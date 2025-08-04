// Load environment variables first
require('dotenv').config({ path: './.env.local' });

console.log('Testing report generation with proper environment...');
console.log('API Key loaded:', process.env.REACT_APP_TWELVE_DATA_API_KEY ? 'Yes' : 'No');

const { createReportGenerator } = require('./dist/reportGeneration/index.js');

async function testReportGeneration() {
  const config = {
    ticker: 'NVDA',
    reportType: 'technical-analysis',
    template: 'technical-analysis',
    title: 'NVIDIA Corporation Q2 2025 Technical Analysis',
    author: 'TriSight Analyst',
    outputFormat: 'pptx',
    reportId: 'test-123',
    currentDate: '2025-08-01',  
    reportDate: '2025-08-01',
    apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY
  };

  console.log('Config API key:', config.apiKey ? 'Present' : 'Missing');

  try {
    const generator = createReportGenerator(config);
    console.log('Generator created successfully');
    
    console.log('Calling generateReport()...');
    const report = await generator.generateReport();
    console.log('Report generated successfully!');
    console.log('Report keys:', Object.keys(report));
    
    if (report.companyData) {
      console.log('Company name:', report.companyData.companyName);
      console.log('Description length:', report.companyData.description?.length || 0);
    }
    
    if (report.slides) {
      console.log('Slides count:', report.slides.length);
      console.log('First slide title:', report.slides[0]?.title);
    }
    
    if (report.outputPath) {
      console.log('Output path:', report.outputPath);
    }
    
  } catch (error) {
    console.error('Error during generation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testReportGeneration();