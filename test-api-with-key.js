console.log('Testing TwelveData API with hardcoded key...');

const axios = require('axios');

async function testTwelveData() {
  // Use the API key from the .env.local file
  const apiKey = '764fb86962cc46ebbe5e1c89a1761623';
  console.log('API Key available:', apiKey ? 'Yes' : 'No');
  
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
    } else {
      console.log('Time series data:', JSON.stringify(timeSeriesResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Time series API error:', error.response ? error.response.data : error.message);
  }
}

testTwelveData();