const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
require('dotenv').config();

async function seedTestAppointments() {
  try {
    console.log('🚗 Création des données de test pour la géolocalisation...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer les utilisateurs existants
    const clients = await User.find({ role: 'client' });
    const mechanics = await User.find({ role: 'mechanic' });
    
    if (mechanics.length === 0) {
      console.error('❌ Aucun mécanicien trouvé');
      return;
    }
    
    console.log(`\n👥 Trouvé ${clients.length} clients et ${mechanics.length} mécanicien(s)`);
    mechanics.forEach(m => console.log(`   - ${m.fullName} (${m.email})`));
    
    // Supprimer les données existantes
    console.log('\n🧹 Suppression des données de test existantes...');
    await Vehicle.deleteMany({});
    await Appointment.deleteMany({});
    
    // Créer des véhicules pour chaque client
    console.log('\n🚗 Création des véhicules...');
    const vehicles = [];
    const vehicleData = [
      { make: 'Peugeot', model: '308', plate: 'AB-123-CD' },
      { make: 'Renault', model: 'Clio', plate: 'EF-456-GH' },
      { make: 'Citroën', model: 'C3', plate: 'IJ-789-KL' },
      { make: 'Volkswagen', model: 'Golf', plate: 'MN-012-OP' },
      { make: 'BMW', model: 'Serie 3', plate: 'QR-345-ST' },
      { make: 'Mercedes', model: 'Classe A', plate: 'UV-678-WX' },
      { make: 'Audi', model: 'A3', plate: 'YZ-901-AB' },
      { make: 'Toyota', model: 'Yaris', plate: 'CD-234-EF' },
      { make: 'Ford', model: 'Fiesta', plate: 'GH-567-IJ' }
    ];
    
    for (let i = 0; i < clients.length && i < vehicleData.length; i++) {
      const client = clients[i];
      const vData = vehicleData[i];
      
      const vehicle = new Vehicle({
        ownerId: client._id,
        make: vData.make,
        model: vData.model,
        plate: vData.plate,
        vin: `VIN${Math.random().toString(36).substr(2, 14).toUpperCase()}`
      });
      
      await vehicle.save();
      vehicles.push(vehicle);
      console.log(`   ✅ ${vData.make} ${vData.model} (${vData.plate}) pour ${client.fullName}`);
    }
    
    // Créer des rendez-vous avec assignations réparties
    console.log('\n📅 Création des rendez-vous...');
    const appointments = [];
    
    // Répartir les assignations entre les mécaniciens
    const mechanic1 = mechanics.find(m => m.email === 'mechanic@demo.com');
    const mechanic2 = mechanics.find(m => m.email === 'mechanic2@demo.com');
    
    // Assignations : 
    // - Mécanicien 1: clients 0, 2, 4 (3 clients)
    // - Mécanicien 2: clients 1, 6 (2 clients) 
    // - Non assignés: clients 3, 5, 7, 8 (4 clients)
    const assignments = [
      { mechanicId: mechanic1?._id, mechanic: mechanic1 }, // Client 0
      { mechanicId: mechanic2?._id, mechanic: mechanic2 }, // Client 1
      { mechanicId: mechanic1?._id, mechanic: mechanic1 }, // Client 2
      { mechanicId: null, mechanic: null },                // Client 3 - non assigné
      { mechanicId: mechanic1?._id, mechanic: mechanic1 }, // Client 4
      { mechanicId: null, mechanic: null },                // Client 5 - non assigné
      { mechanicId: mechanic2?._id, mechanic: mechanic2 }, // Client 6
      { mechanicId: null, mechanic: null },                // Client 7 - non assigné
      { mechanicId: null, mechanic: null }                 // Client 8 - non assigné
    ];
    
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const client = clients[i];
      const assignment = assignments[i] || { mechanicId: null, mechanic: null };
      const isAssigned = assignment.mechanicId !== null;
      
      // Date dans le futur (dans 1-7 jours)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 7) + 1);
      scheduledDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // Entre 9h et 17h
      
      const appointment = new Appointment({
        clientId: client._id,
        vehicleId: vehicle._id,
        scheduledAt: scheduledDate,
        status: isAssigned ? 'confirmed' : 'requested',
        clientNote: `Révision ${vehicle.make} ${vehicle.model} - ${client.fullName}`,
        mechanicId: assignment.mechanicId,
        managerNote: isAssigned ? `Assigné à ${assignment.mechanic.fullName}` : 'En attente d\'assignation'
      });
      
      await appointment.save();
      appointments.push(appointment);
      
      const status = isAssigned ? `✅ ASSIGNÉ à ${assignment.mechanic.fullName}` : '⏳ EN ATTENTE';
      console.log(`   ${status} - ${client.fullName} (${vehicle.make} ${vehicle.model}) - ${scheduledDate.toLocaleDateString('fr-FR')}`);
    }
    
    // Statistiques finales
    console.log('\n📊 Résumé des données créées:');
    const totalVehicles = await Vehicle.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    
    let mechanicStats = '';
    for (const mechanic of mechanics) {
      const assignedCount = await Appointment.countDocuments({ mechanicId: mechanic._id });
      mechanicStats += `\n   - ${mechanic.fullName}: ${assignedCount} client(s) assigné(s)`;
    }
    
    const pendingAppointments = await Appointment.countDocuments({ mechanicId: { $exists: false } });
    
    console.log(`   - Véhicules créés: ${totalVehicles}`);
    console.log(`   - Rendez-vous créés: ${totalAppointments}`);
    console.log(`   - Répartition par mécanicien:${mechanicStats}`);
    console.log(`   - En attente d'assignation: ${pendingAppointments}`);
    
    console.log('\n🎯 Tests à effectuer:');
    console.log('   1. Connectez-vous avec mechanic@demo.com / mechanic123');
    console.log('      → Devrait voir 3 clients assignés avec le filtre');
    console.log('   2. Connectez-vous avec mechanic2@demo.com / mechanic123');
    console.log('      → Devrait voir 2 clients assignés avec le filtre');
    console.log('   3. Connectez-vous avec manager@demo.com / manager123');
    console.log('      → Devrait voir tous les 9 clients avec statuts d\'assignation');
    console.log('   4. Testez la géolocalisation et les filtres dans "Clients Proches"');
    
    console.log('\n✅ Données de test créées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée.');
  }
}

seedTestAppointments();