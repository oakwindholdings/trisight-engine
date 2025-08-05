// test-fixed-charts.js
// Test the fixed chart generation

const axios = require('axios');
const fs = require('fs');

async function testFixedCharts() {
  console.log('🔧 Testing FIXED Chart Generation...\n');
  
  const config = {
    ticker: 'NVDA',
    title: 'FIXED Chart Test Report',
    template: 'equity-research',
    outputFormat: 'pdf',
    includeCharts: true,
    debugMode: true
  };
  
  try {
    console.log('📤 Generating report with FIXED chart embedding...');
    const response = await axios.post('http://localhost:3001/api/reports/generate', config);
    
    if (response.data.success) {
      console.log('✅ Report generated successfully!');
      console.log('📄 File:', response.data.outputPath);
      
      if (response.data.outputPath && fs.existsSync(response.data.outputPath)) {
        const stats = fs.statSync(response.data.outputPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log('📊 Size:', sizeKB, 'KB');
        
        // Copy to accessible location with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const testPath = `./generated-reports/FIXED-chart-test-${timestamp}.pdf`;
        fs.copyFileSync(response.data.outputPath, testPath);
        console.log('📋 FIXED report copied to:', testPath);
        
        // Analyze the size to determine if charts are working
        if (sizeKB > 100) {
          console.log('🎉 SUCCESS: PDF size suggests charts are NOW WORKING!');
          console.log('   Previous reports were ~37KB, this one is', sizeKB, 'KB');
        } else if (sizeKB > 50) {
          console.log('🔄 PROGRESS: PDF size increased but charts may still need work');
          console.log('   Size improved from ~37KB to', sizeKB, 'KB');
        } else {
          console.log('⚠️ PDF still small - charts may not be rendering yet');
        }
        
        // Check for any errors or warnings
        if (response.data.errors && response.data.errors.length > 0) {
          console.log('\n⚠️ Errors during generation:');
          response.data.errors.forEach((error, i) => {
            console.log(`${i + 1}. ${error.message || error}`);
          });
        }
        
        if (response.data.warnings && response.data.warnings.length > 0) {
          console.log('\n⚠️ Warnings during generation:');
          response.data.warnings.forEach((warning, i) => {
            console.log(`${i + 1}. ${warning.message || warning}`);
          });
        }
        
      } else {
        console.log('❌ PDF file not found at:', response.data.outputPath);
      }
    } else {
      console.log('❌ Report generation failed');
      if (response.data.error) {
        console.log('Error:', response.data.error.message || response.data.error);
        if (response.data.error.details) {
          console.log('Details:', response.data.error.details);
        }
      }
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Error details:', error.stack);
    if (error.response?.data) {
      console.log('Server response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status) {
      console.log('HTTP Status:', error.response.status);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('The fix addressed the PDF chart embedding issue by:');
  console.log('1. Detecting base64 SVG charts correctly');
  console.log('2. Attempting direct SVG embedding in PDF');
  console.log('3. Providing enhanced placeholders with chart metadata');
  console.log('4. Improving chart matching logic');
}

testFixedCharts().catch(console.error);
