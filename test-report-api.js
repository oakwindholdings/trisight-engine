// test-report-api.js
// Test report generation through the API endpoint

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testReportAPI() {
  console.log('Testing report generation API...\n');
  
  const apiUrl = 'http://localhost:3001/api/reports/generate';
  
  const requestData = {
    ticker: 'AAPL',
    template: 'comprehensive',
    reportType: 'comprehensive',
    outputFormat: 'pdf',
    sections: [
      'executiveSummary',
      'companyOverview',
      'financialAnalysis',
      'technicalAnalysis',
      'valuation',
      'risks',
      'recommendation'
    ],
    options: {
      includeCharts: true,
      includeAIInsights: true,
      comprehensiveMode: true
    }
  };
  
  try {
    console.log('Sending request to:', apiUrl);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minute timeout
    });
    
    console.log('\nResponse received!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const result = response.data.data;
      console.log('\nReport Generation Results:');
      console.log('========================');
      console.log(`Report ID: ${result.reportId}`);
      console.log(`Status: ${result.status}`);
      console.log(`Slides: ${result.metadata?.slideCount || 'N/A'}`);
      console.log(`File Size: ${result.metadata?.fileSize ? (result.metadata.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}`);
      
      if (result.url) {
        console.log(`\nReport URL: ${result.url}`);
        console.log('\nYou can download the report from the URL above.');
      }
      
      if (result.localPath && fs.existsSync(result.localPath)) {
        console.log(`\nLocal Path: ${result.localPath}`);
        console.log('Opening report...');
        require('child_process').exec(`start "${path.resolve(result.localPath)}"`);
      }
    }
    
  } catch (error) {
    console.error('Error calling API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Try starting the API server
    console.log('\nNote: Make sure the API server is running on port 3001');
    console.log('You can start it with: npm run server');
  }
}

// Run the test
testReportAPI();