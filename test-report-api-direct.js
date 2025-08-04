// Test report generation through the API endpoint
const axios = require('axios');
const fs = require('fs');

async function testReportGeneration() {
  console.log('Testing report generation through API...\n');
  
  try {
    // Start report generation
    console.log('1. Starting report generation for AAPL...');
    const generateResponse = await axios.post('http://localhost:3001/api/reports/generate', {
      symbol: 'AAPL',
      type: 'comprehensive',
      format: 'json',
      title: 'Apple Inc. Investment Analysis - Fixed Data Pipeline',
      description: 'Testing improved data extraction'
    });
    
    const reportId = generateResponse.data.reportId;
    console.log('Report ID:', reportId);
    
    // Poll for completion
    console.log('\n2. Polling for report completion...');
    let attempts = 0;
    let status = 'processing';
    let reportData = null;
    
    while (status === 'processing' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await axios.get(`http://localhost:3001/api/reports/status/${reportId}`);
      status = statusResponse.data.status;
      reportData = statusResponse.data;
      
      console.log(`Attempt ${++attempts}: ${status}${reportData.progress ? ` (${reportData.progress}%)` : ''}`);
      
      if (status === 'error') {
        console.error('Report generation failed:', reportData.error);
        return;
      }
    }
    
    if (status === 'completed') {
      console.log('\n3. Report completed! Analyzing financial data...');
      
      // Download the report
      const downloadResponse = await axios.get(`http://localhost:3001/api/reports/download/${reportId}`);
      const report = downloadResponse.data;
      
      // Check key metrics
      console.log('\n=== Financial Metrics ===');
      const metrics = report.financials?.keyMetrics || report.keyMetrics || {};
      console.log('Market Cap:', (metrics.marketCap / 1e12).toFixed(2), 'T');
      console.log('P/E Ratio:', metrics.peRatio);
      console.log('ROE:', metrics.roe, '%');
      console.log('Debt/Equity:', metrics.debtToEquity);
      console.log('Current Ratio:', metrics.currentRatio);
      console.log('Dividend Yield:', metrics.dividendYield, '%');
      
      // Validate data quality
      console.log('\n=== Data Quality Check ===');
      const issues = [];
      if (metrics.peRatio === 0 || !metrics.peRatio) issues.push('P/E ratio missing or zero');
      if (metrics.roe === 0 || !metrics.roe) issues.push('ROE missing or zero');
      if (metrics.roe > 200) issues.push('ROE seems high but may be valid');
      if (metrics.debtToEquity === 0 || !metrics.debtToEquity) issues.push('Debt/Equity missing or zero');
      
      if (issues.length > 0) {
        console.log('Issues found:');
        issues.forEach(issue => console.log('  ⚠️', issue));
      } else {
        console.log('  ✅ All metrics present and reasonable!');
      }
      
      // Check report sections
      console.log('\n=== Report Sections ===');
      const sections = Object.keys(report);
      console.log('Sections included:', sections.join(', '));
      console.log('Total sections:', sections.length);
      
      // Save report for inspection
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `test-report-fixed-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`\nFull report saved to ${filename}`);
      
    } else {
      console.log('Report generation timed out');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nMake sure the API server is running on port 3001');
      console.error('Run: cd server && npm start');
    }
  }
}

testReportGeneration();