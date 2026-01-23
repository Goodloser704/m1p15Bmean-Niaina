const mongoose = require('mongoose');

async function testMongoDBConnections() {
  console.log('🔍 TEST DES CONNEXIONS MONGODB\n');
  
  const connections = [
    {
      name: 'MongoDB Atlas (Nouvelle URL)',
      uri: 'mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/m1p12mean_garage?retryWrites=true&w=majority'
    },
    {
      name: 'MongoDB Atlas (Test DB)',
      uri: 'mongodb+srv://faustresilient_db_user:NjpL9dxRHG7I0Bdn@cluster0.9fmmkpa.mongodb.net/test?retryWrites=true&w=majority'
    }
  ];
  
  for (const conn of connections) {
    try {
      console.log(`🧪 ${conn.name}`);
      console.log(`   URI: ${conn.uri.replace(/\/\/.*@/, '//***:***@')}`);
      
      const startTime = Date.now();
      await mongoose.connect(conn.uri, {
        serverSelectionTimeoutMS: 5000 // 5 secondes timeout
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`   ✅ Connexion réussie (${responseTime}ms)`);
      
      // Test d'une opération simple
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   📊 Collections trouvées: ${collections.length}`);
      
      await mongoose.disconnect();
      console.log(`   � Déconnecté\n`);
      
      // Si on arrive ici, cette URL fonctionne
      console.log(`🎯 URL FONCTIONNELLE TROUVÉE: ${conn.name}`);
      console.log(`   Utilisez cette URI: ${conn.uri}`);
      break;
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
      
      try {
        await mongoose.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
  
  console.log('\n💡 SOLUTIONS SI AUCUNE URL NE FONCTIONNE:');
  console.log('   1. Vérifier les credentials MongoDB Atlas');
  console.log('   2. Vérifier que l\'IP est autorisée (0.0.0.0/0 pour tous)');
  console.log('   3. Créer une nouvelle base de données sur MongoDB Atlas');
  console.log('   4. Utiliser une base locale pour les tests');
}

testMongoDBConnections();