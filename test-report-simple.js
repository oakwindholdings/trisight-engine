// Simple test script to generate NVDA report bypassing configuration issues
const { createReportGenerator } = require('./dist/reportGeneration');
const fs = require('fs');
const path = require('path');

async function generateSimpleReport() {
  try {
    console.log('Creating simple NVDA report...');
    
    // Create a minimal configuration that includes sections array
    const config = {
      ticker: 'NVDA',
      symbol: 'NVDA',
      companyName: 'NVIDIA Corporation',
      reportType: 'equity-research',
      outputFormat: 'json',  // Start with JSON to see the content
      reportDate: new Date().toISOString(),
      includeCharts: true,
      includeProjections: true,
      // Include sections to avoid the undefined error
      sections: [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          type: 'mixed',
          order: 1,
          required: true,
          dataRequirements: []
        },
        {
          id: 'financial-analysis',
          title: 'Financial Analysis',
          type: 'mixed',
          order: 2,
          required: true,
          dataRequirements: []
        },
        {
          id: 'competitive-analysis',
          title: 'Competitive Analysis',
          type: 'mixed',
          order: 3,
          required: true,
          dataRequirements: []
        },
        {
          id: 'technical-analysis',
          title: 'Technical Analysis',
          type: 'mixed',
          order: 4,
          required: true,
          dataRequirements: []
        },
        {
          id: 'risk-assessment',
          title: 'Risk Assessment',
          type: 'mixed',
          order: 5,
          required: true,
          dataRequirements: []
        },
        {
          id: 'ai-insights',
          title: 'AI Insights',
          type: 'mixed',
          order: 6,
          required: true,
          dataRequirements: []
        }
      ]
    };
    
    // Create the generator
    const generator = createReportGenerator(config);
    
    // Generate the report
    console.log('Generating report...');
    const report = await generator.generateReport();
    
    // Save the report
    const outputDir = path.join(__dirname, 'generated-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(outputDir, `NVDA_report_${timestamp}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    console.log('Report generated successfully!');
    console.log('Output path:', outputPath);
    console.log('\nReport Summary:');
    console.log('- Company:', report.companyData?.companyName || 'N/A');
    console.log('- Slides:', report.slides?.length || 0);
    console.log('- Has AI Content:', !!report.companyData?.metadata?.aiContent);
    
    if (report.companyData?.metadata?.aiContent) {
      console.log('\nAI Content Preview:');
      console.log('Executive Summary:', report.companyData.metadata.aiContent.executiveSummary?.substring(0, 200) + '...');
    }
    
    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
generateSimpleReport()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });