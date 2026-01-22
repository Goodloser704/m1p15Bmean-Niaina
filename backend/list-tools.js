const mongoose = require('mongoose');
const Tool = require('./src/models/Tool');
require('dotenv').config();

async function listTools() {
  try {
    console.log('🔧 Liste des Outils et Consommables\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const tools = await Tool.find().sort({ category: 1, name: 1 });
    
    if (tools.length === 0) {
      console.log('❌ Aucun outil trouvé dans la base de données.');
      console.log('💡 Exécutez "node seed-tools-data.js" pour créer des outils de test.');
      return;
    }
    
    console.log(`📊 Total: ${tools.length} outils/consommables\n`);
    
    // Grouper par catégorie
    const toolsByCategory = {};
    tools.forEach(tool => {
      if (!toolsByCategory[tool.category]) {
        toolsByCategory[tool.category] = [];
      }
      toolsByCategory[tool.category].push(tool);
    });
    
    // Afficher par catégorie
    Object.keys(toolsByCategory).sort().forEach(category => {
      const categoryTools = toolsByCategory[category];
      const categoryIcon = getCategoryIcon(category);
      
      console.log(`${categoryIcon} ${category.toUpperCase()} (${categoryTools.length} items)`);
      console.log('─'.repeat(50));
      
      categoryTools.forEach(tool => {
        const typeIcon = tool.isConsumable ? '📦' : '🔧';
        const stockStatus = getStockStatus(tool);
        const condition = tool.condition || 'good';
        const conditionIcon = getConditionIcon(condition);
        
        console.log(`  ${typeIcon} ${tool.name}`);
        console.log(`     📍 Emplacement: ${tool.location || 'Non spécifié'}`);
        console.log(`     📊 Stock: ${tool.availableQuantity}/${tool.totalQuantity} ${stockStatus}`);
        console.log(`     ${conditionIcon} État: ${getConditionLabel(condition)}`);
        console.log(`     💰 Prix unitaire: ${tool.unitPrice || 0}€`);
        
        if (tool.supplier) {
          console.log(`     🏪 Fournisseur: ${tool.supplier}`);
        }
        
        if (tool.reference) {
          console.log(`     🔖 Référence: ${tool.reference}`);
        }
        
        if (tool.description) {
          console.log(`     📝 Description: ${tool.description}`);
        }
        
        console.log('');
      });
      
      console.log('');
    });
    
    // Statistiques
    console.log('📈 STATISTIQUES');
    console.log('─'.repeat(50));
    
    const totalTools = tools.filter(t => !t.isConsumable).length;
    const totalConsumables = tools.filter(t => t.isConsumable).length;
    const lowStockItems = tools.filter(t => t.isLowStock()).length;
    const outOfOrderItems = tools.filter(t => t.condition === 'out_of_order').length;
    const totalValue = tools.reduce((sum, t) => sum + (t.totalQuantity * (t.unitPrice || 0)), 0);
    
    console.log(`🔧 Outils réutilisables: ${totalTools}`);
    console.log(`📦 Consommables: ${totalConsumables}`);
    console.log(`⚠️  Stock bas: ${lowStockItems}`);
    console.log(`❌ Hors service: ${outOfOrderItems}`);
    console.log(`💰 Valeur totale: ${totalValue.toFixed(2)}€`);
    
    if (lowStockItems > 0) {
      console.log('\n⚠️  ALERTES STOCK BAS:');
      console.log('─'.repeat(30));
      tools.filter(t => t.isLowStock()).forEach(tool => {
        console.log(`   • ${tool.name}: ${tool.availableQuantity}/${tool.totalQuantity} (seuil: ${tool.minStockAlert})`);
      });
    }
    
    if (outOfOrderItems > 0) {
      console.log('\n❌ OUTILS HORS SERVICE:');
      console.log('─'.repeat(30));
      tools.filter(t => t.condition === 'out_of_order').forEach(tool => {
        console.log(`   • ${tool.name} (${tool.location || 'Emplacement non spécifié'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

function getCategoryIcon(category) {
  const icons = {
    'cles': '🔧',
    'tournevis': '🪛',
    'levage': '🏗️',
    'diagnostic': '🔍',
    'fluides': '🛢️',
    'filtres': '🔽',
    'freinage': '🛑',
    'eclairage': '💡',
    'electrique': '⚡',
    'pneumatique': '🛞',
    'carrosserie': '🚗',
    'moteur': '🔩'
  };
  return icons[category] || '🔧';
}

function getStockStatus(tool) {
  if (tool.availableQuantity === 0) return '❌ Rupture';
  if (tool.isLowStock()) return '⚠️ Stock bas';
  return '✅ OK';
}

function getConditionIcon(condition) {
  const icons = {
    'excellent': '🌟',
    'good': '✅',
    'fair': '⚠️',
    'poor': '🔴',
    'out_of_order': '❌'
  };
  return icons[condition] || '✅';
}

function getConditionLabel(condition) {
  const labels = {
    'excellent': 'Excellent',
    'good': 'Bon',
    'fair': 'Correct',
    'poor': 'Mauvais',
    'out_of_order': 'Hors service'
  };
  return labels[condition] || condition;
}

listTools();