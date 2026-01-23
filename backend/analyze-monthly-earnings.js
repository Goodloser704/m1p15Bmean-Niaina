const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkOrder = require('./src/models/WorkOrder');
const Appointment = require('./src/models/Appointment');
require('dotenv').config();

async function analyzeMonthlyEarnings() {
  try {
    console.log('📈 Analyse des revenus mensuels...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer tous les mécaniciens
    const mechanics = await User.find({ role: 'mechanic' });
    
    if (mechanics.length === 0) {
      console.log('❌ Aucun mécanicien trouvé.');
      return;
    }
    
    console.log(`👥 Analyse pour ${mechanics.length} mécanicien(s):\n`);
    
    for (const mechanic of mechanics) {
      console.log(`🔧 ${mechanic.fullName} (${mechanic.email})`);
      console.log(`   Contrat: ${mechanic.contractType} | Salaire: ${mechanic.baseSalary}€ | Commission: ${mechanic.commissionRate}%`);
      console.log('   ─'.repeat(80));
      
      // Récupérer tous les WorkOrders payés de ce mécanicien
      const paidWorkOrders = await WorkOrder.find({
        mechanicId: mechanic._id,
        status: 'paid'
      }).sort({ updatedAt: 1 });
      
      if (paidWorkOrders.length === 0) {
        console.log('   ❌ Aucune réparation payée trouvée\n');
        continue;
      }
      
      // Grouper par mois
      const monthlyData = {};
      
      for (const workOrder of paidWorkOrders) {
        const date = new Date(workOrder.updatedAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            name: monthName,
            workOrders: [],
            totalRevenue: 0,
            totalCommissions: 0,
            repairCount: 0
          };
        }
        
        const revenue = workOrder.total || 0;
        const commission = (revenue * mechanic.commissionRate) / 100;
        
        monthlyData[monthKey].workOrders.push(workOrder);
        monthlyData[monthKey].totalRevenue += revenue;
        monthlyData[monthKey].totalCommissions += commission;
        monthlyData[monthKey].repairCount++;
      }
      
      // Afficher les résultats mois par mois
      const sortedMonths = Object.keys(monthlyData).sort();
      let cumulativeCommissions = 0;
      
      console.log('   📅 ÉVOLUTION MENSUELLE:');
      console.log('   ┌─────────────────┬──────────┬─────────────┬──────────────┬─────────────────┐');
      console.log('   │ Mois            │ Réparat. │ CA Généré   │ Commissions  │ Revenus Totaux  │');
      console.log('   ├─────────────────┼──────────┼─────────────┼──────────────┼─────────────────┤');
      
      for (const monthKey of sortedMonths) {
        const data = monthlyData[monthKey];
        cumulativeCommissions += data.totalCommissions;
        
        let monthlyEarnings = 0;
        if (mechanic.contractType === 'monthly') {
          monthlyEarnings = mechanic.baseSalary + data.totalCommissions;
        } else if (mechanic.contractType === 'daily') {
          // Estimation: 22 jours ouvrés par mois
          monthlyEarnings = (mechanic.baseSalary * 22) + data.totalCommissions;
        } else if (mechanic.contractType === 'commission') {
          monthlyEarnings = data.totalCommissions;
        }
        
        console.log(`   │ ${data.name.padEnd(15)} │ ${data.repairCount.toString().padStart(8)} │ ${data.totalRevenue.toFixed(2).padStart(10)}€ │ ${data.totalCommissions.toFixed(2).padStart(11)}€ │ ${monthlyEarnings.toFixed(2).padStart(14)}€ │`);
      }
      
      console.log('   └─────────────────┴──────────┴─────────────┴──────────────┴─────────────────┘');
      
      // Statistiques globales
      const totalRepairs = paidWorkOrders.length;
      const totalRevenue = paidWorkOrders.reduce((sum, wo) => sum + (wo.total || 0), 0);
      const averageRepairValue = totalRevenue / totalRepairs;
      
      console.log(`\n   📊 STATISTIQUES GLOBALES:`);
      console.log(`   • Total réparations: ${totalRepairs}`);
      console.log(`   • Chiffre d'affaires généré: ${totalRevenue.toFixed(2)}€`);
      console.log(`   • Valeur moyenne par réparation: ${averageRepairValue.toFixed(2)}€`);
      console.log(`   • Commissions totales: ${cumulativeCommissions.toFixed(2)}€`);
      
      // Projection revenus selon le contrat
      console.log(`\n   💰 REVENUS SELON LE CONTRAT:`);
      if (mechanic.contractType === 'monthly') {
        const monthsWorked = sortedMonths.length;
        const totalSalary = mechanic.baseSalary * monthsWorked;
        const totalEarnings = totalSalary + cumulativeCommissions;
        console.log(`   • Salaire fixe (${monthsWorked} mois): ${totalSalary.toFixed(2)}€`);
        console.log(`   • Commissions: ${cumulativeCommissions.toFixed(2)}€`);
        console.log(`   • TOTAL: ${totalEarnings.toFixed(2)}€`);
        console.log(`   • Moyenne mensuelle: ${(totalEarnings / monthsWorked).toFixed(2)}€`);
      } else if (mechanic.contractType === 'commission') {
        const monthsWorked = sortedMonths.length;
        console.log(`   • Commissions uniquement: ${cumulativeCommissions.toFixed(2)}€`);
        console.log(`   • Moyenne mensuelle: ${(cumulativeCommissions / monthsWorked).toFixed(2)}€`);
      }
      
      console.log('\n');
    }
    
    console.log('🎯 VÉRIFICATIONS À FAIRE:');
    console.log('1. Les commissions augmentent-elles chaque mois ?');
    console.log('2. Le salaire mensuel reste-t-il constant (contrat mensuel) ?');
    console.log('3. Les revenus totaux évoluent-ils correctement ?');
    console.log('4. L\'interface web affiche-t-elle les bonnes valeurs ?');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

analyzeMonthlyEarnings();