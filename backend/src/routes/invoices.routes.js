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
    const { workOrderId } = req.params;
    
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }
    
    // Vérifier que le work order est payé
    if (workOrder.status !== "paid") {
      return res.status(400).json({ message: "Work order must be paid to generate invoice" });
    }
    
    // Vérifier qu'une facture n'existe pas déjà
    const existingInvoice = await Invoice.findOne({ workOrderId: workOrder._id });
    if (existingInvoice) {
      return res.json({ invoice: existingInvoice, message: "Invoice already exists" });
    }
    
    // Récupérer les informations nécessaires
    const appointment = await Appointment.findById(workOrder.appointmentId);
    const client = await User.findById(appointment.clientId);
    const vehicle = await Vehicle.findById(appointment.vehicleId);
    const settings = await VatSettings.getSettings();
    
    // Calculer les montants avec TVA
    const invoiceData = await VatService.calculateInvoiceFromWorkOrder(workOrder);
    
    // Créer la facture
    const invoice = new Invoice({
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
    
    return res.status(201).json({ invoice, message: "Facture générée avec succès" });
  } catch (error) {
    console.error("❌ Error generating invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
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