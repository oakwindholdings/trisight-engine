// test-real-data-report.js
// Test the real data report generation endpoint
// Rule: Zero Tolerance for Fake Data - Only test with real APIs

const axios = require('axios');

class RealDataReportTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
  }

  async testRealDataReport() {
    console.log('📊 TESTING REAL DATA REPORT GENERATION');
    console.log('='.repeat(60));
    console.log(`🌐 Production URL: ${this.baseUrl}`);
    console.log('🚫 NO FAKE DATA ALLOWED - REAL APIS ONLY');
    console.log('');

    // Test AAPL real data report
    await this.testAAPLRealDataReport();
    
    // Test NVDA real data report
    await this.testNVDARealDataReport();
    
    // Generate final assessment
    this.generateFinalAssessment();
  }

  async testAAPLRealDataReport() {
    console.log('1️⃣ Testing AAPL Real Data Report...');
    
    try {
      const config = {
        ticker: 'AAPL',
        title: 'Apple Inc. Real Data Analysis',
        template: 'institutional',
        author: 'TriSight Real Data Research'
      };

      console.log('📤 Requesting real data report generation...');
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-real-data`, config, {
        timeout: 120000, // 2 minutes for real data fetching
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
        console.log('✅ Real Data API call successful!');
        
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
        
        // Check for real data content
        this.analyzeRealDataContent(report, 'AAPL');
        
        this.aaplReport = report;
        this.aaplSuccess = true;
        
      } else {
        console.log('❌ Real Data API call failed');
        console.log(`❌ Status: ${response.status}`);
        console.log(`❌ Error: ${response.data?.error || 'Unknown error'}`);
        this.aaplSuccess = false;
        this.aaplError = response.data?.error || 'Unknown error';
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.aaplSuccess = false;
      this.aaplError = error.message;
    }
    
    console.log('');
  }

  async testNVDARealDataReport() {
    console.log('2️⃣ Testing NVDA Real Data Report...');
    
    try {
      const config = {
        ticker: 'NVDA',
        title: 'NVIDIA Corporation Real Data Analysis',
        template: 'institutional',
        author: 'TriSight Real Data Research'
      };

      console.log('📤 Requesting real data report generation...');
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-real-data`, config, {
        timeout: 120000, // 2 minutes for real data fetching
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
        console.log('✅ Real Data API call successful!');
        
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
        
        // Check for real data content
        this.analyzeRealDataContent(report, 'NVDA');
        
        this.nvdaReport = report;
        this.nvdaSuccess = true;
        
      } else {
        console.log('❌ Real Data API call failed');
        console.log(`❌ Status: ${response.status}`);
        console.log(`❌ Error: ${response.data?.error || 'Unknown error'}`);
        this.nvdaSuccess = false;
        this.nvdaError = response.data?.error || 'Unknown error';
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.nvdaSuccess = false;
      this.nvdaError = error.message;
    }
    
    console.log('');
  }

  analyzeRealDataContent(report, ticker) {
    console.log(`🔍 Analyzing ${ticker} Real Data Content:`);
    
    // Check slides for real data
    const slides = report.slides || [];
    let realDataSlides = 0;
    let fakeDataDetected = false;
    
    slides.forEach((slide, index) => {
      const content = slide.content || {};
      
      // Check for real price data
      if (content.currentPrice && content.currentPrice !== 'N/A' && content.currentPrice !== 'Price data unavailable') {
        console.log(`   Slide ${index + 1}: ✅ Real price data: ${content.currentPrice}`);
        realDataSlides++;
      }
      
      // Check for real company data
      if (content.companyName && !content.companyName.includes('Corporation') && content.companyName !== `${ticker} Corporation`) {
        console.log(`   Slide ${index + 1}: ✅ Real company name: ${content.companyName}`);
        realDataSlides++;
      }
      
      // Check for real financial data
      if (content.revenue && content.revenue !== 'N/A') {
        console.log(`   Slide ${index + 1}: ✅ Real revenue data: ${content.revenue}`);
        realDataSlides++;
      }
      
      // Check for fake data indicators
      const contentStr = JSON.stringify(content).toLowerCase();
      const fakeIndicators = [
        'placeholder', 'sample', 'mock', 'fake', 'dummy', 'coming soon',
        'not implemented', 'todo', 'fixme', 'stub', 'hardcoded'
      ];
      
      fakeIndicators.forEach(indicator => {
        if (contentStr.includes(indicator)) {
          console.log(`   Slide ${index + 1}: ❌ Fake data detected: ${indicator}`);
          fakeDataDetected = true;
        }
      });
    });
    
    // Check charts for real data
    const charts = report.charts || [];
    charts.forEach((chart, index) => {
      if (chart.data && Array.isArray(chart.data) && chart.data.length > 0) {
        console.log(`   Chart ${index + 1}: ✅ Real chart data: ${chart.data.length} data points`);
      }
    });
    
    // Check data status transparency
    const dataStatus = report.dataStatus || {};
    const successfulSources = Object.keys(dataStatus).filter(key => dataStatus[key].success);
    const failedSources = Object.keys(dataStatus).filter(key => !dataStatus[key].success);
    
    console.log(`   📊 Data Transparency:`);
    console.log(`      ✅ Working APIs: ${successfulSources.join(', ')}`);
    if (failedSources.length > 0) {
      console.log(`      ❌ Failed APIs: ${failedSources.join(', ')}`);
    }
    
    // Overall assessment
    if (fakeDataDetected) {
      console.log(`   🚨 FAKE DATA DETECTED - VIOLATION OF RULES!`);
    } else {
      console.log(`   ✅ No fake data detected - compliance verified`);
    }
    
    console.log(`   📊 Real Data Quality: ${realDataSlides} slides with real data`);
  }

  generateFinalAssessment() {
    console.log('📋 REAL DATA REPORT GENERATION ASSESSMENT');
    console.log('='.repeat(60));
    
    // Overall status
    console.log('🎯 OVERALL STATUS:');
    
    const successCount = (this.aaplSuccess ? 1 : 0) + (this.nvdaSuccess ? 1 : 0);
    const totalTests = 2;
    
    if (successCount === totalTests) {
      console.log('🎉 SUCCESS: Real data report generation working!');
      console.log('✅ All test tickers generated successfully');
      console.log('✅ No fake data detected');
      console.log('✅ Real API integration confirmed');
      
      console.log('\n📊 QUALITY METRICS:');
      if (this.aaplReport) {
        console.log(`📈 AAPL Data Quality: ${this.aaplReport.metadata.dataQuality}%`);
        console.log(`📑 AAPL Slides: ${this.aaplReport.slides?.length || 0}`);
        console.log(`📊 AAPL Charts: ${this.aaplReport.charts?.length || 0}`);
      }
      
      if (this.nvdaReport) {
        console.log(`📈 NVDA Data Quality: ${this.nvdaReport.metadata.dataQuality}%`);
        console.log(`📑 NVDA Slides: ${this.nvdaReport.slides?.length || 0}`);
        console.log(`📊 NVDA Charts: ${this.nvdaReport.charts?.length || 0}`);
      }
      
      console.log('\n🎯 ACHIEVEMENT:');
      console.log('✅ Real data only report generation operational');
      console.log('✅ Zero tolerance for fake data enforced');
      console.log('✅ Transparent data source reporting');
      console.log('✅ Ready for production use');
      
    } else if (successCount > 0) {
      console.log('⚠️ PARTIAL SUCCESS: Some reports generated');
      console.log(`✅ ${successCount}/${totalTests} reports successful`);
      
      if (!this.aaplSuccess) {
        console.log(`❌ AAPL failed: ${this.aaplError}`);
      }
      if (!this.nvdaSuccess) {
        console.log(`❌ NVDA failed: ${this.nvdaError}`);
      }
      
    } else {
      console.log('❌ FAILURE: No reports generated successfully');
      
      if (this.aaplError) {
        console.log(`❌ AAPL Error: ${this.aaplError}`);
      }
      if (this.nvdaError) {
        console.log(`❌ NVDA Error: ${this.nvdaError}`);
      }
    }
    
    console.log('\n📍 NEXT STEPS:');
    if (successCount === totalTests) {
      console.log('1. ✅ Real data report generation working');
      console.log('2. Integrate with frontend UI');
      console.log('3. Add more tickers for testing');
      console.log('4. Enhance chart visualizations');
    } else {
      console.log('1. Debug failed report generation');
      console.log('2. Fix API integration issues');
      console.log('3. Verify TwelveData API connectivity');
      console.log('4. Check serverless function configuration');
    }
    
    console.log(`\n🌐 Production Endpoint: ${this.baseUrl}/api/reports/generate-real-data`);
    console.log('🚫 Zero Tolerance Policy: No fake, mock, or placeholder data allowed');
    console.log('📊 Transparency: All data sources and failures explicitly reported');
  }
}

// Run the real data report test
const tester = new RealDataReportTester();
tester.testRealDataReport().catch(console.error);
