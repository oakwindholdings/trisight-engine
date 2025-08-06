// test-real-data-apis.js
// Test actual API endpoints to see what real data is available
// Rule: Zero Tolerance for Fake Data - Only report what actually works

const axios = require('axios');

class RealDataTester {
  constructor() {
    this.apiKey = '764fb86962cc46ebbe5e1c89a1761623';
    this.ticker = 'AAPL';
    this.results = {};
  }

  async testAllAPIs() {
    console.log('🔍 TESTING REAL DATA APIS - NO FAKE DATA ALLOWED');
    console.log('='.repeat(60));
    console.log(`Testing ticker: ${this.ticker}`);
    console.log(`API Key: ${this.apiKey.substring(0, 8)}...`);
    console.log('');

    // Test each API endpoint individually
    await this.testQuote();
    await this.testProfile();
    await this.testTimeSeries();
    await this.testIncomeStatement();
    await this.testBalanceSheet();
    await this.testCashFlow();
    await this.testStatistics();
    await this.testRSI();
    await this.testMACD();
    await this.testSMA();

    // Generate final report
    this.generateRealDataReport();
  }

  async testQuote() {
    console.log('1️⃣ Testing Quote API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/quote', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.quote = {
          success: true,
          data: response.data,
          fields: Object.keys(response.data)
        };
        console.log('✅ Quote API: SUCCESS');
        console.log(`   Current Price: $${response.data.close}`);
        console.log(`   Change: ${response.data.change} (${response.data.percent_change}%)`);
        console.log(`   Volume: ${response.data.volume}`);
      } else {
        this.results.quote = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Quote API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.quote = {
        success: false,
        error: error.message
      };
      console.log('❌ Quote API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testProfile() {
    console.log('2️⃣ Testing Profile API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/profile', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.profile = {
          success: true,
          data: response.data,
          fields: Object.keys(response.data)
        };
        console.log('✅ Profile API: SUCCESS');
        console.log(`   Company: ${response.data.name}`);
        console.log(`   Sector: ${response.data.sector}`);
        console.log(`   Industry: ${response.data.industry}`);
        console.log(`   Market Cap: ${response.data.market_capitalization}`);
      } else {
        this.results.profile = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Profile API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.profile = {
        success: false,
        error: error.message
      };
      console.log('❌ Profile API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testTimeSeries() {
    console.log('3️⃣ Testing Time Series API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/time_series', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          outputsize: 5,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.results.timeSeries = {
          success: true,
          data: response.data,
          dataPoints: response.data.values.length
        };
        console.log('✅ Time Series API: SUCCESS');
        console.log(`   Data Points: ${response.data.values.length}`);
        console.log(`   Latest: ${response.data.values[0]?.datetime} - $${response.data.values[0]?.close}`);
      } else {
        this.results.timeSeries = {
          success: false,
          error: response.data?.message || 'No values array returned',
          code: response.data?.code
        };
        console.log('❌ Time Series API: FAILED');
        console.log(`   Error: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.results.timeSeries = {
        success: false,
        error: error.message
      };
      console.log('❌ Time Series API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testIncomeStatement() {
    console.log('4️⃣ Testing Income Statement API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/income_statement', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.incomeStatement = {
          success: true,
          data: response.data,
          hasData: !!response.data.income_statement
        };
        console.log('✅ Income Statement API: SUCCESS');
        if (response.data.income_statement) {
          console.log(`   Has Income Statement Data: Yes`);
        } else {
          console.log(`   Has Income Statement Data: No`);
        }
      } else {
        this.results.incomeStatement = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Income Statement API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.incomeStatement = {
        success: false,
        error: error.message
      };
      console.log('❌ Income Statement API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testBalanceSheet() {
    console.log('5️⃣ Testing Balance Sheet API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/balance_sheet', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.balanceSheet = {
          success: true,
          data: response.data,
          hasData: !!response.data.balance_sheet
        };
        console.log('✅ Balance Sheet API: SUCCESS');
        if (response.data.balance_sheet) {
          console.log(`   Has Balance Sheet Data: Yes`);
        } else {
          console.log(`   Has Balance Sheet Data: No`);
        }
      } else {
        this.results.balanceSheet = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Balance Sheet API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.balanceSheet = {
        success: false,
        error: error.message
      };
      console.log('❌ Balance Sheet API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testCashFlow() {
    console.log('6️⃣ Testing Cash Flow API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/cash_flow', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.cashFlow = {
          success: true,
          data: response.data,
          hasData: !!response.data.cash_flow
        };
        console.log('✅ Cash Flow API: SUCCESS');
        if (response.data.cash_flow) {
          console.log(`   Has Cash Flow Data: Yes`);
        } else {
          console.log(`   Has Cash Flow Data: No`);
        }
      } else {
        this.results.cashFlow = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Cash Flow API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.cashFlow = {
        success: false,
        error: error.message
      };
      console.log('❌ Cash Flow API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testStatistics() {
    console.log('7️⃣ Testing Statistics API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/statistics', {
        params: {
          symbol: this.ticker,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.results.statistics = {
          success: true,
          data: response.data,
          hasStatistics: !!response.data.statistics
        };
        console.log('✅ Statistics API: SUCCESS');
        if (response.data.statistics) {
          console.log(`   Has Statistics Data: Yes`);
        } else {
          console.log(`   Has Statistics Data: No`);
        }
      } else {
        this.results.statistics = {
          success: false,
          error: response.data?.message || 'API returned error code',
          code: response.data?.code
        };
        console.log('❌ Statistics API: FAILED');
        console.log(`   Error: ${response.data?.message}`);
      }
    } catch (error) {
      this.results.statistics = {
        success: false,
        error: error.message
      };
      console.log('❌ Statistics API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testRSI() {
    console.log('8️⃣ Testing RSI API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/rsi', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 14,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.results.rsi = {
          success: true,
          data: response.data,
          dataPoints: response.data.values.length
        };
        console.log('✅ RSI API: SUCCESS');
        console.log(`   Data Points: ${response.data.values.length}`);
        console.log(`   Latest RSI: ${response.data.values[0]?.rsi}`);
      } else {
        this.results.rsi = {
          success: false,
          error: response.data?.message || 'No values array returned',
          code: response.data?.code
        };
        console.log('❌ RSI API: FAILED');
        console.log(`   Error: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.results.rsi = {
        success: false,
        error: error.message
      };
      console.log('❌ RSI API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testMACD() {
    console.log('9️⃣ Testing MACD API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/macd', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.results.macd = {
          success: true,
          data: response.data,
          dataPoints: response.data.values.length
        };
        console.log('✅ MACD API: SUCCESS');
        console.log(`   Data Points: ${response.data.values.length}`);
        console.log(`   Latest MACD: ${response.data.values[0]?.macd}`);
      } else {
        this.results.macd = {
          success: false,
          error: response.data?.message || 'No values array returned',
          code: response.data?.code
        };
        console.log('❌ MACD API: FAILED');
        console.log(`   Error: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.results.macd = {
        success: false,
        error: error.message
      };
      console.log('❌ MACD API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testSMA() {
    console.log('🔟 Testing SMA API...');
    try {
      const response = await axios.get('https://api.twelvedata.com/sma', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 20,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.results.sma = {
          success: true,
          data: response.data,
          dataPoints: response.data.values.length
        };
        console.log('✅ SMA API: SUCCESS');
        console.log(`   Data Points: ${response.data.values.length}`);
        console.log(`   Latest SMA: ${response.data.values[0]?.sma}`);
      } else {
        this.results.sma = {
          success: false,
          error: response.data?.message || 'No values array returned',
          code: response.data?.code
        };
        console.log('❌ SMA API: FAILED');
        console.log(`   Error: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.results.sma = {
        success: false,
        error: error.message
      };
      console.log('❌ SMA API: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  generateRealDataReport() {
    console.log('📊 REAL DATA AVAILABILITY REPORT');
    console.log('='.repeat(60));

    const apis = Object.keys(this.results);
    const successfulAPIs = apis.filter(api => this.results[api].success);
    const failedAPIs = apis.filter(api => !this.results[api].success);

    console.log(`✅ Working APIs: ${successfulAPIs.length}/${apis.length}`);
    console.log(`❌ Failed APIs: ${failedAPIs.length}/${apis.length}`);
    console.log('');

    if (successfulAPIs.length > 0) {
      console.log('✅ AVAILABLE REAL DATA:');
      successfulAPIs.forEach(api => {
        console.log(`   - ${api}: ${this.results[api].success ? 'WORKING' : 'FAILED'}`);
      });
      console.log('');
    }

    if (failedAPIs.length > 0) {
      console.log('❌ UNAVAILABLE DATA (WILL NOT BE FAKED):');
      failedAPIs.forEach(api => {
        console.log(`   - ${api}: ${this.results[api].error}`);
      });
      console.log('');
    }

    console.log('🎯 REPORT GENERATION STRATEGY:');
    console.log('   - Only use data from working APIs');
    console.log('   - Explicitly state when data is unavailable');
    console.log('   - Never generate fake or placeholder data');
    console.log('   - Report actual API failures transparently');
    console.log('');

    console.log('📋 NEXT STEPS:');
    if (successfulAPIs.length >= 3) {
      console.log('   ✅ Sufficient real data available for quality report');
      console.log('   ✅ Can generate institutional-grade analysis');
    } else {
      console.log('   ⚠️ Limited real data available');
      console.log('   ⚠️ Report will clearly state data limitations');
    }
  }
}

// Run the real data test
const tester = new RealDataTester();
tester.testAllAPIs().catch(console.error);
