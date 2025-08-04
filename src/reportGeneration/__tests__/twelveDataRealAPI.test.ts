// src/reportGeneration/__tests__/twelveDataRealAPI.test.ts
// Integration tests for real TwelveData API implementation
// Context: Validates that our adapter correctly handles real API responses

import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';

describe('TwelveData Real API Integration', () => {
  let adapter: TwelveDataAdapter;
  const TEST_SYMBOL = 'AAPL'; // Using Apple as a reliable test symbol
  
  beforeAll(() => {
    // Skip these tests if no API key is available
    if (!process.env.REACT_APP_TWELVE_DATA_API_KEY) {
      console.log('Skipping TwelveData integration tests - no API key found');
      return;
    }
    
    adapter = new TwelveDataAdapter({
      debugMode: true,
      isUltraTier: true // Assuming Ultra tier for full functionality
    });
  });
  
  // Skip tests if no API key
  const conditionalTest = process.env.REACT_APP_TWELVE_DATA_API_KEY ? test : test.skip;
  
  conditionalTest('should fetch real quote data', async () => {
    const quote = await adapter.getQuote(TEST_SYMBOL);
    
    // Verify structure
    expect(quote).toHaveProperty('symbol', TEST_SYMBOL);
    expect(quote).toHaveProperty('name');
    expect(quote).toHaveProperty('close');
    expect(quote).toHaveProperty('volume');
    expect(quote).toHaveProperty('percent_change');
    
    // Verify data types
    expect(typeof quote.close).toBe('string');
    expect(typeof quote.volume).toBe('string');
    expect(parseFloat(quote.close)).toBeGreaterThan(0);
  }, 30000);
  
  conditionalTest('should fetch real time series data', async () => {
    const timeSeries = await adapter.getTimeSeries(TEST_SYMBOL, '1day', 5);
    
    // Verify we got data
    expect(Array.isArray(timeSeries)).toBe(true);
    expect(timeSeries.length).toBeGreaterThan(0);
    expect(timeSeries.length).toBeLessThanOrEqual(5);
    
    // Verify structure of first candle
    const firstCandle = timeSeries[0];
    expect(firstCandle).toHaveProperty('date');
    expect(firstCandle).toHaveProperty('open');
    expect(firstCandle).toHaveProperty('high');
    expect(firstCandle).toHaveProperty('low');
    expect(firstCandle).toHaveProperty('close');
    expect(firstCandle).toHaveProperty('volume');
    
    // Verify data integrity
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.low);
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.open);
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.close);
  }, 30000);
  
  conditionalTest('should fetch real fundamentals data', async () => {
    const fundamentals = await adapter.getFundamentals(TEST_SYMBOL);
    
    // Verify structure
    expect(fundamentals).toHaveProperty('incomeStatement');
    expect(fundamentals).toHaveProperty('balanceSheet');
    expect(fundamentals).toHaveProperty('cashFlow');
    expect(fundamentals).toHaveProperty('keyMetrics');
    
    // Verify income statement has data
    if (fundamentals.incomeStatement && fundamentals.incomeStatement.length > 0) {
      const latestIncome = fundamentals.incomeStatement[0];
      expect(latestIncome).toHaveProperty('date');
      expect(latestIncome).toHaveProperty('revenue');
      expect(latestIncome).toHaveProperty('netIncome');
    }
    
    // Verify key metrics
    if (fundamentals.keyMetrics) {
      expect(fundamentals.keyMetrics).toHaveProperty('marketCap');
      expect(fundamentals.keyMetrics).toHaveProperty('peRatio');
      expect(fundamentals.keyMetrics.marketCap).toBeGreaterThan(0);
    }
  }, 60000); // Longer timeout for fundamentals
  
  conditionalTest('should fetch real earnings data', async () => {
    const earnings = await adapter.getEarnings(TEST_SYMBOL);
    
    // Verify structure
    expect(earnings).toHaveProperty('historical');
    expect(earnings).toHaveProperty('upcoming');
    expect(earnings).toHaveProperty('nextEarningsDate');
    expect(earnings).toHaveProperty('averageSurprise');
    
    // Verify historical earnings
    expect(Array.isArray(earnings.historical)).toBe(true);
    if (earnings.historical.length > 0) {
      const latestEarnings = earnings.historical[0];
      expect(latestEarnings).toHaveProperty('date');
      expect(latestEarnings).toHaveProperty('fiscalQuarter');
      expect(latestEarnings).toHaveProperty('fiscalYear');
      expect(latestEarnings).toHaveProperty('epsActual');
    }
  }, 30000);
  
  conditionalTest('should fetch real analyst ratings', async () => {
    const analystData = await adapter.getAnalystRatings(TEST_SYMBOL);
    
    // Verify structure
    expect(analystData).toHaveProperty('consensus');
    expect(analystData).toHaveProperty('priceTargets');
    expect(analystData).toHaveProperty('recommendations');
    
    // Verify consensus
    expect(analystData.consensus).toHaveProperty('rating');
    expect(analystData.consensus).toHaveProperty('score');
    expect(analystData.consensus).toHaveProperty('count');
    
    // Verify recommendations if available
    if (analystData.recommendations.length > 0) {
      const firstRec = analystData.recommendations[0];
      expect(firstRec).toHaveProperty('firm');
      expect(firstRec).toHaveProperty('rating');
      expect(firstRec).toHaveProperty('date');
    }
  }, 30000);
  
  conditionalTest('should handle rate limiting gracefully', async () => {
    // Make multiple rapid requests
    const promises = Array(5).fill(null).map((_, i) => 
      adapter.getQuote(`AAPL`)
    );
    
    // All should succeed without throwing rate limit errors
    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    results.forEach(quote => {
      expect(quote).toHaveProperty('symbol');
    });
  }, 60000);
  
  conditionalTest('should use localStorage cache effectively', async () => {
    // Clear localStorage first
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('trisight_td_')) {
        localStorage.removeItem(key);
      }
    });
    
    // First call - should hit API
    const start1 = Date.now();
    const quote1 = await adapter.getQuote('MSFT');
    const time1 = Date.now() - start1;
    
    // Second call - should use cache
    const start2 = Date.now();
    const quote2 = await adapter.getQuote('MSFT');
    const time2 = Date.now() - start2;
    
    // Cache should be much faster
    expect(time2).toBeLessThan(time1 / 2);
    
    // Data should be identical
    expect(quote2).toEqual(quote1);
    
    // Verify cache entry exists
    const cacheKeys = Object.keys(localStorage).filter(k => k.includes('MSFT'));
    expect(cacheKeys.length).toBeGreaterThan(0);
  }, 30000);
  
  conditionalTest('should handle API errors gracefully', async () => {
    // Test with invalid symbol
    try {
      await adapter.getQuote('INVALID_SYMBOL_12345');
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toContain('Invalid');
    }
  }, 30000);
  
  conditionalTest('should validate getFinancials alias', async () => {
    const financials = await adapter.getFinancials(TEST_SYMBOL);
    
    // Should return same structure as getFundamentals
    expect(financials).toHaveProperty('incomeStatement');
    expect(financials).toHaveProperty('balanceSheet');
    expect(financials).toHaveProperty('cashFlow');
    expect(financials).toHaveProperty('keyMetrics');
  }, 60000);
});