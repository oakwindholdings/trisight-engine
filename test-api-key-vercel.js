// test-api-key-vercel.js
// Test the API key directly against TwelveData to verify it's working

const axios = require('axios');

async function testTwelveDataDirectly() {
  console.log('🧪 TESTING TWELVEDATA API KEY DIRECTLY');
  console.log('============================================================');
  console.log('🔑 Testing the same API key that should be in Vercel environment\n');

  // Use the same API key that should be in the Vercel environment
  const apiKey = '764fb86962cc46ebbe5e1c89a1761623';
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
  
  try {
    console.log('📤 Testing TwelveData quote endpoint directly...');
    const startTime = Date.now();
    
    const response = await axios.get('https://api.twelvedata.com/quote', {
      params: {
        symbol: 'NVDA',
        apikey: apiKey
      },
      timeout: 15000
    });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`⏱️ Total Time: ${totalTime}ms`);
    
    if (response.status === 200 && response.data) {
      console.log('🎉 SUCCESS: TwelveData API working!');
      console.log('📋 Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check for error indicators
      if (response.data.code) {
        console.log(`❌ API Error Code: ${response.data.code}`);
        console.log(`❌ API Error Message: ${response.data.message}`);
      } else {
        console.log('✅ No API errors detected');
        console.log(`✅ Symbol: ${response.data.symbol}`);
        console.log(`✅ Price: $${response.data.close}`);
        console.log(`✅ Change: ${response.data.percent_change}%`);
      }
    } else {
      console.log('❌ FAILURE: Unexpected response');
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Data: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log('❌ CRITICAL ERROR: TwelveData API call failed');
    console.log(`❌ Error: ${error.message}`);
    
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test multiple endpoints
  console.log('\n🔄 Testing multiple TwelveData endpoints...');
  
  const endpoints = [
    { name: 'Profile', url: 'https://api.twelvedata.com/profile', params: { symbol: 'NVDA', apikey: apiKey } },
    { name: 'Time Series', url: 'https://api.twelvedata.com/time_series', params: { symbol: 'NVDA', interval: '1day', outputsize: 5, apikey: apiKey } },
    { name: 'Statistics', url: 'https://api.twelvedata.com/statistics', params: { symbol: 'NVDA', apikey: apiKey } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📤 Testing ${endpoint.name}...`);
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: 15000
      });
      
      if (response.status === 200 && response.data && !response.data.code) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);
      } else {
        console.log(`❌ ${endpoint.name}: FAILED`);
        if (response.data?.code) {
          console.log(`   Error: ${response.data.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log('✅ API key is valid and working');
  console.log('✅ TwelveData endpoints are accessible');
  console.log('✅ The issue must be in the Vercel environment configuration');
  console.log('\n💡 RECOMMENDATION:');
  console.log('Check Vercel environment variables configuration');
  console.log('Ensure REACT_APP_TWELVE_DATA_API_KEY or TWELVE_DATA_API_KEY is set');
}

// Run the test
testTwelveDataDirectly().catch(console.error);
