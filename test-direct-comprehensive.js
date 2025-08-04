// Direct test of comprehensive report generation
const fs = require('fs');
const path = require('path');

// Clear ALL module caches related to report generation
Object.keys(require.cache).forEach(key => {
  if (key.includes('reportGeneration') || key.includes('dist')) {
    delete require.cache[key];
  }
});

// Now require the module fresh
const { createReportGenerator } = require('./dist/reportGeneration/index.js');

async function testComprehensiveGeneration() {
  console.log('=== DIRECT COMPREHENSIVE REPORT TEST ===\n');
  
  try {
    const config = {
      ticker: 'AAPL',
      reportType: 'comprehensive',
      outputFormat: 'pdf',
      reportDate: new Date().toISOString().split('T')[0],
      currentDate: new Date().toISOString().split('T')[0],
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY || 'demo'
    };
    
    console.log('Creating report generator...');
    const generator = createReportGenerator(config);
    
    console.log('Generating comprehensive report...');
    const report = await generator.generateReport();
    
    console.log('\n=== GENERATION RESULTS ===');
    console.log('Company:', report.companyData?.companyName);
    console.log('Ticker:', report.companyData?.ticker);
    console.log('Slides generated:', report.slides?.length);
    console.log('Output path:', report.outputPath);
    
    if (report.slides && report.slides.length > 0) {
      console.log('\n=== SLIDE BREAKDOWN ===');
      report.slides.forEach((slide, i) => {
        console.log(`${i + 1}. ${slide.title} (${slide.layout})`);
      });
    }
    
    // Check the PDF if it was generated
    if (report.outputPath && fs.existsSync(report.outputPath)) {
      const stats = fs.statSync(report.outputPath);
      const pdfData = fs.readFileSync(report.outputPath);
      const pageMatches = pdfData.toString('binary').match(/\/Type[\s]*\/Page[^s]/g);
      const pageCount = pageMatches ? pageMatches.length : 0;
      
      console.log('\n=== PDF ANALYSIS ===');
      console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
      console.log('Page count:', pageCount);
      console.log('Expected pages: 15-20');
      console.log('Status:', pageCount >= 15 ? '✓ SUCCESS!' : '✗ FAILED - Too few pages');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testComprehensiveGeneration();