const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  priceHT: { type: Number, required: true },
  vatRate: { type: Number, required: true },
  vatAmount: { type: Number, required: true },
  priceTTC: { type: Number, required: true }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true }, // Retiré required car généré automatiquement
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Informations client
  clientName: { type: String, required: true },
  clientAddress: { type: String },
  
  // Informations véhicule
  vehicleInfo: { type: String, required: true },
  
  // Items de la facture
  items: [invoiceItemSchema],
  
  // Totaux
  totalHT: { type: Number, required: true },
  totalVAT: { type: Number, required: true },
  totalTTC: { type: Number, required: true },
  
  // Informations garage (snapshot au moment de la facture)
  garageName: { type: String, required: true },
  garageAddress: { type: String, required: true },
  garageSiret: { type: String, required: true },
  
  // Statut
  status: { 
    type: String, 
    enum: ["draft", "sent", "paid"], 
    default: "draft" 
  },
  
  // Dates
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  paidDate: { type: Date }
}, { timestamps: true });

// Générer le numéro de facture automatiquement
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        invoiceNumber: new RegExp(`^${year}-`)
      });
      this.invoiceNumber = `${year}-${String(count + 1).padStart(4, '0')}`;
      console.log("✅ Generated invoice number:", this.invoiceNumber);
    } catch (error) {
      console.error("❌ Error generating invoice number:", error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);