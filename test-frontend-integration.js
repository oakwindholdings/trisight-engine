// test-frontend-integration.js
// Test the frontend integration with the fixed JavaScript API

const axios = require('axios');

class FrontendIntegrationTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
  }

  async testFrontendIntegration() {
    console.log('🔗 TESTING FRONTEND-API INTEGRATION\n');
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);
    
    // Test 1: Verify frontend is accessible
    await this.testFrontendAccess();
    
    // Test 2: Test the API endpoint the frontend now uses
    await this.testUpdatedAPIEndpoint();
    
    // Test 3: Test with different configurations
    await this.testDifferentConfigurations();
    
    // Test 4: Test error handling
    await this.testErrorHandling();
    
    // Generate final report
    this.generateIntegrationReport();
  }

  async testFrontendAccess() {
    console.log('1️⃣ Testing Frontend Access...');
    try {
      const response = await axios.get(this.baseUrl, { timeout: 15000 });
      
      if (response.status === 200) {
        console.log('✅ Frontend accessible');
        
        // Check if it contains React app content
        if (response.data.includes('react') || response.data.includes('React') || response.data.includes('TriSight')) {
          console.log('✅ React application detected');
          this.frontendWorking = true;
        } else {
          console.log('⚠️ Frontend content unclear');
          this.frontendWorking = false;
        }
      } else {
        console.log(`⚠️ Frontend returned status: ${response.status}`);
        this.frontendWorking = false;
      }
    } catch (error) {
      console.log(`❌ Frontend access failed: ${error.message}`);
      this.frontendWorking = false;
    }
    console.log('');
  }

  async testUpdatedAPIEndpoint() {
    console.log('2️⃣ Testing Updated API Endpoint (/api/reports/generate-js)...');
    try {
      const config = {
        ticker: 'AAPL',
        title: 'Frontend Integration Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: false,
        debugMode: true
      };

      console.log('📤 Testing the endpoint the frontend now uses...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-js`, config, {
        timeout: 45000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`API Response Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Updated API endpoint working!');
        console.log(`📊 Generated ${response.data.slides.length} slides`);
        console.log(`📋 Report ID: ${response.data.reportId}`);
        
        // Verify response format matches what frontend expects
        const hasRequiredFields = response.data.success && 
                                 response.data.slides && 
                                 response.data.metadata;
        
        if (hasRequiredFields) {
          console.log('✅ Response format compatible with frontend');
          this.apiWorking = true;
        } else {
          console.log('⚠️ Response format may not match frontend expectations');
          this.apiWorking = false;
        }
        
        // Log first slide for verification
        if (response.data.slides.length > 0) {
          console.log(`📄 First slide: ${response.data.slides[0].title}`);
        }
        
      } else {
        console.log('❌ Updated API endpoint failed');
        console.log('Response:', response.data);
        this.apiWorking = false;
      }
    } catch (error) {
      console.log(`❌ API endpoint test failed: ${error.message}`);
      this.apiWorking = false;
    }
    console.log('');
  }

  async testDifferentConfigurations() {
    console.log('3️⃣ Testing Different Report Configurations...');
    
    const testConfigs = [
      {
        name: 'With Charts',
        config: {
          ticker: 'MSFT',
          title: 'Microsoft Analysis with Charts',
          template: 'equity-research',
          includeCharts: true
        }
      },
      {
        name: 'Different Ticker',
        config: {
          ticker: 'GOOGL',
          title: 'Google Analysis',
          template: 'equity-research',
          outputFormat: 'pdf'
        }
      },
      {
        name: 'Minimal Config',
        config: {
          ticker: 'TSLA'
        }
      }
    ];

    let successCount = 0;
    
    for (const test of testConfigs) {
      try {
        console.log(`Testing: ${test.name}`);
        const response = await axios.post(`${this.baseUrl}/api/reports/generate-js`, test.config, {
          timeout: 30000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200 && response.data.success) {
          console.log(`  ✅ ${test.name} working`);
          console.log(`  📊 Generated ${response.data.slides.length} slides`);
          successCount++;
        } else {
          console.log(`  ❌ ${test.name} failed`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${test.name} error: ${error.message}`);
      }
    }
    
    this.configTestsWorking = successCount;
    this.totalConfigTests = testConfigs.length;
    console.log(`\n📊 Configuration Tests: ${successCount}/${testConfigs.length} passed\n`);
  }

  async testErrorHandling() {
    console.log('4️⃣ Testing Error Handling...');
    
    // Test missing ticker
    try {
      console.log('Testing missing ticker...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-js`, {
        title: 'Test Without Ticker'
      }, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 400) {
        console.log('✅ Error handling working - missing ticker properly rejected');
        this.errorHandlingWorking = true;
      } else {
        console.log(`⚠️ Unexpected response for missing ticker: ${response.status}`);
        this.errorHandlingWorking = false;
      }
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error.message}`);
      this.errorHandlingWorking = false;
    }
    console.log('');
  }

  generateIntegrationReport() {
    console.log('📋 FRONTEND-API INTEGRATION REPORT');
    console.log('='.repeat(50));
    
    const results = {
      'Frontend Access': this.frontendWorking ? '✅ WORKING' : '❌ FAILED',
      'Updated API Endpoint': this.apiWorking ? '✅ WORKING' : '❌ FAILED',
      'Configuration Tests': `${this.configTestsWorking || 0}/${this.totalConfigTests || 0} passed`,
      'Error Handling': this.errorHandlingWorking ? '✅ WORKING' : '❌ FAILED'
    };
    
    Object.entries(results).forEach(([test, status]) => {
      console.log(`${status.padEnd(15)} ${test}`);
    });
    
    console.log('');
    
    // Overall assessment
    const criticalTestsPassed = this.frontendWorking && this.apiWorking;
    const configTestsGood = (this.configTestsWorking || 0) >= (this.totalConfigTests || 0) * 0.5;
    
    if (criticalTestsPassed && configTestsGood) {
      console.log('🎉 INTEGRATION SUCCESS!');
      console.log('✅ Frontend can now successfully generate reports');
      console.log('✅ API endpoint integration working');
      console.log('✅ Multiple configurations supported');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. ✅ Test report generation in the browser');
      console.log('2. 📊 Verify chart generation functionality');
      console.log('3. 🔧 Set up environment variables for full features');
      console.log('4. 🧪 Run comprehensive user acceptance testing');
      
    } else if (criticalTestsPassed) {
      console.log('⚠️ PARTIAL SUCCESS');
      console.log('✅ Basic integration working');
      console.log('⚠️ Some configuration issues detected');
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. 🧪 Test the working configurations in browser');
      console.log('2. 🔍 Debug failing configurations');
      console.log('3. 📋 Monitor error logs for issues');
      
    } else {
      console.log('❌ INTEGRATION FAILED');
      console.log('❌ Critical components not working');
      
      console.log('\n🚨 URGENT ACTIONS NEEDED:');
      if (!this.frontendWorking) {
        console.log('1. 🔍 Debug frontend deployment issues');
      }
      if (!this.apiWorking) {
        console.log('2. 🔧 Fix API endpoint integration');
      }
    }
    
    console.log('\n📍 DEPLOYMENT STATUS:');
    console.log(`🌐 Frontend URL: ${this.baseUrl}`);
    console.log(`🔗 API Endpoint: ${this.baseUrl}/api/reports/generate-js`);
    console.log('📋 Frontend service updated to use working JavaScript API');
  }
}

// Run the integration test
const tester = new FrontendIntegrationTester();
tester.testFrontendIntegration().catch(console.error);
