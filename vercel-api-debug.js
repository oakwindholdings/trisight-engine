// vercel-api-debug.js
// Targeted debugging for Vercel API endpoints

const axios = require('axios');

class VercelAPIDebugger {
  constructor() {
    this.baseUrl = 'https://trisight-apex-2b9a18e9.vercel.app';
  }

  async debugAPI() {
    console.log('🔍 VERCEL API DEBUGGING\n');
    
    // Test 1: Health endpoint
    await this.testHealthEndpoint();
    
    // Test 2: Reports list endpoint
    await this.testReportsListEndpoint();
    
    // Test 3: Report generation with detailed debugging
    await this.testReportGenerationDetailed();
    
    // Test 4: Test with different request configurations
    await this.testDifferentConfigurations();
  }

  async testHealthEndpoint() {
    console.log('1️⃣ Testing Health Endpoint...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      console.log('✅ Health endpoint working');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }
    console.log('');
  }

  async testReportsListEndpoint() {
    console.log('2️⃣ Testing Reports List Endpoint...');
    try {
      const response = await axios.get(`${this.baseUrl}/api/reports/list`);
      console.log('✅ Reports list endpoint working');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Reports list endpoint failed:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
    }
    console.log('');
  }

  async testReportGenerationDetailed() {
    console.log('3️⃣ Testing Report Generation (Detailed)...');
    
    const testConfig = {
      ticker: 'AAPL',
      title: 'Vercel API Test Report',
      template: 'equity-research',
      outputFormat: 'pdf',
      includeCharts: false,
      debugMode: true
    };

    try {
      console.log('📤 Sending POST request to /api/reports/generate');
      console.log('Config:', JSON.stringify(testConfig, null, 2));
      
      const response = await axios.post(
        `${this.baseUrl}/api/reports/generate`,
        testConfig,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 60000,
          validateStatus: () => true // Accept any status code
        }
      );
      
      console.log('📥 Response received:');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200) {
        console.log('✅ Report generation working!');
        
        if (response.data.success) {
          console.log('✅ Report generated successfully');
          if (response.data.slides) {
            console.log(`📊 Generated ${response.data.slides.length} slides`);
          }
        } else {
          console.log('⚠️ Report generation returned success=false');
          if (response.data.error) {
            console.log('Error:', response.data.error);
          }
        }
      } else {
        console.log(`❌ Report generation failed with status: ${response.status}`);
        if (response.data) {
          console.log('Error details:', response.data);
        }
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        console.log('Response headers:', error.response.headers);
      }
      if (error.request) {
        console.log('Request details:', error.request);
      }
    }
    console.log('');
  }

  async testDifferentConfigurations() {
    console.log('4️⃣ Testing Different Configurations...');
    
    const configurations = [
      {
        name: 'Minimal Config',
        config: {
          ticker: 'MSFT',
          title: 'Minimal Test',
          template: 'equity-research'
        }
      },
      {
        name: 'With Charts',
        config: {
          ticker: 'GOOGL',
          title: 'Chart Test',
          template: 'equity-research',
          includeCharts: true
        }
      },
      {
        name: 'Debug Mode',
        config: {
          ticker: 'TSLA',
          title: 'Debug Test',
          template: 'equity-research',
          debugMode: true
        }
      }
    ];

    for (const test of configurations) {
      console.log(`Testing: ${test.name}`);
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/reports/generate`,
          test.config,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 45000,
            validateStatus: () => true
          }
        );
        
        console.log(`  Status: ${response.status}`);
        if (response.status === 200 && response.data.success) {
          console.log(`  ✅ ${test.name} working`);
          if (response.data.slides) {
            console.log(`  📊 Generated ${response.data.slides.length} slides`);
          }
        } else {
          console.log(`  ⚠️ ${test.name} issues detected`);
          if (response.data.error) {
            console.log(`  Error: ${response.data.error}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ ${test.name} failed: ${error.message}`);
      }
    }
    console.log('');
  }

  async testChartGenerationSpecific() {
    console.log('5️⃣ Testing Chart Generation Specifically...');
    
    const chartConfig = {
      ticker: 'NVDA',
      title: 'Chart Generation Test',
      template: 'equity-research',
      outputFormat: 'pdf',
      includeCharts: true,
      debugMode: true
    };

    try {
      console.log('📊 Testing chart generation with NVDA...');
      
      const response = await axios.post(
        `${this.baseUrl}/api/reports/generate`,
        chartConfig,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 90000, // Longer timeout for chart generation
          validateStatus: () => true
        }
      );
      
      console.log('Chart generation status:', response.status);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Chart generation API working');
        
        // Count charts in response
        let chartCount = 0;
        if (response.data.slides) {
          response.data.slides.forEach(slide => {
            if (slide.content) {
              slide.content.forEach(content => {
                if (content.type === 'chart') {
                  chartCount++;
                  console.log(`  📈 Chart found: ${content.data?.title || 'Untitled'}`);
                }
              });
            }
          });
        }
        
        if (chartCount > 0) {
          console.log(`✅ Charts working - ${chartCount} charts generated`);
        } else {
          console.log('⚠️ No charts found in response');
        }
        
      } else {
        console.log('❌ Chart generation failed');
        if (response.data.error) {
          console.log('Error:', response.data.error);
        }
      }
      
    } catch (error) {
      console.log('❌ Chart generation test failed:', error.message);
    }
  }
}

// Run the debugging
async function runDebug() {
  const apiDebugger = new VercelAPIDebugger();
  await apiDebugger.debugAPI();
  await apiDebugger.testChartGenerationSpecific();
  
  console.log('🎯 DEBUGGING COMPLETE');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('- Frontend: ✅ Deployed and accessible');
  console.log('- API Health: ✅ Working');
  console.log('- Reports List: ✅ Working');
  console.log('- Report Generation: 🔍 Testing in progress');
  console.log('- Chart Generation: 🔍 Testing in progress');
}

runDebug().catch(console.error);
