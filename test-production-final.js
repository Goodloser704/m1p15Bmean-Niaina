const https = require('https');

async function testProductionFinal() {
  console.log('🎯 TEST FINAL DE PRODUCTION - Garage Management System\n');
  
  const config = {
    frontend: 'https://m1p15-bmean-niaina.vercel.app',
    backend: 'https://m1p15bmean-niaina-2.onrender.com',
    database: 'MongoDB Atlas (cluster0.9fmmkpa.mongodb.net)'
  };
  
  console.log('📋 CONFIGURATION:');
  console.log(`   🌐 Frontend: ${config.frontend}`);
  console.log(`   🔧 Backend:  ${config.backend}`);
  console.log(`   🗄️  Database: ${config.database}`);
  console.log('');
  
  // Test 1: Backend Health
  console.log('🧪 TEST 1: Backend Health Check');
  try {
    const health = await makeRequest(config.backend + '/health');
    if (health.statusCode === 200) {
      console.log('   ✅ Backend opérationnel');
    } else {
      console.log(`   ❌ Backend erreur: ${health.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Backend inaccessible: ${error.message}`);
  }
  console.log('');
  
  // Test 2: Frontend
  console.log('🧪 TEST 2: Frontend Accessibility');
  try {
    const frontend = await makeRequest(config.frontend);
    if (frontend.statusCode === 200) {
      console.log('   ✅ Frontend accessible');
    } else {
      console.log(`   ❌ Frontend erreur: ${frontend.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Frontend inaccessible: ${error.message}`);
  }
  console.log('');
  
  // Test 3: Authentification
  console.log('🧪 TEST 3: Système d\'Authentification');
  const testAccounts = [
    { email: 'mechanic@demo.com', password: 'role123', role: 'mechanic' },
    { email: 'manager@demo.com', password: 'role123', role: 'manager' },
    { email: 'client@demo.com', password: 'role123', role: 'client' }
  ];
  
  let authSuccess = 0;
  for (const account of testAccounts) {
    try {
      const loginData = JSON.stringify({
        email: account.email,
        password: account.password
      });
      
      const result = await makeRequest(config.backend + '/api/auth/login', 'POST', loginData);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ ${account.role}: Connexion réussie`);
        authSuccess++;
      } else {
        console.log(`   ❌ ${account.role}: Échec connexion (${result.statusCode})`);
      }
    } catch (error) {
      console.log(`   ❌ ${account.role}: Erreur connexion`);
    }
  }
  console.log('');
  
  // Test 4: API Workdays (nouvelle fonctionnalité)
  console.log('🧪 TEST 4: API Workdays (Nouvelle Fonctionnalité)');
  try {
    // D'abord se connecter pour obtenir un token
    const loginData = JSON.stringify({
      email: 'mechanic@demo.com',
      password: 'role123'
    });
    
    const loginResult = await makeRequest(config.backend + '/api/auth/login', 'POST', loginData);
    
    if (loginResult.statusCode === 200) {
      const loginResponse = JSON.parse(loginResult.data);
      const token = loginResponse.token;
      
      // Tester l'API workdays
      const workdaysResult = await makeRequest(
        config.backend + '/api/workdays/my-workdays',
        'GET',
        null,
        { 'Authorization': `Bearer ${token}` }
      );
      
      if (workdaysResult.statusCode === 200) {
        const workdays = JSON.parse(workdaysResult.data);
        console.log(`   ✅ API Workdays fonctionnelle (${workdays.length} déclarations trouvées)`);
      } else {
        console.log(`   ❌ API Workdays erreur: ${workdaysResult.statusCode}`);
      }
    } else {
      console.log('   ❌ Impossible de tester Workdays (échec connexion)');
    }
  } catch (error) {
    console.log(`   ❌ Erreur test Workdays: ${error.message}`);
  }
  console.log('');
  
  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS:');
  console.log(`   • Backend Health: ${await testEndpoint(config.backend + '/health') ? '✅' : '❌'}`);
  console.log(`   • Frontend: ${await testEndpoint(config.frontend) ? '✅' : '❌'}`);
  console.log(`   • Authentification: ${authSuccess}/3 comptes fonctionnels`);
  console.log('');
  
  console.log('🎯 COMPTES DE TEST DISPONIBLES:');
  console.log('   🔧 Mécaniciens:');
  console.log('      • mechanic@demo.com / role123 (Mensuel - 2500€)');
  console.log('      • jean.dupont@garage.com / role123 (Journalier - 120€/jour)');
  console.log('      • marie.martin@garage.com / role123 (Mensuel - 2800€)');
  console.log('      • pierre.durand@garage.com / role123 (Commission - 25%)');
  console.log('   👔 Manager: manager@demo.com / role123');
  console.log('   👤 Client: client@demo.com / role123');
  console.log('');
  
  console.log('🎮 FONCTIONNALITÉS À TESTER:');
  console.log('   1. 📅 Déclaration des jours de travail (mécanicien)');
  console.log('   2. ✅ Validation des déclarations (manager)');
  console.log('   3. 💰 Calcul précis des salaires (mécanicien)');
  console.log('   4. 🔧 Gestion des outils et inventaire');
  console.log('   5. 🗺️ Géolocalisation et clients proches');
  console.log('   6. 📱 Interface mobile responsive');
  console.log('');
  
  if (authSuccess === 3) {
    console.log('🎉 DÉPLOIEMENT RÉUSSI ! Application prête pour la production.');
  } else {
    console.log('⚠️  DÉPLOIEMENT PARTIEL. Vérifier la configuration.');
  }
}

async function testEndpoint(url) {
  try {
    const result = await makeRequest(url);
    return result.statusCode === 200;
  } catch (error) {
    return false;
  }
}

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (data && method !== 'GET') {
      req.write(data);
    }
    
    req.end();
  });
}

testProductionFinal();