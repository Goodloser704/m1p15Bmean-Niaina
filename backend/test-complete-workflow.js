const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function testCompleteWorkflow() {
  try {
    console.log('🔄 Test complet du workflow...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Nettoyer les données de test précédentes
    await Appointment.deleteMany({ clientNote: { $regex: /test/i } });
    await WorkOrder.deleteMany({});
    
    // Récupérer les utilisateurs
    const client = await User.findOne({ role: 'client' });
    const mechanic = await User.findOne({ role: 'mechanic' });
    const manager = await User.findOne({ role: 'manager' });
    const vehicle = await Vehicle.findOne({ ownerId: client._id });
    
    console.log('\n👥 Utilisateurs trouvés:');
    console.log(`  Client: ${client.fullName} (${client._id})`);
    console.log(`  Mécanicien: ${mechanic.fullName} (${mechanic._id})`);
    console.log(`  Manager: ${manager.fullName} (${manager._id})`);
    console.log(`  Véhicule: ${vehicle.make} ${vehicle.model} (${vehicle._id})`);
    
    // ÉTAPE 1: Client demande un rendez-vous
    console.log('\n📅 ÉTAPE 1: Client demande un rendez-vous...');
    const appointment = await Appointment.create({
      clientId: client._id,
      vehicleId: vehicle._id,
      status: 'requested',
      clientNote: 'Test workflow complet - Problème de freins'
    });
    console.log(`✅ Rendez-vous créé: ${appointment._id} (status: ${appointment.status})`);
    
    // ÉTAPE 2: Manager confirme et assigne mécanicien
    console.log('\n👔 ÉTAPE 2: Manager confirme et assigne mécanicien...');
    appointment.status = 'confirmed';
    appointment.mechanicId = mechanic._id;
    appointment.managerNote = 'Rendez-vous confirmé et assigné';
    appointment.scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await appointment.save();
    console.log(`✅ Rendez-vous confirmé: ${appointment._id} (status: ${appointment.status})`);
    console.log(`   Mécanicien assigné: ${mechanic.fullName}`);
    
    // VÉRIFICATION: Le mécanicien devrait voir ce rendez-vous
    console.log('\n🔍 VÉRIFICATION: Rendez-vous visibles par le mécanicien...');
    const mechanicAppointments = await Appointment.find({ mechanicId: mechanic._id });
    console.log(`   Rendez-vous assignés au mécanicien: ${mechanicAppointments.length}`);
    mechanicAppointments.forEach(a => {
      console.log(`   - ${a._id}: ${a.status} - ${a.clientNote}`);
    });
    
    // VÉRIFICATION: Work orders existants
    const existingWorkOrders = await WorkOrder.find({});
    console.log(`\n🔧 Work orders existants: ${existingWorkOrders.length}`);
    
    // SIMULATION: Ce que devrait voir l'interface mécanicien
    const confirmedWithoutWorkOrder = mechanicAppointments.filter(a => {
      const hasWorkOrder = existingWorkOrders.some(wo => wo.appointmentId.toString() === a._id.toString());
      return a.status === 'confirmed' && !hasWorkOrder;
    });
    
    console.log('\n🎯 RÉSULTAT: Rendez-vous que le mécanicien devrait voir pour estimation:');
    console.log(`   Nombre: ${confirmedWithoutWorkOrder.length}`);
    confirmedWithoutWorkOrder.forEach(a => {
      console.log(`   - ${a._id}: ${a.clientNote} (${vehicle.make} ${vehicle.model})`);
    });
    
    if (confirmedWithoutWorkOrder.length === 0) {
      console.log('❌ PROBLÈME: Le mécanicien ne voit aucun rendez-vous à estimer !');
    } else {
      console.log('✅ SUCCESS: Le mécanicien devrait voir des rendez-vous à estimer !');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCompleteWorkflow();