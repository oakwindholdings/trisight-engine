// test-maximal-nvda.js
// Test script for maximal report generation with NVDA

const axios = require('axios');
const fs = require('fs').promises;

async function testMaximalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING MAXIMAL REPORT GENERATION WITH SECTION-BY-SECTION APPROACH');
  console.log('='.repeat(80) + '\n');
  
  const ticker = 'NVDA';
  
  // Custom prompts for some sections (others will use defaults)
  const customPrompts = {
    executiveSummary: `Generate a comprehensive executive summary for {ticker} focusing on:
      1. AI and datacenter market dominance
      2. Recent earnings and growth trajectory
      3. Competitive position vs AMD and Intel
      4. Key risks and opportunities in AI boom
      Provide specific numbers and percentages.`,
    
    technicalAnalysis: `Perform technical analysis for {ticker} with focus on:
      1. Price action post-earnings
      2. Support/resistance levels
      3. Moving averages and trend strength
      4. Volume patterns during AI hype
      5. Options flow analysis
      Include specific price levels and dates.`
  };
  
  // Optionally disable some sections
  const sectionConfig = {
    executiveSummary: true,
    companyOverview: true,
    financialAnalysis: true,
    technicalAnalysis: true,
    marketSentiment: true,
    competitiveAnalysis: true,
    riskAssessment: true,
    futureOutlook: true,
    investmentRecommendation: true
  };
  
  try {
    console.log(`Testing maximal report for: ${ticker}`);
    console.log(`Custom prompts: ${Object.keys(customPrompts).join(', ')}`);
    console.log(`Enabled sections: ${Object.keys(sectionConfig).filter(k => sectionConfig[k]).length}/${Object.keys(sectionConfig).length}`);
    console.log('\nSending request to server...\n');
    
    const startTime = Date.now();
    
    const response = await axios.post('http://localhost:3001/api/reports/generate-maximal', {
      ticker,
      prompts: customPrompts,
      sections: sectionConfig
    }, {
      timeout: 300000 // 5 minute timeout
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('MAXIMAL REPORT GENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nStatus: ${response.data.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`Ticker: ${response.data.ticker}`);
    console.log(`Generation Time: ${elapsed}s`);
    console.log(`Report Sections: ${response.data.sections?.length || 0}`);
    
    if (response.data.report) {
      const sections = response.data.report.sections;
      console.log('\nGenerated Sections:');
      for (const [name, data] of Object.entries(sections)) {
        console.log(`  - ${name}: ${data.provider} (${data.generationTime || 'N/A'})`);
      }
    }
    
    if (response.data.pdfPath) {
      console.log(`\nPDF Generated: ${response.data.pdfPath}`);
    }
    
    // Save the JSON response for inspection
    const jsonPath = `test-maximal-${ticker.toLowerCase()}.json`;
    await fs.writeFile(jsonPath, JSON.stringify(response.data, null, 2));
    console.log(`JSON saved to: ${jsonPath}`);
    
    // Display section-by-section results
    if (response.data.report?.sections) {
      console.log('\n' + '='.repeat(80));
      console.log('SECTION-BY-SECTION ANALYSIS');
      console.log('='.repeat(80));
      
      for (const [sectionName, sectionData] of Object.entries(response.data.report.sections)) {
        console.log(`\n--- ${sectionName.toUpperCase()} ---`);
        console.log(`Provider: ${sectionData.provider}`);
        console.log(`Generation Time: ${sectionData.generationTime}`);
        console.log(`Content Preview: ${sectionData.content?.substring(0, 200)}...`);
        
        if (sectionData.error) {
          console.log(`ERROR: ${sectionData.error}`);
        }
      }
    }
    
    return response.data;
    
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('ERROR DURING MAXIMAL REPORT GENERATION');
    console.error('='.repeat(80));
    
    if (error.response) {
      console.error('Server Error:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('No response from server');
      console.error('Request details:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    // Save error for debugging
    await fs.writeFile('test-maximal-error.json', JSON.stringify({
      error: error.message,
      response: error.response?.data,
      stack: error.stack
    }, null, 2));
    
    throw error;
  }
}

// Run the test
testMaximalReport()
  .then(() => {
    console.log('\n✓ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  });