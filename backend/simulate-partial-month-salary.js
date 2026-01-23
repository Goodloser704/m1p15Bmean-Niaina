const mongoose = require('mongoose');
const User = require('./src/models/User');
const SalaryService = require('./src/services/salaryService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function simulatePartialMonthSalary() {
  try {
    console.log('🧪 SIMULATION: Inscription le 4 janvier, salaire mensuel 100€, compte au 30 mars\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Créer l'employé avec inscription le 4 janvier
    const hireDate = new Date('2026-01-04'); // 4 janvier 2026
    const endDate = new Date('2026-03-30');   // 30 mars 2026
    
    console.log('📋 DONNÉES DE L\'EMPLOYÉ:');
    console.log(`   • Date d'embauche: ${hireDate.toLocaleDateString('fr-FR')}`);
    console.log(`   • Date de calcul: ${endDate.toLocaleDateString('fr-FR')}`);
    console.log(`   • Salaire mensuel: 100€`);
    console.log(`   • Commission: 0%`);
    console.log(`   • Type de contrat: Mensuel`);
    
    // Créer l'utilisateur
    const passwordHash = await bcrypt.hash('test123', 10);
    
    let testEmployee;
    try {
      testEmployee = new User({
        fullName: 'Test Employé Janvier',
        email: 'test.janvier@demo.com',
        passwordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 00 00 00 00',
        address: 'Test Address',
        contractType: 'monthly',
        baseSalary: 100, // 100€/mois
        commissionRate: 0, // Pas de commission
        createdAt: hireDate, // Date d'embauche
        updatedAt: hireDate
      });
      
      await testEmployee.save();
      console.log(`   ✅ Employé créé: ${testEmployee.fullName}`);
    } catch (error) {
      if (error.code === 11000) {
        testEmployee = await User.findOne({ email: 'test.janvier@demo.com' });
        console.log(`   ℹ️  Employé existant utilisé: ${testEmployee.fullName}`);
      } else {
        throw error;
      }
    }
    
    console.log('\n📅 ANALYSE DÉTAILLÉE PAR MOIS:\n');
    
    // Analyser chaque mois
    const months = [
      {
        name: 'Janvier 2026',
        year: 2026,
        month: 0, // Janvier = 0
        startDate: hireDate, // Commence le 4 janvier
        endDate: new Date('2026-01-31'),
        isPartial: true
      },
      {
        name: 'Février 2026', 
        year: 2026,
        month: 1, // Février = 1
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
        isPartial: false
      },
      {
        name: 'Mars 2026',
        year: 2026,
        month: 2, // Mars = 2
        startDate: new Date('2026-03-01'),
        endDate: endDate, // Jusqu'au 30 mars
        isPartial: true
      }
    ];
    
    let totalSalary = 0;
    
    for (const monthData of months) {
      console.log(`🗓️  ${monthData.name.toUpperCase()}:`);
      
      // Calculer les jours du mois
      const totalDaysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();
      const workingDaysInMonth = SalaryService.getWorkingDaysInMonth(monthData.year, monthData.month);
      
      console.log(`   • Jours total dans le mois: ${totalDaysInMonth}`);
      console.log(`   • Jours ouvrés dans le mois: ${workingDaysInMonth}`);
      
      if (monthData.isPartial) {
        // Calcul pour mois partiel
        const workedDays = SalaryService.calculateWorkedDaysInPeriod(monthData.startDate, monthData.endDate);
        const totalWorkedDays = SalaryService.calculateWorkedDaysInPeriod(
          new Date(monthData.year, monthData.month, 1),
          monthData.endDate
        );
        
        console.log(`   • Période travaillée: ${monthData.startDate.toLocaleDateString('fr-FR')} → ${monthData.endDate.toLocaleDateString('fr-FR')}`);
        console.log(`   • Jours ouvrés travaillés: ${workedDays}`);
        
        // Calcul proratisé
        const dailyRate = testEmployee.baseSalary / workingDaysInMonth;
        const monthSalary = dailyRate * workedDays;
        
        console.log(`   • Taux journalier: ${dailyRate.toFixed(2)}€/jour (${testEmployee.baseSalary}€ ÷ ${workingDaysInMonth} jours)`);
        console.log(`   • Salaire du mois: ${monthSalary.toFixed(2)}€ (${dailyRate.toFixed(2)}€ × ${workedDays} jours)`);
        
        totalSalary += monthSalary;
        
      } else {
        // Mois complet
        console.log(`   • Période: Mois complet`);
        console.log(`   • Salaire du mois: ${testEmployee.baseSalary.toFixed(2)}€ (salaire mensuel complet)`);
        
        totalSalary += testEmployee.baseSalary;
      }
      
      console.log(`   • Cumul total: ${totalSalary.toFixed(2)}€\n`);
    }
    
    console.log('📊 RÉSUMÉ FINAL AU 30 MARS 2026:');
    console.log('═'.repeat(50));
    
    // Détail par mois
    console.log('\n📋 DÉTAIL PAR MOIS:');
    
    // Janvier (partiel)
    const janWorkedDays = SalaryService.calculateWorkedDaysInPeriod(
      new Date('2026-01-04'), 
      new Date('2026-01-31')
    );
    const janWorkingDays = SalaryService.getWorkingDaysInMonth(2026, 0);
    const janSalary = (100 / janWorkingDays) * janWorkedDays;
    
    console.log(`   🗓️  Janvier 2026 (partiel - à partir du 4):`);
    console.log(`      • Jours ouvrés travaillés: ${janWorkedDays}/${janWorkingDays}`);
    console.log(`      • Salaire: ${janSalary.toFixed(2)}€`);
    
    // Février (complet)
    const febWorkingDays = SalaryService.getWorkingDaysInMonth(2026, 1);
    console.log(`   🗓️  Février 2026 (complet):`);
    console.log(`      • Jours ouvrés: ${febWorkingDays}`);
    console.log(`      • Salaire: 100.00€`);
    
    // Mars (partiel)
    const marWorkedDays = SalaryService.calculateWorkedDaysInPeriod(
      new Date('2026-03-01'),
      new Date('2026-03-30')
    );
    const marWorkingDays = SalaryService.getWorkingDaysInMonth(2026, 2);
    const marSalary = (100 / marWorkingDays) * marWorkedDays;
    
    console.log(`   🗓️  Mars 2026 (partiel - jusqu'au 30):`);
    console.log(`      • Jours ouvrés travaillés: ${marWorkedDays}/${marWorkingDays}`);
    console.log(`      • Salaire: ${marSalary.toFixed(2)}€`);
    
    console.log('\n💰 TOTAL CUMULÉ:');
    console.log(`   • Janvier (partiel): ${janSalary.toFixed(2)}€`);
    console.log(`   • Février (complet): 100.00€`);
    console.log(`   • Mars (partiel): ${marSalary.toFixed(2)}€`);
    console.log(`   ─────────────────────────────`);
    console.log(`   • TOTAL AU 30 MARS: ${(janSalary + 100 + marSalary).toFixed(2)}€`);
    
    console.log('\n🔍 VÉRIFICATION CALCUL:');
    console.log(`   • Période totale: ${hireDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`);
    console.log(`   • Durée: ~2.9 mois`);
    console.log(`   • Si salaire complet: 3 × 100€ = 300€`);
    console.log(`   • Avec proratisation: ${(janSalary + 100 + marSalary).toFixed(2)}€`);
    console.log(`   • Différence: ${(300 - (janSalary + 100 + marSalary)).toFixed(2)}€ (normal car mois partiels)`);
    
    console.log('\n🎯 POINTS IMPORTANTS:');
    console.log('   • Janvier: Proratisé car embauche le 4 (pas le 1er)');
    console.log('   • Février: Salaire complet (mois entier travaillé)');
    console.log('   • Mars: Proratisé car calcul jusqu\'au 30 (pas le 31)');
    console.log('   • Le calcul tient compte des weekends et jours fériés');
    
    console.log('\n🧪 POUR TESTER DANS L\'INTERFACE:');
    console.log('   1. Connectez-vous avec: test.janvier@demo.com / test123');
    console.log('   2. Allez dans "Mes Revenus"');
    console.log('   3. Vérifiez que le calcul correspond à cette simulation');
    
    // Nettoyage optionnel
    console.log('\n🧹 Nettoyage (optionnel):');
    console.log('   Pour supprimer cet employé de test:');
    console.log('   await User.deleteOne({ email: "test.janvier@demo.com" });');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

simulatePartialMonthSalary();