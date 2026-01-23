const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkDay = require('./src/models/WorkDay');
require('dotenv').config();

async function quickTestWorkdays() {
  try {
    console.log('🔍 VÉRIFICATION RAPIDE DU SYSTÈME WORKDAYS\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Vérifier les utilisateurs de test
    const testMechanic = await User.findOne({ email: 'test.workdays@demo.com' });
    const manager = await User.findOne({ role: 'manager' });
    
    console.log('👥 UTILISATEURS:');
    console.log(`   • Mécanicien test: ${testMechanic ? '✅ Trouvé' : '❌ Manquant'} (test.workdays@demo.com)`);
    console.log(`   • Manager: ${manager ? '✅ Trouvé' : '❌ Manquant'} (${manager?.email || 'N/A'})`);
    
    if (testMechanic) {
      // Vérifier les déclarations
      const workDays = await WorkDay.find({ mechanicId: testMechanic._id });
      const approved = workDays.filter(wd => wd.status === 'approved');
      const pending = workDays.filter(wd => wd.status === 'declared');
      const rejected = workDays.filter(wd => wd.status === 'rejected');
      
      console.log('\n📅 DÉCLARATIONS DE JOURS:');
      console.log(`   • Total: ${workDays.length}`);
      console.log(`   • Approuvées: ${approved.length}`);
      console.log(`   • En attente: ${pending.length}`);
      console.log(`   • Rejetées: ${rejected.length}`);
      
      if (workDays.length > 0) {
        console.log('\n📋 DÉTAIL DES DÉCLARATIONS:');
        workDays.forEach(wd => {
          const statusIcon = {
            'approved': '✅',
            'declared': '⏳',
            'rejected': '❌'
          }[wd.status];
          
          console.log(`   ${statusIcon} ${wd.date.toISOString().split('T')[0]} - ${wd.hoursWorked}h - ${wd.notes}`);
        });
      }
    }
    
    console.log('\n🌐 POUR TESTER L\'INTERFACE:');
    console.log('   1. Ouvrez http://localhost:4200');
    console.log('   2. Connectez-vous avec test.workdays@demo.com / test123');
    console.log('   3. Allez dans "Mes Jours de Travail"');
    console.log('   4. Allez dans "Mes Revenus" pour voir le calcul');
    console.log('   5. Connectez-vous en manager pour valider les déclarations');
    
    console.log('\n✅ Système prêt pour les tests !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTestWorkdays();