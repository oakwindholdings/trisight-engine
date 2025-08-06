// test-health-endpoint.js
// Test the health endpoint to verify API is working

const axios = require('axios');

async function testHealthEndpoint() {
  console.log('🏥 TESTING HEALTH ENDPOINT');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get('https://trisight-beta.vercel.app/api/health', {
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working!');
      
      // Check environment variables
      const envCheck = response.data.environmentCheck;
      console.log('\n🔧 Environment Check:');
      console.log(`   API Key: ${envCheck.hasApiKey ? '✅' : '❌'}`);
      console.log(`   Supabase URL: ${envCheck.hasSupabaseUrl ? '✅' : '❌'}`);
      console.log(`   Supabase Key: ${envCheck.hasSupabaseKey ? '✅' : '❌'}`);
      console.log(`   Node Env: ${envCheck.nodeEnv}`);
      
    } else {
      console.log('❌ Health endpoint failed');
    }
    
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
  }
}

testHealthEndpoint();
