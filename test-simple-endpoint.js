// test-simple-endpoint.js
// Test the ultra-simple test endpoint

const axios = require('axios');

async function testSimpleEndpoint() {
  console.log('🧪 TESTING ULTRA-SIMPLE ENDPOINT\n');
  
  const baseUrl = 'https://trisight-beta.vercel.app';
  
  try {
    console.log('Testing /api/test-js endpoint...');
    const response = await axios.get(`${baseUrl}/api/test-js`, {
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Ultra-simple endpoint working!');
      console.log('🎉 Vercel serverless functions are operational');
      
      // Now test the JavaScript report generation
      console.log('\nTesting JavaScript report generation...');
      const reportResponse = await axios.post(`${baseUrl}/api/reports/generate-js`, {
        ticker: 'AAPL',
        title: 'Test Report'
      }, {
        timeout: 30000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Report Status: ${reportResponse.status}`);
      
      if (reportResponse.status === 200) {
        console.log('✅ Report generation working!');
        console.log(`📊 Generated ${reportResponse.data.slides.length} slides`);
        console.log('🎯 API is fully functional');
      } else {
        console.log('❌ Report generation failed');
        console.log('Response:', reportResponse.data);
      }
      
    } else {
      console.log('❌ Simple endpoint failed');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testSimpleEndpoint().catch(console.error);
