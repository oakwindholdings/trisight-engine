// test-report-direct.js
// Direct test of report generation components

const path = require('path');
const fs = require('fs');

// Add src directory to NODE_PATH for module resolution
const srcPath = path.join(__dirname, 'src');
require('module').Module._nodeModulePaths = function(from) {
  const paths = require('module').Module._nodeModulePaths.call(this, from);
  paths.push(srcPath);
  return paths;
};

async function generateTestReport() {
  console.log('Testing enhanced report generation...\n');
  
  try {
    // Import modules directly from source
    const { ReportGenerator } = require('./src/reportGeneration/core/reportGenerator');
    const { ReportAssembler } = require('./src/reportGeneration/core/reportAssembler');
    const { DataFetcher } = require('./src/reportGeneration/core/dataFetcher');
    const { DataProcessor } = require('./src/reportGeneration/core/dataProcessor');
    const { EnhancedTwelveDataAdapter } = require('./src/reportGeneration/adapters/enhancedTwelveDataAdapter');
    const { EnhancedAIService } = require('./src/reportGeneration/services/enhancedAIService');
    
    // Initialize components
    console.log('Initializing report generator components...');
    const generator = new ReportGenerator();
    
    // Create report configuration
    const config = {
      ticker: 'AAPL',
      reportType: 'comprehensive',
      outputFormat: 'pdf',
      companyName: 'Apple Inc.',
      template: 'comprehensive',
      sections: ['all'],
      dateRange: {
        start: '2025-01-01',
        end: '2025-08-03'
      },
      options: {
        includeCharts: true,
        includeAIInsights: true,
        comprehensiveMode: true
      }
    };
    
    console.log('Configuration:', JSON.stringify(config, null, 2));
    console.log('\nGenerating report for AAPL...\n');
    
    // Generate the report
    const report = await generator.generate(config);
    
    // Display results
    console.log('Report Generation Complete!');
    console.log('==========================');
    console.log(`Company: ${report.companyData?.companyName || 'N/A'}`);
    console.log(`Ticker: ${report.companyData?.ticker || 'N/A'}`);
    console.log(`Slides Generated: ${report.slides?.length || 0}`);
    console.log(`Output Path: ${report.outputPath || 'N/A'}`);
    
    // Check analysis results
    if (report.metadata?.analysis) {
      const analysis = report.metadata.analysis;
      console.log('\nAnalysis Results:');
      console.log(`- Overall Score: ${Math.round((analysis.composite?.overall || 0) * 100)}/100`);
      console.log(`- Recommendation: ${analysis.composite?.recommendation || 'N/A'}`);
      console.log(`- Growth Score: ${Math.round((analysis.composite?.growth || 0) * 100)}/100`);
      console.log(`- Quality Score: ${Math.round((analysis.composite?.quality || 0) * 100)}/100`);
      console.log(`- Value Score: ${Math.round((analysis.composite?.value || 0) * 100)}/100`);
      
      console.log('\nKey Metrics:');
      console.log(`- Revenue Growth YoY: ${analysis.growth?.revenueGrowth?.yoy || 'N/A'}%`);
      console.log(`- ROE: ${((analysis.quality?.roe || 0) * 100).toFixed(1)}%`);
      console.log(`- P/E Ratio: ${report.companyData?.financials?.keyMetrics?.peRatio || 'N/A'}`);
      console.log(`- Current Ratio: ${report.companyData?.financials?.keyMetrics?.currentRatio || 'N/A'}`);
    }
    
    // Check file size
    if (report.outputPath && fs.existsSync(report.outputPath)) {
      const stats = fs.statSync(report.outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      console.log(`\nFile Size: ${fileSizeKB} KB`);
      
      // Open the PDF
      const fullPath = path.resolve(report.outputPath);
      console.log(`\nOpening report: ${fullPath}`);
      require('child_process').exec(`start "${fullPath}"`);
    } else {
      console.log('\nWarning: Report file not found at expected path');
    }
    
  } catch (error) {
    console.error('Error generating report:', error.message);
    console.error(error.stack);
  }
}

// Run the test
generateTestReport();