const express = require("express");
const Invoice = require("../models/Invoice");
const WorkOrder = require("../models/WorkOrder");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const VatSettings = require("../models/VatSettings");
const VatService = require("../services/vatService");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Lister les factures
router.get("/", requireAuth, async (req, res) => {
  try {
    let invoices;
    
    if (req.user.role === "client") {
      invoices = await Invoice.find({ clientId: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === "manager") {
      invoices = await Invoice.find({}).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    return res.json({ invoices });
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Générer une facture à partir d'un work order
router.post("/generate/:workOrderId", requireAuth, requireRole(["manager", "client"]), async (req, res) => {
  try {
    console.log("🧾 Generating invoice for work order:", req.params.workOrderId);
    const { workOrderId } = req.params;
    
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      console.log("❌ Work order not found:", workOrderId);
      return res.status(404).json({ message: "Work order not found" });
    }
    
    console.log("✅ Work order found:", workOrder.status);
    
    // Vérifier que le work order est payé
    if (workOrder.status !== "paid") {
      console.log("❌ Work order not paid:", workOrder.status);
      return res.status(400).json({ message: "Work order must be paid to generate invoice" });
    }
    
    // Vérifier qu'une facture n'existe pas déjà
    const existingInvoice = await Invoice.findOne({ workOrderId: workOrder._id });
    if (existingInvoice) {
      console.log("ℹ️ Invoice already exists:", existingInvoice.invoiceNumber);
      return res.json({ invoice: existingInvoice, message: "Invoice already exists" });
    }
    
    console.log("🔍 Fetching related data...");
    
    // Récupérer les informations nécessaires
    const appointment = await Appointment.findById(workOrder.appointmentId);
    if (!appointment) {
      console.log("❌ Appointment not found:", workOrder.appointmentId);
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const client = await User.findById(appointment.clientId);
    if (!client) {
      console.log("❌ Client not found:", appointment.clientId);
      return res.status(404).json({ message: "Client not found" });
    }
    
    const vehicle = await Vehicle.findById(appointment.vehicleId);
    if (!vehicle) {
      console.log("❌ Vehicle not found:", appointment.vehicleId);
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    console.log("🔍 Getting VAT settings...");
    const settings = await VatSettings.getSettings();
    console.log("✅ VAT settings loaded:", settings.defaultVatRate);
    
    console.log("🧮 Calculating invoice amounts...");
    // Calculer les montants avec TVA
    const invoiceData = await VatService.calculateInvoiceFromWorkOrder(workOrder);
    console.log("✅ Invoice data calculated:", invoiceData.totalTTC);
    
    console.log("💾 Creating invoice...");
    
    // Générer le numéro de facture
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({
      invoiceNumber: new RegExp(`^${year}-`)
    });
    const invoiceNumber = `${year}-${String(count + 1).padStart(4, '0')}`;
    console.log("📄 Generated invoice number:", invoiceNumber);
    
    // Créer la facture
    const invoice = new Invoice({
      invoiceNumber,
      workOrderId: workOrder._id,
      clientId: client._id,
      clientName: client.fullName,
      clientAddress: client.address || "",
      vehicleInfo: `${vehicle.make} ${vehicle.model} - ${vehicle.plate}`,
      items: invoiceData.items,
      totalHT: invoiceData.totalHT,
      totalVAT: invoiceData.totalVAT,
      totalTTC: invoiceData.totalTTC,
      garageName: settings.garageName,
      garageAddress: settings.garageAddress,
      garageSiret: settings.garageSiret,
      status: "sent"
    });
    
    await invoice.save();
    console.log("✅ Invoice created:", invoice.invoiceNumber);
    
    return res.status(201).json({ invoice, message: "Facture générée avec succès" });
  } catch (error) {
    console.error("❌ Error generating invoice:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Récupérer une facture spécifique
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    // Vérifier les permissions
    if (req.user.role === "client" && invoice.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    return res.json({ invoice });
  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;