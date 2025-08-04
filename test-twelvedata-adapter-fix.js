// Test script to verify TwelveDataAdapter fixes
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Mock window and document for browser-based code
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
};
global.document = {};

// Import after setting up globals
const { TwelveDataAdapter } = require('./dist/reportGeneration/adapters/twelveDataAdapter');

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY;

async function testAdapter() {
  console.log('Testing TwelveDataAdapter with API key:', API_KEY ? 'Present' : 'Missing');
  
  const adapter = new TwelveDataAdapter({
    apiKey: API_KEY,
    debugMode: true
  });
  
  try {
    console.log('\n=== Testing Quote ===');
    const quote = await adapter.getQuote('AAPL');
    console.log('Quote P/E:', quote.pe);
    console.log('Quote Market Cap:', quote.market_cap);
    
    console.log('\n=== Testing Fundamentals (including key metrics) ===');
    const fundamentals = await adapter.getFundamentals('AAPL');
    console.log('Key Metrics:', JSON.stringify(fundamentals.keyMetrics, null, 2));
    
    console.log('\n=== Validating Key Metrics ===');
    const metrics = fundamentals.keyMetrics;
    console.log('P/E Ratio:', metrics.peRatio, '(should be ~35-40 for AAPL)');
    console.log('ROE:', metrics.roe, '% (should be ~140-150% for AAPL)');
    console.log('Debt/Equity:', metrics.debtToEquity, '(should be ~1.5-2.0 for AAPL)');
    console.log('Current Ratio:', metrics.currentRatio, '(should be ~0.9-1.0 for AAPL)');
    console.log('Market Cap:', metrics.marketCap / 1e12, 'T (should be ~3T for AAPL)');
    
    // Check for impossible values
    const issues = [];
    if (metrics.peRatio === 0 && metrics.marketCap > 0) issues.push('P/E is 0 for profitable company');
    if (metrics.roe > 200) issues.push('ROE unrealistically high');
    if (metrics.debtToEquity < 0) issues.push('Negative debt/equity ratio');
    
    if (issues.length > 0) {
      console.log('\n⚠️  Data Quality Issues:');
      issues.forEach(issue => console.log('  -', issue));
    } else {
      console.log('\n✅ All metrics appear reasonable!');
    }
    
    console.log('\n=== Testing Financial Statements ===');
    if (fundamentals.incomeStatement && fundamentals.incomeStatement.length > 0) {
      const latestIncome = fundamentals.incomeStatement[0];
      console.log('Latest Income Statement Date:', latestIncome.date);
      console.log('Revenue:', latestIncome.revenue / 1e9, 'B');
      console.log('Net Income:', latestIncome.netIncome / 1e9, 'B');
      console.log('EPS:', latestIncome.eps);
    }
    
    if (fundamentals.balanceSheet && fundamentals.balanceSheet.length > 0) {
      const latestBalance = fundamentals.balanceSheet[0];
      console.log('\nLatest Balance Sheet Date:', latestBalance.date);
      console.log('Total Assets:', latestBalance.totalAssets / 1e9, 'B');
      console.log('Total Equity:', latestBalance.totalEquity / 1e9, 'B');
      console.log('Long Term Debt:', latestBalance.longTermDebt / 1e9, 'B');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// First compile the TypeScript
console.log('Compiling TypeScript...');
const { execSync } = require('child_process');
try {
  execSync('npx webpack --config webpack.reportgen.config.js', { stdio: 'inherit' });
  console.log('Compilation complete!\n');
  
  // Then run the test
  testAdapter();
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}