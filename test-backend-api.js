const https = require('https');

async function testBackendAPI() {
  console.log('🔍 DIAGNOSTIC DE L\'API BACKEND\n');
  
  const baseUrl = 'https://m1p15bmean-niaina-2.onrender.com';
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/health',
      expectedStatus: 200
    },
    {
      name: 'Login POST (sans données)',
      method: 'POST',
      path: '/api/auth/login',
      expectedStatus: 400, // Bad request car pas de données
      data: null
    },
    {
      name: 'Login POST (avec données)',
      method: 'POST',
      path: '/api/auth/login',
      expectedStatus: 401, // Unauthorized car mauvais credentials
      data: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    },
    {
      name: 'Login POST (credentials valides)',
      method: 'POST',
      path: '/api/auth/login',
      expectedStatus: 200, // Success
      data: JSON.stringify({ email: 'mechanic@demo.com', password: 'role123' })
    },
    {
      name: 'Register GET',
      method: 'GET',
      path: '/api/auth/register',
      expectedStatus: 405 // Method not allowed
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`);
      console.log(`   ${test.method} ${baseUrl}${test.path}`);
      
      const result = await makeRequest(baseUrl + test.path, test.method, test.data);
      
      const statusMatch = result.statusCode === test.expectedStatus;
      const statusIcon = statusMatch ? '✅' : '❌';
      
      console.log(`   ${statusIcon} Status: ${result.statusCode} (attendu: ${test.expectedStatus})`);
      console.log(`   ⏱️  Temps: ${result.responseTime}ms`);
      
      if (result.data) {
        try {
          const parsed = JSON.parse(result.data);
          console.log(`   📄 Réponse: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   📄 Réponse: ${result.data.substring(0, 100)}...`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎯 ANALYSE:');
  console.log('   • Si health check fonctionne → Backend opérationnel');
  console.log('   • Si login POST retourne 400/401 → Routes auth fonctionnelles');
  console.log('   • Si erreurs CORS → Problème de configuration CORS');
  console.log('   • Si 404 sur /api/* → Problème de routing');
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
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
      const responseTime = Date.now() - startTime;
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
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

testBackendAPI();