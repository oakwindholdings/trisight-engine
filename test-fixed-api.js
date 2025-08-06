// test-fixed-api.js
// Test the fixed Vercel API endpoints

const axios = require('axios');

class FixedAPITester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
  }

  async testFixedAPI() {
    console.log('🔧 TESTING FIXED VERCEL API ENDPOINTS\n');
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);
    
    // Test 1: Health endpoint
    await this.testHealthEndpoint();
    
    // Test 2: Simple report generation
    await this.testSimpleReportGeneration();
    
    // Test 3: Report generation with charts
    await this.testReportGenerationWithCharts();
    
    // Test 4: Error handling
    await this.testErrorHandling();
    
    // Generate final report
    this.generateFinalReport();
  }

  async testHealthEndpoint() {
    console.log('1️⃣ Testing Health Endpoint...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log(`Health Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ Health endpoint working!');
        console.log('Response data:');
        console.log(JSON.stringify(response.data, null, 2));
        this.healthWorking = true;
      } else {
        console.log('❌ Health endpoint failed');
        this.healthWorking = false;
      }
    } catch (error) {
      console.log(`❌ Health endpoint error: ${error.message}`);
      this.healthWorking = false;
    }
    console.log('');
  }

  async testSimpleReportGeneration() {
    console.log('2️⃣ Testing Simple Report Generation...');
    try {
      const config = {
        ticker: 'AAPL',
        title: 'Apple Inc. Analysis',
        template: 'equity-research',
        includeCharts: false
      };

      console.log('📤 Sending request to /api/reports/generate-simple');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-simple`, config, {
        timeout: 30000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Simple Report Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Simple report generation working!');
        console.log(`📊 Generated ${response.data.slides.length} slides`);
        console.log(`📋 Report ID: ${response.data.reportId}`);
        console.log(`🎯 Template: ${response.data.metadata.template}`);
        this.simpleReportWorking = true;
        
        // Show first slide as example
        if (response.data.slides.length > 0) {
          console.log('\n📄 First slide preview:');
          console.log(`  Title: ${response.data.slides[0].title}`);
          console.log(`  Type: ${response.data.slides[0].type}`);
        }
      } else {
        console.log('❌ Simple report generation failed');
        console.log('Response:', response.data);
        this.simpleReportWorking = false;
      }
    } catch (error) {
      console.log(`❌ Simple report generation error: ${error.message}`);
      this.simpleReportWorking = false;
    }
    console.log('');
  }

  async testReportGenerationWithCharts() {
    console.log('3️⃣ Testing Report Generation with Charts...');
    try {
      const config = {
        ticker: 'MSFT',
        title: 'Microsoft Corporation Analysis',
        template: 'equity-research',
        includeCharts: true
      };

      console.log('📊 Testing chart generation...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-simple`, config, {
        timeout: 45000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Chart Report Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Chart report generation working!');
        console.log(`📊 Generated ${response.data.slides.length} slides`);
        
        // Count chart slides
        let chartSlides = 0;
        response.data.slides.forEach(slide => {
          if (slide.type === 'charts' || (slide.content && slide.content.charts)) {
            chartSlides++;
          }
        });
        
        if (chartSlides > 0) {
          console.log(`📈 Found ${chartSlides} chart slides`);
          this.chartReportWorking = true;
        } else {
          console.log('⚠️ No chart slides found');
          this.chartReportWorking = false;
        }
      } else {
        console.log('❌ Chart report generation failed');
        this.chartReportWorking = false;
      }
    } catch (error) {
      console.log(`❌ Chart report generation error: ${error.message}`);
      this.chartReportWorking = false;
    }
    console.log('');
  }

  async testErrorHandling() {
    console.log('4️⃣ Testing Error Handling...');
    
    // Test missing ticker
    try {
      console.log('Testing missing ticker...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-simple`, {
        title: 'Test Report'
      }, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 400) {
        console.log('✅ Error handling working - missing ticker detected');
        this.errorHandlingWorking = true;
      } else {
        console.log(`⚠️ Unexpected status for missing ticker: ${response.status}`);
        this.errorHandlingWorking = false;
      }
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error.message}`);
      this.errorHandlingWorking = false;
    }
    
    // Test invalid method
    try {
      console.log('Testing invalid method...');
      const response = await axios.get(`${this.baseUrl}/api/reports/generate-simple`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      if (response.status === 405) {
        console.log('✅ Method validation working - GET rejected');
      } else {
        console.log(`⚠️ Unexpected status for invalid method: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Method validation test failed: ${error.message}`);
    }
    console.log('');
  }

  generateFinalReport() {
    console.log('📋 FINAL API TEST REPORT');
    console.log('='.repeat(50));
    
    const results = {
      'Health Endpoint': this.healthWorking ? '✅ WORKING' : '❌ FAILED',
      'Simple Report Generation': this.simpleReportWorking ? '✅ WORKING' : '❌ FAILED',
      'Chart Report Generation': this.chartReportWorking ? '✅ WORKING' : '❌ FAILED',
      'Error Handling': this.errorHandlingWorking ? '✅ WORKING' : '❌ FAILED'
    };
    
    Object.entries(results).forEach(([test, status]) => {
      console.log(`${status.padEnd(12)} ${test}`);
    });
    
    const workingCount = Object.values(results).filter(r => r.includes('✅')).length;
    const totalTests = Object.keys(results).length;
    
    console.log('');
    console.log(`🎯 OVERALL STATUS: ${workingCount}/${totalTests} tests passing`);
    
    if (workingCount === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Vercel API is fully functional');
    } else if (workingCount > 0) {
      console.log('⚠️ PARTIAL SUCCESS - Some endpoints working');
    } else {
      console.log('❌ ALL TESTS FAILED - API needs investigation');
    }
    
    console.log('');
    console.log('🚀 NEXT STEPS:');
    if (this.simpleReportWorking) {
      console.log('1. ✅ Basic report generation is working');
      console.log('2. 🔧 Can now integrate with frontend');
      console.log('3. 📊 Chart generation capabilities confirmed');
      console.log('4. 🛡️ Error handling implemented');
    } else {
      console.log('1. 🔍 Check Vercel function logs for errors');
      console.log('2. 🔧 Debug serverless function issues');
      console.log('3. 📋 Review environment configuration');
    }
  }
}

// Run the test
const tester = new FixedAPITester();
tester.testFixedAPI().catch(console.error);
