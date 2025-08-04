// Test TwelveData API directly and validate the data transformation
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

async function validateDataPipeline() {
  console.log('=== TwelveData API Data Pipeline Validation ===\n');
  
  try {
    // 1. Fetch statistics
    console.log('1. Fetching statistics for AAPL...');
    const statsResponse = await axios.get(`${BASE_URL}/statistics`, {
      params: { symbol: 'AAPL', apikey: API_KEY }
    });
    
    const stats = statsResponse.data?.statistics || {};
    const valuations = stats?.valuations_metrics || {};
    const financials = stats?.financials || {};
    const balanceSheet = financials?.balance_sheet || {};
    
    console.log('\n2. Raw Data from API:');
    console.log('   - Market Cap:', valuations.market_capitalization);
    console.log('   - P/E Ratio:', valuations.trailing_pe);
    console.log('   - ROE (raw):', financials.return_on_equity_ttm);
    console.log('   - Debt/Equity:', balanceSheet.total_debt_to_equity_mrq);
    console.log('   - Current Ratio:', balanceSheet.current_ratio_mrq);
    
    // 2. Apply transformations (matching our adapter logic)
    console.log('\n3. After Transformation:');
    const transformedMetrics = {
      marketCap: valuations.market_capitalization || 0,
      peRatio: valuations.trailing_pe || 0,
      roe: (financials.return_on_equity_ttm || 0) * 100, // Convert to percentage
      debtToEquity: balanceSheet.total_debt_to_equity_mrq || 0,
      currentRatio: balanceSheet.current_ratio_mrq || 0
    };
    
    console.log('   - Market Cap:', (transformedMetrics.marketCap / 1e12).toFixed(2), 'T');
    console.log('   - P/E Ratio:', transformedMetrics.peRatio.toFixed(2));
    console.log('   - ROE:', transformedMetrics.roe.toFixed(2), '%');
    console.log('   - Debt/Equity:', transformedMetrics.debtToEquity.toFixed(2));
    console.log('   - Current Ratio:', transformedMetrics.currentRatio.toFixed(2));
    
    // 3. Validate data quality
    console.log('\n4. Data Quality Validation:');
    const validations = [
      { 
        name: 'P/E Ratio', 
        value: transformedMetrics.peRatio, 
        valid: transformedMetrics.peRatio > 0 && transformedMetrics.peRatio < 100,
        expected: '10-40 for AAPL'
      },
      { 
        name: 'ROE', 
        value: transformedMetrics.roe, 
        valid: transformedMetrics.roe > 50 && transformedMetrics.roe < 200,
        expected: '100-150% for AAPL'
      },
      { 
        name: 'Debt/Equity', 
        value: transformedMetrics.debtToEquity, 
        valid: transformedMetrics.debtToEquity > 0,
        expected: '>100 for AAPL (high by design)'
      },
      { 
        name: 'Current Ratio', 
        value: transformedMetrics.currentRatio, 
        valid: transformedMetrics.currentRatio > 0.5 && transformedMetrics.currentRatio < 2,
        expected: '0.8-1.0 for AAPL'
      },
      { 
        name: 'Market Cap', 
        value: transformedMetrics.marketCap, 
        valid: transformedMetrics.marketCap > 2e12 && transformedMetrics.marketCap < 4e12,
        expected: '~3T for AAPL'
      }
    ];
    
    let allValid = true;
    validations.forEach(v => {
      const status = v.valid ? '✅' : '❌';
      console.log(`   ${status} ${v.name}: ${typeof v.value === 'number' ? v.value.toFixed(2) : v.value} (expected: ${v.expected})`);
      if (!v.valid) allValid = false;
    });
    
    // 4. Test income statement transformation
    console.log('\n5. Testing Income Statement Transformation:');
    const incomeResponse = await axios.get(`${BASE_URL}/income_statement`, {
      params: { symbol: 'AAPL', apikey: API_KEY, outputsize: 1 }
    });
    
    const latestIncome = incomeResponse.data?.income_statement?.[0];
    if (latestIncome) {
      console.log('   - Date:', latestIncome.fiscal_date);
      console.log('   - Revenue (sales):', (latestIncome.sales / 1e9).toFixed(2), 'B');
      console.log('   - Net Income:', (latestIncome.net_income / 1e9).toFixed(2), 'B');
      console.log('   - EPS:', latestIncome.eps_diluted);
    }
    
    console.log('\n6. Summary:');
    if (allValid) {
      console.log('   ✅ All financial metrics are valid and reasonable!');
      console.log('   ✅ Data pipeline is working correctly!');
    } else {
      console.log('   ⚠️  Some metrics need attention');
    }
    
  } catch (error) {
    console.error('Validation failed:', error.response?.data || error.message);
  }
}

validateDataPipeline();