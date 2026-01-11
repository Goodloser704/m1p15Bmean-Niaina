const express = require("express");
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
    if (!appointmentId) return res.status(400).json({ message: "appointmentId is required" });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const existing = await WorkOrder.findOne({ appointmentId: appointment._id });
    if (existing) return res.status(409).json({ message: "Work order already exists" });

    const workOrder = await WorkOrder.create({
      appointmentId: appointment._id,
      mechanicId: appointment.mechanicId || undefined
    });

    console.log("✅ Work order created:", workOrder._id);
    return res.status(201).json({ workOrder });
  } catch (error) {
    console.error("❌ Error creating work order:", error);
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

router.patch("/:id/validate", requireAuth, requireRole("manager"), async (req, res) => {
  const { id } = req.params;
  const workOrder = await WorkOrder.findById(id);
  if (!workOrder) return res.status(404).json({ message: "Work order not found" });
  workOrder.status = "validated";
  await workOrder.save();
  return res.json({ workOrder });
});

module.exports = router;

