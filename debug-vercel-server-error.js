// debug-vercel-server-error.js
// Systematic debugging of Vercel server errors

const axios = require('axios');

class VercelServerErrorDebugger {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
    this.errors = [];
    this.findings = [];
  }

  async debugServerError() {
    console.log('🔍 DEBUGGING VERCEL SERVER ERROR\n');
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);
    
    // Step 1: Test basic connectivity
    await this.testBasicConnectivity();
    
    // Step 2: Test API endpoints individually
    await this.testAPIEndpoints();
    
    // Step 3: Test report generation with detailed error capture
    await this.testReportGenerationDetailed();
    
    // Step 4: Test with minimal configuration
    await this.testMinimalConfiguration();
    
    // Step 5: Generate diagnostic report
    this.generateDiagnosticReport();
  }

  async testBasicConnectivity() {
    console.log('1️⃣ Testing Basic Connectivity...');
    try {
      const response = await axios.get(this.baseUrl, { timeout: 15000 });
      if (response.status === 200) {
        console.log('✅ Frontend accessible');
        this.findings.push('Frontend: Accessible');
      }
    } catch (error) {
      console.log(`❌ Frontend connectivity failed: ${error.message}`);
      this.errors.push(`Frontend: ${error.message}`);
    }
    console.log('');
  }

  async testAPIEndpoints() {
    console.log('2️⃣ Testing API Endpoints...');
    
    const endpoints = [
      { path: '/api/health', method: 'GET' },
      { path: '/api/reports/list', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.method} ${endpoint.path}`);
        
        const response = await axios({
          method: endpoint.method,
          url: `${this.baseUrl}${endpoint.path}`,
          timeout: 15000,
          validateStatus: () => true
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`  ✅ ${endpoint.path} working`);
          this.findings.push(`${endpoint.path}: Working`);
        } else if (response.status >= 500) {
          console.log(`  ❌ ${endpoint.path} server error`);
          this.errors.push(`${endpoint.path}: Server error ${response.status}`);
          
          // Try to extract error details
          if (response.data && typeof response.data === 'string') {
            const errorMatch = response.data.match(/Error: ([^<\n]+)/);
            if (errorMatch) {
              console.log(`  Error details: ${errorMatch[1]}`);
              this.errors.push(`${endpoint.path} details: ${errorMatch[1]}`);
            }
          }
        } else {
          console.log(`  ⚠️ ${endpoint.path} returned ${response.status}`);
          this.findings.push(`${endpoint.path}: Status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${endpoint.path} failed: ${error.message}`);
        this.errors.push(`${endpoint.path}: ${error.message}`);
      }
    }
    console.log('');
  }

  async testReportGenerationDetailed() {
    console.log('3️⃣ Testing Report Generation (Detailed Error Capture)...');
    
    const testConfigs = [
      {
        name: 'Minimal Config',
        config: {
          ticker: 'AAPL',
          title: 'Server Error Debug Test',
          template: 'equity-research'
        }
      },
      {
        name: 'No Charts Config',
        config: {
          ticker: 'AAPL',
          title: 'No Charts Test',
          template: 'equity-research',
          includeCharts: false
        }
      },
      {
        name: 'Debug Mode Config',
        config: {
          ticker: 'AAPL',
          title: 'Debug Mode Test',
          template: 'equity-research',
          debugMode: true,
          includeCharts: false
        }
      }
    ];

    for (const test of testConfigs) {
      console.log(`\nTesting: ${test.name}`);
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/reports/generate`,
          test.config,
          {
            timeout: 60000,
            validateStatus: () => true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 200) {
          if (response.data.success) {
            console.log(`  ✅ ${test.name} successful`);
            this.findings.push(`Report ${test.name}: Success`);
          } else {
            console.log(`  ⚠️ ${test.name} returned success=false`);
            if (response.data.error) {
              console.log(`  Error: ${response.data.error}`);
              this.errors.push(`Report ${test.name}: ${response.data.error}`);
            }
          }
        } else if (response.status >= 500) {
          console.log(`  ❌ ${test.name} server error`);
          
          // Extract detailed error information
          let errorDetails = 'Unknown server error';
          
          if (response.data) {
            if (typeof response.data === 'string') {
              // Try to extract error from HTML response
              const errorMatch = response.data.match(/Error: ([^<\n]+)/);
              if (errorMatch) {
                errorDetails = errorMatch[1];
              } else {
                // Look for other error patterns
                const stackMatch = response.data.match(/at ([^<\n]+)/);
                if (stackMatch) {
                  errorDetails = `Stack trace: ${stackMatch[1]}`;
                }
              }
            } else if (response.data.error) {
              errorDetails = response.data.error;
            }
          }
          
          console.log(`  Error details: ${errorDetails}`);
          this.errors.push(`Report ${test.name}: ${errorDetails}`);
          
        } else {
          console.log(`  ⚠️ ${test.name} returned ${response.status}`);
          this.findings.push(`Report ${test.name}: Status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${test.name} request failed: ${error.message}`);
        this.errors.push(`Report ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async testMinimalConfiguration() {
    console.log('4️⃣ Testing Minimal Configuration...');
    
    // Test with absolute minimal payload
    const minimalConfig = {
      ticker: 'AAPL'
    };

    try {
      console.log('Testing with minimal payload...');
      const response = await axios.post(
        `${this.baseUrl}/api/reports/generate`,
        minimalConfig,
        {
          timeout: 30000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Minimal config status: ${response.status}`);
      
      if (response.status >= 500) {
        console.log('❌ Even minimal configuration fails');
        
        // This suggests a fundamental server-side issue
        if (response.data && typeof response.data === 'string') {
          const errorMatch = response.data.match(/Error: ([^<\n]+)/);
          if (errorMatch) {
            console.log(`Root cause: ${errorMatch[1]}`);
            this.errors.push(`Root cause: ${errorMatch[1]}`);
          }
        }
      } else {
        console.log('✅ Minimal configuration works');
        this.findings.push('Minimal config: Works');
      }
      
    } catch (error) {
      console.log(`❌ Minimal configuration failed: ${error.message}`);
      this.errors.push(`Minimal config: ${error.message}`);
    }
    console.log('');
  }

  generateDiagnosticReport() {
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    
    // Findings
    if (this.findings.length > 0) {
      console.log('\n✅ WORKING COMPONENTS:');
      this.findings.forEach((finding, i) => {
        console.log(`${i + 1}. ${finding}`);
      });
    }
    
    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ IDENTIFIED ISSUES:');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    // Analysis
    console.log('\n🔍 ANALYSIS:');
    
    if (this.errors.some(e => e.includes('server error') || e.includes('500'))) {
      console.log('• Server-side errors detected - likely code or environment issues');
    }
    
    if (this.errors.some(e => e.includes('timeout') || e.includes('ECONNRESET'))) {
      console.log('• Network/timeout issues detected');
    }
    
    if (this.errors.some(e => e.includes('undefined') || e.includes('null'))) {
      console.log('• Null/undefined errors suggest missing dependencies or environment variables');
    }
    
    // Recommendations
    console.log('\n🔧 RECOMMENDED FIXES:');
    
    if (this.errors.length === 0) {
      console.log('1. No critical issues found - application appears functional');
    } else {
      console.log('1. Check Vercel function logs for detailed error traces');
      console.log('2. Verify all environment variables are set correctly');
      console.log('3. Check for missing dependencies in serverless environment');
      console.log('4. Test with simplified report generation logic');
      console.log('5. Implement better error handling and logging');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Access Vercel dashboard to view function logs');
    console.log('2. Check environment variable configuration');
    console.log('3. Test individual components in isolation');
    console.log('4. Implement enhanced error reporting');
  }
}

// Run the debugging
const errorDebugger = new VercelServerErrorDebugger();
errorDebugger.debugServerError().catch(console.error);
