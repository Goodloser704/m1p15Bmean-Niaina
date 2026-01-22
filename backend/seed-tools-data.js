const mongoose = require("mongoose");
const Tool = require("./src/models/Tool");
const { mongodbUri } = require("./src/config/env");

const toolsData = [
  // Outils de base
  {
    name: "Clé à molette 15mm",
    category: "cles",
    description: "Clé à molette standard 15mm",
    totalQuantity: 5,
    availableQuantity: 5,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 2,
    location: "Atelier - Panneau A1"
  },
  {
    name: "Clé à molette 17mm",
    category: "cles",
    description: "Clé à molette standard 17mm",
    totalQuantity: 5,
    availableQuantity: 5,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 2,
    location: "Atelier - Panneau A1"
  },
  {
    name: "Tournevis cruciforme",
    category: "tournevis",
    description: "Tournevis cruciforme standard",
    totalQuantity: 8,
    availableQuantity: 8,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 3,
    location: "Atelier - Panneau A2"
  },
  {
    name: "Tournevis plat",
    category: "tournevis",
    description: "Tournevis plat standard",
    totalQuantity: 8,
    availableQuantity: 8,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 3,
    location: "Atelier - Panneau A2"
  },
  
  // Outils spécialisés
  {
    name: "Cric hydraulique",
    category: "levage",
    description: "Cric hydraulique 2 tonnes",
    totalQuantity: 3,
    availableQuantity: 3,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 1,
    location: "Atelier - Zone levage"
  },
  {
    name: "Chandelles",
    category: "levage",
    description: "Paire de chandelles de sécurité",
    totalQuantity: 6,
    availableQuantity: 6,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 2,
    location: "Atelier - Zone levage"
  },
  {
    name: "Scanner OBD",
    category: "diagnostic",
    description: "Scanner de diagnostic OBD-II",
    totalQuantity: 2,
    availableQuantity: 2,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 1,
    location: "Atelier - Bureau diagnostic"
  },
  {
    name: "Multimètre",
    category: "diagnostic",
    description: "Multimètre numérique",
    totalQuantity: 3,
    availableQuantity: 3,
    isConsumable: false,
    unitPrice: 0,
    minStockAlert: 1,
    location: "Atelier - Bureau diagnostic"
  },
  
  // Consommables
  {
    name: "Huile moteur 5W30",
    category: "fluides",
    description: "Huile moteur synthétique 5W30 - Bidon 5L",
    totalQuantity: 20,
    availableQuantity: 20,
    isConsumable: true,
    unitPrice: 45.00,
    minStockAlert: 5,
    supplier: "Total",
    reference: "QUARTZ-5W30-5L",
    location: "Stock - Étagère B1"
  },
  {
    name: "Huile moteur 10W40",
    category: "fluides",
    description: "Huile moteur semi-synthétique 10W40 - Bidon 5L",
    totalQuantity: 15,
    availableQuantity: 15,
    isConsumable: true,
    unitPrice: 35.00,
    minStockAlert: 5,
    supplier: "Castrol",
    reference: "GTX-10W40-5L",
    location: "Stock - Étagère B1"
  },
  {
    name: "Filtre à huile universel",
    category: "filtres",
    description: "Filtre à huile standard",
    totalQuantity: 50,
    availableQuantity: 50,
    isConsumable: true,
    unitPrice: 12.50,
    minStockAlert: 10,
    supplier: "Mann Filter",
    reference: "W712/75",
    location: "Stock - Étagère C1"
  },
  {
    name: "Filtre à air",
    category: "filtres",
    description: "Filtre à air standard",
    totalQuantity: 30,
    availableQuantity: 30,
    isConsumable: true,
    unitPrice: 18.00,
    minStockAlert: 8,
    supplier: "Bosch",
    reference: "1457433529",
    location: "Stock - Étagère C2"
  },
  {
    name: "Plaquettes de frein avant",
    category: "freinage",
    description: "Jeu de plaquettes de frein avant",
    totalQuantity: 25,
    availableQuantity: 25,
    isConsumable: true,
    unitPrice: 65.00,
    minStockAlert: 5,
    supplier: "Brembo",
    reference: "P85020",
    location: "Stock - Étagère D1"
  },
  {
    name: "Plaquettes de frein arrière",
    category: "freinage",
    description: "Jeu de plaquettes de frein arrière",
    totalQuantity: 20,
    availableQuantity: 20,
    isConsumable: true,
    unitPrice: 55.00,
    minStockAlert: 5,
    supplier: "Brembo",
    reference: "P85021",
    location: "Stock - Étagère D1"
  },
  {
    name: "Liquide de frein DOT4",
    category: "fluides",
    description: "Liquide de frein DOT4 - Bidon 1L",
    totalQuantity: 12,
    availableQuantity: 12,
    isConsumable: true,
    unitPrice: 15.00,
    minStockAlert: 3,
    supplier: "Bosch",
    reference: "DOT4-1L",
    location: "Stock - Étagère B2"
  },
  {
    name: "Liquide de refroidissement",
    category: "fluides",
    description: "Liquide de refroidissement universel - Bidon 5L",
    totalQuantity: 10,
    availableQuantity: 10,
    isConsumable: true,
    unitPrice: 25.00,
    minStockAlert: 3,
    supplier: "Total",
    reference: "COOLELF-5L",
    location: "Stock - Étagère B2"
  },
  
  // Pièces d'usure
  {
    name: "Ampoule H7",
    category: "eclairage",
    description: "Ampoule halogène H7 12V 55W",
    totalQuantity: 40,
    availableQuantity: 40,
    isConsumable: true,
    unitPrice: 8.50,
    minStockAlert: 10,
    supplier: "Philips",
    reference: "H7-12V-55W",
    location: "Stock - Étagère E1"
  },
  {
    name: "Ampoule H4",
    category: "eclairage",
    description: "Ampoule halogène H4 12V 60/55W",
    totalQuantity: 35,
    availableQuantity: 35,
    isConsumable: true,
    unitPrice: 9.00,
    minStockAlert: 10,
    supplier: "Philips",
    reference: "H4-12V-60-55W",
    location: "Stock - Étagère E1"
  },
  {
    name: "Fusible 10A",
    category: "electrique",
    description: "Fusible standard 10A",
    totalQuantity: 100,
    availableQuantity: 100,
    isConsumable: true,
    unitPrice: 0.50,
    minStockAlert: 20,
    supplier: "Bosch",
    reference: "FUSE-10A",
    location: "Stock - Étagère E2"
  },
  {
    name: "Fusible 15A",
    category: "electrique",
    description: "Fusible standard 15A",
    totalQuantity: 80,
    availableQuantity: 80,
    isConsumable: true,
    unitPrice: 0.50,
    minStockAlert: 20,
    supplier: "Bosch",
    reference: "FUSE-15A",
    location: "Stock - Étagère E2"
  }
];

