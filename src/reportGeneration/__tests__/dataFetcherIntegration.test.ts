// src/reportGeneration/__tests__/dataFetcherIntegration.test.ts
// Comprehensive integration tests for the data fetching system
// Context: Ensures the entire pipeline works correctly end-to-end

import { createDataFetcher } from '../core/dataFetcher';
import { MemoryCache } from '../utils/cache';

// Skip these tests in CI or when no API keys are available
const hasTwelveDataKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || false;
const hasFirecrawlKey = process.env.FIRECRAWL_API_KEY || false;
const describeif = (hasTwelveDataKey) ? describe : describe.skip;

describe('DataFetcher Integration', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
  });
  
  afterEach(() => {
    cache.clear();
  });
  
  describe('Complete Data Fetching Pipeline', () => {
    it('should fetch comprehensive data for a valid ticker', async () => {
      const fetcher = createDataFetcher({
        ticker: 'NVDA',
        cache,
        debugMode: true,
        includeNews: true,
        includeTranscripts: false // Skip for faster tests
      });
      
      // Track progress
      const progressUpdates: Array<{ stage: string; progress: number }> = [];
      
      const data = await fetcher.fetchAll('NVDA', (stage, progress) => {
        progressUpdates.push({ stage, progress });
        console.log(`Progress: ${stage} - ${progress}%`);
      });
      
      // Verify data structure
      expect(data).toHaveProperty('ticker', 'NVDA');
      expect(data).toHaveProperty('companyName');
      expect(data).toHaveProperty('financials');
      expect(data).toHaveProperty('news');
      expect(data).toHaveProperty('metadata');
      
      // Verify financial data
      expect(data.financials).toHaveProperty('historicalPrices');
      expect(data.financials.historicalPrices.length).toBeGreaterThan(100);
      
      // Verify metadata quality
      expect(data.metadata).toHaveProperty('completeness');
      expect(data.metadata.completeness).toBeGreaterThan(50);
      
      // Verify progress tracking
      expect(progressUpdates.length).toBeGreaterThan(5);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    }, 60000); // Extended timeout for real API calls
    
    it('should handle partial failures gracefully', async () => {
      const fetcher = createDataFetcher({
        ticker: 'INVALID_TICKER_XYZ',
        cache,
        debugMode: true
      });
      
      // This should not throw but return partial data
      const data = await fetcher.fetchAll('INVALID_TICKER_XYZ');
      
      // Should have structure even with failures
      expect(data).toHaveProperty('ticker');
      expect(data).toHaveProperty('metadata');
      
      // Check that failures were recorded
      expect(data.metadata.sources).toBeDefined();
      const failedSources = Object.values(data.metadata.sources)
        .filter(s => s.status === 'failed');
      expect(failedSources.length).toBeGreaterThan(0);
    });
    
    it('should utilize cache on repeated requests', async () => {
      const fetcher = createDataFetcher({
        ticker: 'NVDA',
        cache,
        debugMode: true
      });
      
      // First fetch
      const start1 = Date.now();
      await fetcher.fetchAll('NVDA');
      const duration1 = Date.now() - start1;
      
      // Second fetch (should be faster due to cache)
      const start2 = Date.now();
      await fetcher.fetchAll('NVDA');
      const duration2 = Date.now() - start2;
      
      // Cache should make second request significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
      
      // Verify cache statistics
      const cacheStats = cache.getStats();
      expect(cacheStats.totalHits).toBeGreaterThan(0);
    });
  });
  
  describe('Data Quality and Validation', () => {
    it('should validate and clean financial data', async () => {
      const fetcher = createDataFetcher({
        ticker: 'AAPL',
        cache,
        debugMode: true
      });
      
      const data = await fetcher.fetchAll('AAPL');
      
      // Check that price data is valid
      data.financials.historicalPrices.forEach(price => {
        expect(price.close).toBeGreaterThan(0);
        expect(price.high).toBeGreaterThanOrEqual(price.low);
        expect(price.high).toBeGreaterThanOrEqual(price.close);
        expect(price.low).toBeLessThanOrEqual(price.close);
      });
      
      // Check that dates are properly ordered
      for (let i = 1; i < data.financials.historicalPrices.length; i++) {
        const current = new Date(data.financials.historicalPrices[i].date);
        const previous = new Date(data.financials.historicalPrices[i - 1].date);
        expect(current.getTime()).toBeLessThan(previous.getTime());
      }
    });
    
    it('should enrich data with calculated metrics', async () => {
      const fetcher = createDataFetcher({
        ticker: 'MSFT',
        cache,
        debugMode: true
      });
      
      const data = await fetcher.fetchAll('MSFT');
      
      // Check for enriched technical indicators
      if (data.technicals.volatility) {
        expect(data.technicals.volatility).toBeGreaterThan(0);
        expect(data.technicals.volatility).toBeLessThan(2); // Reasonable range for annualized volatility
      }
      
      // Check for sentiment analysis
      if (data.metadata.aggregatedSentiment) {
        expect(['positive', 'neutral', 'negative'])
          .toContain(data.metadata.aggregatedSentiment.overall);
      }
      
      // Check data quality assessment
      expect(data.metadata.quality).toBeDefined();
      expect(data.metadata.quality.grade).toMatch(/[A-D]/);
    });
  });
  
  describe('Error Handling and Recovery', () => {
    it('should handle API rate limits gracefully', async () => {
      const fetcher = createDataFetcher({
        ticker: 'GOOGL',
        cache: new MemoryCache(), // Fresh cache to force API calls
        debugMode: true
      });
      
      // Make multiple rapid requests
      const requests = Array(5).fill(null).map((_, i) => 
        fetcher.fetchAll(`GOOGL`)
      );
      
      // All should complete without throwing rate limit errors
      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      expect(successful.length).toBeGreaterThan(0);
    });
    
    it('should provide meaningful errors for critical failures', async () => {
      // Mock environment without API key
      const originalKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
      delete process.env.REACT_APP_TWELVE_DATA_API_KEY;
      
      expect(() => {
        createDataFetcher({
          ticker: 'NVDA',
          cache
        });
      }).toThrow('TwelveData API key is required');
      
      // Restore
      if (originalKey) {
        process.env.REACT_APP_TWELVE_DATA_API_KEY = originalKey;
      }
    });
  });
  
  describe('Different Configuration Scenarios', () => {
    it('should work with minimal configuration', async () => {
      const fetcher = createDataFetcher({
        ticker: 'TSLA',
        includeNews: false,
        includeTranscripts: false
      });
      
      const data = await fetcher.fetchAll('TSLA');
      
      // Should still have core data
      expect(data.ticker).toBe('TSLA');
      expect(data.financials).toBeDefined();
      expect(data.news).toEqual([]);
      expect(data.transcripts).toEqual([]);
    });
    
    it('should work with full configuration', async () => {
      const fetcher = createDataFetcher({
        ticker: 'AMZN',
        cache,
        debugMode: true,
        includeNews: true,
        includeTranscripts: true,
        maxConcurrent: 5
      });
      
      const data = await fetcher.fetchAll('AMZN');
      
      // Should have all data types
      expect(data.financials).toBeDefined();
      expect(data.news.length).toBeGreaterThanOrEqual(0);
      expect(data.transcripts).toBeDefined();
      expect(data.technicals).toBeDefined();
      expect(data.analysts).toBeDefined();
    }, 90000); // Extended timeout for full fetch
  });
  
  describe('Data Enrichment Verification', () => {
    it('should calculate volatility correctly', async () => {
      const fetcher = createDataFetcher({
        ticker: 'SPY', // S&P 500 ETF for stable data
        cache,
        debugMode: false
      });
      
      const data = await fetcher.fetchAll('SPY');
      
      if (data.technicals.volatility !== undefined) {
        // SPY typically has volatility between 10-30%
        expect(data.technicals.volatility).toBeGreaterThan(0.05);
        expect(data.technicals.volatility).toBeLessThan(0.50);
      }
    });
    
    it('should identify support and resistance levels', async () => {
      const fetcher = createDataFetcher({
        ticker: 'META',
        cache,
        debugMode: false
      });
      
      const data = await fetcher.fetchAll('META');
      
      if (data.technicals.support && data.technicals.resistance) {
        expect(data.technicals.resistance).toBeGreaterThan(data.technicals.support);
        
        // Should be within reasonable range of current price
        const latestPrice = data.financials.historicalPrices[0]?.close;
        if (latestPrice) {
          const supportRatio = data.technicals.support / latestPrice;
          const resistanceRatio = data.technicals.resistance / latestPrice;
          
          expect(supportRatio).toBeGreaterThan(0.5); // Within 50% below
          expect(resistanceRatio).toBeLessThan(1.5); // Within 50% above
        }
      }
    });
    
    it('should aggregate sentiment from multiple sources', async () => {
      const fetcher = createDataFetcher({
        ticker: 'NFLX',
        cache,
        debugMode: false,
        includeNews: true
      });
      
      const data = await fetcher.fetchAll('NFLX');
      
      if (data.metadata.aggregatedSentiment && data.news.length > 0) {
        const sentiment = data.metadata.aggregatedSentiment;
        
        expect(sentiment.score).toBeGreaterThanOrEqual(-1);
        expect(sentiment.score).toBeLessThanOrEqual(1);
        expect(sentiment.newsSentiment).toBeDefined();
        
        // Overall sentiment should be consistent with score
        if (sentiment.score > 0.2) {
          expect(sentiment.overall).toBe('positive');
        } else if (sentiment.score < -0.2) {
          expect(sentiment.overall).toBe('negative');
        } else {
          expect(sentiment.overall).toBe('neutral');
        }
      }
    });
  });
  
  describe('Performance Characteristics', () => {
    it('should complete basic fetch within reasonable time', async () => {
      const fetcher = createDataFetcher({
        ticker: 'IBM',
        cache,
        includeNews: false,
        includeTranscripts: false
      });
      
      const start = Date.now();
      await fetcher.fetchAll('IBM');
      const duration = Date.now() - start;
      
      // Should complete within 30 seconds for basic data
      expect(duration).toBeLessThan(30000);
    });
    
    it('should show performance benefit from caching', async () => {
      const ticker = 'ORCL';
      const fetcher = createDataFetcher({
        ticker,
        cache,
        debugMode: false
      });
      
      // Warm up cache
      await fetcher.fetchAll(ticker);
      
      // Measure cache hit performance
      const measurements = [];
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await fetcher.fetchAll(ticker);
        measurements.push(Date.now() - start);
      }
      
      // Each subsequent call should be very fast
      measurements.forEach(duration => {
        expect(duration).toBeLessThan(1000); // Sub-second from cache
      });
    });
  });
});

