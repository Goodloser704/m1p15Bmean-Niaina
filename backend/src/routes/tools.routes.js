const express = require("express");
const Tool = require("../models/Tool");
const ToolReservation = require("../models/ToolReservation");
const WorkOrder = require("../models/WorkOrder");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Lister tous les outils (avec filtres)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { category, available, lowStock, search } = req.query;
    
    let filter = {};
    
    // Filtre par catégorie
    if (category) {
      filter.category = category;
    }
    
    // Filtre par disponibilité
    if (available === 'true') {
      filter.availableQuantity = { $gt: 0 };
    }
    
    // Recherche textuelle
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tools = await Tool.find(filter).sort({ name: 1 });
    
    // Filtre stock bas (après récupération car c'est une méthode)
    let filteredTools = tools;
    if (lowStock === 'true') {
      filteredTools = tools.filter(tool => tool.isLowStock());
    }
    
    return res.json({ 
      tools: filteredTools.map(tool => tool.toSafeJSON()),
      total: filteredTools.length
    });
  } catch (error) {
    console.error("❌ Erreur récupération outils:", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des outils" });
  }
});

// Récupérer les catégories d'outils
router.get("/categories", requireAuth, async (req, res) => {
  try {
    const categories = await Tool.distinct("category");
    return res.json({ categories: categories.sort() });
  } catch (error) {
    console.error("❌ Erreur récupération catégories:", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
  }
});

// Créer un nouvel outil (Manager seulement)
router.post("/", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const {
      name, category, description, totalQuantity, isConsumable,
      unitPrice, minStockAlert, supplier, reference, location
    } = req.body;
    
    if (!name || !category || totalQuantity === undefined) {
      return res.status(400).json({ message: "Nom, catégorie et quantité sont requis" });
    }
    
    const tool = new Tool({
      name: String(name).trim(),
      category: String(category).trim(),
      description: description ? String(description).trim() : undefined,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity), // Initialement, tout est disponible
      isConsumable: Boolean(isConsumable),
      unitPrice: Number(unitPrice) || 0,
      minStockAlert: Number(minStockAlert) || 5,
      supplier: supplier ? String(supplier).trim() : undefined,
      reference: reference ? String(reference).trim() : undefined,
      location: location ? String(location).trim() : undefined
    });
    
    await tool.save();
    
    console.log(`🔧 Nouvel outil créé: ${tool.name} (${tool.totalQuantity} unités)`);
    
    return res.status(201).json({ 
      message: "Outil créé avec succès",
      tool: tool.toSafeJSON()
    });
  } catch (error) {
    console.error("❌ Erreur création outil:", error);
    return res.status(500).json({ message: "Erreur lors de la création de l'outil" });
  }
});

// Mettre à jour un outil (Manager seulement)
router.patch("/:toolId", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { toolId } = req.params;
    const updates = req.body;
    
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ message: "Outil non trouvé" });
    }
    
    // Mise à jour des champs autorisés
    const allowedUpdates = [
      'name', 'category', 'description', 'unitPrice', 'minStockAlert',
      'supplier', 'reference', 'location', 'condition'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        tool[field] = updates[field];
      }
    });
    
    tool.updatedAt = new Date();
    await tool.save();
    
    return res.json({
      message: "Outil mis à jour avec succès",
      tool: tool.toSafeJSON()
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour outil:", error);
    return res.status(500).json({ message: "Erreur lors de la mise à jour de l'outil" });
  }
});

// Réapprovisionner un outil (Manager seulement)
router.post("/:toolId/restock", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { toolId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Quantité valide requise" });
    }
    
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ message: "Outil non trouvé" });
    }
    
    tool.restock(Number(quantity));
    await tool.save();
    
    console.log(`📦 Réapprovisionnement: ${tool.name} +${quantity} unités`);
    
    return res.json({
      message: `Réapprovisionnement effectué: +${quantity} unités`,
      tool: tool.toSafeJSON()
    });
  } catch (error) {
    console.error("❌ Erreur réapprovisionnement:", error);
    return res.status(500).json({ message: "Erreur lors du réapprovisionnement" });
  }
});

// Vérifier la disponibilité d'outils pour une estimation
router.post("/check-availability", requireAuth, requireRole(["manager", "mechanic"]), async (req, res) => {
  try {
    const { resources } = req.body; // [{ toolId, quantityNeeded }]
    
    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({ message: "Liste de ressources requise" });
    }
    
    const availability = [];
    
    for (const resource of resources) {
      const tool = await Tool.findById(resource.toolId);
      if (!tool) {
        availability.push({
          toolId: resource.toolId,
          available: false,
          reason: "Outil non trouvé"
        });
        continue;
      }
      
      const isAvailable = tool.isAvailable(resource.quantityNeeded);
      availability.push({
        toolId: resource.toolId,
        toolName: tool.name,
        quantityNeeded: resource.quantityNeeded,
        quantityAvailable: tool.availableQuantity,
        available: isAvailable,
        reason: isAvailable ? null : "Quantité insuffisante"
      });
    }
    
    const allAvailable = availability.every(item => item.available);
    
    return res.json({
      allAvailable,
      availability,
      message: allAvailable ? "Toutes les ressources sont disponibles" : "Certaines ressources ne sont pas disponibles"
    });
  } catch (error) {
    console.error("❌ Erreur vérification disponibilité:", error);
    return res.status(500).json({ message: "Erreur lors de la vérification de disponibilité" });
  }
});

