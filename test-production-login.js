const https = require('https');

async function testProductionLogin() {
  console.log('🔐 TEST DE CONNEXION EN PRODUCTION\n');
  
  const baseUrl = 'https://m1p15bmean-niaina-2.onrender.com';
  
  // Comptes à tester (ceux qui devraient exister en production)
  const accounts = [
    { email: 'client@demo.com', password: 'role123', role: 'client' },
    { email: 'manager@demo.com', password: 'role123', role: 'manager' },
    { email: 'mechanic@demo.com', password: 'role123', role: 'mechanic' }
  ];
  
  console.log('🧪 Test de connexion pour chaque compte:\n');
  
  for (const account of accounts) {
    try {
      console.log(`👤 Test: ${account.email} (${account.role})`);
      
      const loginData = JSON.stringify({
        email: account.email,
        password: account.password
      });
      
      const result = await makeRequest(baseUrl + '/api/auth/login', 'POST', loginData);
      
      if (result.statusCode === 200) {
        console.log('   ✅ Connexion réussie');
        
        try {
          const response = JSON.parse(result.data);
          if (response.token) {
            console.log('   🎫 Token reçu');
            
            // Décoder le token pour vérifier le rôle
            const tokenParts = response.token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
              console.log(`   👤 Rôle dans token: ${payload.role}`);
              console.log(`   📧 Email dans token: ${payload.email}`);
            }
          }
        } catch (e) {
          console.log('   ⚠️  Réponse non-JSON');
        }
        
      } else if (result.statusCode === 401) {
        console.log('   ❌ Identifiants incorrects ou compte inexistant');
      } else {
        console.log(`   ❓ Status inattendu: ${result.statusCode}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur de connexion: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎯 ANALYSE:');
  console.log('   • Si tous les comptes échouent → Base de données vide');
  console.log('   • Si certains réussissent → Base partiellement initialisée');
  console.log('   • Si erreurs réseau → Problème de connectivité');
  
  console.log('\n💡 SOLUTION SI BASE VIDE:');
  console.log('   1. Configurer MongoDB Atlas dans Render');
  console.log('   2. Exécuter le script d\'initialisation en production');
  console.log('   3. Ou utiliser l\'interface d\'inscription pour créer les comptes');
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://m1p15-bmean-niaina.vercel.app'
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

testProductionLogin();