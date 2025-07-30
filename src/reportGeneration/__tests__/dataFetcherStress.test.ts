// src/reportGeneration/__tests__/dataFetcherStress.test.ts
// Stress tests for the data fetching system
// Context: Validates system resilience under extreme conditions

import { createDataFetcher } from '../core/dataFetcher';
import { MemoryCache } from '../utils/cache';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { EdgarAdapter } from '../adapters/edgarAdapter';
import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';

// Mock the adapters for stress testing
jest.mock('../adapters/twelveDataAdapter');
jest.mock('../adapters/newsAdapter');
jest.mock('../adapters/edgarAdapter');
jest.mock('../adapters/firecrawlAdapter');

describe('DataFetcher Stress Tests', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
    jest.clearAllMocks();
  });
  
  describe('High Volume Scenarios', () => {
    it('should handle rapid concurrent requests', async () => {
      // Mock adapters to simulate varying response times
      const mockAdapters = createMockAdapters({
        quoteDelay: 100,
        fundamentalsDelay: 200,
        pricesDelay: 300,
        newsDelay: 150
      });
      
      // Create multiple fetchers
      const tickers = Array.from({ length: 20 }, (_, i) => `TICK${i}`);
      const fetchers = tickers.map(ticker => createDataFetcher({
        ticker,
        cache,
        adapters: mockAdapters
      }));
      
      // Launch all requests simultaneously
      const start = Date.now();
      const promises = fetchers.map((f, i) => f.fetchAll(tickers[i]));
      const results = await Promise.allSettled(promises);
      const duration = Date.now() - start;
      
      // Count successes and failures
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log('\nHigh Volume Test Results:');
      console.log(`  Total requests: ${tickers.length}`);
      console.log(`  Successful: ${successful}`);
      console.log(`  Failed: ${failed}`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Avg per request: ${(duration / tickers.length).toFixed(0)}ms`);
      
      // Most should succeed
      expect(successful).toBeGreaterThan(tickers.length * 0.8);
    });
    
    it('should handle memory pressure gracefully', async () => {
      // Create adapters that return large datasets
      const largeDataAdapters = createMockAdapters({
        largePriceData: true, // 5000 price points
        largeNewsData: true   // 100 news items
      });
      
      const tickers = ['BIG1', 'BIG2', 'BIG3', 'BIG4', 'BIG5'];
      const memorySnapshots = [];
      
      // Monitor memory usage
      memorySnapshots.push({
        stage: 'initial',
        memory: cache.getStats().totalMemoryMB
      });
      
      for (const ticker of tickers) {
        const fetcher = createDataFetcher({
          ticker,
          cache,
          adapters: largeDataAdapters
        });
        
        await fetcher.fetchAll(ticker);
        
        memorySnapshots.push({
          stage: `after_${ticker}`,
          memory: cache.getStats().totalMemoryMB
        });
      }
      
      console.log('\nMemory Pressure Test:');
      memorySnapshots.forEach(snapshot => {
        console.log(`  ${snapshot.stage}: ${snapshot.memory.toFixed(2)}MB`);
      });
      
      // Memory should grow but stay within reasonable bounds
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
      expect(finalMemory).toBeLessThan(100); // Less than 100MB total
      
      // Cache should start evicting if needed
      const stats = cache.getStats();
      console.log(`  Cache evictions: ${stats.evictions || 0}`);
    });
  });
  
  describe('Error Cascade Scenarios', () => {
    it('should prevent error cascades when primary source fails', async () => {
      // Mock TwelveData to fail intermittently
      let callCount = 0;
      const flakyAdapters = createMockAdapters({
        failureRate: 0.5, // 50% failure rate
        onCall: () => {
          callCount++;
        }
      });
      
      const results = [];
      
      // Try to fetch 10 times
      for (let i = 0; i < 10; i++) {
        const fetcher = createDataFetcher({
          ticker: 'FLAKY',
          cache: new MemoryCache(), // Fresh cache each time
          adapters: flakyAdapters
        });
        
        try {
          const data = await fetcher.fetchAll('FLAKY');
          results.push({ success: true, completeness: data.metadata.completeness });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      console.log('\nError Cascade Test:');
      console.log(`  Total attempts: ${results.length}`);
      console.log(`  Successful: ${successCount}`);
      console.log(`  Failed: ${results.length - successCount}`);
      console.log(`  Total API calls: ${callCount}`);
      
      // Should have some successes despite failures
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(results.length);
    });
    
    it('should handle cascading timeouts', async () => {
      // Create adapters with increasing delays
      const slowAdapters = createMockAdapters({
        quoteDelay: 5000,
        fundamentalsDelay: 10000,
        pricesDelay: 15000,
        newsDelay: 20000
      });
      
      const fetcher = createDataFetcher({
        ticker: 'SLOW',
        cache,
        adapters: slowAdapters
      });
      
      const start = Date.now();
      const data = await fetcher.fetchAll('SLOW');
      const duration = Date.now() - start;
      
      console.log('\nTimeout Cascade Test:');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Sources attempted: ${Object.keys(data.metadata.sources).length}`);
      console.log(`  Sources succeeded: ${Object.values(data.metadata.sources)
        .filter(s => s.status === 'success').length}`);
      console.log(`  Sources timed out: ${Object.values(data.metadata.sources)
        .filter(s => s.error === 'Request timeout').length}`);
      
      // Should complete within timeout limits (not wait for all slow requests)
      expect(duration).toBeLessThan(40000); // 40 seconds max
      
      // Should have some timeouts
      const timedOut = Object.values(data.metadata.sources)
        .filter(s => s.error === 'Request timeout').length;
      expect(timedOut).toBeGreaterThan(0);
    });
  });
  
  describe('Resource Exhaustion Scenarios', () => {
    it('should handle cache saturation', async () => {
      // Create a small cache that will fill quickly
      const smallCache = new MemoryCache({ maxSizeMB: 5 });
      
      const tickers = Array.from({ length: 50 }, (_, i) => `CACHE${i}`);
      const mockAdapters = createMockAdapters({});
      
      let evictionCount = 0;
      const originalEvict = smallCache['evictOldest'];
      smallCache['evictOldest'] = function() {
        evictionCount++;
        return originalEvict.call(this);
      };
      
      // Fill the cache
      for (const ticker of tickers) {
        const fetcher = createDataFetcher({
          ticker,
          cache: smallCache,
          adapters: mockAdapters
        });
        
        await fetcher.fetchAll(ticker);
        
        if (smallCache.getStats().totalMemoryMB >= 4.5) {
          break; // Stop when cache is nearly full
        }
      }
      
      const finalStats = smallCache.getStats();
      
      console.log('\nCache Saturation Test:');
      console.log(`  Cache size: ${finalStats.totalMemoryMB.toFixed(2)}MB / 5MB`);
      console.log(`  Entries: ${finalStats.size}`);
      console.log(`  Evictions: ${evictionCount}`);
      console.log(`  Hit rate: ${(finalStats.hitRate * 100).toFixed(1)}%`);
      
      // Cache should stay within limits
      expect(finalStats.totalMemoryMB).toBeLessThanOrEqual(5);
      
      // Should have triggered evictions
      expect(evictionCount).toBeGreaterThan(0);
    });
    
    it('should degrade gracefully under API rate limits', async () => {
      let apiCallCount = 0;
      const rateLimitedAdapters = createMockAdapters({
        onCall: () => {
          apiCallCount++;
          // Simulate rate limit after 10 calls
          if (apiCallCount > 10) {
            throw new Error('429 Rate Limit Exceeded');
          }
        }
      });
      
      const tickers = Array.from({ length: 20 }, (_, i) => `RATE${i}`);
      const results = [];
      
      for (const ticker of tickers) {
        const fetcher = createDataFetcher({
          ticker,
          cache,
          adapters: rateLimitedAdapters
        });
        
        try {
          const data = await fetcher.fetchAll(ticker);
          results.push({ ticker, success: true });
        } catch (error) {
          results.push({ ticker, success: false, error: error.message });
        }
      }
      
      const successfulBefore = results.slice(0, 10).filter(r => r.success).length;
      const successfulAfter = results.slice(10).filter(r => r.success).length;
      
      console.log('\nRate Limit Test:');
      console.log(`  Total requests: ${results.length}`);
      console.log(`  Successful before limit: ${successfulBefore}/10`);
      console.log(`  Successful after limit: ${successfulAfter}/10`);
      console.log(`  API calls made: ${apiCallCount}`);
      
      // Should succeed before hitting rate limit
      expect(successfulBefore).toBeGreaterThan(0);
      
      // Should fail after rate limit
      expect(successfulAfter).toBe(0);
    });
  });
  
  describe('Data Corruption Scenarios', () => {
    it('should handle malformed API responses', async () => {
      const corruptAdapters = createMockAdapters({
        corruptData: true
      });
      
      const fetcher = createDataFetcher({
        ticker: 'CORRUPT',
        cache,
        adapters: corruptAdapters,
        debugMode: true
      });
      
      const data = await fetcher.fetchAll('CORRUPT');
      
      console.log('\nCorrupt Data Test:');
      console.log(`  Completeness: ${data.metadata.completeness}%`);
      console.log(`  Warnings: ${data.metadata.warnings?.length || 0}`);
      console.log(`  Data quality: ${data.metadata.quality?.grade || 'N/A'}`);
      
      // Should complete despite corrupt data
      expect(data).toBeDefined();
      expect(data.ticker).toBe('CORRUPT');
      
      // Should have warnings about data issues
      expect(data.metadata.warnings?.length || 0).toBeGreaterThan(0);
    });
    
    it('should validate and clean extreme values', async () => {
      const extremeAdapters = createMockAdapters({
        extremeValues: true
      });
      
      const fetcher = createDataFetcher({
        ticker: 'EXTREME',
        cache,
        adapters: extremeAdapters
      });
      
      const data = await fetcher.fetchAll('EXTREME');
      
      console.log('\nExtreme Values Test:');
      
      // Check that extreme values were cleaned
      data.financials.historicalPrices.forEach(price => {
        expect(price.close).toBeGreaterThanOrEqual(0);
        expect(price.close).toBeLessThan(Infinity);
        expect(isNaN(price.close)).toBe(false);
      });
      
      if (data.financials.incomeStatement.length > 0) {
        const statement = data.financials.incomeStatement[0];
        Object.values(statement).forEach(value => {
          if (typeof value === 'number') {
            expect(isFinite(value)).toBe(true);
          }
        });
      }
      
      console.log(`  Cleaned ${data.metadata.warnings?.filter(w => 
        w.message.includes('Invalid')).length || 0} invalid values`);
    });
  });
});

