const axios = require('axios');

async function testCompleteFlow() {
  console.log('🚀 Testing complete end-to-end report generation flow...');
  
  const reportConfig = {
    ticker: 'NVDA',
    template: 'technical-analysis',
    title: 'NVIDIA Corporation Q2 2025 Technical Analysis',
    author: 'TriSight Analyst',
    reportType: 'technical-analysis',
    outputFormat: 'pptx'
  };
  
  try {
    console.log('📤 Sending report generation request to API...');
    console.log('Config:', JSON.stringify(reportConfig, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/reports/generate', reportConfig, {
      timeout: 120000, // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data) {
      const report = response.data; // The response.data IS the report
      
      console.log('\n🎉 REPORT GENERATION SUCCESSFUL!');
      console.log('==========================================');
      console.log('📈 Company:', report.companyData?.companyName || 'N/A');
      console.log('🎯 Ticker:', report.companyData?.ticker || reportConfig.ticker);
      console.log('📄 Slides Generated:', report.slides?.length || 0);
      console.log('💾 Output Path:', report.outputPath || 'N/A');
      console.log('📊 Generation Time:', report.metadata?.generationTime || 'N/A', 'ms');
      
      if (report.slides) {
        console.log('\n📋 SLIDE BREAKDOWN:');
        report.slides.forEach((slide, index) => {
          console.log(`  ${index + 1}. ${slide.title || 'Untitled Slide'}`);
        });
      }
      
      if (report.companyData?.analysis) {
        console.log('\n📈 ANALYSIS RESULTS:');
        const analysis = report.companyData.analysis;
        if (analysis.composite) {
          console.log(`  🎯 Overall Score: ${analysis.composite.overall}/100`);
          console.log(`  💡 Recommendation: ${analysis.composite.recommendation}`);
          console.log(`  🔒 Confidence: ${(analysis.composite.confidence * 100).toFixed(1)}%`);
        }
      }
      
      console.log('\n✅ ALL SYSTEMS OPERATIONAL! 🚀');
      console.log('==========================================');
      
      return true;
    } else {
      console.log('❌ Unexpected response format');
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('📤 Response Status:', error.response.status);
      console.error('📤 Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.error('🚨 Server Error - Check server logs for details');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Connection refused - Is the server running on port 3001?');
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.error('🚨 Request timeout - Report generation took too long');
    }
    
    return false;
  }
}

// Run the test
testCompleteFlow()
  .then((success) => {
    if (success) {
      console.log('\n🎉 END-TO-END TEST PASSED!');
      console.log('The reporting system is fully operational.');
      process.exit(0);
    } else {
      console.log('\n❌ END-TO-END TEST FAILED!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 UNEXPECTED ERROR:', error);
    process.exit(1);
  });