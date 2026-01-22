const express = require("express");
const mongoose = require("mongoose");
const WorkOrder = require("../models/WorkOrder");
const Appointment = require("../models/Appointment");
const Tool = require("../models/Tool");
const ToolReservation = require("../models/ToolReservation");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  let workOrders;
  
  if (req.user.role === "mechanic") {
    // Pour les mécaniciens, trouver d'abord leurs rendez-vous
    const appointments = await Appointment.find({ mechanicId: req.user._id });
    const appointmentIds = appointments.map(a => a._id);
    workOrders = await WorkOrder.find({ appointmentId: { $in: appointmentIds } }).sort({ createdAt: -1 });
  } else if (req.user.role === "client") {
    // Pour les clients, trouver leurs rendez-vous
    const appointments = await Appointment.find({ clientId: req.user._id });
    const appointmentIds = appointments.map(a => a._id);
    workOrders = await WorkOrder.find({ appointmentId: { $in: appointmentIds } }).sort({ createdAt: -1 });
  } else {
    // Pour les managers, tout voir
    workOrders = await WorkOrder.find({}).sort({ createdAt: -1 });
  }

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
    const { tasks, estimationNote, requiredResources } = req.body || {};
    
    if (!Array.isArray(tasks)) return res.status(400).json({ message: "tasks must be an array" });

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    if (String(workOrder.mechanicId || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    workOrder.tasks = tasks.map((t) => ({ label: String(t.label || ""), price: Number(t.price || 0) }));
    workOrder.estimationNote = estimationNote || "";
    
    // Mise à jour des ressources nécessaires
    if (requiredResources && Array.isArray(requiredResources)) {
      workOrder.requiredResources = requiredResources.map(r => ({
        toolId: r.toolId,
        quantityNeeded: Number(r.quantityNeeded || 1),
        estimatedDuration: Number(r.estimatedDuration || 0),
        notes: r.notes || ""
      }));
      
      console.log(`🔧 Ressources requises pour WorkOrder ${id}:`, workOrder.requiredResources.length);
    }
    
    // Envoyer directement au client pour approbation
    workOrder.status = "pending_client_approval";
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

    // Si approuvé, réserver automatiquement les outils nécessaires
    if (approved && workOrder.requiredResources && workOrder.requiredResources.length > 0) {
      try {
        console.log(`🔒 Réservation automatique des outils pour WorkOrder ${id}`);
        
        const reservations = [];
        const errors = [];

        for (const resource of workOrder.requiredResources) {
          try {
            const tool = await Tool.findById(resource.toolId);
            if (!tool) {
              errors.push(`Outil ${resource.toolId} non trouvé`);
              continue;
            }

            if (!tool.reserve(resource.quantityNeeded)) {
              errors.push(`Quantité insuffisante pour ${tool.name} (demandé: ${resource.quantityNeeded}, disponible: ${tool.availableQuantity})`);
              continue;
            }

            await tool.save();

            // Créer la réservation
            const reservation = new ToolReservation({
              workOrderId: workOrder._id,
              mechanicId: workOrder.mechanicId,
              toolId: resource.toolId,
              quantityReserved: resource.quantityNeeded
            });

            await reservation.save();
            reservations.push(reservation);

            console.log(`✅ Réservé: ${tool.name} x${resource.quantityNeeded}`);

          } catch (error) {
            errors.push(`Erreur pour ${resource.toolId}: ${error.message}`);
          }
        }

        // Marquer les ressources comme réservées si au moins une réservation a réussi
        if (reservations.length > 0) {
          workOrder.resourcesReserved = true;
          console.log(`🎉 ${reservations.length} outils réservés avec succès`);
        }

        if (errors.length > 0) {
          console.warn(`⚠️ Erreurs lors de la réservation:`, errors);
        }

      } catch (reservationError) {
        console.error("❌ Erreur lors de la réservation automatique:", reservationError);
        // Ne pas bloquer l'approbation si la réservation échoue
      }
    }

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

router.patch("/:id/start-repair", requireAuth, requireRole("mechanic"), async (req, res) => {
  try {
    const { id } = req.params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    // Vérifier que le mécanicien est assigné à ce WorkOrder
    if (String(workOrder.mechanicId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (workOrder.status !== "approved") {
      return res.status(400).json({ message: "Work order must be approved to start repair" });
    }

    workOrder.status = "in_progress";
    await workOrder.save();

    console.log(`🔧 Réparation commencée pour WorkOrder ${id}`);
    return res.json({ workOrder });
  } catch (error) {
    console.error("❌ Error starting repair:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/complete-repair", requireAuth, requireRole("mechanic"), async (req, res) => {
  try {
    const { id } = req.params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    // Vérifier que le mécanicien est assigné à ce WorkOrder
    if (String(workOrder.mechanicId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (workOrder.status !== "in_progress") {
      return res.status(400).json({ message: "Work order must be in progress to complete" });
    }

    workOrder.status = "validated";
    await workOrder.save();

    console.log(`✅ Réparation terminée pour WorkOrder ${id}`);
    return res.json({ workOrder });
  } catch (error) {
    console.error("❌ Error completing repair:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/mark-paid", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { id } = req.params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    if (workOrder.status !== "validated") {
      return res.status(400).json({ message: "Work order must be validated to mark as paid" });
    }

    workOrder.status = "paid";
    await workOrder.save();

    console.log(`💰 WorkOrder ${id} marqué comme payé`);
    return res.json({ workOrder });
  } catch (error) {
    console.error("❌ Error marking as paid:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

