// test-vercel-api-debug.js
// Debug the TwelveData API calls in the Vercel environment

const axios = require('axios');

async function debugVercelAPICall() {
  console.log('🔍 DEBUGGING VERCEL API CALL');
  console.log('============================================================');
  console.log('🎯 Testing the real data endpoint with detailed logging\n');

  const baseUrl = 'https://trisight-mreigaju3-apex-2b9a18e9.vercel.app';
  
  try {
    const config = {
      ticker: 'NVDA',
      title: 'Debug Test',
      template: 'technical-analysis',
      author: 'Debug Test'
    };
    
    console.log('📤 Calling real data endpoint with debug mode...');
    const startTime = Date.now();
    
    const response = await axios.post(`${baseUrl}/api/reports/generate-real-data`, config, {
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
    
    if (response.status === 200) {
      console.log('✅ API call successful');
      
      // Check the response structure
      const data = response.data;
      console.log('\n📋 RESPONSE STRUCTURE:');
      console.log(`Success: ${data.success}`);
      console.log(`Report ID: ${data.reportId}`);
      console.log(`Ticker: ${data.ticker}`);
      console.log(`Slides: ${data.slides?.length || 0}`);
      console.log(`Charts: ${data.charts?.length || 0}`);
      
      // Check metadata
      if (data.metadata) {
        console.log('\n📊 METADATA:');
        console.log(`Data Quality: ${data.metadata.dataQuality}%`);
        console.log(`Real Data Sources: ${data.metadata.realDataSources}`);
        console.log(`Failed Data Sources: ${data.metadata.failedDataSources}`);
        console.log(`Has Charts: ${data.metadata.hasCharts}`);
        console.log(`Slide Count: ${data.metadata.slideCount}`);
      }
      
      // Check data sources
      if (data.dataSources) {
        console.log('\n🔍 DATA SOURCES:');
        const working = data.dataSources.working || [];
        const failed = data.dataSources.failed || [];
        
        console.log(`Working APIs: ${working.length}`);
        if (working.length > 0) {
          working.forEach(api => console.log(`  ✅ ${api}`));
        }
        
        console.log(`Failed APIs: ${failed.length}`);
        if (failed.length > 0) {
          failed.forEach(api => console.log(`  ❌ ${api}`));
        }
      }
      
      // Check raw data status
      if (data.dataStatus) {
        console.log('\n📈 RAW DATA STATUS:');
        Object.keys(data.dataStatus).forEach(key => {
          const status = data.dataStatus[key];
          const icon = status.success ? '✅' : '❌';
          console.log(`  ${icon} ${key}: ${status.success ? 'SUCCESS' : `FAILED - ${status.error}`}`);
        });
      }
      
      // Check for violations
      if (data.violations && data.violations.length > 0) {
        console.log('\n🚨 VIOLATIONS:');
        data.violations.forEach(violation => {
          console.log(`  - ${violation}`);
        });
      } else {
        console.log('\n✅ NO VIOLATIONS FOUND');
      }
      
      // Check raw data
      if (data.rawData) {
        console.log('\n📊 RAW DATA SUMMARY:');
        Object.keys(data.rawData).forEach(key => {
          const dataItem = data.rawData[key];
          if (dataItem) {
            console.log(`  ✅ ${key}: ${typeof dataItem === 'object' ? JSON.stringify(dataItem).substring(0, 100) + '...' : dataItem}`);
          } else {
            console.log(`  ❌ ${key}: null/undefined`);
          }
        });
      }
      
    } else {
      console.log('❌ API call failed');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${response.data?.error || 'Unknown error'}`);
      
      if (response.data) {
        console.log('\n📋 ERROR RESPONSE:');
        console.log(JSON.stringify(response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.log('❌ CRITICAL ERROR');
    console.log(`Error: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('If data quality is 0%, check:');
  console.log('1. Environment variables in Vercel');
  console.log('2. TwelveData API key validity');
  console.log('3. API rate limits');
  console.log('4. Network connectivity from Vercel');
  console.log('5. TwelveData API endpoint availability');
}

// Run the debug test
debugVercelAPICall().catch(console.error);
