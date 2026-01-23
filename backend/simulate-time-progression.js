const mongoose = require('mongoose');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function simulateTimeProgression() {
  try {
    console.log('⏰ Simulation de la progression temporelle...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer tous les WorkOrders payés
    const paidWorkOrders = await WorkOrder.find({ status: 'paid' }).sort({ createdAt: 1 });
    
    if (paidWorkOrders.length === 0) {
      console.log('❌ Aucun WorkOrder payé trouvé. Exécutez d\'abord test-complete-workflow.js');
      return;
    }
    
    console.log(`📋 ${paidWorkOrders.length} WorkOrder(s) payé(s) trouvé(s)`);
    
    // Définir les périodes (3 mois en arrière)
    const now = new Date();
    const periods = [
      {
        name: 'Il y a 3 mois',
        start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        end: new Date(now.getFullYear(), now.getMonth() - 2, 0)
      },
      {
        name: 'Il y a 2 mois', 
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        end: new Date(now.getFullYear(), now.getMonth() - 1, 0)
      },
      {
        name: 'Le mois dernier',
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      }
    ];
    
    console.log('\n📅 Périodes définies:');
    periods.forEach((period, index) => {
      console.log(`   ${index + 1}. ${period.name}: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`);
    });
    
    // Répartir les WorkOrders sur les 3 périodes
    const workOrdersPerPeriod = Math.ceil(paidWorkOrders.length / periods.length);
    let updatedCount = 0;
    
    console.log(`\n🔄 Répartition: ~${workOrdersPerPeriod} WorkOrders par période`);
    
    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const period = periods[periodIndex];
      const startIndex = periodIndex * workOrdersPerPeriod;
      const endIndex = Math.min(startIndex + workOrdersPerPeriod, paidWorkOrders.length);
      const workOrdersForPeriod = paidWorkOrders.slice(startIndex, endIndex);
      
      console.log(`\n📊 ${period.name}: ${workOrdersForPeriod.length} WorkOrders`);
      
      for (let i = 0; i < workOrdersForPeriod.length; i++) {
        const workOrder = workOrdersForPeriod[i];
        
        // Générer une date aléatoire dans la période
        const randomTime = period.start.getTime() + 
          Math.random() * (period.end.getTime() - period.start.getTime());
        const randomDate = new Date(randomTime);
        
        // Mettre à jour les dates
        const originalCreated = workOrder.createdAt;
        const originalUpdated = workOrder.updatedAt;
        
        workOrder.createdAt = randomDate;
        workOrder.updatedAt = new Date(randomDate.getTime() + 24 * 60 * 60 * 1000); // +1 jour
        
        await workOrder.save();
        updatedCount++;
        
        console.log(`   ✅ WorkOrder ${workOrder._id.toString().substring(0, 8)}... : ${originalCreated.toLocaleDateString()} → ${randomDate.toLocaleDateString()}`);
      }
    }
    
    console.log(`\n🎉 ${updatedCount} WorkOrders mis à jour avec succès !`);
    
    // Vérification finale
    console.log('\n🔍 VÉRIFICATION:');
    const updatedWorkOrders = await WorkOrder.find({ status: 'paid' }).sort({ updatedAt: 1 });
    
    const monthlyStats = {};
    for (const wo of updatedWorkOrders) {
      const monthKey = `${wo.updatedAt.getFullYear()}-${(wo.updatedAt.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = wo.updatedAt.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { name: monthName, count: 0, total: 0 };
      }
      
      monthlyStats[monthKey].count++;
      monthlyStats[monthKey].total += wo.total || 0;
    }
    
    console.log('\n📈 RÉPARTITION PAR MOIS:');
    Object.values(monthlyStats).forEach(stat => {
      console.log(`   • ${stat.name}: ${stat.count} réparations, ${stat.total.toFixed(2)}€`);
    });
    
    console.log('\n🧪 TESTS À EFFECTUER MAINTENANT:');
    console.log('1. Exécutez: node analyze-monthly-earnings.js');
    console.log('2. Connectez-vous sur l\'interface web');
    console.log('3. Allez dans "Mes Revenus" (mécanicien)');
    console.log('4. Vérifiez l\'évolution des commissions');
    console.log('5. Vérifiez que le salaire mensuel reste constant');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

simulateTimeProgression();