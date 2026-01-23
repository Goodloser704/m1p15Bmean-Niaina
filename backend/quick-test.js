const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tool = require('./src/models/Tool');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function quickTest() {
  try {
    console.log('⚡ Test rapide du système...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Test 1: Vérifier les utilisateurs
    const users = await User.find();
    console.log(`👥 Utilisateurs: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.fullName} (${user.role}) - ${user.email}`);
    });
    
    // Test 2: Vérifier les outils
    const tools = await Tool.find();
    console.log(`\n🔧 Outils: ${tools.length}`);
    const reusableTools = tools.filter(t => !t.isConsumable);
    const consumables = tools.filter(t => t.isConsumable);
    console.log(`   - Réutilisables: ${reusableTools.length}`);
    console.log(`   - Consommables: ${consumables.length}`);
    
    // Test 3: Vérifier les WorkOrders
    const workOrders = await WorkOrder.find();
    console.log(`\n📋 WorkOrders: ${workOrders.length}`);
    const statusCounts = {};
    workOrders.forEach(wo => {
      statusCounts[wo.status] = (statusCounts[wo.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // Test 4: Calculer les revenus des mécaniciens
    const mechanics = users.filter(u => u.role === 'mechanic');
    console.log(`\n💰 Revenus mécaniciens:`);
    for (const mechanic of mechanics) {
      const paidWorkOrders = await WorkOrder.find({ 
        mechanicId: mechanic._id, 
        status: 'paid' 
      });
      const totalEarnings = paidWorkOrders.reduce((sum, wo) => sum + (wo.total || 0), 0);
      const commission = (totalEarnings * (mechanic.commissionRate || 0)) / 100;
      console.log(`   - ${mechanic.fullName}: ${totalEarnings}€ → ${commission.toFixed(2)}€ commission`);
    }
    
    console.log('\n✅ Test rapide terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();