const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
const Tool = require('./src/models/Tool');
const ToolReservation = require('./src/models/ToolReservation');
require('dotenv').config();

async function testToolsWorkflow() {
  try {
    console.log('🧪 Test du workflow des outils et consommables...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les utilisateurs et outils de test
    const client = await User.findOne({ email: 'client@demo.com' });
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    
    if (!client || !mechanic) {
      console.log('❌ Utilisateurs de test non trouvés.');
      return;
    }
    
    // Récupérer quelques outils (réutilisables et consommables)
    const reusableTool = await Tool.findOne({ isConsumable: false }); // Outil réutilisable
    const consumable = await Tool.findOne({ isConsumable: true }); // Consommable
    
    if (!reusableTool || !consumable) {
      console.log('❌ Outils de test non trouvés. Exécutez seed-tools-data.js');
      return;
    }
    
    console.log('📊 État initial des stocks:');
    console.log(`   🔧 ${reusableTool.name}: ${reusableTool.availableQuantity}/${reusableTool.totalQuantity} (réutilisable)`);
    console.log(`   📦 ${consumable.name}: ${consumable.availableQuantity}/${consumable.totalQuantity} (consommable)`);
    
    // Créer un véhicule et rendez-vous de test
    const vehicle = new Vehicle({
      ownerId: client._id,
      make: 'Test',
      model: 'Vehicle',
      plate: 'TEST-123'
    });
    await vehicle.save();
    
    const appointment = new Appointment({
      clientId: client._id,
      mechanicId: mechanic._id,
      vehicleId: vehicle._id,
      scheduledAt: new Date(),
      status: 'confirmed',
      clientNote: 'Test workflow outils'
    });
    await appointment.save();
    
    // Créer un WorkOrder avec outils
    const workOrder = new WorkOrder({
      appointmentId: appointment._id,
      mechanicId: mechanic._id,
      status: 'draft',
      tasks: [
        { label: 'Test réparation', price: 100 }
      ],
      requiredResources: [
        {
          toolId: reusableTool._id,
          quantityNeeded: 1,
          notes: 'Outil réutilisable pour test'
        },
        {
          toolId: consumable._id,
          quantityNeeded: 2,
          notes: 'Consommable pour test'
        }
      ]
    });
    await workOrder.save();
    
    console.log('\n🔧 WorkOrder créé avec outils requis');
    
    // Simuler l'approbation client et réservation automatique
    workOrder.status = 'approved';
    await workOrder.save();
    
    // Réserver les outils manuellement (normalement fait automatiquement)
    const reservation1 = new ToolReservation({
      workOrderId: workOrder._id,
      mechanicId: mechanic._id,
      toolId: reusableTool._id,
      quantityReserved: 1
    });
    await reservation1.save();
    
    const reservation2 = new ToolReservation({
      workOrderId: workOrder._id,
      mechanicId: mechanic._id,
      toolId: consumable._id,
      quantityReserved: 2
    });
    await reservation2.save();
    
    // Réduire le stock disponible
    reusableTool.reserve(1);
    await reusableTool.save();
    
    consumable.reserve(2);
    await consumable.save();
    
    console.log('\n📦 Outils réservés:');
    console.log(`   🔧 ${reusableTool.name}: ${reusableTool.availableQuantity}/${reusableTool.totalQuantity} (-1 réservé)`);
    console.log(`   📦 ${consumable.name}: ${consumable.availableQuantity}/${consumable.totalQuantity} (-2 réservés)`);
    
    // Simuler le début de réparation
    workOrder.status = 'in_progress';
    await workOrder.save();
    
    // Marquer les réservations comme en cours
    reservation1.startUsing();
    await reservation1.save();
    
    reservation2.startUsing();
    await reservation2.save();
    
    console.log('\n🔧 Réparation commencée - Outils en cours d\'utilisation');
    
    // Simuler la fin de réparation avec gestion automatique des outils
    console.log('\n✅ Finalisation de la réparation...');
    
    // Recharger les outils pour avoir les valeurs actuelles
    const reusableToolUpdated = await Tool.findById(reusableTool._id);
    const consumableUpdated = await Tool.findById(consumable._id);
    
    console.log('\n📊 Avant finalisation:');
    console.log(`   🔧 ${reusableToolUpdated.name}: ${reusableToolUpdated.availableQuantity}/${reusableToolUpdated.totalQuantity}`);
    console.log(`   📦 ${consumableUpdated.name}: ${consumableUpdated.availableQuantity}/${consumableUpdated.totalQuantity}`);
    
    // OUTIL RÉUTILISABLE : Retourner au stock
    reusableToolUpdated.release(1);
    await reusableToolUpdated.save();
    reservation1.returnTool(1, "good", "Retourné après réparation");
    await reservation1.save();
    
    // CONSOMMABLE : Consommer définitivement
    consumableUpdated.consume(2);
    await consumableUpdated.save();
    reservation2.markAsConsumed(2, "Consommé lors de la réparation");
    await reservation2.save();
    
    workOrder.status = 'validated';
    await workOrder.save();
    
    // Recharger une dernière fois pour afficher les résultats finaux
    const finalReusableTool = await Tool.findById(reusableTool._id);
    const finalConsumable = await Tool.findById(consumable._id);
    
    console.log('\n📊 Après finalisation:');
    console.log(`   � ${finalReusableTool.name}: ${finalReusableTool.availableQuantity}/${finalReusableTool.totalQuantity} (outil rendu)`);
    console.log(`   📦 ${finalConsumable.name}: ${finalConsumable.availableQuantity}/${finalConsumable.totalQuantity} (consommé)`);
    
    console.log('\n📋 État des réservations:');
    const finalReservations = await ToolReservation.find({ workOrderId: workOrder._id });
    for (const res of finalReservations) {
      const tool = await Tool.findById(res.toolId);
      console.log(`   ${tool.isConsumable ? '📦' : '🔧'} ${tool.name}: ${res.status} (${res.quantityUsed}/${res.quantityReserved} utilisé)`);
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n💡 Résumé:');
    console.log('   - Outils réutilisables: Réservés → Utilisés → Rendus au stock');
    console.log('   - Consommables: Réservés → Utilisés → Consommés définitivement');
    
    // Nettoyage
    await ToolReservation.deleteMany({ workOrderId: workOrder._id });
    await WorkOrder.findByIdAndDelete(workOrder._id);
    await Appointment.findByIdAndDelete(appointment._id);
    await Vehicle.findByIdAndDelete(vehicle._id);
    
    console.log('\n🧹 Données de test nettoyées');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

testToolsWorkflow();