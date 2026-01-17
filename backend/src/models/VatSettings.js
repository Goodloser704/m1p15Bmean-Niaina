const mongoose = require("mongoose");

const vatRuleSchema = new mongoose.Schema({
  keywords: [{ type: String, required: true }], // Mots-clés pour détecter le type
  vatRate: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String, required: true }
}, { _id: false });

const vatSettingsSchema = new mongoose.Schema({
  defaultVatRate: { type: Number, required: true, default: 20 },
  rules: [vatRuleSchema],
  garageName: { type: String, default: "Garage Auto Plus" },
  garageAddress: { type: String, default: "123 Rue de la Mécanique, 75001 Paris" },
  garageSiret: { type: String, default: "12345678901234" }
}, { timestamps: true });

// Il n'y aura qu'un seul document de settings
vatSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Créer les settings par défaut
    settings = await this.create({
      defaultVatRate: 20,
      rules: [
        {
          keywords: ["vidange", "huile", "filtre", "revision", "diagnostic", "main", "oeuvre", "reparation", "entretien"],
          vatRate: 20,
          description: "Services et main d'œuvre"
        },
        {
          keywords: ["piece", "neuve", "neuf", "plaquette", "disque", "amortisseur", "batterie"],
          vatRate: 20,
          description: "Pièces neuves"
        },
        {
          keywords: ["occasion", "reconditionne", "usage", "seconde"],
          vatRate: 10,
          description: "Pièces d'occasion"
        },
        {
          keywords: ["handicap", "adapte", "rampe", "commande", "accessibilite"],
          vatRate: 5.5,
          description: "Services véhicules handicapés"
        }
      ]
    });
  }
  return settings;
};

module.exports = mongoose.model("VatSettings", vatSettingsSchema);