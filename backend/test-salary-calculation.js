const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkOrder = require('./src/models/WorkOrder');
const SalaryService = require('./src/services/salaryService');
require('dotenv').config();

async function testSalaryCalculation() {
  try {
    console.log('💰 Test du calcul des salaires réaliste...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les mécaniciens
    const mechanics = await User.find({ role: 'mechanic' });
    
    if (mechanics.length === 0) {
      console.log('❌ Aucun mécanicien trouvé.');
      return;
    }
    
    console.log('📅 ANALYSE DES JOURS OUVRÉS:\n');
    
    // Analyser plusieurs mois
    const months = [
      { year: 2025, month: 11, name: 'Décembre 2025' }, // month = 11 pour décembre
      { year: 2026, month: 0, name: 'Janvier 2026' },   // month = 0 pour janvier
      { year: 2026, month: 1, name: 'Février 2026' }    // month = 1 pour février
    ];
    
    console.log('🗓️  JOURS OUVRÉS PAR MOIS:');
    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Mois            │ Jours Total │ Jours Ouvrés│ Weekends+Fér│');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────┤');
    
    months.forEach(({ year, month, name }) => {
      const totalDays = new Date(year, month + 1, 0).getDate();
      const workingDays = SalaryService.getWorkingDaysInMonth(year, month);
      const nonWorkingDays = totalDays - workingDays;
      
      console.log(`│ ${name.padEnd(15)} │ ${totalDays.toString().padStart(11)} │ ${workingDays.toString().padStart(11)} │ ${nonWorkingDays.toString().padStart(11)} │`);
    });
    
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────┘\n');
    
    // Analyser chaque mécanicien
    for (const mechanic of mechanics) {
      console.log(`🔧 ${mechanic.fullName} (${mechanic.email})`);
      console.log(`   Contrat: ${SalaryService.getContractTypeLabel(mechanic.contractType)}`);
      console.log(`   Salaire de base: ${mechanic.baseSalary}€ ${mechanic.contractType === 'daily' ? '/jour' : '/mois'}`);
      console.log(`   Commission: ${mechanic.commissionRate}%`);
      console.log('   ─'.repeat(80));
      
      // Récupérer les WorkOrders payés
      const paidWorkOrders = await WorkOrder.find({
        mechanicId: mechanic._id,
        status: 'paid'
      }).sort({ updatedAt: 1 });
      
      if (paidWorkOrders.length === 0) {
        console.log('   ❌ Aucune réparation payée\n');
        continue;
      }
      
      console.log('   📊 CALCUL DÉTAILLÉ PAR MOIS:');
      console.log('   ┌─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐');
      console.log('   │ Mois            │ Jours Ouvrés│ Salaire Base│ Commissions │ Total Mois  │');
      console.log('   ├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
      
      let totalBaseSalary = 0;
      let totalCommissions = 0;
      
      // Grouper par mois
      const monthlyData = {};
      paidWorkOrders.forEach(wo => {
        const date = new Date(wo.updatedAt);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthKey = `${year}-${month}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            year,
            month,
            name: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            workOrders: [],
            totalRevenue: 0
          };
        }
        
        monthlyData[monthKey].workOrders.push(wo);
        monthlyData[monthKey].totalRevenue += wo.total || 0;
      });
      
      // Calculer pour chaque mois
      Object.values(monthlyData).forEach(monthData => {
        const commissions = monthData.totalRevenue * (mechanic.commissionRate / 100);
        
        const salaryCalc = SalaryService.calculateMonthlySalary(
          mechanic,
          monthData.year,
          monthData.month,
          {
            includeCommissions: false // On affiche séparément
          }
        );
        
        const workingDays = SalaryService.getWorkingDaysInMonth(monthData.year, monthData.month);
        
        console.log(`   │ ${monthData.name.padEnd(15)} │ ${workingDays.toString().padStart(11)} │ ${salaryCalc.baseSalary.toFixed(2).padStart(10)}€ │ ${commissions.toFixed(2).padStart(10)}€ │ ${(salaryCalc.baseSalary + commissions).toFixed(2).padStart(10)}€ │`);
        
        totalBaseSalary += salaryCalc.baseSalary;
        totalCommissions += commissions;
      });
      
      console.log('   ├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
      console.log(`   │ TOTAL           │             │ ${totalBaseSalary.toFixed(2).padStart(10)}€ │ ${totalCommissions.toFixed(2).padStart(10)}€ │ ${(totalBaseSalary + totalCommissions).toFixed(2).padStart(10)}€ │`);
      console.log('   └─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘');
      
      // Détails du calcul selon le type de contrat
      console.log('\n   💡 DÉTAILS DU CALCUL:');
      if (mechanic.contractType === 'monthly') {
        console.log(`   • Salaire mensuel fixe: ${mechanic.baseSalary}€/mois`);
        console.log(`   • Nombre de mois travaillés: ${Object.keys(monthlyData).length}`);
        console.log(`   • Total salaire fixe: ${totalBaseSalary.toFixed(2)}€`);
      } else if (mechanic.contractType === 'daily') {
        const totalWorkingDays = Object.values(monthlyData).reduce((sum, month) => {
          return sum + SalaryService.getWorkingDaysInMonth(month.year, month.month);
        }, 0);
        console.log(`   • Salaire journalier: ${mechanic.baseSalary}€/jour`);
        console.log(`   • Total jours ouvrés: ${totalWorkingDays} jours`);
        console.log(`   • Total salaire: ${totalBaseSalary.toFixed(2)}€`);
      } else if (mechanic.contractType === 'commission') {
        console.log(`   • Pas de salaire fixe (commission uniquement)`);
        console.log(`   • Taux de commission: ${mechanic.commissionRate}%`);
      }
      
      console.log(`   • Total commissions: ${totalCommissions.toFixed(2)}€`);
      console.log(`   • REVENUS TOTAUX: ${(totalBaseSalary + totalCommissions).toFixed(2)}€\n`);
    }
    
    console.log('🎯 POINTS IMPORTANTS:');
    console.log('• Le salaire mensuel est calculé selon les jours ouvrés réels');
    console.log('• Les weekends et jours fériés sont exclus du calcul journalier');
    console.log('• Février a moins de jours ouvrés que janvier');
    console.log('• Les commissions s\'ajoutent au salaire de base');
    console.log('• Le contrat "commission" n\'a pas de salaire fixe');
    
    console.log('\n🔧 AMÉLIORATIONS POSSIBLES:');
    console.log('• Gestion des congés payés');
    console.log('• Gestion des arrêts maladie');
    console.log('• Heures supplémentaires');
    console.log('• Primes et bonus');
    console.log('• Calcul proratisé pour embauche/départ en cours de mois');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

testSalaryCalculation();