const express = require("express");
const Vehicle = require("../models/Vehicle");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  if (req.user.role === "manager" || req.user.role === "mechanic") {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    return res.json({ vehicles });
  }

  const vehicles = await Vehicle.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ vehicles });
});

router.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const { make, model, plate, vin } = req.body || {};
  if (!make || !model || !plate) return res.status(400).json({ message: "make, model, plate are required" });

  const vehicle = await Vehicle.create({
    ownerId: req.user._id,
    make,
    model,
    plate,
    vin
  });

  return res.status(201).json({ vehicle });
});

module.exports = router;

