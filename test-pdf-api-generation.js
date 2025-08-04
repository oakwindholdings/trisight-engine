// Test PDF generation through API
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  console.log('Testing PDF generation through API...\n');

  const payload = {
    ticker: 'AAPL',
    reportType: 'comprehensive',
    outputFormat: 'pdf',
    config: {
      includeAI: true,
      includeTechnical: true,
      includeFinancial: true,
      includeRisk: true,
      includeValuation: true,
      includeCompetitive: true
    }
  };

  try {
    console.log('Sending request to generate comprehensive PDF report...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/reports/generate', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\nReport generated successfully!');
      console.log('Report path:', response.data.reportPath);
      
      // Check if file exists
      const reportPath = path.join(__dirname, response.data.reportPath);
      if (fs.existsSync(reportPath)) {
        const stats = fs.statSync(reportPath);
        console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
        
        // Read PDF to check page count (basic check)
        const pdfData = fs.readFileSync(reportPath);
        const pageMatches = pdfData.toString('binary').match(/\/Type[\s]*\/Page[^s]/g);
        const pageCount = pageMatches ? pageMatches.length : 0;
        console.log('Estimated page count:', pageCount);
      } else {
        console.log('Report file not found at:', reportPath);
      }
    } else {
      console.log('Report generation failed:', response.data.error);
    }

  } catch (error) {
    console.error('Error during API call:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPDFGeneration();