// src/reportGeneration/__tests__/twelveDataAdapter.test.ts
// Tests for TwelveData API adapter
// Context: Validates adapter functionality with mock responses

import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { MemoryCache } from '../utils/cache';
import { 
  setupMockTwelveDataAPI,
  setupRateLimitedMock,
  mockQuoteResponse,
  mockTimeSeriesResponse
} from './mockTwelveDataResponses';

describe('TwelveDataAdapter', () => {
  let adapter: TwelveDataAdapter;
  let cache: MemoryCache;
  let cleanup: () => void;

  beforeEach(() => {
    cache = new MemoryCache();
    adapter = new TwelveDataAdapter({
      apiKey: 'test-api-key',
      cache,
      debugMode: false
    });
    cleanup = setupMockTwelveDataAPI();
  });

  afterEach(() => {
    cleanup();
    cache.clear();
  });

  describe('getQuote', () => {
    it('should fetch quote data successfully', async () => {
      const quote = await adapter.getQuote('NVDA');
      
      expect(quote).toBeDefined();
      expect(quote.symbol).toBe('NVDA');
      expect(quote.name).toBe('NVIDIA Corporation');
      expect(quote.close).toBe('552.50');
      expect(quote.volume).toBe('45000000');
    });

    it('should cache quote responses', async () => {
      // First call - hits API
      const quote1 = await adapter.getQuote('NVDA');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const quote2 = await adapter.getQuote('NVDA');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional API call
      
      expect(quote1).toEqual(quote2);
    });

    it('should handle invalid symbol errors', async () => {
      await expect(adapter.getQuote('INVALID')).rejects.toThrow();
    });
  });

  describe('getTimeSeries', () => {
    it('should fetch and transform time series data', async () => {
      const prices = await adapter.getTimeSeries('NVDA', '1day', 5);
      
      expect(prices).toHaveLength(5);
      expect(prices[0]).toEqual({
        date: '2024-01-15',
        open: 550.00,
        high: 555.00,
        low: 545.00,
        close: 552.50,
        volume: 45000000,
        adjustedClose: 552.50
      });
    });

    it('should validate time series response structure', async () => {
      const prices = await adapter.getTimeSeries('NVDA');
      
      prices.forEach(price => {
        expect(typeof price.date).toBe('string');
        expect(typeof price.open).toBe('number');
        expect(typeof price.high).toBe('number');
        expect(typeof price.low).toBe('number');
        expect(typeof price.close).toBe('number');
        expect(typeof price.volume).toBe('number');
      });
    });
  });

  describe('getFundamentals', () => {
    it('should fetch and transform fundamental data', async () => {
      const fundamentals = await adapter.getFundamentals('NVDA');
      
      expect(fundamentals.incomeStatement).toBeDefined();
      expect(fundamentals.balanceSheet).toBeDefined();
      expect(fundamentals.cashFlow).toBeDefined();
      expect(fundamentals.keyMetrics).toBeDefined();
      
      // Check income statement transformation
      const latestIncome = fundamentals.incomeStatement?.[0];
      expect(latestIncome?.revenue).toBe(18120000000);
      expect(latestIncome?.netIncome).toBe(9243000000);
      expect(latestIncome?.eps).toBe(3.71);
    });

    it('should extract key metrics correctly', async () => {
      const fundamentals = await adapter.getFundamentals('NVDA');
      const metrics = fundamentals.keyMetrics;
      
      expect(metrics?.marketCap).toBe(1364875000000);
      expect(metrics?.peRatio).toBe(65.50);
      expect(metrics?.currentRatio).toBe(5.34);
      expect(metrics?.debtToEquity).toBe(0.32);
    });
  });

  describe('getAnalystRatings', () => {
    it('should fetch and process analyst ratings', async () => {
      const ratings = await adapter.getAnalystRatings('NVDA');
      
      expect(ratings.consensus).toBeDefined();
      expect(ratings.consensus.rating).toBe('buy');
      expect(ratings.consensus.count).toBeGreaterThan(0);
      
      expect(ratings.priceTargets).toHaveLength(3); // 3 ratings have price targets
      expect(ratings.recommendations).toHaveLength(5);
    });

    it('should calculate consensus correctly', async () => {
      const ratings = await adapter.getAnalystRatings('NVDA');
      
      // With our mock data: 1 Strong Buy (5), 3 Buy (4), 1 Hold (3)
      // Average = (5 + 4 + 4 + 3 + 4) / 5 = 4.0
      expect(ratings.consensus.score).toBeCloseTo(4.0, 1);
      expect(ratings.consensus.rating).toBe('buy');
    });
  });

  describe('getTechnicalIndicators', () => {
    it('should fetch multiple technical indicators', async () => {
      const technicals = await adapter.getTechnicalIndicators('NVDA');
      
      expect(technicals.sma20).toBe(547.25);
      expect(technicals.rsi).toBe(68.45);
      expect(technicals.macd).toEqual({
        macd: 12.45,
        signal: 10.20,
        histogram: 2.25
      });
    });

    it('should calculate volume trend', async () => {
      const technicals = await adapter.getTechnicalIndicators('NVDA');
      
      // Current volume (45M) vs average (42M) = 1.07 ratio = stable
      expect(technicals.volume.trend).toBe('stable');
      expect(technicals.volume.current).toBe(45000000);
      expect(technicals.volume.average10Day).toBe(42000000);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      cleanup();
      setupRateLimitedMock();
    });

    it('should handle rate limit errors gracefully', async () => {
      // Make requests until rate limited
      for (let i = 0; i < 5; i++) {
        await adapter.getQuote('NVDA');
      }
      
      // Next request should fail with rate limit error
      await expect(adapter.getQuote('NVDA')).rejects.toThrow(/rate limit/i);
    });
  });

  describe('API Usage Info', () => {
    it('should report Ultra tier correctly', () => {
      const usage = adapter.getApiUsageInfo();
      
      expect(usage.isUltraTier).toBe(true);
      expect(usage.creditsPerMinute).toBe(10946);
      expect(usage.availableCredits).toBeGreaterThan(0);
    });

    it('should track credit consumption', async () => {
      const initialCredits = adapter.getApiUsageInfo().availableCredits;
      
      await adapter.getQuote('NVDA'); // -1 credit
      
      const afterQuote = adapter.getApiUsageInfo().availableCredits;
      expect(afterQuote).toBe(initialCredits - 1);
      
      await adapter.getTimeSeries('NVDA'); // -10 credits
      
      const afterTimeSeries = adapter.getApiUsageInfo().availableCredits;
      expect(afterTimeSeries).toBe(afterQuote - 10);
    });

    it('should validate credit availability', () => {
      expect(adapter.canMakeRequest(1)).toBe(true); // Quote
      expect(adapter.canMakeRequest(50)).toBe(true); // Fundamentals
      expect(adapter.canMakeRequest(20000)).toBe(false); // Too many
    });
  });

  describe('Error Handling', () => {
    it('should categorize errors correctly', async () => {
      // Test auth error
      const noKeyAdapter = new TwelveDataAdapter({
        apiKey: '',
        cache
      });
      
      await expect(noKeyAdapter.getQuote('NVDA')).rejects.toThrow(/401/);
    });

    it('should handle network timeouts', async () => {
      // Mock a timeout
      global.fetch = jest.fn(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      await expect(adapter.getQuote('NVDA')).rejects.toThrow(/timeout/i);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      await adapter.getQuote('NVDA');
      await adapter.getQuote('AAPL');
      await adapter.getQuote('NVDA'); // Cache hit
      
      const stats = adapter.getCacheStats();
      
      expect(stats.adapter).toBe('TwelveData');
      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBeGreaterThan(0);
    });

    it('should clear cache on demand', async () => {
      await adapter.getQuote('NVDA');
      
      let stats = adapter.getCacheStats();
      expect(stats.size).toBe(1);
      
      adapter.clearCache();
      
      stats = adapter.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});