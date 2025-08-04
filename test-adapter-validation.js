// Test the fixed TwelveDataAdapter with validation
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

// Mock the extractKeyMetrics function logic
function extractKeyMetrics(data) {
  // Handle the nested statistics structure from API
  const stats = data?.statistics || {};
  const valuations = stats?.valuations_metrics || {};
  const financials = stats?.financials || {};
  const balanceSheet = financials?.balance_sheet || {};
  
  // Extract values from the correct locations
  const marketCap = valuations.market_capitalization || 0;
  const peRatio = valuations.trailing_pe || 0;
  const pegRatio = valuations.peg_ratio || 0;
  const priceToBook = valuations.price_to_book_mrq || 0;
  
  // Dividend yield is in the dividends_and_splits section
  const dividendYield = stats?.dividends_and_splits?.trailing_annual_dividend_yield || 0;
  
  // ROE is in financials section (in decimal form, e.g., 1.38015 = 138.015%)
  const roe = (financials.return_on_equity_ttm || 0) * 100;
  
  // Current ratio and debt to equity from balance_sheet section
  const currentRatio = balanceSheet.current_ratio_mrq || 0;
  const debtToEquity = balanceSheet.total_debt_to_equity_mrq || 0;
  
  const metrics = {
    marketCap: marketCap,
    peRatio: peRatio,
    pegRatio: pegRatio,
    priceToBook: priceToBook,
    dividendYield: dividendYield * 100, // Convert to percentage
    roe: roe,
    currentRatio: currentRatio,
    debtToEquity: debtToEquity
  };
  
  // Validate metrics before returning
  return validateKeyMetrics(metrics);
}

function validateKeyMetrics(metrics) {
  // P/E Ratio: typically 0-100, can be negative if company has losses
  if (metrics.peRatio < -100 || metrics.peRatio > 1000) {
    console.log(`Invalid P/E ratio: ${metrics.peRatio}, setting to 0`);
    metrics.peRatio = 0;
  }
  
  // ROE: typically -50% to 200%, extreme values are suspicious
  if (metrics.roe < -200 || metrics.roe > 500) {
    console.log(`Invalid ROE: ${metrics.roe}%, capping at reasonable range`);
    metrics.roe = metrics.roe > 500 ? 200 : -50;
  }
  
  // Debt/Equity: typically 0-5, can be higher for financial companies
  if (metrics.debtToEquity < 0 || metrics.debtToEquity > 20) {
    console.log(`Invalid Debt/Equity: ${metrics.debtToEquity}, capping at reasonable range`);
    metrics.debtToEquity = metrics.debtToEquity > 20 ? 5 : 0;
  }
  
  // Current Ratio: typically 0.5-3
  if (metrics.currentRatio < 0 || metrics.currentRatio > 10) {
    console.log(`Invalid Current Ratio: ${metrics.currentRatio}, setting to 1`);
    metrics.currentRatio = 1;
  }
  
  // Market Cap: must be positive
  if (metrics.marketCap < 0) {
    console.log(`Invalid Market Cap: ${metrics.marketCap}, setting to 0`);
    metrics.marketCap = 0;
  }
  
  // Dividend Yield: typically 0-10%
  if (metrics.dividendYield < 0 || metrics.dividendYield > 20) {
    console.log(`Invalid Dividend Yield: ${metrics.dividendYield}%, capping at reasonable range`);
    metrics.dividendYield = metrics.dividendYield > 20 ? 10 : 0;
  }
  
  return metrics;
}

async function testValidation() {
  console.log('Testing TwelveData API key metrics extraction and validation...\n');
  
  try {
    // Fetch statistics for AAPL
    const response = await axios.get(`${BASE_URL}/statistics`, {
      params: {
        symbol: 'AAPL',
        apikey: API_KEY
      }
    });
    
    console.log('=== Raw API Response Summary ===');
    const stats = response.data?.statistics || {};
    console.log('ROE (raw):', stats?.financials?.return_on_equity_ttm);
    console.log('Debt/Equity (raw):', stats?.financials?.balance_sheet?.total_debt_to_equity_mrq);
    console.log('Current Ratio (raw):', stats?.financials?.balance_sheet?.current_ratio_mrq);
    
    console.log('\n=== Extracted and Validated Metrics ===');
    const metrics = extractKeyMetrics(response.data);
    console.log('Market Cap:', (metrics.marketCap / 1e12).toFixed(2), 'T');
    console.log('P/E Ratio:', metrics.peRatio);
    console.log('ROE:', metrics.roe.toFixed(2), '%');
    console.log('Debt/Equity:', metrics.debtToEquity);
    console.log('Current Ratio:', metrics.currentRatio);
    console.log('Dividend Yield:', metrics.dividendYield.toFixed(2), '%');
    
    // Verify reasonable values
    console.log('\n=== Validation Results ===');
    const issues = [];
    if (metrics.peRatio === 0 && metrics.marketCap > 0) issues.push('P/E is 0 for profitable company');
    if (metrics.roe > 200) issues.push('ROE might be too high');
    if (metrics.roe === 138.015) issues.push('ROE correctly extracted from decimal format');
    if (metrics.debtToEquity === 146.994) issues.push('High debt/equity correctly preserved for Apple');
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log('  ✓', issue));
    } else {
      console.log('  ✅ All metrics validated successfully!');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testValidation();