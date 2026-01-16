const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function seedTestData() {
  try {
    console.log('🌱 Génération de données de test...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les utilisateurs démo
    const client = await User.findOne({ email: 'client@demo.com' });
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    const manager = await User.findOne({ email: 'manager@demo.com' });
    
    if (!client || !mechanic || !manager) {
      console.error('❌ Utilisateurs démo non trouvés. Exécutez d\'abord clean-database.js');
      return;
    }
    
    console.log('✅ Utilisateurs trouvés:');
    console.log(`   - Client: ${client.fullName} (${client._id})`);
    console.log(`   - Mécanicien: ${mechanic.fullName} (${mechanic._id})`);
    console.log(`   - Manager: ${manager.fullName} (${manager._id})`);
    
    // Créer des véhicules pour le client
    console.log('\n🚗 Création des véhicules...');
    const vehicles = [];
    
    const vehicleData = [
      { make: 'Renault', model: 'Clio', plate: 'AB-123-CD', vin: 'VF1RJ0F0H12345678' },
      { make: 'Peugeot', model: '308', plate: 'EF-456-GH', vin: 'VF3LCYHZPHS123456' },
      { make: 'Citroën', model: 'C3', plate: 'IJ-789-KL', vin: 'VF7SXHZPFHS654321' }
    ];
    
    for (const vData of vehicleData) {
      const vehicle = new Vehicle({
        ownerId: client._id,
        make: vData.make,
        model: vData.model,
        plate: vData.plate,
        vin: vData.vin
      });
      await vehicle.save();
      vehicles.push(vehicle);
      console.log(`   ✅ ${vehicle.make} ${vehicle.model} (${vehicle.plate})`);
    }
    
    // Créer des rendez-vous et work orders payés
    console.log('\n📅 Création des rendez-vous et réparations...');
    
    const repairsData = [
      {
        vehicle: vehicles[0],
        scheduledAt: new Date('2024-01-15'),
        clientNote: 'Vidange et révision complète',
        tasks: [
          { label: 'Vidange moteur', price: 80 },
          { label: 'Changement filtre à huile', price: 25 },
          { label: 'Révision complète', price: 150 }
        ]
      },
      {
        vehicle: vehicles[0],
        scheduledAt: new Date('2024-02-20'),
        clientNote: 'Problème de freins',
        tasks: [
          { label: 'Remplacement plaquettes avant', price: 120 },
          { label: 'Remplacement disques avant', price: 180 },
          { label: 'Purge circuit de freinage', price: 50 }
        ]
      },
      {
        vehicle: vehicles[1],
        scheduledAt: new Date('2024-03-10'),
        clientNote: 'Changement pneus',
        tasks: [
          { label: 'Montage 4 pneus neufs', price: 400 },
          { label: 'Équilibrage', price: 40 },
          { label: 'Géométrie', price: 60 }
        ]
      },
      {
        vehicle: vehicles[1],
        scheduledAt: new Date('2024-04-05'),
        clientNote: 'Problème de climatisation',
        tasks: [
          { label: 'Diagnostic climatisation', price: 50 },
          { label: 'Recharge gaz climatisation', price: 80 },
          { label: 'Nettoyage circuit', price: 70 }
        ]
      },
      {
        vehicle: vehicles[2],
        scheduledAt: new Date('2024-05-12'),
        clientNote: 'Entretien général',
        tasks: [
          { label: 'Vidange', price: 70 },
          { label: 'Changement filtre à air', price: 30 },
          { label: 'Changement filtre habitacle', price: 25 },
          { label: 'Contrôle général', price: 50 }
        ]
      }
    ];
    
    for (const repairData of repairsData) {
      // Créer le rendez-vous
      const appointment = new Appointment({
        clientId: client._id,
        vehicleId: repairData.vehicle._id,
        scheduledAt: repairData.scheduledAt,
        status: 'done',
        clientNote: repairData.clientNote,
        mechanicId: mechanic._id,
        managerNote: 'Assigné au mécanicien',
        mechanicNote: 'Réparation terminée'
      });
      await appointment.save();
      
      // Calculer le total
      const total = repairData.tasks.reduce((sum, task) => sum + task.price, 0);
      
      // Créer le work order
      const workOrder = new WorkOrder({
        appointmentId: appointment._id,
        status: 'paid',
        tasks: repairData.tasks,
        total: total,
        estimationNote: 'Estimation validée',
        clientNote: 'Travail approuvé',
        createdAt: repairData.scheduledAt,
        updatedAt: new Date(repairData.scheduledAt.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 jours après
      });
      await workOrder.save();
      
      console.log(`   ✅ ${repairData.vehicle.make} ${repairData.vehicle.model} - ${total}€ (${repairData.tasks.length} tâches)`);
    }
    
    // Calculer et afficher les statistiques
    console.log('\n📊 Statistiques générées:');
    const totalVehicles = await Vehicle.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalWorkOrders = await WorkOrder.countDocuments();
    const paidWorkOrders = await WorkOrder.find({ status: 'paid' });
    
    const totalRevenue = paidWorkOrders.reduce((sum, wo) => sum + wo.total, 0);
    const mechanicCommission = (totalRevenue * mechanic.commissionRate) / 100;
    const mechanicTotal = mechanic.baseSalary + mechanicCommission;
    
    console.log(`   - Véhicules: ${totalVehicles}`);
    console.log(`   - Rendez-vous: ${totalAppointments}`);
    console.log(`   - Réparations payées: ${paidWorkOrders.length}`);
    console.log(`   - Chiffre d'affaires total: ${totalRevenue}€`);
    console.log(`\n💰 Revenus du mécanicien:`);
    console.log(`   - Salaire de base: ${mechanic.baseSalary}€/mois`);
    console.log(`   - Taux de commission: ${mechanic.commissionRate}%`);
    console.log(`   - Commissions gagnées: ${mechanicCommission.toFixed(2)}€`);
    console.log(`   - Total: ${mechanicTotal.toFixed(2)}€`);
    
    console.log('\n✅ Données de test générées avec succès!');
    console.log('\n🔑 Connectez-vous avec:');
    console.log('   Mécanicien: mechanic@demo.com / mechanic123');
    console.log('   Puis allez sur "💰 Mes Revenus"');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

seedTestData();
