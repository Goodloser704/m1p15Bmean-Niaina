const express = require("express");
const mongoose = require("mongoose");
const WorkOrder = require("../models/WorkOrder");
const Appointment = require("../models/Appointment");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === "mechanic") filter.mechanicId = req.user._id;

  const workOrders = await WorkOrder.find(filter).sort({ createdAt: -1 });
  return res.json({ workOrders });
});

router.post("/", requireAuth, requireRole(["mechanic", "manager"]), async (req, res) => {
  try {
    console.log("📝 Creating work order:", req.body);
    const { appointmentId } = req.body || {};
    
    // Validation de l'appointmentId
    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointmentId format" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const existing = await WorkOrder.findOne({ appointmentId: appointment._id });
    if (existing) {
      return res.status(409).json({ message: "Work order already exists for this appointment" });
    }

    const workOrder = await WorkOrder.create({
      appointmentId: appointment._id,
      mechanicId: appointment.mechanicId || undefined
    });

    console.log("✅ Work order created:", workOrder._id);
    return res.status(201).json({ workOrder });
  } catch (error) {
    console.error("❌ Error creating work order:", error);
    
    // Gestion spécifique des erreurs de cast MongoDB
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/tasks", requireAuth, requireRole(["mechanic", "manager"]), async (req, res) => {
  const { id } = req.params;
  const { tasks } = req.body || {};
  if (!Array.isArray(tasks)) return res.status(400).json({ message: "tasks must be an array" });

  const workOrder = await WorkOrder.findById(id);
  if (!workOrder) return res.status(404).json({ message: "Work order not found" });

  if (req.user.role === "mechanic" && String(workOrder.mechanicId || "") !== String(req.user._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  workOrder.tasks = tasks.map((t) => ({ label: String(t.label || ""), price: Number(t.price || 0) }));
  await workOrder.save();

  return res.json({ workOrder, total: workOrder.total });
});

router.patch("/:id/estimate", requireAuth, requireRole("mechanic"), async (req, res) => {
  try {
    const { id } = req.params;
    const { tasks, estimationNote } = req.body || {};
    
    if (!Array.isArray(tasks)) return res.status(400).json({ message: "tasks must be an array" });

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    if (String(workOrder.mechanicId || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    workOrder.tasks = tasks.map((t) => ({ label: String(t.label || ""), price: Number(t.price || 0) }));
    workOrder.estimationNote = estimationNote || "";
    workOrder.status = "estimated";
    await workOrder.save();

    return res.json({ workOrder, total: workOrder.total });
  } catch (error) {
    console.error("❌ Error updating estimation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/manager-review", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const { tasks, action } = req.body || {}; // action: "send_to_client" | "request_changes"
    
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    if (tasks && Array.isArray(tasks)) {
      workOrder.tasks = tasks.map((t) => ({ label: String(t.label || ""), price: Number(t.price || 0) }));
    }

    if (action === "send_to_client") {
      workOrder.status = "pending_client_approval";
    }

    await workOrder.save();
    return res.json({ workOrder, total: workOrder.total });
  } catch (error) {
    console.error("❌ Error in manager review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    
    if (!message) return res.status(400).json({ message: "message is required" });

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    // Déterminer le sender basé sur le rôle
    let sender = req.user.role;
    if (sender === "mechanic" || sender === "manager" || sender === "client") {
      workOrder.messages.push({ sender, message: String(message).trim() });
      await workOrder.save();
      return res.json({ workOrder });
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    console.error("❌ Error adding message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/client-decision", requireAuth, requireRole("client"), async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, clientNote } = req.body || {};
    
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    // Vérifier que le client est propriétaire du rendez-vous
    const appointment = await Appointment.findById(workOrder.appointmentId);
    if (!appointment || String(appointment.clientId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    workOrder.clientApproved = Boolean(approved);
    workOrder.clientNote = clientNote || "";
    workOrder.status = approved ? "approved" : "rejected";
    await workOrder.save();

    return res.json({ workOrder });
  } catch (error) {
    console.error("❌ Error in client decision:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/validate", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });
    
    workOrder.status = "validated";
    await workOrder.save();
    return res.json({ workOrder });
  } catch (error) {
    console.error("❌ Error validating work order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

