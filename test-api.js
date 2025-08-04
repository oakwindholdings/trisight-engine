console.log('Testing TwelveData API directly...');

const axios = require('axios');

async function testTwelveData() {
  const apiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  console.log('API Key available:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  
  try {
    console.log('Testing quote endpoint...');
    const quoteResponse = await axios.get('https://api.twelvedata.com/quote', {
      params: {
        symbol: 'NVDA',
        apikey: apiKey
      },
      timeout: 10000
    });
    console.log('Quote response status:', quoteResponse.status);
    console.log('Quote data keys:', Object.keys(quoteResponse.data));
    console.log('Quote data:', JSON.stringify(quoteResponse.data, null, 2));
  } catch (error) {
    console.error('Quote API error:', error.response ? error.response.data : error.message);
  }
  
  try {
    console.log('Testing time series endpoint...');
    const timeSeriesResponse = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: 'NVDA',
        interval: '1day',
        outputsize: 30,
        apikey: apiKey
      },
      timeout: 10000
    });
    console.log('Time series response status:', timeSeriesResponse.status);
    console.log('Time series data keys:', Object.keys(timeSeriesResponse.data));
    if (timeSeriesResponse.data.values) {
      console.log('Values count:', timeSeriesResponse.data.values.length);
    }
    console.log('Time series data:', JSON.stringify(timeSeriesResponse.data, null, 2));
  } catch (error) {
    console.error('Time series API error:', error.response ? error.response.data : error.message);
  }
}

testTwelveData();