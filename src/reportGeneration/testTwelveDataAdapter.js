// Test TwelveData adapter directly
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function testAdapter() {
  console.log('=== TwelveData Adapter Test ===\n');
  
  try {
    // Import adapter
    const { TwelveDataAdapter } = await import('./adapters/twelveDataAdapter.js');
    
    // Create adapter instance
    const adapter = new TwelveDataAdapter({
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY,
      tier: 'ultra',
      rateLimit: 75,
      timeout: 30000
    });
    
    console.log('✅ Adapter created');
    
    // Test fetching data
    console.log('\n📊 Fetching NVDA data...');
    
    // Test 1: Company Overview
    console.log('\n1. Getting company overview...');
    const overview = await adapter.getCompanyOverview('NVDA');
    console.log('Company Overview:', {
      name: overview.name,
      description: overview.description?.substring(0, 100) + '...',
      sector: overview.sector,
      industry: overview.industry
    });
    
    // Test 2: Fundamentals
    console.log('\n2. Getting fundamentals...');
    const fundamentals = await adapter.getFundamentals('NVDA');
    console.log('Fundamentals:', {
      hasIncomeStatement: !!fundamentals.incomeStatement,
      hasBalanceSheet: !!fundamentals.balanceSheet,
      hasCashFlow: !!fundamentals.cashFlow,
      hasKeyMetrics: !!fundamentals.keyMetrics
    });
    
    // Test 3: Historical Prices
    console.log('\n3. Getting historical prices...');
    const prices = await adapter.getHistoricalPrices('NVDA', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
    console.log('Historical Prices:', {
      count: prices.length,
      firstDate: prices[0]?.date,
      lastDate: prices[prices.length - 1]?.date,
      latestClose: prices[prices.length - 1]?.close
    });
    
    // Test 4: Real-time Quote
    console.log('\n4. Getting real-time quote...');
    const quote = await adapter.getRealTimeQuote('NVDA');
    console.log('Real-time Quote:', quote);
    
    // Test 5: Technical Indicators
    console.log('\n5. Getting technical indicators...');
    const technicals = await adapter.getTechnicalIndicators('NVDA');
    console.log('Technical Indicators:', {
      sma20: technicals.sma20,
      sma50: technicals.sma50,
      rsi: technicals.rsi,
      hasMACD: !!technicals.macd
    });
    
    console.log('\n✅ All adapter tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAdapter();