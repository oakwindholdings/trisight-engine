// test-browser-viewer.js
// Test script to verify the browser report viewer integration

const axios = require('axios');

async function testBrowserReportViewer() {
  console.log('🧪 Testing Browser Report Viewer Integration\n');
  
  // 1. Test React app is running
  console.log('1. Testing React app availability...');
  try {
    const response = await axios.get('http://localhost:3000');
    console.log('✅ React app is running on port 3000');
  } catch (error) {
    console.log('❌ React app not accessible:', error.message);
    return;
  }
  
  // 2. Test server API is running
  console.log('\n2. Testing server API availability...');
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server API is running on port 3001');
  } catch (error) {
    console.log('❌ Server API not accessible:', error.message);
    return;
  }
  
  // 3. Test report generation API
  console.log('\n3. Testing report generation API...');
  try {
    const reportConfig = {
      ticker: 'NVDA',
      title: 'Test Report for Browser Viewer',
      template: 'equity-research',
      outputFormat: 'json', // Request JSON for browser viewing
      includeCharts: true,
      debugMode: true
    };
    
    console.log('📤 Sending report generation request...');
    const response = await axios.post('http://localhost:3001/api/reports/generate', reportConfig);
    
    if (response.data) {
      console.log('✅ Report generation API working');
      console.log('📊 Report structure:', {
        hasSlides: !!response.data.slides,
        slideCount: response.data.slides?.length || 0,
        hasCompanyData: !!response.data.companyData,
        hasTicker: !!response.data.ticker
      });
      
      // Check for charts in slides
      let chartCount = 0;
      if (response.data.slides) {
        for (const slide of response.data.slides) {
          if (slide.content) {
            for (const content of slide.content) {
              if (content.type === 'chart') {
                chartCount++;
                console.log(`📈 Found chart: ${content.data?.title || 'Untitled'} (${content.data?.type || 'unknown'})`);
              }
            }
          }
        }
      }
      
      console.log(`🎯 Total charts found: ${chartCount}`);
      
      if (chartCount > 0) {
        console.log('\n✅ SUCCESS: Browser Report Viewer should be able to debug these charts!');
        console.log('\n🔧 To test the browser viewer:');
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Navigate to Reports page');
        console.log('3. Click the 🔧 (Debug in Browser) button on any report');
        console.log('4. Use the "New Report" button to generate a fresh report');
        console.log('5. Watch the debug console for real-time chart generation logs');
      } else {
        console.log('\n⚠️ WARNING: No charts found in generated report');
        console.log('The browser viewer will show this issue in the debug console');
      }
      
    } else {
      console.log('❌ Report generation returned empty response');
    }
    
  } catch (error) {
    console.log('❌ Report generation failed:', error.message);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }
  
  console.log('\n🎉 Browser Report Viewer test complete!');
  console.log('\nThe browser viewer provides:');
  console.log('• Real-time chart generation debugging');
  console.log('• Console logs for data flow tracing');
  console.log('• Visual status indicators for each chart');
  console.log('• Error messages for failed chart generation');
  console.log('• Live report generation with debug output');
}

testBrowserReportViewer().catch(console.error);
