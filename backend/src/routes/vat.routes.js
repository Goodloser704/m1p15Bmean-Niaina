const express = require("express");
const VatSettings = require("../models/VatSettings");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Récupérer les paramètres TVA
router.get("/settings", requireAuth, async (req, res) => {
  try {
    const settings = await VatSettings.getSettings();
    return res.json({ settings });
  } catch (error) {
    console.error("❌ Error fetching VAT settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Mettre à jour les paramètres TVA (manager seulement)
router.put("/settings", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { defaultVatRate, rules, garageName, garageAddress, garageSiret } = req.body;
    
    let settings = await VatSettings.findOne();
    if (!settings) {
      settings = new VatSettings();
    }
    
    if (defaultVatRate !== undefined) settings.defaultVatRate = defaultVatRate;
    if (rules !== undefined) settings.rules = rules;
    if (garageName !== undefined) settings.garageName = garageName;
    if (garageAddress !== undefined) settings.garageAddress = garageAddress;
    if (garageSiret !== undefined) settings.garageSiret = garageSiret;
    
    await settings.save();
    
    return res.json({ settings, message: "Paramètres TVA mis à jour" });
  } catch (error) {
    console.error("❌ Error updating VAT settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;