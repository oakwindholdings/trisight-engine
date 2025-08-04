// Debug comprehensive slide generation
const axios = require('axios');
const fs = require('fs');

async function debugSlideGeneration() {
  console.log('=== COMPREHENSIVE SLIDE GENERATION DEBUG ===\n');

  // Test 1: Simple API call
  console.log('Test 1: API Generation with comprehensive report type');
  try {
    const response = await axios.post('http://localhost:3001/api/reports/generate', {
      ticker: 'AAPL',
      reportType: 'comprehensive',
      outputFormat: 'pdf'
    });
    
    console.log('Slides count:', response.data.slides?.length);
    console.log('First 3 slide titles:', response.data.slides?.slice(0, 3).map(s => s.title));
  } catch (error) {
    console.error('API Error:', error.message);
  }

  // Test 2: Check the actual built code
  console.log('\nTest 2: Direct module test');
  try {
    // Clear require cache
    delete require.cache[require.resolve('./dist/reportGeneration/index.js')];
    const { createReportGenerator } = require('./dist/reportGeneration/index.js');
    
    const generator = createReportGenerator({
      ticker: 'TEST',
      reportType: 'comprehensive',
      outputFormat: 'pdf',
      reportDate: new Date().toISOString().split('T')[0]
    });
    
    // Try to access internal methods if possible
    console.log('Generator created successfully');
    
  } catch (error) {
    console.error('Module Error:', error.message);
  }

  // Test 3: Check if comprehensive slide generator is exported
  console.log('\nTest 3: Check exports');
  try {
    // Import the built module
    const reportGenModule = require('./dist/reportGeneration/index.js');
    console.log('Exported functions:', Object.keys(reportGenModule));
    
    // Check if we can access comprehensive slide generator
    const hasComprehensiveGenerator = 'generateComprehensiveSlides' in reportGenModule;
    console.log('Has generateComprehensiveSlides:', hasComprehensiveGenerator);
    
  } catch (error) {
    console.error('Export check error:', error.message);
  }

  // Test 4: Check the source TypeScript files
  console.log('\nTest 4: Source file check');
  const files = [
    'src/reportGeneration/core/comprehensiveSlideGenerator.ts',
    'src/reportGeneration/core/reportAssembler.ts',
    'src/reportGeneration/core/reportGenerator.ts'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasComprehensive = content.includes('generateComprehensiveSlides');
      console.log(`${file}: ${hasComprehensive ? '✓ Has comprehensive slides' : '✗ Missing'}`);
    }
  });
}

debugSlideGeneration();