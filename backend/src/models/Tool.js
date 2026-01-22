const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Clé à molette 15mm"
  category: { type: String, required: true }, // "cles", "tournevis", "diagnostic", etc.
  description: String,
  totalQuantity: { type: Number, required: true, min: 0 }, // Quantité totale disponible
  availableQuantity: { type: Number, required: true, min: 0 }, // Quantité actuellement disponible
  isConsumable: { type: Boolean, default: false }, // true = consommable, false = outil réutilisable
  unitPrice: { type: Number, default: 0 }, // Prix unitaire pour facturation
  minStockAlert: { type: Number, default: 5 }, // Seuil d'alerte stock bas
  supplier: String, // Fournisseur
  reference: String, // Référence fournisseur
  location: String, // Emplacement dans l'atelier
  condition: { 
    type: String, 
    enum: ["excellent", "good", "fair", "poor", "out_of_order"],
    default: "good"
  },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index pour recherche rapide
toolSchema.index({ name: 1, category: 1 });
toolSchema.index({ availableQuantity: 1 });

// Méthode pour vérifier la disponibilité
toolSchema.methods.isAvailable = function(requestedQuantity = 1) {
  return this.availableQuantity >= requestedQuantity;
};

// Méthode pour réserver des outils
toolSchema.methods.reserve = function(quantity = 1) {
  if (this.availableQuantity >= quantity) {
    this.availableQuantity -= quantity;
    this.updatedAt = new Date();
    return true;
  }
  return false;
};

// Méthode pour libérer des outils
toolSchema.methods.release = function(quantity = 1) {
  this.availableQuantity = Math.min(this.availableQuantity + quantity, this.totalQuantity);
  this.updatedAt = new Date();
};

// Méthode pour consommer (consommables uniquement)
toolSchema.methods.consume = function(quantity = 1) {
  if (this.isConsumable && this.availableQuantity >= quantity) {
    this.availableQuantity -= quantity;
    this.totalQuantity -= quantity;
    this.updatedAt = new Date();
    return true;
  }
  return false;
};

// Méthode pour réapprovisionner
toolSchema.methods.restock = function(quantity) {
  this.totalQuantity += quantity;
  this.availableQuantity += quantity;
  this.updatedAt = new Date();
};

// Vérifier si le stock est bas
toolSchema.methods.isLowStock = function() {
  return this.availableQuantity <= this.minStockAlert;
};

toolSchema.methods.toSafeJSON = function() {
  return {
    id: this._id,
    name: this.name,
    category: this.category,
    description: this.description,
    totalQuantity: this.totalQuantity,
    availableQuantity: this.availableQuantity,
    isConsumable: this.isConsumable,
    unitPrice: this.unitPrice,
    minStockAlert: this.minStockAlert,
    supplier: this.supplier,
    reference: this.reference,
    location: this.location,
    condition: this.condition,
    lastMaintenanceDate: this.lastMaintenanceDate,
    nextMaintenanceDate: this.nextMaintenanceDate,
    isLowStock: this.isLowStock(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model("Tool", toolSchema);