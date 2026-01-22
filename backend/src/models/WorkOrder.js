const mongoose = require("mongoose");

const workOrderTaskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Schéma pour les outils/consommables requis dans l'estimation
const requiredResourceSchema = new mongoose.Schema(
  {
    toolId: { type: mongoose.Schema.Types.ObjectId, ref: "Tool", required: true },
    quantityNeeded: { type: Number, required: true, min: 1 },
    estimatedDuration: { type: Number, default: 0 }, // Durée d'utilisation en minutes (pour outils)
    notes: String
  },
  { _id: false }
);

const workOrderMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true, enum: ["client", "manager", "mechanic"] },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const workOrderSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { 
      type: String, 
      required: true, 
      enum: ["draft", "estimated", "pending_client_approval", "approved", "rejected", "in_progress", "validated", "paid"], 
      default: "draft" 
    },
    tasks: { type: [workOrderTaskSchema], default: [] },
    requiredResources: { type: [requiredResourceSchema], default: [] }, // Outils/consommables nécessaires
    resourcesReserved: { type: Boolean, default: false }, // Ressources réservées ?
    estimationNote: { type: String, trim: true },
    clientApproved: { type: Boolean },
    clientNote: { type: String, trim: true },
    messages: { type: [workOrderMessageSchema], default: [] }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

workOrderSchema.virtual("total").get(function total() {
  return (this.tasks || []).reduce((sum, t) => sum + Number(t.price || 0), 0);
});

module.exports = mongoose.model("WorkOrder", workOrderSchema);

