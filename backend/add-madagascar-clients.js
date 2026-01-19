const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
require('dotenv').config();

async function addMadagascarClients() {
  try {
    console.log('🏝️  Ajout de clients à Madagascar pour les tests...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Récupérer le mécanicien pour les assignations
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    
    if (!mechanic) {
      console.error('❌ Mécanicien demo non trouvé');
      return;
    }
    
    // Supprimer les clients Madagascar existants
    await User.deleteMany({ email: { $regex: /madagascar\.com$/ } });
    await Vehicle.deleteMany({ plate: { $regex: /^MG-/ } });
    await Appointment.deleteMany({ clientNote: { $regex: /Madagascar/ } });
    
    // Clients autour de ta position (-18.9296, 47.5183)
    const madagascarClients = [
      {
        fullName: 'Rabe Andriamampianina',
        email: 'rabe.andriamampianina@madagascar.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+261 34 12 345 67',
        address: 'Lot II M 15 Antananarivo',
        location: {
          address: 'Lot II M 15',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          coordinates: {
            latitude: -18.9204,
            longitude: 47.5208
          },
          source: 'manual'
        },
        vehicle: { make: 'Toyota', model: 'Corolla', plate: 'MG-001-AB' }
      },
      {
        fullName: 'Hery Rakotomalala',
        email: 'hery.rakotomalala@madagascar.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+261 34 23 456 78',
        address: 'Rue Rainandriamampandry Antananarivo',
        location: {
          address: 'Rue Rainandriamampandry',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          coordinates: {
            latitude: -18.9147,
            longitude: 47.5317
          },
          source: 'manual'
        },
        vehicle: { make: 'Peugeot', model: '206', plate: 'MG-002-CD' }
      },
      {
        fullName: 'Voahangy Razafy',
        email: 'voahangy.razafy@madagascar.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+261 34 34 567 89',
        address: 'Avenue de l\'Indépendance Antananarivo',
        location: {
          address: 'Avenue de l\'Indépendance',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          coordinates: {
            latitude: -18.9386,
            longitude: 47.5214
          },
          source: 'manual'
        },
        vehicle: { make: 'Renault', model: 'Sandero', plate: 'MG-003-EF' }
      },
      {
        fullName: 'Andry Rasolofo',
        email: 'andry.rasolofo@madagascar.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+261 34 45 678 90',
        address: 'Analakely Antananarivo',
        location: {
          address: 'Analakely',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          coordinates: {
            latitude: -18.9167,
            longitude: 47.5167
          },
          source: 'manual'
        },
        vehicle: { make: 'Hyundai', model: 'i10', plate: 'MG-004-GH' }
      },
      {
        fullName: 'Nirina Randrianarisoa',
        email: 'nirina.randrianarisoa@madagascar.com',
        password: 'demo123',
        role: 'client',
        status: 'approved',
        phone: '+261 34 56 789 01',
        address: 'Behoririka Antananarivo',
        location: {
          address: 'Behoririka',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          coordinates: {
            latitude: -18.9244,
            longitude: 47.5289
          },
          source: 'manual'
        },
        vehicle: { make: 'Suzuki', model: 'Alto', plate: 'MG-005-IJ' }
      }
    ];
    
    console.log('\n👥 Création des clients Madagascar...');
    const createdUsers = [];
    const createdVehicles = [];
    
    for (const clientData of madagascarClients) {
      // Créer l'utilisateur
      const passwordHash = await bcrypt.hash(clientData.password, 10);
      const user = new User({
        fullName: clientData.fullName,
        email: clientData.email,
        passwordHash,
        role: clientData.role,
        status: clientData.status,
        phone: clientData.phone,
        address: clientData.address,
        location: clientData.location
      });
      
      await user.save();
      createdUsers.push(user);
      
      // Créer le véhicule
      const vehicle = new Vehicle({
        ownerId: user._id,
        make: clientData.vehicle.make,
        model: clientData.vehicle.model,
        plate: clientData.vehicle.plate,
        vin: `VIN${Math.random().toString(36).substr(2, 14).toUpperCase()}`
      });
      
      await vehicle.save();
      createdVehicles.push(vehicle);
      
      console.log(`   ✅ ${user.fullName} - ${vehicle.make} ${vehicle.model} (${vehicle.plate})`);
      console.log(`      📍 ${user.location.coordinates.latitude.toFixed(4)}, ${user.location.coordinates.longitude.toFixed(4)}`);
    }
    
    // Créer quelques rendez-vous assignés
    console.log('\n📅 Création des rendez-vous Madagascar...');
    const assignedIndices = [0, 2, 4]; // 3 clients sur 5 assignés
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const vehicle = createdVehicles[i];
      const isAssigned = assignedIndices.includes(i);
      
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 7) + 1);
      scheduledDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
      
      const appointment = new Appointment({
        clientId: user._id,
        vehicleId: vehicle._id,
        scheduledAt: scheduledDate,
        status: isAssigned ? 'confirmed' : 'requested',
        clientNote: `Révision ${vehicle.make} ${vehicle.model} - Madagascar`,
        mechanicId: isAssigned ? mechanic._id : undefined,
        managerNote: isAssigned ? `Assigné à ${mechanic.fullName}` : 'En attente d\'assignation'
      });
      
      await appointment.save();
      
      const status = isAssigned ? '✅ ASSIGNÉ' : '⏳ EN ATTENTE';
      console.log(`   ${status} - ${user.fullName} (${vehicle.make} ${vehicle.model})`);
    }
    
    // Statistiques finales
    console.log('\n📊 Résumé Madagascar:');
    const totalMadagascarUsers = await User.countDocuments({ email: { $regex: /madagascar\.com$/ } });
    const totalMadagascarVehicles = await Vehicle.countDocuments({ plate: { $regex: /^MG-/ } });
    const assignedMadagascarAppointments = await Appointment.countDocuments({ 
      mechanicId: mechanic._id,
      clientNote: { $regex: /Madagascar/ }
    });
    
    console.log(`   - Clients Madagascar: ${totalMadagascarUsers}`);
    console.log(`   - Véhicules Madagascar: ${totalMadagascarVehicles}`);
    console.log(`   - Rendez-vous assignés: ${assignedMadagascarAppointments}`);
    
    console.log('\n🎯 Test avec ta position réelle:');
    console.log('   1. Connecte-toi avec mechanic@demo.com / mechanic123');
    console.log('   2. Va dans "Clients Proches"');
    console.log('   3. Clique "📍 Ma position" pour utiliser ta position Madagascar');
    console.log('   4. Tu devrais voir les 5 clients autour d\'Antananarivo');
    console.log('   5. Teste le filtre "Seulement mes clients assignés" (3 clients)');
    console.log('   6. Clique "🗼 Position Paris (test)" pour voir les clients parisiens');
    
    console.log('\n✅ Clients Madagascar ajoutés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addMadagascarClients();