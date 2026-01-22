const mongoose = require("mongoose");

const toolReservationSchema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true },
  mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toolId: { type: mongoose.Schema.Types.ObjectId, ref: "Tool", required: true },
  quantityReserved: { type: Number, required: true, min: 1 },
  quantityUsed: { type: Number, default: 0, min: 0 }, // Quantité réellement utilisée
  status: {
    type: String,
    enum: ["reserved", "in_use", "returned", "consumed"],
    default: "reserved"
  },
  reservedAt: { type: Date, default: Date.now },
  startedAt: Date, // Quand l'utilisation a commencé
  returnedAt: Date, // Quand l'outil a été rendu
  notes: String, // Notes sur l'utilisation
  condition: {
    type: String,
    enum: ["excellent", "good", "fair", "poor", "damaged"],
    default: "good"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index pour recherche rapide
toolReservationSchema.index({ workOrderId: 1 });
toolReservationSchema.index({ mechanicId: 1 });
toolReservationSchema.index({ toolId: 1 });
toolReservationSchema.index({ status: 1 });

// Méthode pour démarrer l'utilisation
toolReservationSchema.methods.startUsing = function() {
  this.status = "in_use";
  this.startedAt = new Date();
  this.updatedAt = new Date();
};

// Méthode pour retourner l'outil
toolReservationSchema.methods.returnTool = function(quantityUsed, condition = "good", notes = "") {
  this.status = "returned";
  this.quantityUsed = quantityUsed;
  this.condition = condition;
  this.notes = notes;
  this.returnedAt = new Date();
  this.updatedAt = new Date();
};

// Méthode pour marquer comme consommé
toolReservationSchema.methods.markAsConsumed = function(quantityUsed, notes = "") {
  this.status = "consumed";
  this.quantityUsed = quantityUsed;
  this.notes = notes;
  this.returnedAt = new Date();
  this.updatedAt = new Date();
};

toolReservationSchema.methods.toSafeJSON = function() {
  return {
    id: this._id,
    workOrderId: this.workOrderId,
    mechanicId: this.mechanicId,
    toolId: this.toolId,
    quantityReserved: this.quantityReserved,
    quantityUsed: this.quantityUsed,
    status: this.status,
    reservedAt: this.reservedAt,
    startedAt: this.startedAt,
    returnedAt: this.returnedAt,
    notes: this.notes,
    condition: this.condition,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model("ToolReservation", toolReservationSchema);