async function seedTools() {
  try {
    console.log("🔧 Connexion à MongoDB...");
    await mongoose.connect(mongodbUri);
    
    console.log("🗑️  Suppression des outils existants...");
    await Tool.deleteMany({});
    
    console.log("📦 Création des outils de test...");
    const tools = await Tool.insertMany(toolsData);
    
    console.log(`✅ ${tools.length} outils créés avec succès !`);
    
    // Affichage par catégorie
    const categories = await Tool.distinct("category");
    for (const category of categories) {
      const categoryTools = await Tool.find({ category });
      console.log(`\n📂 Catégorie "${category}": ${categoryTools.length} outils`);
      categoryTools.forEach(tool => {
        const type = tool.isConsumable ? "📦 Consommable" : "🔧 Outil";
        console.log(`  ${type} ${tool.name} (${tool.availableQuantity}/${tool.totalQuantity})`);
      });
    }
    
    // Statistiques
    const totalTools = await Tool.countDocuments();
    const consumables = await Tool.countDocuments({ isConsumable: true });
    const reusableTools = await Tool.countDocuments({ isConsumable: false });
    
    console.log(`\n📊 Statistiques:`);
    console.log(`   Total: ${totalTools} outils`);
    console.log(`   Consommables: ${consumables}`);
    console.log(`   Outils réutilisables: ${reusableTools}`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la création des outils:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnexion de MongoDB");
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedTools();
}

module.exports = { seedTools, toolsData };