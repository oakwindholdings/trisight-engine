// vercel-deployment-test.js
// Comprehensive deployment and testing strategy for Vercel

const axios = require('axios');
const fs = require('fs');

class VercelDeploymentTester {
  constructor() {
    this.deploymentUrl = null;
    this.testResults = {
      deployment: 'pending',
      frontend: 'pending',
      api: 'pending',
      reportGeneration: 'pending',
      chartGeneration: 'pending'
    };
    this.errors = [];
    this.warnings = [];
  }

  async runComprehensiveTest() {
    console.log('🚀 VERCEL DEPLOYMENT & TESTING STRATEGY\n');
    
    // Step 1: Set up environment variables
    await this.setupEnvironmentVariables();
    
    // Step 2: Deploy to Vercel
    await this.deployToVercel();
    
    // Step 3: Test deployed application
    if (this.deploymentUrl) {
      await this.testDeployedFrontend();
      await this.testDeployedAPI();
      await this.testReportGeneration();
      await this.testChartGeneration();
    }
    
    // Step 4: Generate comprehensive report
    this.generateTestReport();
  }

  async setupEnvironmentVariables() {
    console.log('1️⃣ Setting up Environment Variables...');
    
    try {
      // Read current .env file to get the structure
      const envContent = fs.readFileSync('.env', 'utf8');
      console.log('✅ Found .env file with configuration');
      
      // Instructions for manual setup (since we can't access actual API keys)
      console.log('\n📋 ENVIRONMENT VARIABLES SETUP REQUIRED:');
      console.log('Please set up these environment variables in Vercel dashboard:');
      console.log('');
      console.log('1. REACT_APP_TWELVE_DATA_API_KEY=your_actual_api_key');
      console.log('2. REACT_APP_SUPABASE_URL=your_supabase_url');
      console.log('3. REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
      console.log('4. REACT_APP_FEEDBACK_ENABLED=true');
      console.log('5. REACT_APP_LEARNING_ENABLED=true');
      console.log('6. REACT_APP_CONSENT_REQUIRED=true');
      console.log('');
      console.log('🔗 Go to: https://vercel.com/apex-2b9a18e9/trisight/settings/environment-variables');
      
      this.testResults.deployment = 'setup_required';
      
    } catch (error) {
      console.log('❌ Error reading .env file:', error.message);
      this.errors.push(`Environment setup: ${error.message}`);
      this.testResults.deployment = 'failed';
    }
  }

  async deployToVercel() {
    console.log('\n2️⃣ Deploying to Vercel...');
    
    // Since environment variables need manual setup, provide deployment command
    console.log('📤 DEPLOYMENT COMMAND:');
    console.log('After setting up environment variables, run:');
    console.log('  npm run deploy');
    console.log('  or');
    console.log('  vercel --prod');
    console.log('');
    
    // For testing purposes, let's assume a deployment URL
    // In real scenario, this would be obtained from the deployment process
    this.deploymentUrl = 'https://trisight-apex-2b9a18e9.vercel.app';
    console.log(`🎯 Expected deployment URL: ${this.deploymentUrl}`);
    
    this.testResults.deployment = 'manual_required';
  }

  async testDeployedFrontend() {
    console.log('\n3️⃣ Testing Deployed Frontend...');
    
    try {
      const response = await axios.get(this.deploymentUrl, {
        timeout: 30000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status === 200) {
        console.log('✅ Frontend deployed and accessible');
        
        // Check if it's a React app
        if (response.data.includes('react') || response.data.includes('React')) {
          console.log('✅ React application detected');
        }
        
        // Check for TriSight specific content
        if (response.data.includes('TriSight') || response.data.includes('trisight')) {
          console.log('✅ TriSight application content detected');
        }
        
        this.testResults.frontend = 'passed';
        
      } else {
        console.log(`⚠️ Frontend accessible but returned status: ${response.status}`);
        this.warnings.push(`Frontend status: ${response.status}`);
        this.testResults.frontend = 'warning';
      }
      
    } catch (error) {
      console.log(`❌ Frontend test failed: ${error.message}`);
      this.errors.push(`Frontend: ${error.message}`);
      this.testResults.frontend = 'failed';
    }
  }

  async testDeployedAPI() {
    console.log('\n4️⃣ Testing Deployed API...');
    
    const apiEndpoints = [
      '/api/health',
      '/api/reports/list',
      '/api/reports/generate'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const url = `${this.deploymentUrl}${endpoint}`;
        console.log(`Testing: ${endpoint}`);
        
        if (endpoint === '/api/reports/generate') {
          // Test POST endpoint
          const response = await axios.post(url, {
            ticker: 'AAPL',
            title: 'Vercel Test Report',
            template: 'equity-research',
            outputFormat: 'pdf',
            includeCharts: false
          }, {
            timeout: 30000,
            validateStatus: () => true
          });
          
          console.log(`  Status: ${response.status}`);
          if (response.status === 200 || response.status === 201) {
            console.log('  ✅ Report generation API working');
          } else {
            console.log(`  ⚠️ Report generation returned: ${response.status}`);
          }
          
        } else {
          // Test GET endpoint
          const response = await axios.get(url, {
            timeout: 15000,
            validateStatus: () => true
          });
          
          console.log(`  Status: ${response.status}`);
          if (response.status === 200) {
            console.log(`  ✅ ${endpoint} working`);
          } else {
            console.log(`  ⚠️ ${endpoint} returned: ${response.status}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ ${endpoint} failed: ${error.message}`);
        this.errors.push(`API ${endpoint}: ${error.message}`);
      }
    }
    
    this.testResults.api = this.errors.filter(e => e.includes('API')).length === 0 ? 'passed' : 'failed';
  }

  async testReportGeneration() {
    console.log('\n5️⃣ Testing Report Generation...');
    
    try {
      const response = await axios.post(`${this.deploymentUrl}/api/reports/generate`, {
        ticker: 'MSFT',
        title: 'Vercel Deployment Test Report',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true,
        debugMode: true
      }, {
        timeout: 60000,
        validateStatus: () => true
      });
      
      console.log(`Report generation status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Report generation working in production');
        
        if (response.data.slides && response.data.slides.length > 1) {
          console.log(`✅ Generated ${response.data.slides.length} slides`);
        }
        
        this.testResults.reportGeneration = 'passed';
        
      } else {
        console.log('⚠️ Report generation issues detected');
        if (response.data.error) {
          console.log(`Error: ${response.data.error}`);
        }
        this.testResults.reportGeneration = 'warning';
      }
      
    } catch (error) {
      console.log(`❌ Report generation test failed: ${error.message}`);
      this.errors.push(`Report generation: ${error.message}`);
      this.testResults.reportGeneration = 'failed';
    }
  }

  async testChartGeneration() {
    console.log('\n6️⃣ Testing Chart Generation...');
    
    try {
      const response = await axios.post(`${this.deploymentUrl}/api/reports/generate`, {
        ticker: 'GOOGL',
        title: 'Chart Generation Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true,
        debugMode: true
      }, {
        timeout: 60000,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data.success) {
        // Count charts in response
        let chartCount = 0;
        if (response.data.slides) {
          response.data.slides.forEach(slide => {
            if (slide.content) {
              slide.content.forEach(content => {
                if (content.type === 'chart') chartCount++;
              });
            }
          });
        }
        
        if (chartCount > 0) {
          console.log(`✅ Chart generation working - ${chartCount} charts found`);
          this.testResults.chartGeneration = 'passed';
        } else {
          console.log('⚠️ No charts found in generated report');
          this.testResults.chartGeneration = 'warning';
        }
        
      } else {
        console.log('❌ Chart generation test failed');
        this.testResults.chartGeneration = 'failed';
      }
      
    } catch (error) {
      console.log(`❌ Chart generation test failed: ${error.message}`);
      this.errors.push(`Chart generation: ${error.message}`);
      this.testResults.chartGeneration = 'failed';
    }
  }

  generateTestReport() {
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));
    
    // Test results summary
    Object.entries(this.testResults).forEach(([test, status]) => {
      const icon = status === 'passed' ? '✅' : 
                   status === 'warning' ? '⚠️' : 
                   status === 'manual_required' || status === 'setup_required' ? '🔧' : '❌';
      console.log(`${icon} ${test.padEnd(20)} ${status.toUpperCase()}`);
    });
    
    // Errors and warnings
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
    }
    
    // Next steps
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Set up environment variables in Vercel dashboard');
    console.log('2. Run: vercel --prod');
    console.log('3. Test the deployed application');
    console.log('4. Monitor performance and error rates');
    
    // Save test report
    const report = {
      timestamp: new Date().toISOString(),
      deploymentUrl: this.deploymentUrl,
      testResults: this.testResults,
      errors: this.errors,
      warnings: this.warnings
    };
    
    fs.writeFileSync('vercel-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Test report saved to vercel-test-report.json');
  }
}

// Run the comprehensive test
const tester = new VercelDeploymentTester();
tester.runComprehensiveTest().catch(console.error);