// Real API integration tests (only run with actual API keys)
describeif('Real API Integration Tests', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
  });
  
  it('should fetch real data for tech stocks', async () => {
    const tickers = ['AAPL', 'GOOGL', 'MSFT'];
    const results = [];
    
    for (const ticker of tickers) {
      const fetcher = createDataFetcher({
        ticker,
        cache,
        includeNews: true,
        includeTranscripts: false
      });
      
      const data = await fetcher.fetchAll(ticker);
      results.push({
        ticker,
        companyName: data.companyName,
        marketCap: data.financials.keyMetrics.marketCap,
        peRatio: data.financials.keyMetrics.peRatio,
        newsCount: data.news.length,
        dataQuality: data.metadata.quality?.grade
      });
    }
    
    console.log('\nTech Stock Summary:');
    results.forEach(r => {
      console.log(`${r.ticker}: ${r.companyName}`);
      console.log(`  Market Cap: $${(r.marketCap / 1e9).toFixed(2)}B`);
      console.log(`  P/E Ratio: ${r.peRatio.toFixed(2)}`);
      console.log(`  News Articles: ${r.newsCount}`);
      console.log(`  Data Quality: ${r.dataQuality}`);
    });
    
    // All should have valid data
    results.forEach(r => {
      expect(r.marketCap).toBeGreaterThan(0);
      expect(r.newsCount).toBeGreaterThan(0);
    });
  }, 120000); // 2 minute timeout for multiple fetches
  
  it('should handle different market sectors', async () => {
    const sectorStocks = {
      'Technology': 'NVDA',
      'Healthcare': 'JNJ',
      'Finance': 'JPM',
      'Consumer': 'WMT',
      'Energy': 'XOM'
    };
    
    const sectorData = [];
    
    for (const [sector, ticker] of Object.entries(sectorStocks)) {
      const fetcher = createDataFetcher({
        ticker,
        cache,
        includeNews: false // Faster
      });
      
      const data = await fetcher.fetchAll(ticker);
      sectorData.push({
        providedSector: sector,
        ticker,
        actualSector: data.sector,
        industry: data.industry,
        volatility: data.technicals.volatility
      });
    }
    
    console.log('\nSector Analysis:');
    sectorData.forEach(s => {
      console.log(`${s.ticker} (${s.providedSector}):`);
      console.log(`  Actual Sector: ${s.actualSector}`);
      console.log(`  Industry: ${s.industry}`);
      if (s.volatility) {
        console.log(`  Volatility: ${(s.volatility * 100).toFixed(1)}%`);
      }
    });
    
    // All should have sector data
    sectorData.forEach(s => {
      expect(s.actualSector).toBeTruthy();
      expect(s.industry).toBeTruthy();
    });
  }, 180000); // 3 minute timeout
  
  it('should demonstrate error recovery with mixed valid/invalid tickers', async () => {
    const tickers = ['AAPL', 'INVALID123', 'GOOGL', 'FAKEXYZ', 'MSFT'];
    const results = [];
    
    for (const ticker of tickers) {
      const fetcher = createDataFetcher({
        ticker,
        cache,
        debugMode: false
      });
      
      try {
        const data = await fetcher.fetchAll(ticker);
        results.push({
          ticker,
          success: true,
          hasData: !!data.financials.historicalPrices?.length,
          completeness: data.metadata.completeness
        });
      } catch (error: any) {
        results.push({
          ticker,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('\nMixed Ticker Results:');
    results.forEach(r => {
      if (r.success) {
        console.log(`✅ ${r.ticker}: Completeness ${r.completeness}%`);
      } else {
        console.log(`❌ ${r.ticker}: ${r.error}`);
      }
    });
    
    // Valid tickers should succeed
    const appleResult = results.find(r => r.ticker === 'AAPL');
    expect(appleResult?.success).toBe(true);
    
    // Invalid tickers should handle gracefully
    const invalidResult = results.find(r => r.ticker === 'INVALID123');
    expect(invalidResult).toBeDefined();
  }, 150000);
});