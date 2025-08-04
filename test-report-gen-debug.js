// Debug script to see what data we're getting from TwelveData
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY;

async function testTwelveDataAPI() {
  console.log('[DEBUG] Testing TwelveData API with key:', API_KEY ? 'Present' : 'Missing');
  
  try {
    // Test 1: Get Quote
    console.log('\n[DEBUG] Fetching NVDA quote...');
    const quoteResponse = await axios.get('https://api.twelvedata.com/quote', {
      params: {
        symbol: 'NVDA',
        apikey: API_KEY
      }
    });
    console.log('[DEBUG] Quote response:', JSON.stringify(quoteResponse.data, null, 2));
    
    // Test 2: Get Statistics
    console.log('\n[DEBUG] Fetching NVDA statistics...');
    try {
      const statsResponse = await axios.get('https://api.twelvedata.com/statistics', {
        params: {
          symbol: 'NVDA',
          apikey: API_KEY
        }
      });
      console.log('[DEBUG] Statistics response:', JSON.stringify(statsResponse.data, null, 2));
    } catch (e) {
      console.log('[DEBUG] Statistics error:', e.response?.status, e.response?.data);
    }
    
    // Test 3: Get Income Statement
    console.log('\n[DEBUG] Fetching NVDA income statement...');
    try {
      const incomeResponse = await axios.get('https://api.twelvedata.com/income_statement', {
        params: {
          symbol: 'NVDA',
          apikey: API_KEY
        }
      });
      console.log('[DEBUG] Income statement response:', JSON.stringify(incomeResponse.data, null, 2));
    } catch (e) {
      console.log('[DEBUG] Income statement error:', e.response?.status, e.response?.data);
    }
    
    // Test 4: Get Balance Sheet
    console.log('\n[DEBUG] Fetching NVDA balance sheet...');
    try {
      const balanceResponse = await axios.get('https://api.twelvedata.com/balance_sheet', {
        params: {
          symbol: 'NVDA',
          apikey: API_KEY
        }
      });
      console.log('[DEBUG] Balance sheet response:', JSON.stringify(balanceResponse.data, null, 2));
    } catch (e) {
      console.log('[DEBUG] Balance sheet error:', e.response?.status, e.response?.data);
    }
    
    // Test 5: Get Earnings
    console.log('\n[DEBUG] Fetching NVDA earnings...');
    try {
      const earningsResponse = await axios.get('https://api.twelvedata.com/earnings', {
        params: {
          symbol: 'NVDA',
          apikey: API_KEY
        }
      });
      console.log('[DEBUG] Earnings response:', JSON.stringify(earningsResponse.data, null, 2));
    } catch (e) {
      console.log('[DEBUG] Earnings error:', e.response?.status, e.response?.data);
    }
    
  } catch (error) {
    console.error('[DEBUG] API Error:', error.response?.data || error.message);
  }
}

testTwelveDataAPI();