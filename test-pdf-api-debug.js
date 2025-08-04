// Test PDF generation through local API
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  console.log('Testing PDF generation through local API...\n');

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
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Output path:', response.data.outputPath);
    console.log('Slides count:', response.data.slides?.length);
    console.log('Company name:', response.data.companyData?.companyName);

    if (response.data.outputPath) {
      console.log('\nReport generated successfully!');
      console.log('Report path:', response.data.outputPath);
      
      // Check if file exists
      const reportPath = path.join(__dirname, response.data.outputPath);
      if (fs.existsSync(reportPath)) {
        const stats = fs.statSync(reportPath);
        console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
        
        // Read PDF to check page count (basic check)
        const pdfData = fs.readFileSync(reportPath);
        const pageMatches = pdfData.toString('binary').match(/\/Type[\s]*\/Page[^s]/g);
        const pageCount = pageMatches ? pageMatches.length : 0;
        console.log('Estimated page count:', pageCount);
        
        // Check for expected content
        const pdfString = pdfData.toString('binary');
        const expectedSections = [
          'Executive Summary',
          'Investment Thesis',
          'Company Overview',
          'Financial Performance',
          'Revenue & Growth Analysis',
          'Profitability Analysis',
          'Balance Sheet Strength',
          'Valuation Analysis',
          'Technical Analysis',
          'Risk Assessment',
          'Competitive Positioning',
          'Future Outlook',
          'Investment Recommendation',
          'Key Metrics Dashboard'
        ];
        
        console.log('\nContent check:');
        let foundCount = 0;
        expectedSections.forEach(section => {
          const found = pdfString.includes(section);
          console.log(`  ${section}: ${found ? '✓' : '✗'}`);
          if (found) foundCount++;
        });
        
        console.log(`\nSummary: ${foundCount}/${expectedSections.length} sections found`);
        console.log('Expected pages: 15-20');
        console.log('Actual pages:', pageCount);
        console.log('Status:', pageCount >= 15 ? 'GOOD' : 'ISSUE - Too few pages!');
        
      } else {
        console.log('Report file not found at:', reportPath);
      }
    } else {
      console.log('No output path in response');
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