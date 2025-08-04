// test-enhanced-report.js
// Test script to generate a report with enhanced data integration

const { ReportGenerator } = require('./dist/reportGeneration/core/reportGenerator');
const { EnhancedTwelveDataAdapter } = require('./dist/reportGeneration/adapters/enhancedTwelveDataAdapter');
const { EnhancedAIService } = require('./dist/reportGeneration/services/enhancedAIService');
const fs = require('fs');
const path = require('path');

async function testEnhancedReportGeneration() {
  console.log('Starting enhanced report generation test...');
  
  try {
    // Initialize report generator
    const generator = new ReportGenerator();
    
    // Configure report
    const config = {
      ticker: 'AAPL',
      reportType: 'comprehensive',
      outputFormat: 'pdf',
      sections: [
        'executiveSummary',
        'companyOverview',
        'financialAnalysis',
        'technicalAnalysis',
        'valuation',
        'risks',
        'recommendation'
      ],
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
    
    console.log('Generating comprehensive report for AAPL...');
    const report = await generator.generate(config);
    
    console.log('Report generation completed!');
    console.log(`- Slides generated: ${report.slides?.length || 0}`);
    console.log(`- Output path: ${report.outputPath}`);
    console.log(`- Company: ${report.companyData?.companyName}`);
    console.log(`- Overall score: ${Math.round((report.metadata?.analysis?.composite?.overall || 0) * 100)}/100`);
    console.log(`- Recommendation: ${report.metadata?.analysis?.composite?.recommendation || 'N/A'}`);
    
    // Check file size
    if (report.outputPath && fs.existsSync(report.outputPath)) {
      const stats = fs.statSync(report.outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      console.log(`- File size: ${fileSizeKB} KB`);
      
      // Open the PDF
      const fullPath = path.resolve(report.outputPath);
      console.log(`\nOpening report: ${fullPath}`);
      require('child_process').exec(`start "${fullPath}"`);
    }
    
    // Log any data quality issues
    if (report.metadata?.analysis) {
      const analysis = report.metadata.analysis;
      console.log('\nData Quality Check:');
      console.log(`- Revenue Growth: ${analysis.growth?.revenueGrowth?.yoy || 'N/A'}%`);
      console.log(`- ROE: ${((analysis.quality?.roe || 0) * 100).toFixed(1)}%`);
      console.log(`- P/E Ratio: ${analysis.valuation?.peRatio || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('Error generating report:', error);
    console.error(error.stack);
  }
}

// Run the test
testEnhancedReportGeneration();