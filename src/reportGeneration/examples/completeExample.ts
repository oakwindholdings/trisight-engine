// src/reportGeneration/examples/completeExample.ts
// Complete example showing the full data fetching pipeline with performance optimization
// Context: Demonstrates how to use the orchestrated system with all performance features

import { createDataFetcher } from '../core/dataFetcher';
import { performanceMonitor } from '../utils/performanceMonitor';
import { cacheWarmer, commonStrategies } from '../utils/cacheWarming';
import { ParallelOrchestrator } from '../utils/parallelOrchestrator';
import { ResourcePool } from '../utils/resourcePool';
import logger from '../../utils/logger';

// '../core/dataOrchestrator' never existed in this repo; local stub keeps this
// unreferenced example compiling without inventing a fake module.
const DataOrchestrator: any = class { constructor(_cfg: any) { throw new Error('DataOrchestrator was never implemented'); } };

// Example configuration for production-ready data fetching
const EXAMPLE_CONFIG = {
  ticker: 'NVDA',
  debugMode: true,
  includeNews: true,
  includeTranscripts: true,
  maxConcurrent: 5,
  cacheEnabled: true,
  performanceTracking: true
};

// Popular stocks to warm cache for
const POPULAR_STOCKS = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'];

async function setupCacheWarming(fetcher: ReturnType<typeof createDataFetcher>) {
  console.log('Setting up cache warming strategies...\n');
  
  // Register market data warming strategy
  cacheWarmer.registerStrategy(
    commonStrategies.marketDataWarming(
      POPULAR_STOCKS,
      async (symbol) => {
        return (fetcher as any).adapters.marketData.fetchHistoricalPrices(symbol, '1day', 30);
      }
    )
  );
  
  // Register company profile warming strategy
  cacheWarmer.registerStrategy(
    commonStrategies.companyProfileWarming(
      POPULAR_STOCKS,
      async (symbol) => {
        return (fetcher as any).adapters.companyProfile.fetchCompanyProfile(symbol);
      }
    )
  );
  
  // Warm caches before starting
  const warmingResults = await cacheWarmer.warmAllCaches();
  console.log(`Cache warming completed: ${warmingResults.length} strategies executed\n`);
}

async function demonstrateParallelFetching() {
  console.log('=== Parallel Data Fetching Example ===\n');
  
  const orchestrator = new ParallelOrchestrator({
    maxConcurrency: 3,
    defaultTimeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    rateLimitPerSecond: 10
  });
  
  const fetcher = createDataFetcher(EXAMPLE_CONFIG);
  
  // Define tasks with dependencies
  const tasks = [
    {
      id: 'company_profile',
      priority: 100,
      execute: async () => {
        return (fetcher as any).adapters.companyProfile.fetchCompanyProfile('NVDA');
      }
    },
    {
      id: 'market_data',
      priority: 90,
      execute: async () => {
        return (fetcher as any).adapters.marketData.fetchHistoricalPrices('NVDA', '1day', 365);
      }
    },
    {
      id: 'financials',
      priority: 80,
      execute: async () => {
        return (fetcher as any).adapters.financials.fetchIncomeStatement('NVDA');
      }
    },
    {
      id: 'key_metrics',
      priority: 70,
      dependencies: ['financials', 'market_data'],
      execute: async () => {
        return (fetcher as any).adapters.financials.fetchKeyMetrics('NVDA');
      }
    },
    {
      id: 'news',
      priority: 60,
      execute: async () => {
        return (fetcher as any).adapters.news.fetchNews('NVDA', 20);
      }
    },
    {
      id: 'sentiment_analysis',
      priority: 50,
      dependencies: ['news'],
      execute: async () => {
        // Simulate sentiment analysis
        return { overall: 'positive', score: 0.75 };
      }
    }
  ];
  
  const startTime = performance.now();
  const results = await orchestrator.executeTasks(tasks);
  const duration = performance.now() - startTime;
  
  console.log(`Parallel fetching completed in ${(duration / 1000).toFixed(2)}s\n`);
  
  // Display results
  results.forEach((result, taskId) => {
    console.log(`${taskId}: ${result.success ? '✅' : '❌'} (${result.duration.toFixed(0)}ms)`);
  });
  
  return results;
}

async function demonstrateResourcePooling() {
  console.log('\n=== Resource Pooling Example ===\n');
  
  // Create a pool for API connections
  const apiPool = new ResourcePool({
    name: 'api_connections',
    minSize: 2,
    maxSize: 5,
    acquireTimeout: 5000,
    idleTimeout: 30000,
    maxUseCount: 100,
    factory: async () => {
      // Simulate creating an expensive API connection
      return {
        id: Math.random().toString(36),
        fetch: async (url: string) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          return { url, data: 'mock data' };
        }
      };
    },
    destroyer: async (resource) => {
      // Cleanup connection
      console.log(`Destroying API connection ${resource.id}`);
    }
  });
  
  // Use the pool for multiple concurrent requests
  const requests = Array(10).fill(0).map((_, i) => async () => {
    const resource = await apiPool.acquire();
    try {
      const result = await resource.resource.fetch(`/api/data/${i}`);
      console.log(`Request ${i} completed using connection ${resource.resource.id}`);
      return result;
    } finally {
      await apiPool.release(resource);
    }
  });
  
  await Promise.all(requests.map(req => req()));
  
  const stats = apiPool.getStats();
  console.log('\nPool Statistics:', stats);
  
  await apiPool.dispose();
}

async function generateComprehensiveReport() {
  console.log('Starting comprehensive report generation for NVIDIA...\n');
  
  // Start performance monitoring
  performanceMonitor.reset();
  
  // Create orchestrator with full configuration
  const orchestrator = new DataOrchestrator({
    ticker: 'NVDA',
    debugMode: true,
    includeNews: true,
    includeTranscripts: true,
    maxConcurrent: 5,
    retryAttempts: 3,
    timeoutMs: 30000
  });
  
  try {
    // Setup cache warming
    await setupCacheWarming(orchestrator.fetcher);
    
    // Fetch all data with performance tracking
    const companyData = await performanceMonitor.measureOperation(
      'complete_data_fetch',
      async () => {
        return await orchestrator.fetchCompanyData();
      }
    );
    
    // Display summary of fetched data
    console.log('\n=== Data Fetch Complete ===');
    console.log(`Company: ${companyData.companyName}`);
    console.log(`Sector: ${companyData.sector}`);
    console.log(`Industry: ${companyData.industry}`);
    
    // Financial data summary
    console.log('\n--- Financial Data ---');
    console.log(`Historical Prices: ${companyData.financials.historicalPrices.length} days`);
    console.log(`Income Statements: ${companyData.financials.incomeStatement?.length || 0}`);
    
    const latestPrice = companyData.financials.historicalPrices[0];
    if (latestPrice) {
      console.log(`Current Price: $${latestPrice.close.toFixed(2)}`);
      console.log(`Volume: ${latestPrice.volume.toLocaleString()}`);
    }
    
    // Key metrics
    const metrics = companyData.financials.keyMetrics;
    console.log('\n--- Key Metrics ---');
    console.log(`Market Cap: $${(metrics.marketCap / 1e9).toFixed(2)}B`);
    console.log(`P/E Ratio: ${metrics.peRatio.toFixed(2)}`);
    console.log(`Revenue Growth: ${(metrics.revenueGrowth * 100).toFixed(2)}%`);
    console.log(`Profit Margin: ${(metrics.profitMargin * 100).toFixed(2)}%`);
    console.log(`Dividend Yield: ${(metrics.dividendYield * 100).toFixed(2)}%`);
    
    // Technical indicators
    console.log('\n--- Technical Indicators ---');
    console.log(`RSI: ${companyData.technicals.rsi.toFixed(2)}`);
    console.log(`MACD Signal: ${companyData.technicals.macd.signal}`);
    console.log(`SMA 50: $${companyData.technicals.sma50.toFixed(2)}`);
    console.log(`SMA 200: $${companyData.technicals.sma200.toFixed(2)}`);
    console.log(`Volume Trend: ${companyData.technicals.volume.trend}`);
    console.log(`Support: $${companyData.technicals.support.toFixed(2)}`);
    console.log(`Resistance: $${companyData.technicals.resistance.toFixed(2)}`);
    
    // News and sentiment
    console.log('\n--- News & Sentiment ---');
    console.log(`News Articles: ${companyData.news.length}`);
    console.log(`Transcripts: ${companyData.transcripts.length}`);
    console.log(`Social Mentions: ${companyData.socialSentiment.mentionCount}`);
    
    if (companyData.metadata.aggregatedSentiment) {
      const sentiment = companyData.metadata.aggregatedSentiment;
      console.log(`Overall Sentiment: ${sentiment.overall} (${sentiment.score.toFixed(2)})`);
      console.log(`News Sentiment: ${sentiment.sources.news.toFixed(2)}`);
      console.log(`Social Sentiment: ${sentiment.sources.social.toFixed(2)}`);
    }
    
    // Analyst data
    console.log('\n--- Analyst Consensus ---');
    const consensus = companyData.analysts.consensus;
    console.log(`Rating: ${consensus.rating} (${consensus.score.toFixed(1)}/5)`);
    console.log(`Number of Analysts: ${consensus.count}`);
    console.log(`Price Targets: ${companyData.analysts.priceTargets.length}`);
    
    if (companyData.analysts.priceTargets.length > 0) {
      const targets = companyData.analysts.priceTargets;
      const avgTarget = targets.reduce((sum, t) => sum + t.target, 0) / targets.length;
      console.log(`Average Target: $${avgTarget.toFixed(2)}`);
    }
    
    // Data quality assessment
    console.log('\n--- Data Quality ---');
    console.log(`Completeness: ${companyData.metadata.completeness}%`);
    console.log(`Quality Grade: ${companyData.metadata.dataQuality?.grade || 'N/A'}`);
    console.log(`Data Freshness: ${companyData.metadata.lastUpdated}`);
    
    // Source status
    console.log('\n--- Source Status ---');
    Object.entries(companyData.metadata.sources).forEach(([source, info]: [string, any]) => {
      const status = info.status === 'success' ? '✅' : info.status === 'partial' ? '⚠️' : '❌';
      console.log(`${status} ${source}: ${info.status}${
        info.recordCount ? ` (${info.recordCount} records)` : ''
      }`);
    });
    
    // Performance report
    const perfReport = performanceMonitor.generateReport();
    
    console.log('\n--- Performance Metrics ---');
    console.log(`Total Operations: ${Object.keys(perfReport.summary).length}`);
    
    // Show top slowest operations
    const slowOps = Object.entries(perfReport.summary)
      .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
      .slice(0, 5);
    
    console.log('\nSlowest Operations:');
    slowOps.forEach(([name, stats]) => {
      console.log(`- ${name}: ${(stats.avgDuration / 1000).toFixed(2)}s avg (${stats.count} calls)`);
    });
    
    console.log('\nResource Usage:');
    console.log(`- Memory: ${perfReport.resourceUsage.memoryUsageMB}MB`);
    console.log(`- API Calls: ${perfReport.resourceUsage.apiCallsCount}`);
    console.log(`- Cache Hit Rate: ${(perfReport.resourceUsage.cacheHitRate * 100).toFixed(1)}%`);
    
    // Bottlenecks and recommendations
    if (perfReport.bottlenecks.length > 0) {
      console.log('\nPerformance Bottlenecks:');
      perfReport.bottlenecks.forEach(b => console.log(`- ${b}`));
    }
    
    if (perfReport.recommendations.length > 0) {
      console.log('\nOptimization Recommendations:');
      perfReport.recommendations.forEach(r => console.log(`- ${r}`));
    }
    
    // Save the data for next phase
    console.log('\n✅ Data fetching complete! Ready for processing phase.');
    
    return companyData;
    
  } catch (error) {
    console.error('\n❌ Error during data fetching:', error);
    
    // Log performance data even on failure
    const perfReport = performanceMonitor.generateReport();
    console.log('\nPerformance Report on Failure:');
    console.log('Failed Operations:', 
      Object.entries(perfReport.summary)
        .filter(([, stats]) => stats.successRate < 1)
        .map(([name, stats]) => `${name} (${Math.round(stats.successRate * 100)}% success)`)
    );
    
    throw error;
  }
}

// Run the complete example with all features
async function runCompleteExample() {
  try {
    console.log('=== TriSight Report Generation - Complete Example ===\n');
    
    // Demonstrate parallel fetching
    await demonstrateParallelFetching();
    
    // Demonstrate resource pooling
    await demonstrateResourcePooling();
    
    // Generate comprehensive report
    console.log('\n=== Comprehensive Report Generation ===\n');
    const report = await generateComprehensiveReport();
    
    console.log('\n✅ Example completed successfully!');
    console.log('\nNext Steps:');
    console.log('1. Use the fetched data with report templates');
    console.log('2. Apply AI processing for insights');
    console.log('3. Generate visualizations');
    console.log('4. Export to various formats');
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    throw error;
  }
}

// Run the example if called directly
if (require.main === module) {
  runCompleteExample()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { 
  generateComprehensiveReport,
  demonstrateParallelFetching,
  demonstrateResourcePooling,
  runCompleteExample
};