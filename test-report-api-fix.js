// Direct test of report generation with fixed adapter
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import the fixed adapter directly
const TwelveDataAdapter = require('./src/reportGeneration/adapters/twelveDataAdapter.ts');

// Mock environment for testing
global.process.env.REACT_APP_TWELVE_DATA_API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY;

async function testReportGeneration() {
  try {
    // Import report generator
    const { ReportGenerator } = require('./src/reportGeneration/core/reportGenerator.ts');
    
    console.log('Creating report generator...');
    const generator = new ReportGenerator({
      debugMode: true
    });
    
    console.log('\nGenerating report for AAPL...');
    const report = await generator.generateReport({
      symbol: 'AAPL',
      type: 'comprehensive',
      format: 'json'
    });
    
    // Check key metrics
    console.log('\n=== Report Key Metrics ===');
    const metrics = report.financials?.keyMetrics;
    if (metrics) {
      console.log('P/E Ratio:', metrics.peRatio);
      console.log('ROE:', metrics.roe, '%');
      console.log('Debt/Equity:', metrics.debtToEquity);
      console.log('Current Ratio:', metrics.currentRatio);
      console.log('Market Cap:', (metrics.marketCap / 1e12).toFixed(2), 'T');
      
      // Validate metrics
      const issues = [];
      if (metrics.peRatio === 0) issues.push('P/E is 0');
      if (metrics.roe > 200) issues.push('ROE unrealistically high');
      if (metrics.debtToEquity < 0) issues.push('Negative debt/equity');
      
      if (issues.length > 0) {
        console.log('\n⚠️  Issues found:', issues.join(', '));
      } else {
        console.log('\n✅ All metrics look reasonable!');
      }
    } else {
      console.log('⚠️  No key metrics found in report');
    }
    
    // Save report for inspection
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `test-report-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to ${filename}`);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
console.log('Testing report generation with fixed adapter...\n');
testReportGeneration();