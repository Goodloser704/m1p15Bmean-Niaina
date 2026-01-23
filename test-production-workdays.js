const https = require('https');

async function testProductionWorkdays() {
  try {
    console.log('🧪 TEST WORKDAYS EN PRODUCTION\n');
    
    const baseUrl = 'https://m1p15bmean-niaina-2.onrender.com';
    
    // 1. Test de connexion
    console.log('🔐 Test de connexion...');
    const loginResult = await makeRequest(baseUrl + '/api/auth/login', 'POST', JSON.stringify({
      email: 'mechanic@demo.com',
      password: 'mechanic123'
    }));
    
    if (loginResult.statusCode !== 200) {
      console.log('❌ Échec de connexion');
      console.log('Response:', loginResult.data);
      return;
    }
    
    const loginData = JSON.parse(loginResult.data);
    const token = loginData.token;
    console.log('✅ Connexion réussie');
    
    // 2. Test de l'URL workdays en production
    console.log('\n📅 Test workdays production...');
    const workdaysUrl = baseUrl + '/api/workdays/my-workdays?month=1&year=2026';
    console.log(`URL testée: ${workdaysUrl}`);
    
    const workdaysResult = await makeRequest(
      workdaysUrl,
      'GET',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    console.log(`Status: ${workdaysResult.statusCode}`);
    
    if (workdaysResult.statusCode === 200) {
      const workdays = JSON.parse(workdaysResult.data);
      console.log(`✅ ${workdays.length} déclarations récupérées en production`);
      
      if (workdays.length > 0) {
        console.log('\n📋 Premières déclarations:');
        workdays.slice(0, 3).forEach(wd => {
          console.log(`   ${new Date(wd.date).toLocaleDateString('fr-FR')} - ${wd.hoursWorked}h - ${wd.status}`);
        });
      }
      
      console.log('\n🎉 LA PRODUCTION FONCTIONNE DÉJÀ !');
      console.log('   ✅ L\'API workdays est accessible');
      console.log('   ✅ Les données sont présentes');
      
    } else if (workdaysResult.statusCode === 404) {
      console.log('❌ Erreur 404 - Route non trouvée');
      console.log('   🔧 Il faut déployer la correction');
    } else {
      console.log(`❌ Erreur ${workdaysResult.statusCode}:`, workdaysResult.data);
    }
    
    // 3. Test du frontend production
    console.log('\n🌐 Test du frontend production...');
    const frontendUrl = 'https://m1p15-bmean-niaina.vercel.app';
    console.log(`Frontend URL: ${frontendUrl}`);
    
    const frontendResult = await makeRequest(frontendUrl);
    if (frontendResult.statusCode === 200) {
      console.log('✅ Frontend accessible');
      console.log('   📱 Testez manuellement: Connexion → Mes Jours de Travail');
    } else {
      console.log('❌ Frontend inaccessible');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
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

testProductionWorkdays();