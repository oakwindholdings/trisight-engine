// src/reportGeneration/__tests__/twelveDataIntegration.test.ts
// Integration tests for TwelveData API
// Context: Validates real API integration when credentials are available

import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { MemoryCache } from '../utils/cache';

// Skip these tests in CI or when no API key is available
const hasApiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || false;
const describeif = hasApiKey ? describe : describe.skip;

describeif('TwelveData Integration Tests', () => {
  let adapter: TwelveDataAdapter;
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
    adapter = new TwelveDataAdapter({
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY,
      cache,
      debugMode: false
    });
  });
  
  afterEach(() => {
    cache.clear();
  });
  
  describe('Real API Calls', () => {
    it('should fetch real quote data', async () => {
      const quote = await adapter.getQuote('NVDA');
      
      expect(quote).toHaveProperty('symbol', 'NVDA');
      expect(quote).toHaveProperty('name');
      expect(quote).toHaveProperty('close');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('market_cap');
      
      // Validate data types
      expect(typeof quote.close).toBe('string');
      expect(typeof quote.volume).toBe('string');
      
      console.log('Live NVDA Quote:', {
        price: quote.close,
        volume: quote.volume,
        change: quote.percent_change + '%'
      });
    }, 10000); // Allow 10 seconds for real API call
    
    it('should fetch historical price data', async () => {
      const prices = await adapter.getTimeSeries('NVDA', '1day', 5);
      
      expect(prices).toHaveLength(5);
      expect(prices[0]).toHaveProperty('date');
      expect(prices[0]).toHaveProperty('open');
      expect(prices[0]).toHaveProperty('high');
      expect(prices[0]).toHaveProperty('low');
      expect(prices[0]).toHaveProperty('close');
      expect(prices[0]).toHaveProperty('volume');
      
      // Validate data is numeric after transformation
      prices.forEach(price => {
        expect(typeof price.open).toBe('number');
        expect(typeof price.close).toBe('number');
        expect(typeof price.volume).toBe('number');
        expect(price.high).toBeGreaterThanOrEqual(price.low);
      });
    }, 15000);
    
    it('should fetch fundamental data', async () => {
      const fundamentals = await adapter.getFundamentals('NVDA');
      
      expect(fundamentals).toHaveProperty('incomeStatement');
      expect(fundamentals).toHaveProperty('balanceSheet');
      expect(fundamentals).toHaveProperty('cashFlow');
      expect(fundamentals).toHaveProperty('keyMetrics');
      
      const metrics = fundamentals.keyMetrics;
      expect(metrics).toBeDefined();
      expect(metrics?.marketCap).toBeGreaterThan(0);
      expect(metrics?.peRatio).toBeGreaterThan(0);
      
      console.log('NVDA Key Metrics:', {
        marketCap: (metrics?.marketCap || 0) / 1e9 + 'B',
        peRatio: metrics?.peRatio,
        roe: (metrics?.roe || 0) * 100 + '%'
      });
    }, 20000);
    
    it('should fetch analyst ratings (Ultra tier)', async () => {
      const ratings = await adapter.getAnalystRatings('NVDA');
      
      expect(ratings).toHaveProperty('consensus');
      expect(ratings).toHaveProperty('priceTargets');
      expect(ratings).toHaveProperty('recommendations');
      
      if (ratings.consensus.count > 0) {
        expect(ratings.consensus.rating).toMatch(/buy|hold|sell/i);
        expect(ratings.consensus.score).toBeGreaterThanOrEqual(1);
        expect(ratings.consensus.score).toBeLessThanOrEqual(5);
        
        console.log('NVDA Analyst Consensus:', ratings.consensus);
      }
    }, 15000);
    
    it('should fetch technical indicators', async () => {
      const technicals = await adapter.getTechnicalIndicators('NVDA');
      
      expect(technicals).toHaveProperty('sma20');
      expect(technicals).toHaveProperty('sma50');
      expect(technicals).toHaveProperty('sma200');
      expect(technicals).toHaveProperty('rsi');
      expect(technicals).toHaveProperty('macd');
      expect(technicals).toHaveProperty('volume');
      
      // RSI should be between 0 and 100
      expect(technicals.rsi).toBeGreaterThanOrEqual(0);
      expect(technicals.rsi).toBeLessThanOrEqual(100);
      
      console.log('NVDA Technical Indicators:', {
        sma20: technicals.sma20,
        rsi: technicals.rsi,
        volumeTrend: technicals.volume.trend
      });
    }, 20000);
  });
  
  describe('Rate Limiting and Performance', () => {
    it('should handle concurrent requests within rate limits', async () => {
      const symbols = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'];
      const startTime = Date.now();
      
      // Fetch quotes for multiple symbols concurrently
      const quotes = await Promise.all(
        symbols.map(symbol => adapter.getQuote(symbol))
      );
      
      const duration = Date.now() - startTime;
      
      expect(quotes).toHaveLength(5);
      quotes.forEach((quote, index) => {
        expect(quote.symbol).toBe(symbols[index]);
      });
      
      console.log(`Fetched ${symbols.length} quotes in ${duration}ms`);
      
      // Check that we haven't exceeded rate limits
      const usage = adapter.getApiUsageInfo();
      expect(usage.availableCredits).toBeGreaterThan(0);
    }, 30000);
    
    it('should effectively use cache', async () => {
      // First fetch - hits API
      const start1 = Date.now();
      const quote1 = await adapter.getQuote('NVDA');
      const duration1 = Date.now() - start1;
      
      // Second fetch - should use cache
      const start2 = Date.now();
      const quote2 = await adapter.getQuote('NVDA');
      const duration2 = Date.now() - start2;
      
      expect(quote1).toEqual(quote2);
      expect(duration2).toBeLessThan(duration1 / 10); // Cache should be much faster
      
      console.log(`API call: ${duration1}ms, Cache hit: ${duration2}ms`);
    }, 15000);
  });
  
  describe('Error Handling', () => {
    it('should handle invalid symbols gracefully', async () => {
      await expect(adapter.getQuote('INVALID_SYMBOL_XYZ')).rejects.toThrow();
    });
    
    it('should provide meaningful error messages', async () => {
      try {
        await adapter.getQuote('INVALID_SYMBOL_XYZ');
      } catch (error: any) {
        expect(error.message).toMatch(/invalid|not found/i);
        expect(error.category).toBeDefined();
      }
    });
  });
  
  describe('API Usage Monitoring', () => {
    it('should track credit consumption accurately', async () => {
      const initialUsage = adapter.getApiUsageInfo();
      
      // Make a quote request (1 credit)
      await adapter.getQuote('NVDA');
      
      const afterQuote = adapter.getApiUsageInfo();
      const quoteCost = initialUsage.availableCredits - afterQuote.availableCredits;
      expect(quoteCost).toBe(1);
      
      // Make a time series request (10 credits)
      await adapter.getTimeSeries('NVDA', '1day', 30);
      
      const afterTimeSeries = adapter.getApiUsageInfo();
      const timeSeriesCost = afterQuote.availableCredits - afterTimeSeries.availableCredits;
      expect(timeSeriesCost).toBe(10);
      
      console.log('Credit consumption:', {
        quote: quoteCost,
        timeSeries: timeSeriesCost,
        remaining: afterTimeSeries.availableCredits
      });
    }, 20000);
  });
});

// Example usage function for documentation
export async function testTwelveDataIntegration() {
  const adapter = new TwelveDataAdapter({
    debugMode: true
  });
  
  try {
    // Get real-time quote
    console.log('Fetching quote for NVDA...');
    const quote = await adapter.getQuote('NVDA');
    console.log('Current price:', quote.close);
    console.log('Market cap:', quote.market_cap);
    
    // Get historical data
    console.log('\nFetching historical prices...');
    const prices = await adapter.getTimeSeries('NVDA', '1day', 30);
    console.log('Got', prices.length, 'days of price data');
    
    // Get analyst ratings (Ultra tier only)
    console.log('\nFetching analyst ratings...');
    const analysts = await adapter.getAnalystRatings('NVDA');
    console.log('Consensus:', analysts.consensus);
    
    // Check API usage
    const usage = adapter.getApiUsageInfo();
    console.log('\nAPI Usage:', usage);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  testTwelveDataIntegration().catch(console.error);
}