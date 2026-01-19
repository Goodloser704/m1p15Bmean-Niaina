const mongoose = require('mongoose');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const Appointment = require('./src/models/Appointment');
require('dotenv').config();

async function checkGeolocationData() {
  try {
    console.log('🔍 Vérification des données de géolocalisation...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Vérifier les utilisateurs
    console.log('\n👥 Utilisateurs:');
    const clients = await User.find({ role: 'client' });
    const mechanics = await User.find({ role: 'mechanic' });
    const managers = await User.find({ role: 'manager' });
    
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Mécaniciens: ${mechanics.length}`);
    console.log(`   - Managers: ${managers.length}`);
    
    // Vérifier les coordonnées GPS
    console.log('\n📍 Clients avec coordonnées GPS:');
    for (const client of clients) {
      if (client.location && client.location.coordinates) {
        const { latitude, longitude } = client.location.coordinates;
        console.log(`   ✅ ${client.fullName}: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${client.location.address})`);
      } else {
        console.log(`   ❌ ${client.fullName}: Pas de coordonnées`);
      }
    }
    
    // Vérifier les rendez-vous et assignations
    console.log('\n📅 Rendez-vous et assignations:');
    const appointments = await Appointment.find({}).populate('clientId mechanicId');
    
    for (const appointment of appointments) {
      const clientName = appointment.clientId?.fullName || 'Client inconnu';
      const mechanicName = appointment.mechanicId?.fullName || 'Non assigné';
      const status = appointment.mechanicId ? '✅ ASSIGNÉ' : '⏳ EN ATTENTE';
      
      console.log(`   ${status} - ${clientName} → ${mechanicName}`);
    }
    
    // Statistiques par mécanicien
    console.log('\n📊 Statistiques par mécanicien:');
    for (const mechanic of mechanics) {
      const assignedCount = await Appointment.countDocuments({ mechanicId: mechanic._id });
      console.log(`   - ${mechanic.fullName} (${mechanic.email}): ${assignedCount} client(s) assigné(s)`);
    }
    
    // Test de distance (exemple avec Paris centre)
    console.log('\n🗺️  Test de proximité (depuis Paris centre - 48.8566, 2.3522):');
    const parisCenter = { latitude: 48.8566, longitude: 2.3522 };
    
    for (const client of clients) {
      if (client.location && client.location.coordinates) {
        const distance = calculateDistance(
          parisCenter.latitude, parisCenter.longitude,
          client.location.coordinates.latitude, client.location.coordinates.longitude
        );
        console.log(`   - ${client.fullName}: ${distance.toFixed(2)} km`);
      }
    }
    
    console.log('\n✅ Vérification terminée!');
    console.log('\n🎯 Prêt pour les tests:');
    console.log('   1. Démarrez le serveur backend');
    console.log('   2. Démarrez le frontend');
    console.log('   3. Testez les comptes mécaniciens et manager');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Fonction de calcul de distance (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

checkGeolocationData();