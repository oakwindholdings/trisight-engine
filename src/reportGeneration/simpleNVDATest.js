// Simple NVDA test script to validate API integration
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY;
const BASE_URL = '/api/market';

async function testNVDAData() {
  console.log('=== Simple NVDA API Test ===\n');
  
  if (!API_KEY) {
    console.error('❌ API key not found in .env.local');
    return;
  }
  
  console.log('✅ API key found:', API_KEY.substring(0, 8) + '...');
  
  try {
    // Test 1: Quote
    console.log('\n📊 Fetching NVDA quote...');
    const quoteResponse = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol: 'NVDA', apikey: API_KEY }
    });
    console.log('Quote:', {
      symbol: quoteResponse.data.symbol,
      name: quoteResponse.data.name,
      price: quoteResponse.data.close,
      change: quoteResponse.data.change,
      percent_change: quoteResponse.data.percent_change,
      volume: quoteResponse.data.volume
    });
    
    // Test 2: Statistics
    console.log('\n📈 Fetching NVDA statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/statistics`, {
      params: { symbol: 'NVDA', apikey: API_KEY }
    });
    console.log('Statistics:', {
      market_cap: statsResponse.data.statistics?.valuations_metrics?.market_capitalization,
      pe_ratio: statsResponse.data.statistics?.valuations_metrics?.pe_ratio,
      dividend_yield: statsResponse.data.statistics?.valuations_metrics?.dividend_yield
    });
    
    // Test 3: Income Statement
    console.log('\n💰 Fetching NVDA income statement...');
    const incomeResponse = await axios.get(`${BASE_URL}/income_statement`, {
      params: { symbol: 'NVDA', apikey: API_KEY, period: 'annual' }
    });
    if (incomeResponse.data.income_statement && incomeResponse.data.income_statement.length > 0) {
      const latest = incomeResponse.data.income_statement[0];
      console.log('Latest Income Statement:', {
        fiscal_date: latest.fiscal_date,
        revenue: latest.total_revenue,
        net_income: latest.net_income,
        eps: latest.basic_earnings_per_share
      });
    }
    
    // Test 4: Time Series (for charts)
    console.log('\n📉 Fetching NVDA time series...');
    const tsResponse = await axios.get(`${BASE_URL}/time_series`, {
      params: { 
        symbol: 'NVDA', 
        apikey: API_KEY,
        interval: '1day',
        outputsize: 30
      }
    });
    console.log('Time Series:', {
      symbol: tsResponse.data.meta?.symbol,
      interval: tsResponse.data.meta?.interval,
      data_points: tsResponse.data.values?.length || 0,
      latest_date: tsResponse.data.values?.[0]?.datetime,
      latest_close: tsResponse.data.values?.[0]?.close
    });
    
    console.log('\n✅ All API tests passed!');
    
    // Now test report generation with this data
    console.log('\n🚀 Testing report generation...');
    const { ReportGenerator } = require('./core/reportGenerator');
    
    const config = {
      ticker: 'NVDA',
      reportDate: new Date().toISOString().split('T')[0],
      currentDate: new Date().toISOString().split('T')[0],
      reportType: 'technical_analysis',
      outputFormat: 'pdf',
      includeCharts: true,
      debugMode: true,
      apiKey: API_KEY
    };
    
    console.log('Config:', config);
    
    const generator = new ReportGenerator(config);
    const report = await generator.generateReport();
    
    console.log('\n📋 Report Generated:');
    console.log('- Company:', report.companyData?.companyName);
    console.log('- Slides:', report.slides?.length);
    console.log('- Output:', report.outputPath);
    
    if (report.outputPath && fs.existsSync(report.outputPath)) {
      const stats = fs.statSync(report.outputPath);
      console.log('- File Size:', (stats.size / 1024).toFixed(1), 'KB');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run the test
testNVDAData();