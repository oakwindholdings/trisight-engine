// src/reportGeneration/__tests__/dataFetcherPerformance.test.ts
// Performance benchmarking tests for the data fetching system
// Context: Measures and validates performance characteristics

import { createDataFetcher, DataFetcher } from '../core/dataFetcher';
import { MemoryCache } from '../utils/cache';

// Skip in CI environments
const isCI = process.env.CI === 'true';
const hasTwelveDataKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || false;
const describeif = (!isCI && hasTwelveDataKey) ? describe : describe.skip;

describe('DataFetcher Performance Benchmarks', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
  });
  
  afterEach(() => {
    cache.clear();
  });
  
  describe('Caching Performance', () => {
    it('should demonstrate significant cache performance improvement', async () => {
      const ticker = 'AAPL';
      const fetcher = createDataFetcher({
        ticker,
        cache,
        debugMode: false,
        includeNews: false,
        includeTranscripts: false
      });
      
      // Cold cache fetch
      const coldStart = Date.now();
      const data1 = await fetcher.fetchAll(ticker);
      const coldDuration = Date.now() - coldStart;
      
      // Warm cache fetch (immediate)
      const warmStart = Date.now();
      const data2 = await fetcher.fetchAll(ticker);
      const warmDuration = Date.now() - warmStart;
      
      // Calculate improvement
      const improvement = ((coldDuration - warmDuration) / coldDuration) * 100;
      
      console.log(`\nCache Performance for ${ticker}:`);
      console.log(`  Cold cache: ${coldDuration}ms`);
      console.log(`  Warm cache: ${warmDuration}ms`);
      console.log(`  Improvement: ${improvement.toFixed(1)}%`);
      console.log(`  Cache hit rate: ${(cache.getStats().hitRate * 100).toFixed(1)}%`);
      
      // Warm cache should be at least 80% faster
      expect(improvement).toBeGreaterThan(80);
      
      // Data should be identical
      expect(data2.financials.historicalPrices).toEqual(data1.financials.historicalPrices);
    });
    
    it('should handle cache memory efficiently', async () => {
      const tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const fetcher = createDataFetcher({
        ticker: 'DUMMY',
        cache,
        debugMode: false,
        includeNews: false
      });
      
      const memoryBefore = cache.getStats().totalMemoryMB;
      
      // Fetch multiple tickers
      for (const ticker of tickers) {
        await fetcher.fetchAll(ticker);
      }
      
      const stats = cache.getStats();
      const memoryAfter = stats.totalMemoryMB;
      const memoryPerTicker = (memoryAfter - memoryBefore) / tickers.length;
      
      console.log('\nCache Memory Usage:');
      console.log(`  Total entries: ${stats.size}`);
      console.log(`  Total memory: ${memoryAfter.toFixed(2)}MB`);
      console.log(`  Average per ticker: ${memoryPerTicker.toFixed(2)}MB`);
      console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      
      // Should use reasonable memory (less than 10MB per ticker)
      expect(memoryPerTicker).toBeLessThan(10);
    });
  });
  
  describe('Parallel Fetching Performance', () => {
    it('should efficiently fetch data for multiple tickers in parallel', async () => {
      const tickers = ['NVDA', 'AMD', 'INTC']; // Semiconductor companies
      
      // Sequential fetching
      const sequentialStart = Date.now();
      const sequentialResults = [];
      for (const ticker of tickers) {
        const fetcher = createDataFetcher({
          ticker,
          cache: new MemoryCache(), // Fresh cache for fair comparison
          includeNews: false
        });
        sequentialResults.push(await fetcher.fetchAll(ticker));
      }
      const sequentialDuration = Date.now() - sequentialStart;
      
      // Parallel fetching
      const parallelStart = Date.now();
      const parallelPromises = tickers.map(ticker => {
        const fetcher = createDataFetcher({
          ticker,
          cache: new MemoryCache(),
          includeNews: false
        });
        return fetcher.fetchAll(ticker);
      });
      const parallelResults = await Promise.all(parallelPromises);
      const parallelDuration = Date.now() - parallelStart;
      
      const speedup = sequentialDuration / parallelDuration;
      
      console.log('\nParallel Fetching Performance:');
      console.log(`  Sequential: ${sequentialDuration}ms`);
      console.log(`  Parallel: ${parallelDuration}ms`);
      console.log(`  Speedup: ${speedup.toFixed(2)}x`);
      
      // Parallel should be faster
      expect(parallelDuration).toBeLessThan(sequentialDuration);
      
      // Should achieve at least 1.5x speedup
      expect(speedup).toBeGreaterThan(1.5);
      
      // Results should be valid for all tickers
      [...sequentialResults, ...parallelResults].forEach(data => {
        expect(data.ticker).toBeTruthy();
        expect(data.financials.historicalPrices.length).toBeGreaterThan(0);
      });
    }, 60000);
  });
  
  describe('Data Processing Performance', () => {
    it('should efficiently process large historical datasets', async () => {
      const fetcher = createDataFetcher({
        ticker: 'SPY', // High liquidity ETF with lots of data
        cache,
        debugMode: false
      });
      
      const start = Date.now();
      const data = await fetcher.fetchAll('SPY');
      const duration = Date.now() - start;
      
      const priceCount = data.financials.historicalPrices.length;
      const processingRate = priceCount / (duration / 1000); // prices per second
      
      console.log('\nData Processing Performance:');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Price points processed: ${priceCount}`);
      console.log(`  Processing rate: ${processingRate.toFixed(0)} prices/second`);
      
      // Should process at least 100 prices per second
      expect(processingRate).toBeGreaterThan(100);
      
      // Validation should be efficient
      if (data.metadata.warnings) {
        console.log(`  Validation warnings: ${data.metadata.warnings.length}`);
      }
    });
    
    it('should efficiently calculate enrichment metrics', async () => {
      const fetcher = createDataFetcher({
        ticker: 'MSFT',
        cache,
        debugMode: false,
        includeNews: true
      });
      
      // Measure enrichment phase specifically
      let enrichmentStart = 0;
      let enrichmentEnd = 0;
      
      await fetcher.fetchAll('MSFT', (stage, progress) => {
        if (stage.includes('Enriching') && enrichmentStart === 0) {
          enrichmentStart = Date.now();
        } else if (stage.includes('Assembling') && enrichmentEnd === 0) {
          enrichmentEnd = Date.now();
        }
      });
      
      const enrichmentDuration = enrichmentEnd - enrichmentStart;
      
      console.log('\nEnrichment Performance:');
      console.log(`  Enrichment duration: ${enrichmentDuration}ms`);
      
      // Enrichment should be fast (under 500ms)
      expect(enrichmentDuration).toBeLessThan(500);
    });
  });
  
  describe('Error Recovery Performance', () => {
    it('should handle timeouts efficiently', async () => {
      const fetcher = createDataFetcher({
        ticker: 'AAPL',
        cache,
        debugMode: false,
        maxConcurrent: 5
      });
      
      // Override timeout for news to be very short
      const shortTimeoutFetcher = new DataFetcher({
        ticker: 'AAPL',
        cache,
        debugMode: true,
        adapters: fetcher['adapters']
      });
      
      // Time the full fetch with potential timeouts
      const start = Date.now();
      const data = await shortTimeoutFetcher.fetchAll('AAPL');
      const duration = Date.now() - start;
      
      console.log('\nTimeout Handling Performance:');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Failed sources: ${Object.values(data.metadata.sources)
        .filter(s => s.status === 'failed').length}`);
      
      // Should complete within reasonable time even with failures
      expect(duration).toBeLessThan(35000); // 35 seconds max
    });
  });
});

describeif('Real API Performance Tests', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = new MemoryCache();
  });
  
  it('should benchmark real-world performance across market caps', async () => {
    const stocks = [
      { ticker: 'AAPL', category: 'Mega Cap' },
      { ticker: 'CRM', category: 'Large Cap' },
      { ticker: 'DOCU', category: 'Mid Cap' },
      { ticker: 'PLUG', category: 'Small Cap' }
    ];
    
    const benchmarks = [];
    
    for (const stock of stocks) {
      const fetcher = createDataFetcher({
        ticker: stock.ticker,
        cache,
        includeNews: true,
        includeTranscripts: false
      });
      
      const phases: { [key: string]: number } = {};
      let lastTime = Date.now();
      
      const data = await fetcher.fetchAll(stock.ticker, (stage, progress) => {
        const now = Date.now();
        const phase = stage.split(' ')[0];
        if (!phases[phase]) {
          phases[phase] = now - lastTime;
          lastTime = now;
        }
      });
      
      benchmarks.push({
        ...stock,
        totalTime: Object.values(phases).reduce((a, b) => a + b, 0),
        phases,
        dataPoints: data.financials.historicalPrices.length,
        newsCount: data.news.length,
        completeness: data.metadata.completeness,
        quality: data.metadata.quality?.grade
      });
    }
    
    console.log('\nPerformance Benchmarks by Market Cap:');
    benchmarks.forEach(b => {
      console.log(`\n${b.ticker} (${b.category}):`);
      console.log(`  Total time: ${b.totalTime}ms`);
      console.log(`  Data points: ${b.dataPoints}`);
      console.log(`  News articles: ${b.newsCount}`);
      console.log(`  Completeness: ${b.completeness}%`);
      console.log(`  Quality: ${b.quality}`);
      console.log('  Phase breakdown:');
      Object.entries(b.phases).forEach(([phase, time]) => {
        console.log(`    ${phase}: ${time}ms`);
      });
    });
    
    // All should complete successfully
    benchmarks.forEach(b => {
      expect(b.completeness).toBeGreaterThan(50);
      expect(b.dataPoints).toBeGreaterThan(100);
    });
  }, 180000); // 3 minutes for all stocks
  
  it('should demonstrate cache effectiveness over time', async () => {
    const ticker = 'GOOGL';
    const measurements = [];
    
    // Create a shared fetcher
    const fetcher = createDataFetcher({
      ticker,
      cache,
      includeNews: false
    });
    
    // Make 5 consecutive fetches
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await fetcher.fetchAll(ticker);
      const duration = Date.now() - start;
      
      measurements.push({
        attempt: i + 1,
        duration,
        cacheStats: { ...cache.getStats() }
      });
      
      // Wait a bit between fetches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\nCache Effectiveness Over Time:');
    measurements.forEach(m => {
      console.log(`Attempt ${m.attempt}:`);
      console.log(`  Duration: ${m.duration}ms`);
      console.log(`  Cache hits: ${m.cacheStats.totalHits}`);
      console.log(`  Hit rate: ${(m.cacheStats.hitRate * 100).toFixed(1)}%`);
      console.log(`  Memory: ${m.cacheStats.totalMemoryMB.toFixed(2)}MB`);
    });
    
    // First fetch should be slowest
    expect(measurements[0].duration).toBeGreaterThan(measurements[1].duration);
    
    // Hit rate should improve
    expect(measurements[4].cacheStats.hitRate).toBeGreaterThan(0.5);
  }, 60000);
});