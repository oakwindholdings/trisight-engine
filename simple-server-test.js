// simple-server-test.js
// Simple test to check server response

const axios = require('axios');

async function testServer() {
  console.log('🔍 Testing Server Response...\n');
  
  try {
    const config = {
      ticker: 'NVDA',
      title: 'Canvas Chart Test',
      template: 'equity-research',
      outputFormat: 'pdf',
      includeCharts: true,
      debugMode: true
    };
    
    console.log('📤 Sending request to server...');
    console.log('Config:', JSON.stringify(config, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/reports/generate', config, {
      timeout: 30000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('\n📥 Server Response:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.error) {
      console.log('\n❌ Error Details:');
      console.log('Message:', response.data.error.message);
      console.log('Stack:', response.data.error.stack);
    }
    
  } catch (error) {
    console.log('\n❌ Request Failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
  }
}

testServer().catch(console.error);
