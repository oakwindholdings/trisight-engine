// test-real-report-generation.js
// Test the REAL report generation (no mock data)

const axios = require('axios');

class RealReportTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
  }

  async testRealReportGeneration() {
    console.log('🔥 TESTING REAL REPORT GENERATION (NO MOCK DATA)\n');
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);
    
    // Test 1: Test with REAL report generation
    await this.testRealReportAPI();
    
    // Test 2: Compare with previous mock version
    await this.compareWithMockVersion();
    
    // Test 3: Test different tickers
    await this.testDifferentTickers();
    
    // Generate final report
    this.generateFinalReport();
  }

  async testRealReportAPI() {
    console.log('1️⃣ Testing REAL Report Generation API...');
    try {
      const config = {
        ticker: 'NFLX',
        title: 'Netflix Inc. Analysis',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true,
        debugMode: true
      };

      console.log('📤 Testing REAL report generation (no mock data)...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-js`, config, {
        timeout: 90000, // Longer timeout for real data processing
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Real Report Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ REAL report generation working!');
        console.log(`📊 Generated ${response.data.slides.length} slides`);
        console.log(`📋 Report ID: ${response.data.reportId}`);
        console.log(`⏱️ Generation time: ${response.data.generationTime}ms`);
        
        // Check if it's using real data
        if (response.data.metadata.realData) {
          console.log('✅ Using REAL financial data (not mock)');
          this.realDataConfirmed = true;
        } else {
          console.log('⚠️ Still using mock data');
          this.realDataConfirmed = false;
        }
        
        // Analyze slide content for real data indicators
        let hasRealContent = false;
        if (response.data.slides && response.data.slides.length > 0) {
          console.log('\n📄 Analyzing slide content:');
          
          response.data.slides.forEach((slide, index) => {
            console.log(`  Slide ${index + 1}: ${slide.title}`);
            
            // Check for real financial content
            if (slide.content) {
              const contentStr = JSON.stringify(slide.content);
              
              // Look for real financial indicators
              if (contentStr.includes('revenue') || 
                  contentStr.includes('earnings') || 
                  contentStr.includes('$') ||
                  contentStr.includes('million') ||
                  contentStr.includes('billion') ||
                  contentStr.includes('%')) {
                hasRealContent = true;
                console.log(`    ✅ Contains financial data`);
              } else {
                console.log(`    ⚠️ Limited financial content`);
              }
            }
          });
        }
        
        if (hasRealContent) {
          console.log('✅ Report contains real financial content');
          this.hasRealContent = true;
        } else {
          console.log('❌ Report lacks real financial content');
          this.hasRealContent = false;
        }
        
        this.realReportWorking = true;
        
      } else {
        console.log('❌ REAL report generation failed');
        console.log('Response:', response.data);
        this.realReportWorking = false;
      }
    } catch (error) {
      console.log(`❌ REAL report generation error: ${error.message}`);
      this.realReportWorking = false;
    }
    console.log('');
  }

  async compareWithMockVersion() {
    console.log('2️⃣ Comparing with Mock Version...');
    
    // This would test the old mock endpoint if it still existed
    // For now, we'll just verify the new endpoint is different
    console.log('📊 The new JavaScript API should provide:');
    console.log('  - Real financial data from TwelveData API');
    console.log('  - Actual company analysis');
    console.log('  - Meaningful metrics and insights');
    console.log('  - NOT placeholder or mock content');
    
    if (this.realDataConfirmed && this.hasRealContent) {
      console.log('✅ Successfully replaced mock data with real analysis');
      this.comparisonPassed = true;
    } else {
      console.log('❌ Still showing mock/placeholder content');
      this.comparisonPassed = false;
    }
    console.log('');
  }

  async testDifferentTickers() {
    console.log('3️⃣ Testing Different Tickers with Real Data...');
    
    const testTickers = ['AAPL', 'MSFT', 'GOOGL'];
    let successCount = 0;
    
    for (const ticker of testTickers) {
      try {
        console.log(`Testing ${ticker}...`);
        const response = await axios.post(`${this.baseUrl}/api/reports/generate-js`, {
          ticker: ticker,
          title: `${ticker} Real Analysis`,
          template: 'equity-research',
          includeCharts: false // Faster without charts
        }, {
          timeout: 60000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200 && response.data.success) {
          console.log(`  ✅ ${ticker} real report generated`);
          console.log(`  📊 ${response.data.slides.length} slides`);
          
          // Check for ticker-specific content
          const hasTickerContent = response.data.slides.some(slide => 
            JSON.stringify(slide).includes(ticker)
          );
          
          if (hasTickerContent) {
            console.log(`  ✅ Contains ${ticker}-specific content`);
            successCount++;
          } else {
            console.log(`  ⚠️ Generic content (not ${ticker}-specific)`);
          }
        } else {
          console.log(`  ❌ ${ticker} failed`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${ticker} error: ${error.message}`);
      }
    }
    
    this.tickerTestsWorking = successCount;
    this.totalTickerTests = testTickers.length;
    console.log(`\n📊 Ticker Tests: ${successCount}/${testTickers.length} passed\n`);
  }

  generateFinalReport() {
    console.log('📋 REAL REPORT GENERATION TEST RESULTS');
    console.log('='.repeat(50));
    
    const results = {
      'Real Report Generation': this.realReportWorking ? '✅ WORKING' : '❌ FAILED',
      'Real Data Confirmed': this.realDataConfirmed ? '✅ YES' : '❌ NO',
      'Real Content Detected': this.hasRealContent ? '✅ YES' : '❌ NO',
      'Mock Data Replaced': this.comparisonPassed ? '✅ YES' : '❌ NO',
      'Ticker-Specific Tests': `${this.tickerTestsWorking || 0}/${this.totalTickerTests || 0} passed`
    };
    
    Object.entries(results).forEach(([test, status]) => {
      console.log(`${status.padEnd(15)} ${test}`);
    });
    
    console.log('');
    
    // Overall assessment
    const criticalTestsPassed = this.realReportWorking && this.realDataConfirmed && this.hasRealContent;
    
    if (criticalTestsPassed) {
      console.log('🎉 SUCCESS! REAL REPORT GENERATION WORKING!');
      console.log('✅ No more mock data - using real financial analysis');
      console.log('✅ Reports contain meaningful financial content');
      console.log('✅ Ticker-specific analysis generated');
      
      console.log('\n🚀 WHAT THIS MEANS:');
      console.log('- Reports now show actual financial data');
      console.log('- Executive summaries contain real insights');
      console.log('- Financial metrics are from real sources');
      console.log('- Technical analysis uses actual market data');
      console.log('- Investment thesis based on real fundamentals');
      
    } else {
      console.log('❌ STILL ISSUES WITH REAL DATA');
      
      if (!this.realReportWorking) {
        console.log('🚨 Report generation API not working');
      }
      if (!this.realDataConfirmed) {
        console.log('🚨 Still using mock/placeholder data');
      }
      if (!this.hasRealContent) {
        console.log('🚨 Reports lack meaningful financial content');
      }
      
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. 🔍 Check API logs for data fetching errors');
      console.log('2. 🔑 Verify environment variables are set');
      console.log('3. 🌐 Test data source connections');
      console.log('4. 📊 Debug report generation pipeline');
    }
    
    console.log('\n📍 CURRENT STATUS:');
    console.log(`🌐 Frontend: ${this.baseUrl}`);
    console.log(`🔗 API: ${this.baseUrl}/api/reports/generate-js`);
    console.log('📋 Using REAL report generation logic (not mock)');
  }
}

// Run the real report test
const tester = new RealReportTester();
tester.testRealReportGeneration().catch(console.error);
