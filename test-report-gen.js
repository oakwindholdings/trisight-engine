// Test script to debug report generation
const { createReportGenerator } = require('./dist/reportGeneration');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testReportGeneration() {
  try {
    console.log('[TEST] Starting report generation test...');
    console.log('[TEST] API Keys loaded:', {
      twelveData: process.env.REACT_APP_TWELVE_DATA_API_KEY ? 'YES' : 'NO',
      firecrawl: process.env.REACT_APP_FIRECRAWL_API_KEY ? 'YES' : 'NO'
    });
    
    const config = {
      ticker: 'NVDA',  // Using NVDA as requested
      reportType: 'technical-analysis',
      outputFormat: 'pptx',
      title: 'NVIDIA Corporation Technical Analysis',
      author: 'TriSight',
      sections: [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          type: 'summary',
          required: true,
          dataRequirements: []
        }
      ],
      debugMode: true,
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY,
      firecrawlApiKey: process.env.REACT_APP_FIRECRAWL_API_KEY,
      currentDate: new Date().toISOString().split('T')[0]
    };
    
    console.log('[TEST] Creating report generator with config:', config);
    const generator = createReportGenerator(config);
    
    console.log('[TEST] Calling generateReport()...');
    const report = await generator.generateReport();
    
    console.log('[TEST] Report generated:', {
      keys: Object.keys(report),
      outputPath: report.outputPath,
      metadata: report.metadata
    });
    
    // Check if output file exists
    if (report.outputPath) {
      const exists = fs.existsSync(report.outputPath);
      console.log('[TEST] Output file exists:', exists);
      
      if (exists) {
        const stats = fs.statSync(report.outputPath);
        console.log('[TEST] File size:', stats.size, 'bytes');
      }
    }
    
    // Write the report object to see what we got
    fs.writeFileSync('test-report-output.json', JSON.stringify(report, null, 2));
    console.log('[TEST] Full report object written to test-report-output.json');
    
  } catch (error) {
    console.error('[TEST] Error during report generation:', error);
    console.error('[TEST] Stack trace:', error.stack);
    
    // Write the error details
    fs.writeFileSync('test-report-error.json', JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name
    }, null, 2));
  }
}

testReportGeneration();