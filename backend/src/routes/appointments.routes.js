const express = require("express");
const Appointment = require("../models/Appointment");
const Vehicle = require("../models/Vehicle");
const WorkOrder = require("../models/WorkOrder");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === "client") filter.clientId = req.user._id;
  if (req.user.role === "mechanic") filter.mechanicId = req.user._id;

  const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
  return res.json({ appointments });
});

router.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const { vehicleId, clientNote } = req.body || {};
  if (!vehicleId) return res.status(400).json({ message: "vehicleId is required" });

  const vehicle = await Vehicle.findOne({ _id: vehicleId, ownerId: req.user._id });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  const appointment = await Appointment.create({
    clientId: req.user._id,
    vehicleId: vehicle._id,
    clientNote: clientNote || ""
  });

  return res.status(201).json({ appointment });
});

router.patch("/:id/confirm", requireAuth, requireRole("manager"), async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, mechanicId, managerNote } = req.body || {};
  const appointment = await Appointment.findById(id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  appointment.status = "confirmed";
  if (scheduledAt) appointment.scheduledAt = new Date(scheduledAt);
  if (mechanicId) appointment.mechanicId = mechanicId;
  if (managerNote !== undefined) appointment.managerNote = managerNote;
  await appointment.save();

  return res.json({ appointment });
});

router.patch("/:id/status", requireAuth, requireRole(["mechanic", "manager"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mechanicNote } = req.body || {};
    const allowed = ["in_progress", "done", "canceled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (req.user.role === "mechanic" && String(appointment.mechanicId || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // SÉCURITÉ : Vérifier que le work order est approuvé avant de marquer "done"
    if (status === "done" && req.user.role === "mechanic") {
      const workOrder = await WorkOrder.findOne({ appointmentId: appointment._id });
      if (workOrder) {
        if (workOrder.status !== "approved") {
          return res.status(400).json({ 
            message: "Cannot complete repair: work order must be approved by client first. Current status: " + workOrder.status 
          });
        }
      }
    }

    appointment.status = status;
    if (mechanicNote !== undefined) appointment.mechanicNote = mechanicNote;
    await appointment.save();

    return res.json({ appointment });
  } catch (error) {
    console.error("❌ Error updating appointment status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