// Réserver des outils pour un WorkOrder
router.post("/reserve", requireAuth, requireRole(["manager", "mechanic"]), async (req, res) => {
  try {
    const { workOrderId, resources } = req.body; // [{ toolId, quantityNeeded }]
    
    if (!workOrderId || !resources || !Array.isArray(resources)) {
      return res.status(400).json({ message: "WorkOrder ID et liste de ressources requis" });
    }
    
    // Vérifier que le WorkOrder existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return res.status(404).json({ message: "Ordre de travail non trouvé" });
    }
    
    // Vérifier les permissions (mécanicien ne peut réserver que pour ses propres WorkOrders)
    if (req.user.role === 'mechanic' && workOrder.mechanicId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    const reservations = [];
    const errors = [];
    
    // Transaction pour éviter les conflits
    for (const resource of resources) {
      try {
        const tool = await Tool.findById(resource.toolId);
        if (!tool) {
          errors.push(`Outil ${resource.toolId} non trouvé`);
          continue;
        }
        
        if (!tool.reserve(resource.quantityNeeded)) {
          errors.push(`Quantité insuffisante pour ${tool.name} (demandé: ${resource.quantityNeeded}, disponible: ${tool.availableQuantity})`);
          continue;
        }
        
        await tool.save();
        
        // Créer la réservation
        const reservation = new ToolReservation({
          workOrderId,
          mechanicId: workOrder.mechanicId,
          toolId: resource.toolId,
          quantityReserved: resource.quantityNeeded
        });
        
        await reservation.save();
        reservations.push(reservation.toSafeJSON());
        
        console.log(`🔒 Réservation: ${tool.name} x${resource.quantityNeeded} pour WorkOrder ${workOrderId}`);
        
      } catch (error) {
        errors.push(`Erreur pour ${resource.toolId}: ${error.message}`);
      }
    }
    
    // Marquer les ressources comme réservées dans le WorkOrder
    if (reservations.length > 0) {
      workOrder.resourcesReserved = true;
      await workOrder.save();
    }
    
    return res.json({
      message: `${reservations.length} réservations créées`,
      reservations,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error("❌ Erreur réservation outils:", error);
    return res.status(500).json({ message: "Erreur lors de la réservation des outils" });
  }
});

// Libérer les réservations d'un WorkOrder
router.post("/release/:workOrderId", requireAuth, requireRole(["manager", "mechanic"]), async (req, res) => {
  try {
    const { workOrderId } = req.params;
    
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return res.status(404).json({ message: "Ordre de travail non trouvé" });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'mechanic' && workOrder.mechanicId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    // Trouver toutes les réservations actives
    const reservations = await ToolReservation.find({
      workOrderId,
      status: { $in: ["reserved", "in_use"] }
    });
    
    let releasedCount = 0;
    
    for (const reservation of reservations) {
      const tool = await Tool.findById(reservation.toolId);
      if (tool) {
        // Libérer la quantité réservée
        tool.release(reservation.quantityReserved);
        await tool.save();
        
        // Marquer la réservation comme retournée
        reservation.returnTool(0, "good", "Libération automatique");
        await reservation.save();
        
        releasedCount++;
        console.log(`🔓 Libération: ${tool.name} x${reservation.quantityReserved}`);
      }
    }
    
    // Marquer les ressources comme non réservées
    workOrder.resourcesReserved = false;
    await workOrder.save();
    
    return res.json({
      message: `${releasedCount} réservations libérées`,
      releasedCount
    });
    
  } catch (error) {
    console.error("❌ Erreur libération outils:", error);
    return res.status(500).json({ message: "Erreur lors de la libération des outils" });
  }
});

// Récupérer les réservations d'un mécanicien
router.get("/reservations/my", requireAuth, requireRole("mechanic"), async (req, res) => {
  try {
    const reservations = await ToolReservation.find({
      mechanicId: req.user._id,
      status: { $in: ["reserved", "in_use"] }
    })
    .populate('toolId', 'name category isConsumable')
    .populate('workOrderId', 'status')
    .sort({ reservedAt: -1 });
    
    return res.json({
      reservations: reservations.map(r => ({
        ...r.toSafeJSON(),
        tool: r.toolId,
        workOrder: r.workOrderId
      }))
    });
  } catch (error) {
    console.error("❌ Erreur récupération réservations:", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des réservations" });
  }
});

module.exports = router;