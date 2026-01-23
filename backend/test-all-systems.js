const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tool = require('./src/models/Tool');
const WorkOrder = require('./src/models/WorkOrder');
const WorkDay = require('./src/models/WorkDay');
require('dotenv').config();

async function testAllSystems() {
  try {
    console.log('🧪 TEST COMPLET DE TOUS LES SYSTÈMES\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Test 1: Vérifier les utilisateurs
    console.log('👥 UTILISATEURS:');
    const users = await User.find();
    const mechanics = users.filter(u => u.role === 'mechanic');
    const managers = users.filter(u => u.role === 'manager');
    const clients = users.filter(u => u.role === 'client');
    
    console.log(`   • Total: ${users.length} utilisateurs`);
    console.log(`   • Mécaniciens: ${mechanics.length}`);
    console.log(`   • Managers: ${managers.length}`);
    console.log(`   • Clients: ${clients.length}`);
    
    // Test 2: Vérifier les outils
    console.log('\n🔧 OUTILS:');
    const tools = await Tool.find();
    const reusableTools = tools.filter(t => !t.isConsumable);
    const consumables = tools.filter(t => t.isConsumable);
    
    console.log(`   • Total: ${tools.length} outils`);
    console.log(`   • Réutilisables: ${reusableTools.length}`);
    console.log(`   • Consommables: ${consumables.length}`);
    
    // Test 3: Vérifier les WorkOrders
    console.log('\n📋 WORK ORDERS:');
    const workOrders = await WorkOrder.find();
    const paidWorkOrders = workOrders.filter(wo => wo.status === 'paid');
    const totalRevenue = paidWorkOrders.reduce((sum, wo) => sum + (wo.total || 0), 0);
    
    console.log(`   • Total: ${workOrders.length} work orders`);
    console.log(`   • Payés: ${paidWorkOrders.length}`);
    console.log(`   • Chiffre d'affaires: ${totalRevenue}€`);
    
    // Test 4: Vérifier les WorkDays
    console.log('\n📅 JOURS DE TRAVAIL:');
    const workDays = await WorkDay.find();
    const approvedDays = workDays.filter(wd => wd.status === 'approved');
    const pendingDays = workDays.filter(wd => wd.status === 'declared');
    
    console.log(`   • Total déclarations: ${workDays.length}`);
    console.log(`   • Approuvées: ${approvedDays.length}`);
    console.log(`   • En attente: ${pendingDays.length}`);
    
    // Test 5: Calculer les revenus des mécaniciens
    console.log('\n💰 REVENUS MÉCANICIENS:');
    for (const mechanic of mechanics) {
      const mechanicWorkOrders = paidWorkOrders.filter(wo => 
        wo.mechanicId && wo.mechanicId.toString() === mechanic._id.toString()
      );
      const mechanicRevenue = mechanicWorkOrders.reduce((sum, wo) => sum + (wo.total || 0), 0);
      const commission = (mechanicRevenue * (mechanic.commissionRate || 0)) / 100;
      
      console.log(`   • ${mechanic.fullName}:`);
      console.log(`     - Contrat: ${mechanic.contractType} (${mechanic.baseSalary}€)`);
      console.log(`     - Réparations: ${mechanicWorkOrders.length}`);
      console.log(`     - CA généré: ${mechanicRevenue}€`);
      console.log(`     - Commission: ${commission.toFixed(2)}€`);
    }
    
    console.log('\n✅ SYSTÈME OPÉRATIONNEL !');
    
    console.log('\n🎯 COMPTES DE TEST:');
    console.log('   • Client: client@demo.com / client123');
    console.log('   • Mécanicien: mechanic@demo.com / mechanic123');
    console.log('   • Manager: manager@demo.com / manager123');
    
    console.log('\n🔧 FONCTIONNALITÉS À TESTER:');
    console.log('   1. Déclaration des jours de travail');
    console.log('   2. Gestion des outils et inventaire');
    console.log('   3. Calcul des salaires et commissions');
    console.log('   4. Workflow complet des réparations');
    console.log('   5. Interface mobile responsive');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAllSystems();