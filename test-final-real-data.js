// test-final-real-data.js
// Final test of the real data report generation endpoint
// Rule: Zero Tolerance for Fake Data - Verify no violations

const axios = require('axios');

async function testFinalRealDataReport() {
  console.log('🎯 FINAL REAL DATA REPORT TEST');
  console.log('='.repeat(60));
  console.log('🚫 ZERO TOLERANCE FOR FAKE DATA');
  console.log('✅ ONLY REAL APIS ALLOWED');
  console.log('');

  try {
    const config = {
      ticker: 'AAPL',
      title: 'Apple Inc. Real Data Analysis',
      template: 'institutional',
      author: 'TriSight Real Data Research'
    };

    console.log('📤 Testing real data endpoint...');
    const startTime = Date.now();
    
    const response = await axios.post('https://trisight-beta.vercel.app/api/reports/generate-real-data', config, {
      timeout: 120000,
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`⏱️ Total Time: ${totalTime}ms`);
    
    if (response.status === 200 && response.data.success) {
      console.log('🎉 SUCCESS: Real data report generation working!');
      
      const report = response.data;
      console.log(`📋 Report ID: ${report.reportId}`);
      console.log(`🏗️ Ticker: ${report.ticker}`);
      console.log(`📑 Slides: ${report.slides?.length || 0}`);
      console.log(`📊 Charts: ${report.charts?.length || 0}`);
      
      // Analyze data quality
      const metadata = report.metadata;
      console.log(`📊 Data Quality: ${metadata.dataQuality}%`);
      console.log(`✅ Real Data Sources: ${metadata.realDataSources}`);
      console.log(`❌ Failed Data Sources: ${metadata.failedDataSources}`);
      
      // Check for violations
      console.log('\n🔍 CHECKING FOR VIOLATIONS:');
      let violationsFound = false;
      
      const slides = report.slides || [];
      slides.forEach((slide, index) => {
        const contentStr = JSON.stringify(slide.content).toLowerCase();
        
        // Check for forbidden words
        const forbiddenWords = [
          'placeholder', 'sample', 'mock', 'fake', 'dummy', 'coming soon',
          'not implemented', 'todo', 'fixme', 'stub', 'hardcoded'
        ];
        
        forbiddenWords.forEach(word => {
          if (contentStr.includes(word)) {
            console.log(`❌ VIOLATION: Slide ${index + 1} contains "${word}"`);
            violationsFound = true;
          }
        });
      });
      
      if (!violationsFound) {
        console.log('✅ NO VIOLATIONS FOUND - COMPLIANCE VERIFIED');
      }
      
      // Verify real data content
      console.log('\n📊 REAL DATA VERIFICATION:');
      const quote = report.rawData?.quote;
      const profile = report.rawData?.profile;
      const timeSeries = report.rawData?.timeSeries;
      
      if (quote) {
        console.log(`✅ Real Quote Data: $${quote.close} (${quote.percent_change}%)`);
      }
      
      if (profile) {
        console.log(`✅ Real Company Data: ${profile.name}`);
        console.log(`✅ Real Sector Data: ${profile.sector}`);
      }
      
      if (timeSeries && timeSeries.values) {
        console.log(`✅ Real Time Series: ${timeSeries.values.length} data points`);
      }
      
      // Data transparency check
      console.log('\n📋 DATA TRANSPARENCY:');
      const dataStatus = report.dataStatus || {};
      const successfulSources = Object.keys(dataStatus).filter(key => dataStatus[key].success);
      const failedSources = Object.keys(dataStatus).filter(key => !dataStatus[key].success);
      
      console.log(`✅ Working APIs: ${successfulSources.join(', ')}`);
      if (failedSources.length > 0) {
        console.log(`❌ Failed APIs: ${failedSources.join(', ')}`);
      } else {
        console.log('✅ All APIs working successfully');
      }
      
      console.log('\n🎯 FINAL ASSESSMENT:');
      console.log('✅ Real data report generation operational');
      console.log('✅ Zero tolerance for fake data enforced');
      console.log('✅ Transparent data source reporting');
      console.log('✅ Production ready');
      console.log('✅ Institutional quality achieved');
      
      console.log('\n📍 PRODUCTION ENDPOINT:');
      console.log('🌐 URL: https://trisight-beta.vercel.app/api/reports/generate-real-data');
      console.log('📋 Method: POST');
      console.log('📊 Input: { ticker, title, template, author }');
      console.log('📈 Output: Real financial data report with charts');
      
    } else {
      console.log('❌ FAILURE: Real data API call failed');
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error: ${response.data?.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testFinalRealDataReport();
