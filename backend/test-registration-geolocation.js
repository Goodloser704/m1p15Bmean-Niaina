const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testRegistrationGeolocation() {
  try {
    console.log('🧪 Test de l\'inscription avec géolocalisation...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Supprimer les utilisateurs de test s'ils existent
    await User.deleteMany({ email: { $in: ['test.gps@demo.com', 'test.address@demo.com'] } });
    
    // Test 1: Inscription avec coordonnées GPS
    console.log('\n📍 Test 1: Inscription avec coordonnées GPS');
    const userWithGPS = new User({
      fullName: 'Test GPS User',
      email: 'test.gps@demo.com',
      passwordHash: 'hashedpassword',
      role: 'client',
      status: 'approved',
      phone: '+33 6 12 34 56 78',
      address: '10 Rue de Test',
      location: {
        address: '10 Rue de Test',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        coordinates: {
          latitude: 48.8566,
          longitude: 2.3522
        },
        source: 'gps',
        geocodedAt: new Date().toISOString()
      }
    });
    
    await userWithGPS.save();
    console.log('   ✅ Utilisateur avec GPS créé');
    console.log(`   📍 Coordonnées: ${userWithGPS.location.coordinates.latitude}, ${userWithGPS.location.coordinates.longitude}`);
    console.log(`   🗺️  Source: ${userWithGPS.location.source}`);
    
    // Test 2: Inscription avec adresse seulement (géocodage automatique)
    console.log('\n🗺️  Test 2: Inscription avec géocodage automatique');
    
    // Simuler une inscription avec adresse
    const geocodingService = require('./src/services/geocodingService');
    
    try {
      const coords = await geocodingService.geocodeAddress(
        '1 Place de la Concorde',
        'Paris',
        '75001',
        'France'
      );
      
      const userWithAddress = new User({
        fullName: 'Test Address User',
        email: 'test.address@demo.com',
        passwordHash: 'hashedpassword',
        role: 'client',
        status: 'approved',
        phone: '+33 6 98 76 54 32',
        address: '1 Place de la Concorde',
        location: {
          address: '1 Place de la Concorde',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          coordinates: coords,
          source: 'api',
          geocodedAt: new Date().toISOString()
        }
      });
      
      await userWithAddress.save();
      console.log('   ✅ Utilisateur avec géocodage créé');
      console.log(`   📍 Coordonnées: ${coords.latitude}, ${coords.longitude}`);
      console.log(`   🗺️  Source: api (géocodage automatique)`);
      
    } catch (geocodeError) {
      console.log('   ⚠️  Géocodage échoué:', geocodeError.message);
    }
    
    // Vérification finale
    console.log('\n📊 Vérification des utilisateurs créés:');
    const usersWithLocation = await User.find({ 
      'location.coordinates': { $exists: true } 
    });
    
    console.log(`   - Utilisateurs avec géolocalisation: ${usersWithLocation.length}`);
    
    for (const user of usersWithLocation) {
      if (user.email.includes('test.')) {
        const { latitude, longitude } = user.location.coordinates;
        console.log(`   - ${user.fullName}: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${user.location.source})`);
      }
    }
    
    console.log('\n🎯 Test de l\'inscription:');
    console.log('   1. Allez sur /register');
    console.log('   2. Remplissez le formulaire avec une adresse');
    console.log('   3. Testez "Détecter ma position" (GPS)');
    console.log('   4. Testez "Géocoder l\'adresse" (API)');
    console.log('   5. Vérifiez que les coordonnées s\'affichent');
    console.log('   6. Inscrivez-vous et vérifiez en base');
    
    console.log('\n✅ Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testRegistrationGeolocation();