const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function cleanDatabase() {
  try {
    console.log('🧹 Nettoyage de la base de données...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Vérifier les utilisateurs démo existants
    const demoUsers = await User.find({
      email: { $in: ['client@demo.com', 'mechanic@demo.com', 'manager@demo.com'] }
    });
    
    console.log('\n👥 Utilisateurs démo trouvés:');
    demoUsers.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });
    
    if (demoUsers.length !== 3) {
      console.log('⚠️  Attention: Tous les utilisateurs démo ne sont pas présents!');
      console.log('   Attendu: 3 utilisateurs (client, mechanic, manager)');
      console.log(`   Trouvé: ${demoUsers.length} utilisateurs`);
    }
    
    // Supprimer tous les véhicules
    console.log('\n🚗 Suppression des véhicules...');
    const vehiclesDeleted = await Vehicle.deleteMany({});
    console.log(`   ✅ ${vehiclesDeleted.deletedCount} véhicules supprimés`);
    
    // Supprimer tous les rendez-vous
    console.log('\n📅 Suppression des rendez-vous...');
    const appointmentsDeleted = await Appointment.deleteMany({});
    console.log(`   ✅ ${appointmentsDeleted.deletedCount} rendez-vous supprimés`);
    
    // Supprimer tous les ordres de réparation
    console.log('\n🔧 Suppression des ordres de réparation...');
    const workOrdersDeleted = await WorkOrder.deleteMany({});
    console.log(`   ✅ ${workOrdersDeleted.deletedCount} ordres de réparation supprimés`);
    
    // Supprimer tous les autres utilisateurs (garder seulement les démo)
    console.log('\n👤 Suppression des utilisateurs non-démo...');
    const usersDeleted = await User.deleteMany({
      email: { $nin: ['client@demo.com', 'mechanic@demo.com', 'manager@demo.com'] }
    });
    console.log(`   ✅ ${usersDeleted.deletedCount} utilisateurs non-démo supprimés`);
    
    // Vérification finale
    console.log('\n📊 État final de la base de données:');
    const finalUsers = await User.countDocuments();
    const finalVehicles = await Vehicle.countDocuments();
    const finalAppointments = await Appointment.countDocuments();
    const finalWorkOrders = await WorkOrder.countDocuments();
    
    console.log(`   - Utilisateurs: ${finalUsers} (devrait être 3)`);
    console.log(`   - Véhicules: ${finalVehicles} (devrait être 0)`);
    console.log(`   - Rendez-vous: ${finalAppointments} (devrait être 0)`);
    console.log(`   - Ordres de réparation: ${finalWorkOrders} (devrait être 0)`);
    
    if (finalUsers === 3 && finalVehicles === 0 && finalAppointments === 0 && finalWorkOrders === 0) {
      console.log('\n✅ Nettoyage terminé avec succès!');
      console.log('   La base de données ne contient plus que les 3 utilisateurs démo.');
    } else {
      console.log('\n⚠️  Nettoyage terminé mais avec des anomalies.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion à la base de données fermée.');
  }
}

cleanDatabase();