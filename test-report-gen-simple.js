// Simplified test to skip AI generation and see report output
const { createReportGenerator } = require('./dist/reportGeneration');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Mock the AI calls to speed up testing
process.env.MOCK_AI_RESPONSES = 'true';

async function testReportGeneration() {
  try {
    console.log('[TEST] Starting simplified report generation test...');
    
    const config = {
      ticker: 'NVDA',
      reportType: 'technical-analysis',
      outputFormat: 'pdf',  // PDF is the must-have format
      title: 'NVIDIA Corporation Technical Analysis',
      author: 'TriSight',
      sections: [
        {
          id: 'price-analysis',
          title: 'Price Analysis',
          type: 'chart',
          required: true
        }
      ],  // Include price analysis section
      dataSources: ['market-data', 'financials', 'patterns'],  // Fix the missing dataSources
      debugMode: true,
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY,
      firecrawlApiKey: process.env.REACT_APP_FIRECRAWL_API_KEY,
      currentDate: '2025-07-31',
      skipAIGeneration: true  // Skip AI content generation
    };
    
    console.log('[TEST] Creating report generator...');
    const generator = createReportGenerator(config);
    
    console.log('[TEST] Generating report...');
    const report = await generator.generateReport();
    
    console.log('[TEST] Report generated successfully!');
    console.log('[TEST] Report keys:', Object.keys(report));
    console.log('[TEST] Output path:', report.outputPath);
    console.log('[TEST] Output format:', report.config?.outputFormat);
    
    // Check what files were created
    if (report.outputPath) {
      const exists = fs.existsSync(report.outputPath);
      console.log('[TEST] Output file exists:', exists);
      
      if (exists) {
        const stats = fs.statSync(report.outputPath);
        console.log('[TEST] File size:', stats.size, 'bytes');
        console.log('[TEST] File extension:', report.outputPath.split('.').pop());
      }
    }
    
    // Write the full report object
    fs.writeFileSync('test-report-simple-output.json', JSON.stringify(report, null, 2));
    console.log('[TEST] Full report written to test-report-simple-output.json');
    
    // Check generated-reports directory
    const reportsDir = './generated-reports';
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      console.log('[TEST] Files in generated-reports:', files.filter(f => f.includes('NVDA')));
    }
    
  } catch (error) {
    console.error('[TEST] Error:', error.message);
    console.error('[TEST] Stack:', error.stack);
  }
}

testReportGeneration();