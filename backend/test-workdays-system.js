const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkDay = require('./src/models/WorkDay');
const SalaryService = require('./src/services/salaryService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testWorkDaysSystem() {
  try {
    console.log('🧪 TEST DU SYSTÈME DE DÉCLARATION DES JOURS DE TRAVAIL\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Nettoyer les données de test existantes
    await WorkDay.deleteMany({ 
      $or: [
        { notes: { $regex: /test/i } },
        { notes: 'Test automatique' }
      ]
    });
    
    // Créer un mécanicien de test
    const passwordHash = await bcrypt.hash('test123', 10);
    
    let testMechanic;
    try {
      testMechanic = new User({
        fullName: 'Test Mécanicien WorkDays',
        email: 'test.workdays@demo.com',
        passwordHash,
        role: 'mechanic',
        status: 'approved',
        phone: '+33 6 11 11 11 11',
        address: 'Test Address WorkDays',
        contractType: 'daily', // Contrat journalier pour tester
        baseSalary: 80, // 80€/jour
        commissionRate: 5,
        createdAt: new Date('2026-01-01'), // Embauché le 1er janvier
        updatedAt: new Date('2026-01-01')
      });
      
      await testMechanic.save();
      console.log(`✅ Mécanicien créé: ${testMechanic.fullName}`);
    } catch (error) {
      if (error.code === 11000) {
        testMechanic = await User.findOne({ email: 'test.workdays@demo.com' });
        console.log(`ℹ️  Mécanicien existant utilisé: ${testMechanic.fullName}`);
      } else {
        throw error;
      }
    }
    
    console.log('\n📅 SIMULATION DES DÉCLARATIONS DE JOURS DE TRAVAIL:\n');
    
    // Simuler des déclarations pour janvier 2026
    const workDaysToCreate = [
      { date: '2026-01-02', hours: 8, status: 'approved', notes: 'Journée complète' },
      { date: '2026-01-03', hours: 7.5, status: 'approved', notes: 'Parti plus tôt' },
      { date: '2026-01-06', hours: 8, status: 'approved', notes: 'Journée normale' },
      { date: '2026-01-07', hours: 8, status: 'approved', notes: 'Journée normale' },
      { date: '2026-01-08', hours: 6, status: 'approved', notes: 'Demi-journée formation' },
      { date: '2026-01-09', hours: 8, status: 'declared', notes: 'En attente validation' },
      { date: '2026-01-10', hours: 8, status: 'declared', notes: 'En attente validation' },
      { date: '2026-01-13', hours: 8, status: 'rejected', notes: 'Jour férié non travaillé', rejectionReason: 'Jour férié' },
      { date: '2026-01-14', hours: 8, status: 'approved', notes: 'Retour après férié' },
      { date: '2026-01-15', hours: 8, status: 'approved', notes: 'Journée normale' },
    ];
    
    console.log('📋 CRÉATION DES DÉCLARATIONS:');
    console.log('┌─────────────┬───────┬─────────────┬─────────────────────────┐');
    console.log('│ Date        │ Heures│ Statut      │ Notes                   │');
    console.log('├─────────────┼───────┼─────────────┼─────────────────────────┤');
    
    for (const dayData of workDaysToCreate) {
      const workDay = new WorkDay({
        mechanicId: testMechanic._id,
        date: new Date(dayData.date),
        hoursWorked: dayData.hours,
        status: dayData.status,
        notes: dayData.notes,
        declaredAt: new Date(),
        ...(dayData.status === 'approved' && { approvedAt: new Date() }),
        ...(dayData.status === 'rejected' && { 
          approvedAt: new Date(),
          rejectionReason: dayData.rejectionReason 
        })
      });
      
      await workDay.save();
      
      const statusLabel = {
        'declared': '⏳ En attente',
        'approved': '✅ Approuvé',
        'rejected': '❌ Rejeté'
      }[dayData.status];
      
      console.log(`│ ${dayData.date} │ ${dayData.hours.toString().padStart(5)}h │ ${statusLabel.padEnd(11)} │ ${dayData.notes.padEnd(23)} │`);
    }
    
    console.log('└─────────────┴───────┴─────────────┴─────────────────────────┘\n');
    
    // Calculer les statistiques
    const approvedDays = await WorkDay.find({
      mechanicId: testMechanic._id,
      status: 'approved'
    });
    
    const pendingDays = await WorkDay.find({
      mechanicId: testMechanic._id,
      status: 'declared'
    });
    
    const rejectedDays = await WorkDay.find({
      mechanicId: testMechanic._id,
      status: 'rejected'
    });
    
    console.log('📊 STATISTIQUES:');
    console.log(`   • Jours approuvés: ${approvedDays.length}`);
    console.log(`   • Jours en attente: ${pendingDays.length}`);
    console.log(`   • Jours rejetés: ${rejectedDays.length}`);
    console.log(`   • Total heures approuvées: ${approvedDays.reduce((sum, day) => sum + day.hoursWorked, 0)}h`);
    
    // Test du calcul de salaire avec les jours déclarés
    console.log('\n💰 CALCUL DU SALAIRE AVEC JOURS DÉCLARÉS:\n');
    
    const salaryCalc = await SalaryService.calculateMonthlySalary(
      testMechanic,
      2026, // année
      0,    // janvier (mois 0)
      { includeCommissions: false }
    );
    
    console.log('📋 DÉTAIL DU CALCUL:');
    console.log(`   • Type de contrat: ${SalaryService.getContractTypeLabel(testMechanic.contractType)}`);
    console.log(`   • Salaire journalier: ${testMechanic.baseSalary}€/jour`);
    console.log(`   • Méthode de calcul: ${salaryCalc.calculationDetails.calculationMethod}`);
    
    if (salaryCalc.workDaysDetails) {
      console.log(`   • Jours déclarés et approuvés: ${salaryCalc.workDaysDetails.declaredDays}`);
      console.log(`   • Total heures travaillées: ${salaryCalc.workDaysDetails.totalHours}h`);
      console.log(`   • Moyenne heures/jour: ${salaryCalc.workDaysDetails.averageHours.toFixed(1)}h`);
    } else {
      console.log(`   • Jours ouvrés théoriques: ${salaryCalc.calculationDetails.workingDaysInMonth}`);
    }
    
    console.log(`   • Salaire calculé: ${salaryCalc.baseSalary}€`);
    
    // Comparaison avec le calcul théorique
    const theoreticalDays = SalaryService.getWorkingDaysInMonth(2026, 0);
    const theoreticalSalary = testMechanic.baseSalary * theoreticalDays;
    
    console.log('\n🔍 COMPARAISON:');
    console.log(`   • Calcul théorique: ${theoreticalDays} jours × ${testMechanic.baseSalary}€ = ${theoreticalSalary}€`);
    console.log(`   • Calcul avec déclarations: ${approvedDays.length} jours × ${testMechanic.baseSalary}€ = ${salaryCalc.baseSalary}€`);
    console.log(`   • Différence: ${(theoreticalSalary - salaryCalc.baseSalary).toFixed(2)}€`);
    
    if (salaryCalc.workDaysDetails) {
      console.log(`   ✅ Le calcul utilise les jours réellement déclarés et approuvés`);
    } else {
      console.log(`   📊 Le calcul utilise les jours ouvrés théoriques`);
    }
    
    // Test des fonctions utilitaires
    console.log('\n🛠️  TEST DES FONCTIONS UTILITAIRES:\n');
    
    // Test de validation des jours ouvrés
    const testDates = [
      { date: '2026-01-01', expected: false, reason: 'Jour férié (Nouvel An)' },
      { date: '2026-01-04', expected: false, reason: 'Samedi' },
      { date: '2026-01-05', expected: false, reason: 'Dimanche' },
      { date: '2026-01-06', expected: true, reason: 'Lundi ouvré' },
      { date: '2026-05-01', expected: false, reason: 'Fête du Travail' },
      { date: '2026-12-25', expected: false, reason: 'Noël' }
    ];
    
    console.log('📅 VALIDATION DES JOURS OUVRÉS:');
    console.log('┌─────────────┬─────────┬─────────────────────────┐');
    console.log('│ Date        │ Ouvré ? │ Raison                  │');
    console.log('├─────────────┼─────────┼─────────────────────────┤');
    
    testDates.forEach(({ date, expected, reason }) => {
      const testDate = new Date(date);
      const workDay = new WorkDay({ date: testDate });
      const isWorking = workDay.isWorkingDay();
      const result = isWorking === expected ? '✅' : '❌';
      
      console.log(`│ ${date} │ ${result} ${isWorking ? 'Oui' : 'Non'.padEnd(3)} │ ${reason.padEnd(23)} │`);
    });
    
    console.log('└─────────────┴─────────┴─────────────────────────┘\n');
    
    // Test des statistiques
    const stats = await WorkDay.calculateWorkedHours(
      testMechanic._id,
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );
    
    console.log('📈 STATISTIQUES CALCULÉES:');
    if (stats.length > 0) {
      console.log(`   • Total heures: ${stats[0].totalHours}h`);
      console.log(`   • Total jours: ${stats[0].totalDays}`);
      console.log(`   • Moyenne heures/jour: ${(stats[0].totalHours / stats[0].totalDays).toFixed(1)}h`);
    } else {
      console.log('   • Aucune donnée trouvée');
    }
    
    console.log('\n🎯 POINTS IMPORTANTS:');
    console.log('   • Les déclarations doivent être approuvées par le manager');
    console.log('   • Seuls les jours ouvrés peuvent être déclarés');
    console.log('   • Le calcul de salaire utilise les jours réellement approuvés');
    console.log('   • Les weekends et jours fériés sont automatiquement rejetés');
    console.log('   • Le système empêche les déclarations futures');
    
    console.log('\n🧪 POUR TESTER DANS L\'INTERFACE:');
    console.log('   1. Connectez-vous avec: test.workdays@demo.com / test123');
    console.log('   2. Allez dans "Mes Jours de Travail" pour voir les déclarations');
    console.log('   3. Allez dans "Mes Revenus" pour voir le calcul précis');
    console.log('   4. Connectez-vous en tant que manager pour valider les déclarations en attente');
    
    console.log('\n🧹 NETTOYAGE:');
    console.log('   Les données de test restent pour les tests d\'interface');
    console.log('   Pour nettoyer: await WorkDay.deleteMany({ notes: /test/i });');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

testWorkDaysSystem();