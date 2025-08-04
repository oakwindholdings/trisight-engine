// Test slide generation directly
const path = require('path');

// First, let's test if the comprehensive slide generator is working
console.log('Testing comprehensive slide generation directly...\n');

// We need to use the built module
delete require.cache[require.resolve('./dist/reportGeneration/index.js')];
const { createReportGenerator } = require('./dist/reportGeneration/index.js');

async function testSlideGeneration() {
  try {
    const config = {
      ticker: 'AAPL',
      reportType: 'comprehensive',
      outputFormat: 'pdf',
      reportDate: new Date().toISOString().split('T')[0],
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY || 'demo',
      includeAI: false, // Skip AI for now
      includeTechnical: true,
      includeFinancial: true,
      includeRisk: true,
      includeValuation: true,
      includeCompetitive: true
    };

    console.log('Creating report generator...');
    const generator = createReportGenerator(config);
    
    console.log('Generating report...');
    const report = await generator.generateReport();
    
    console.log('\n=== REPORT GENERATION RESULTS ===');
    console.log('Company name:', report.companyData?.companyName);
    console.log('Ticker:', report.companyData?.ticker);
    console.log('Slides generated:', report.slides?.length);
    console.log('Output path:', report.outputPath);
    
    if (report.slides) {
      console.log('\n=== SLIDE DETAILS ===');
      report.slides.forEach((slide, index) => {
        console.log(`\nSlide ${index + 1}:`);
        console.log('  Title:', slide.title);
        console.log('  Layout:', slide.layout);
        console.log('  Content types:', slide.content.map(c => c.type).join(', '));
      });
    }
    
    // Check if comprehensive slide generator is being used
    console.log('\n=== DEBUGGING INFO ===');
    console.log('Report type requested:', config.reportType);
    console.log('Expected slides: 15-20');
    console.log('Actual slides:', report.slides?.length || 0);
    console.log('Issue detected:', (report.slides?.length || 0) < 15 ? 'YES - Too few slides!' : 'NO');
    
  } catch (error) {
    console.error('Error during slide generation:', error);
    console.error('Stack:', error.stack);
  }
}

testSlideGeneration();