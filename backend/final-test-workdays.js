const mongoose = require('mongoose');
const User = require('./src/models/User');
const WorkDay = require('./src/models/WorkDay');
require('dotenv').config();

async function finalTestWorkdays() {
  try {
    console.log('🎯 VÉRIFICATION FINALE DU SYSTÈME WORKDAYS\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Vérifier les utilisateurs
    const users = await User.find({}).select('fullName email role contractType baseSalary commissionRate');
    const mechanics = users.filter(u => u.role === 'mechanic');
    
    console.log('👥 UTILISATEURS DISPONIBLES:');
    users.forEach(user => {
      const roleIcon = {
        'client': '👤',
        'mechanic': '🔧',
        'manager': '👔'
      }[user.role] || '❓';
      
      console.log(`   ${roleIcon} ${user.fullName} (${user.email}) - ${user.role}`);
      if (user.role === 'mechanic') {
        console.log(`      💰 ${user.contractType} - ${user.baseSalary}€ - ${user.commissionRate}% commission`);
      }
    });
    
    // Vérifier les déclarations
    console.log('\n📅 DÉCLARATIONS PAR MÉCANICIEN:');
    for (const mechanic of mechanics) {
      const workDays = await WorkDay.find({ mechanicId: mechanic._id });
      const approved = workDays.filter(wd => wd.status === 'approved');
      const pending = workDays.filter(wd => wd.status === 'declared');
      const rejected = workDays.filter(wd => wd.status === 'rejected');
      
      console.log(`   🔧 ${mechanic.fullName}:`);
      console.log(`      • Total: ${workDays.length} déclarations`);
      console.log(`      • ✅ Approuvées: ${approved.length}`);
      console.log(`      • ⏳ En attente: ${pending.length}`);
      console.log(`      • ❌ Rejetées: ${rejected.length}`);
      
      if (approved.length > 0) {
        const totalHours = approved.reduce((sum, wd) => sum + wd.hoursWorked, 0);
        console.log(`      • 🕐 Total heures approuvées: ${totalHours}h`);
      }
    }
    
    // Statistiques globales
    const totalWorkDays = await WorkDay.countDocuments();
    const totalApproved = await WorkDay.countDocuments({ status: 'approved' });
    const totalPending = await WorkDay.countDocuments({ status: 'declared' });
    const totalRejected = await WorkDay.countDocuments({ status: 'rejected' });
    
    console.log('\n📊 STATISTIQUES GLOBALES:');
    console.log(`   • Total déclarations: ${totalWorkDays}`);
    console.log(`   • Approuvées: ${totalApproved}`);
    console.log(`   • En attente: ${totalPending}`);
    console.log(`   • Rejetées: ${totalRejected}`);
    
    console.log('\n🧪 COMPTES DE TEST RECOMMANDÉS:');
    console.log('   🔧 Mécaniciens:');
    mechanics.forEach(mechanic => {
      console.log(`      • ${mechanic.fullName}: ${mechanic.email} / mechanic123`);
      console.log(`        (${mechanic.contractType} - ${mechanic.baseSalary}€)`);
    });
    console.log('   👔 Manager: manager@demo.com / manager123');
    console.log('   👤 Client: client@demo.com / client123');
    
    console.log('\n🎯 FONCTIONNALITÉS À TESTER:');
    console.log('   1. 📅 Déclaration de jours de travail (mécanicien)');
    console.log('   2. ✅ Validation des déclarations (manager)');
    console.log('   3. 💰 Calcul précis des salaires (mécanicien)');
    console.log('   4. 📊 Différents types de contrats');
    console.log('   5. 🔄 Workflow complet déclaration → validation → calcul');
    
    console.log('\n✅ Système prêt pour les tests complets !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

finalTestWorkdays();