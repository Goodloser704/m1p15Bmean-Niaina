const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
const Tool = require('./src/models/Tool');
require('dotenv').config();

async function testCompleteWorkflow() {
  try {
    console.log('🧪 Test du workflow complet des réparations...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les utilisateurs de test
    const client = await User.findOne({ email: 'client@demo.com' });
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    const manager = await User.findOne({ email: 'manager@demo.com' });
    
    if (!client || !mechanic || !manager) {
      console.log('❌ Utilisateurs de test non trouvés. Exécutez d\'abord clean-database.js');
      return;
    }
    
    console.log('✅ Utilisateurs trouvés:');
    console.log(`   - Client: ${client.fullName} (${client.email})`);
    console.log(`   - Mécanicien: ${mechanic.fullName} (${mechanic.email}) - Commission: ${mechanic.commissionRate}%`);
    console.log(`   - Manager: ${manager.fullName} (${manager.email})`);
    
    // Créer un véhicule de test
    const vehicle = new Vehicle({
      ownerId: client._id,
      make: 'Peugeot',
      model: '308',
      plate: 'AB-123-CD',
      vin: 'VF3XXXXXXXXXXXXXXX'
    });
    await vehicle.save();
    console.log(`🚗 Véhicule créé: ${vehicle.make} ${vehicle.model} (${vehicle.plate})`);
    
    // Créer un rendez-vous
    const appointment = new Appointment({
      clientId: client._id,
      mechanicId: mechanic._id,
      vehicleId: vehicle._id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
      status: 'confirmed',
      clientNote: 'Problème de freinage et bruit moteur'
    });
    await appointment.save();
    console.log(`📅 Rendez-vous créé: ${appointment.scheduledAt.toLocaleDateString()}`);
    
    // Créer un WorkOrder
    const workOrder = new WorkOrder({
      appointmentId: appointment._id,
      mechanicId: mechanic._id,
      status: 'draft'
    });
    await workOrder.save();
    console.log(`📋 WorkOrder créé: ${workOrder._id}`);
    
    // Simuler l'estimation du mécanicien avec outils
    const tools = await Tool.find().limit(3);
    console.log(`🔧 Outils disponibles: ${tools.length}`);
    
    workOrder.tasks = [
      { label: 'Remplacement plaquettes de frein', price: 120 },
      { label: 'Vidange moteur', price: 80 },
      { label: 'Diagnostic électronique', price: 50 }
    ];
    
    if (tools.length > 0) {
      workOrder.requiredResources = tools.slice(0, 2).map(tool => ({
        toolId: tool._id,
        quantityNeeded: 1,
        estimatedDuration: 60,
        notes: `Nécessaire pour la réparation`
      }));
    }
    
    workOrder.estimationNote = 'Diagnostic complet effectué. Plaquettes usées et huile moteur à changer.';
    workOrder.status = 'pending_client_approval';
    await workOrder.save();
    console.log(`💰 Estimation créée: ${workOrder.total}€ (${workOrder.tasks.length} tâches)`);
    
    // Simuler l'approbation du client
    workOrder.clientApproved = true;
    workOrder.clientNote = 'D\'accord pour les réparations, procédez.';
    workOrder.status = 'approved';
    await workOrder.save();
    console.log(`✅ Client a approuvé l'estimation`);
    
    // Simuler le début de réparation
    workOrder.status = 'in_progress';
    await workOrder.save();
    console.log(`🔧 Réparation commencée`);
    
    // Simuler la fin de réparation
    workOrder.status = 'validated';
    await workOrder.save();
    console.log(`✅ Réparation terminée par le mécanicien`);
    
    // Simuler la validation manager et paiement
    workOrder.status = 'paid';
    await workOrder.save();
    console.log(`💰 Réparation marquée comme payée par le manager`);
    
    // Calculer la commission
    const commission = (workOrder.total * mechanic.commissionRate) / 100;
    console.log(`📈 Commission du mécanicien: ${commission.toFixed(2)}€ (${mechanic.commissionRate}% de ${workOrder.total}€)`);
    
    console.log('\n🎉 Workflow complet testé avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`   - Estimation: ${workOrder.total}€`);
    console.log(`   - Commission mécanicien: ${commission.toFixed(2)}€`);
    console.log(`   - Statut final: ${workOrder.status}`);
    console.log('\n🔍 Testez maintenant:');
    console.log('   1. Connectez-vous comme mécanicien pour voir les revenus');
    console.log('   2. Connectez-vous comme manager pour voir les réparations payées');
    console.log('   3. Connectez-vous comme client pour voir l\'historique');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

testCompleteWorkflow();