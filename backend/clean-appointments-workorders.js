const mongoose = require('mongoose');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
const ToolReservation = require('./src/models/ToolReservation');
const Tool = require('./src/models/Tool');
require('dotenv').config();

async function cleanAppointmentsAndWorkOrders() {
  try {
    console.log('🧹 Nettoyage des rendez-vous et réparations...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Compter les données avant suppression
    const appointmentCount = await Appointment.countDocuments();
    const workOrderCount = await WorkOrder.countDocuments();
    const reservationCount = await ToolReservation.countDocuments();
    
    console.log(`\n📊 Données à supprimer:`);
    console.log(`   - Rendez-vous: ${appointmentCount}`);
    console.log(`   - Ordres de réparation: ${workOrderCount}`);
    console.log(`   - Réservations d'outils: ${reservationCount}`);
    
    // Libérer tous les outils réservés avant de supprimer les réservations
    console.log('\n🔓 Libération des outils réservés...');
    const activeReservations = await ToolReservation.find({
      status: { $in: ["reserved", "in_use"] }
    });
    
    for (const reservation of activeReservations) {
      const tool = await Tool.findById(reservation.toolId);
      if (tool) {
        tool.release(reservation.quantityReserved);
        await tool.save();
        console.log(`   ✅ Libéré: ${tool.name} x${reservation.quantityReserved}`);
      }
    }
    
    // Supprimer les données
    console.log('\n🗑️  Suppression des données...');
    await ToolReservation.deleteMany({});
    console.log('   ✅ Réservations d\'outils supprimées');
    
    await WorkOrder.deleteMany({});
    console.log('   ✅ Ordres de réparation supprimés');
    
    await Appointment.deleteMany({});
    console.log('   ✅ Rendez-vous supprimés');
    
    // Vérification finale
    console.log('\n📊 État final:');
    const finalAppointments = await Appointment.countDocuments();
    const finalWorkOrders = await WorkOrder.countDocuments();
    const finalReservations = await ToolReservation.countDocuments();
    
    console.log(`   - Rendez-vous: ${finalAppointments}`);
    console.log(`   - Ordres de réparation: ${finalWorkOrders}`);
    console.log(`   - Réservations d'outils: ${finalReservations}`);
    
    console.log('\n✅ Nettoyage terminé avec succès!');
    console.log('📝 Les utilisateurs, véhicules et outils ont été conservés.');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion à la base de données fermée.');
  }
}

cleanAppointmentsAndWorkOrders();