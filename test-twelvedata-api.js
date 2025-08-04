// Test script to verify TwelveData API responses
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY || '764fb86962cc46ebbe5e1c89a1761623';
const BASE_URL = 'https://api.twelvedata.com';

async function testStatisticsEndpoint() {
  console.log('\n=== Testing Statistics Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/statistics`, {
      params: {
        symbol: 'AAPL',
        apikey: API_KEY
      }
    });
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Statistics error:', error.response?.data || error.message);
    return null;
  }
}

async function testQuoteEndpoint() {
  console.log('\n=== Testing Quote Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: 'AAPL',
        apikey: API_KEY
      }
    });
    console.log('Quote response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Quote error:', error.response?.data || error.message);
    return null;
  }
}

async function testIncomeStatement() {
  console.log('\n=== Testing Income Statement Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/income_statement`, {
      params: {
        symbol: 'AAPL',
        apikey: API_KEY
      }
    });
    console.log('Income statement sample:', JSON.stringify(response.data.income_statement?.[0] || response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Income statement error:', error.response?.data || error.message);
    return null;
  }
}

async function testBalanceSheet() {
  console.log('\n=== Testing Balance Sheet Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/balance_sheet`, {
      params: {
        symbol: 'AAPL',
        apikey: API_KEY
      }
    });
    console.log('Balance sheet sample:', JSON.stringify(response.data.balance_sheet?.[0] || response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Balance sheet error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('Testing TwelveData API with key:', API_KEY ? 'Present' : 'Missing');
  
  if (!API_KEY) {
    console.error('API key is missing! Set TWELVE_DATA_API_KEY environment variable.');
    process.exit(1);
  }

  const quote = await testQuoteEndpoint();
  const stats = await testStatisticsEndpoint();
  const income = await testIncomeStatement();
  const balance = await testBalanceSheet();
  
  // Analyze the data structure
  console.log('\n=== Data Analysis ===');
  if (quote) {
    console.log('Quote has P/E:', quote.pe);
    console.log('Quote has Market Cap:', quote.market_cap);
  }
  
  if (stats) {
    console.log('Statistics structure keys:', Object.keys(stats));
  }
  
  if (income) {
    console.log('Income statement has data:', !!income.income_statement);
  }
  
  if (balance) {
    console.log('Balance sheet has data:', !!balance.balance_sheet);
  }
}

main().catch(console.error);