// Helper function to create mock adapters with configurable behavior
function createMockAdapters(options: {
  quoteDelay?: number;
  fundamentalsDelay?: number;
  pricesDelay?: number;
  newsDelay?: number;
  failureRate?: number;
  largePriceData?: boolean;
  largeNewsData?: boolean;
  corruptData?: boolean;
  extremeValues?: boolean;
  onCall?: () => void;
}) {
  const shouldFail = () => Math.random() < (options.failureRate || 0);
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const mockQuote = async () => {
    options.onCall?.();
    if (options.quoteDelay) await delay(options.quoteDelay);
    if (shouldFail()) throw new Error('API Error');
    
    return {
      symbol: 'TEST',
      name: 'Test Company',
      price: options.extremeValues ? Infinity : 100,
      market_cap: options.extremeValues ? '999999999999999' : '1000000000',
      pe: options.extremeValues ? -1000 : '15',
      pb: options.corruptData ? 'invalid' : '2.5',
      dividend_yield: '0.02'
    };
  };
  
  const mockFundamentals = async () => {
    options.onCall?.();
    if (options.fundamentalsDelay) await delay(options.fundamentalsDelay);
    if (shouldFail()) throw new Error('API Error');
    
    return {
      incomeStatement: [{
        date: '2023-12-31',
        period: 'annual',
        revenue: options.extremeValues ? NaN : 1000000,
        netIncome: options.corruptData ? null : 100000
      }],
      balanceSheet: [{
        date: '2023-12-31',
        period: 'annual',
        totalAssets: options.extremeValues ? -1000000 : 5000000,
        totalLiabilities: 2000000,
        totalEquity: options.corruptData ? undefined : 3000000
      }],
      cashFlow: [],
      keyMetrics: {}
    };
  };
  
  const mockPrices = async () => {
    options.onCall?.();
    if (options.pricesDelay) await delay(options.pricesDelay);
    if (shouldFail()) throw new Error('API Error');
    
    const count = options.largePriceData ? 5000 : 252;
    return Array.from({ length: count }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: options.extremeValues ? -100 : 100 + Math.random() * 10,
      high: options.corruptData ? 'high' : 110 + Math.random() * 10,
      low: 90 + Math.random() * 10,
      close: options.extremeValues ? NaN : 100 + Math.random() * 10,
      volume: 1000000 + Math.random() * 500000
    }));
  };
  
  const mockNews = async () => {
    options.onCall?.();
    if (options.newsDelay) await delay(options.newsDelay);
    if (shouldFail()) throw new Error('API Error');
    
    const count = options.largeNewsData ? 100 : 10;
    return Array.from({ length: count }, (_, i) => ({
      title: `News Item ${i}`,
      url: `https://example.com/news${i}`,
      source: 'Test Source',
      publishedDate: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      summary: 'Test summary',
      sentiment: 'neutral',
      relevanceScore: 0.5
    }));
  };
  
  return {
    twelveData: {
      getQuote: jest.fn().mockImplementation(mockQuote),
      getFundamentals: jest.fn().mockImplementation(mockFundamentals),
      getTimeSeries: jest.fn().mockImplementation(mockPrices),
      getTechnicalIndicators: jest.fn().mockResolvedValue({
        sma20: 100, sma50: 98, sma200: 95,
        rsi: 55,
        macd: { macd: 1, signal: 0.5, histogram: 0.5 },
        volume: { current: 1000000, average10Day: 950000, average30Day: 900000, trend: 'stable' },
        patterns: []
      }),
      getAnalystRatings: jest.fn().mockResolvedValue({
        consensus: { rating: 'buy', score: 4, count: 10 },
        priceTargets: [],
        recommendations: [],
        revisions: []
      })
    } as any,
    news: {
      getCompanyNews: jest.fn().mockImplementation(mockNews)
    } as any,
    edgar: {
      getCompanyDescription: jest.fn().mockResolvedValue({
        description: 'Test company description',
        sector: 'Technology',
        industry: 'Software'
      }),
      getEarningsTranscripts: jest.fn().mockResolvedValue([])
    } as any,
    firecrawl: {} as any
  };
}