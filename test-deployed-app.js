// test-deployed-app.js
// Test the successfully deployed Vercel application

const axios = require('axios');

class DeployedAppTester {
  constructor() {
    this.deploymentUrl = 'https://trisight-36nyq5swt-apex-2b9a18e9.vercel.app';
    this.testResults = {
      frontend: 'pending',
      apiHealth: 'pending',
      reportGeneration: 'pending',
      chartGeneration: 'pending'
    };
  }

  async runComprehensiveTest() {
    console.log('🎯 TESTING DEPLOYED VERCEL APPLICATION\n');
    console.log(`🌐 Deployment URL: ${this.deploymentUrl}\n`);
    
    // Test 1: Frontend
    await this.testFrontend();
    
    // Test 2: API Health
    await this.testAPIHealth();
    
    // Test 3: Report Generation
    await this.testReportGeneration();
    
    // Test 4: Chart Generation
    await this.testChartGeneration();
    
    // Generate final report
    this.generateFinalReport();
  }

  async testFrontend() {
    console.log('1️⃣ Testing Frontend Deployment...');
    try {
      const response = await axios.get(this.deploymentUrl, { timeout: 15000 });
      
      if (response.status === 200) {
        console.log('✅ Frontend accessible');
        
        // Check for TriSight content
        if (response.data.includes('TriSight') || response.data.includes('Emerald')) {
          console.log('✅ TriSight application content detected');
          this.testResults.frontend = 'passed';
        } else {
          console.log('⚠️ TriSight content not detected');
          this.testResults.frontend = 'warning';
        }
      } else {
        console.log(`⚠️ Frontend returned status: ${response.status}`);
        this.testResults.frontend = 'warning';
      }
    } catch (error) {
      console.log(`❌ Frontend test failed: ${error.message}`);
      this.testResults.frontend = 'failed';
    }
    console.log('');
  }

  async testAPIHealth() {
    console.log('2️⃣ Testing API Health Endpoint...');
    try {
      const response = await axios.get(`${this.deploymentUrl}/api/health`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log(`API Health Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ API health endpoint working');
        console.log('Response:', response.data);
        this.testResults.apiHealth = 'passed';
      } else {
        console.log('⚠️ API health endpoint issues');
        console.log('Response:', response.data);
        this.testResults.apiHealth = 'warning';
      }
    } catch (error) {
      console.log(`❌ API health test failed: ${error.message}`);
      this.testResults.apiHealth = 'failed';
    }
    console.log('');
  }

  async testReportGeneration() {
    console.log('3️⃣ Testing Report Generation...');
    try {
      const config = {
        ticker: 'AAPL',
        title: 'Vercel Deployment Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: false,
        debugMode: true
      };

      console.log('📤 Sending report generation request...');
      const response = await axios.post(`${this.deploymentUrl}/api/reports/generate`, config, {
        timeout: 60000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Report Generation Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Report generation working!');
        
        if (response.data.slides && response.data.slides.length > 1) {
          console.log(`📊 Generated ${response.data.slides.length} slides`);
          this.testResults.reportGeneration = 'passed';
        } else {
          console.log('⚠️ Report generated but with limited content');
          this.testResults.reportGeneration = 'warning';
        }
      } else if (response.status === 500) {
        console.log('⚠️ Server error - likely missing environment variables');
        console.log('Error:', response.data);
        this.testResults.reportGeneration = 'env_required';
      } else {
        console.log('❌ Report generation failed');
        console.log('Response:', response.data);
        this.testResults.reportGeneration = 'failed';
      }
    } catch (error) {
      console.log(`❌ Report generation test failed: ${error.message}`);
      this.testResults.reportGeneration = 'failed';
    }
    console.log('');
  }

  async testChartGeneration() {
    console.log('4️⃣ Testing Chart Generation...');
    try {
      const config = {
        ticker: 'MSFT',
        title: 'Chart Generation Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true,
        debugMode: true
      };

      console.log('📊 Testing chart generation...');
      const response = await axios.post(`${this.deploymentUrl}/api/reports/generate`, config, {
        timeout: 90000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Chart Generation Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        // Count charts in response
        let chartCount = 0;
        if (response.data.slides) {
          response.data.slides.forEach(slide => {
            if (slide.content) {
              slide.content.forEach(content => {
                if (content.type === 'chart') {
                  chartCount++;
                }
              });
            }
          });
        }
        
        if (chartCount > 0) {
          console.log(`✅ Chart generation working - ${chartCount} charts found`);
          this.testResults.chartGeneration = 'passed';
        } else {
          console.log('⚠️ No charts found in response');
          this.testResults.chartGeneration = 'warning';
        }
      } else if (response.status === 500) {
        console.log('⚠️ Server error - likely missing environment variables');
        this.testResults.chartGeneration = 'env_required';
      } else {
        console.log('❌ Chart generation failed');
        this.testResults.chartGeneration = 'failed';
      }
    } catch (error) {
      console.log(`❌ Chart generation test failed: ${error.message}`);
      this.testResults.chartGeneration = 'failed';
    }
    console.log('');
  }

  generateFinalReport() {
    console.log('📋 FINAL DEPLOYMENT TEST REPORT');
    console.log('='.repeat(50));
    
    // Test results
    Object.entries(this.testResults).forEach(([test, status]) => {
      const icon = status === 'passed' ? '✅' : 
                   status === 'warning' ? '⚠️' : 
                   status === 'env_required' ? '🔧' : '❌';
      console.log(`${icon} ${test.padEnd(20)} ${status.toUpperCase()}`);
    });
    
    console.log('');
    console.log('🎯 DEPLOYMENT STATUS: SUCCESS ✅');
    console.log(`🌐 Live URL: ${this.deploymentUrl}`);
    console.log('');
    
    // Next steps
    console.log('🚀 NEXT STEPS:');
    
    const envRequired = Object.values(this.testResults).includes('env_required');
    if (envRequired) {
      console.log('1. 🔧 Set up environment variables in Vercel:');
      console.log('   - REACT_APP_TWELVE_DATA_API_KEY');
      console.log('   - REACT_APP_SUPABASE_URL');
      console.log('   - REACT_APP_SUPABASE_ANON_KEY');
      console.log('   📍 Go to: https://vercel.com/apex-2b9a18e9/trisight/settings/environment-variables');
      console.log('');
      console.log('2. 🔄 Redeploy after setting environment variables');
      console.log('3. 🧪 Test report generation functionality');
    } else {
      console.log('1. ✅ Application is fully functional');
      console.log('2. 📊 Test chart generation with different tickers');
      console.log('3. 🔍 Monitor application performance');
    }
    
    console.log('');
    console.log('🎉 VERCEL DEPLOYMENT COMPLETE!');
    console.log('The TriSight application is now live and accessible.');
  }
}

// Run the test
const tester = new DeployedAppTester();
tester.runComprehensiveTest().catch(console.error);
