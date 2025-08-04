// Direct test of report generation using the fixed adapter
const path = require('path');
const fs = require('fs');

// Set up environment
require('dotenv').config({ path: '.env.local' });

// Mock browser globals
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
};
global.document = {};
global.navigator = { userAgent: 'node' };

// Import after setting up environment
async function testDirectGeneration() {
  try {
    console.log('Testing direct report generation with fixed adapter...\n');
    
    // Dynamically import to avoid hoisting issues
    const { ReportGenerator } = await import('./src/reportGeneration/core/reportGenerator.ts');
    
    const generator = new ReportGenerator({
      debugMode: true
    });
    
    console.log('Generating report for AAPL...');
    const report = await generator.generateReport({
      symbol: 'AAPL',
      type: 'comprehensive',
      format: 'json',
      title: 'Apple Inc. - Data Pipeline Test',
      description: 'Testing fixed data extraction'
    });
    
    console.log('\n=== Report Generated Successfully ===');
    
    // Check financial data
    if (report.financials) {
      console.log('\nFinancial Data:');
      const metrics = report.financials.keyMetrics || {};
      console.log('- Market Cap:', (metrics.marketCap / 1e12).toFixed(2), 'T');
      console.log('- P/E Ratio:', metrics.peRatio || 'N/A');
      console.log('- ROE:', metrics.roe ? metrics.roe.toFixed(2) + '%' : 'N/A');
      console.log('- Debt/Equity:', metrics.debtToEquity || 'N/A');
      console.log('- Current Ratio:', metrics.currentRatio || 'N/A');
      
      // Data quality check
      const issues = [];
      if (!metrics.peRatio || metrics.peRatio === 0) issues.push('P/E missing or zero');
      if (!metrics.roe || metrics.roe === 0) issues.push('ROE missing or zero');
      if (!metrics.debtToEquity) issues.push('Debt/Equity missing');
      
      if (issues.length > 0) {
        console.log('\n⚠️  Data Issues:', issues.join(', '));
      } else {
        console.log('\n✅ All key metrics populated correctly!');
      }
    }
    
    // Check report sections
    console.log('\n=== Report Content ===');
    const sections = Object.keys(report).filter(k => report[k] && typeof report[k] === 'object');
    console.log('Sections:', sections.join(', '));
    
    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `generated-reports/test-direct-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${filename}`);
    
  } catch (error) {
    console.error('Generation failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Use dynamic import and run
(async () => {
  await testDirectGeneration();
})();