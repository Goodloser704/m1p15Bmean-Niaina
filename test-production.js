const https = require('https');
const http = require('http');

async function testProduction() {
  console.log('🧪 TEST DES URLS DE PRODUCTION\n');
  
  const urls = [
    {
      name: 'Frontend (Vercel)',
      url: 'https://m1p15-bmean-niaina.vercel.app',
      expected: 200
    },
    {
      name: 'Backend Health (Render)',
      url: 'https://m1p15bmean-niaina-2.onrender.com/health',
      expected: 200
    },
    {
      name: 'Backend API Auth (Render)',
      url: 'https://m1p15bmean-niaina-2.onrender.com/api/auth/login',
      expected: 405 // Method not allowed pour GET sur login
    }
  ];
  
  for (const test of urls) {
    try {
      console.log(`🔍 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const result = await testUrl(test.url);
      
      if (result.statusCode === test.expected) {
        console.log(`   ✅ Status: ${result.statusCode} (attendu: ${test.expected})`);
      } else {
        console.log(`   ❌ Status: ${result.statusCode} (attendu: ${test.expected})`);
      }
      
      console.log(`   ⏱️  Temps de réponse: ${result.responseTime}ms`);
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎯 URLS DE PRODUCTION:');
  console.log('   🌐 Frontend: https://m1p15-bmean-niaina.vercel.app');
  console.log('   🔧 Backend: https://m1p15bmean-niaina-2.onrender.com');
  console.log('');
  console.log('🧪 COMPTES DE TEST:');
  console.log('   • Client: client@demo.com / role123');
  console.log('   • Mécanicien: mechanic@demo.com / role123');
  console.log('   • Manager: manager@demo.com / role123');
  console.log('   • Jean Dupont (journalier): jean.dupont@garage.com / role123');
  console.log('   • Marie Martin (mensuel): marie.martin@garage.com / role123');
  console.log('   • Pierre Durand (commission): pierre.durand@garage.com / role123');
}

function testUrl(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        statusCode: res.statusCode,
        responseTime
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

testProduction();