// src/reportGeneration/__tests__/manualTestDataFetcher.ts
// Manual test script for the enhanced data fetching orchestration
// Context: Demonstrates the sophisticated data gathering and resilience features

import { createDataFetcher } from '../core/dataFetcher';
import { MemoryCache } from '../utils/cache';

async function runManualTest() {
  console.log('=== Enhanced DataFetcher Manual Test ===\n');
  
  // Check for API keys
  const twelveDataKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || 'fc-79d2302cc006490fbde0e0373a4227fe';
  
  if (!twelveDataKey) {
    console.error('❌ No TwelveData API key found!');
    console.log('Please set REACT_APP_TWELVE_DATA_API_KEY environment variable');
    return;
  }
  
  console.log('✅ API keys found');
  console.log('Creating enhanced DataFetcher...\n');
  
  const cache = new MemoryCache();
  const testTicker = 'NVDA';
  
  try {
    // Create the data fetcher with progress tracking
    const dataFetcher = createDataFetcher({
      ticker: testTicker,
      cache,
      debugMode: true,
      includeNews: true,
      includeTranscripts: true,
      apiKey: twelveDataKey,
      firecrawlApiKey: firecrawlKey
    });
    
    console.log(`📊 Fetching comprehensive data for ${testTicker}...\n`);
    
    // Track progress
    const startTime = Date.now();
    let lastProgress = 0;
    
    const result = await dataFetcher.fetchAll(testTicker, (stage, progress) => {
      if (progress > lastProgress) {
        console.log(`[${progress}%] ${stage}`);
        lastProgress = progress;
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Data fetch completed in ${(duration / 1000).toFixed(2)} seconds\n`);
    
    // Display results summary
    console.log('📋 Data Summary:');
    console.log('================');
    
    // Company Information
    console.log('\n🏢 Company Information:');
    console.log(`  Name: ${result.companyName}`);
    console.log(`  Ticker: ${result.ticker}`);
    console.log(`  Sector: ${result.sector}`);
    console.log(`  Industry: ${result.industry}`);
    console.log(`  Description: ${result.description.substring(0, 100)}...`);
    
    // Financial Data
    console.log('\n💰 Financial Data:');
    console.log(`  Income Statements: ${result.financials.incomeStatement.length} periods`);
    console.log(`  Balance Sheets: ${result.financials.balanceSheet.length} periods`);
    console.log(`  Cash Flow Statements: ${result.financials.cashFlow.length} periods`);
    console.log(`  Historical Prices: ${result.financials.historicalPrices.length} days`);
    
    if (result.financials.keyMetrics) {
      console.log(`  Key Metrics:`);
      console.log(`    - Market Cap: $${(result.financials.keyMetrics.marketCap / 1e9).toFixed(2)}B`);
      console.log(`    - P/E Ratio: ${result.financials.keyMetrics.peRatio.toFixed(2)}`);
      console.log(`    - ROE: ${(result.financials.keyMetrics.roe * 100).toFixed(1)}%`);
    }
    
    // Technical Indicators
    console.log('\n📈 Technical Indicators:');
    console.log(`  SMA 20: ${result.technicals.sma20.toFixed(2)}`);
    console.log(`  SMA 50: ${result.technicals.sma50.toFixed(2)}`);
    console.log(`  SMA 200: ${result.technicals.sma200.toFixed(2)}`);
    console.log(`  RSI: ${result.technicals.rsi.toFixed(1)}`);
    if (result.technicals.volatility) {
      console.log(`  Volatility: ${(result.technicals.volatility * 100).toFixed(1)}%`);
    }
    if (result.technicals.support && result.technicals.resistance) {
      console.log(`  Support: $${result.technicals.support.toFixed(2)}`);
      console.log(`  Resistance: $${result.technicals.resistance.toFixed(2)}`);
    }
    
    // Analyst Data
    console.log('\n👥 Analyst Coverage:');
    console.log(`  Consensus: ${result.analysts.consensus.rating.toUpperCase()}`);
    console.log(`  Average Score: ${result.analysts.consensus.score.toFixed(1)}/5`);
    console.log(`  Number of Analysts: ${result.analysts.consensus.count}`);
    
    // News and Sentiment
    console.log('\n📰 News & Sentiment:');
    console.log(`  News Articles: ${result.news.length}`);
    console.log(`  Earnings Transcripts: ${result.transcripts.length}`);
    
    if (result.metadata.aggregatedSentiment) {
      const sentiment = result.metadata.aggregatedSentiment;
      console.log(`  Overall Sentiment: ${sentiment.overall.toUpperCase()}`);
      console.log(`  Sentiment Score: ${sentiment.score.toFixed(2)}`);
    }
    
    // Data Quality Assessment
    console.log('\n📊 Data Quality Assessment:');
    console.log(`  Completeness: ${result.metadata.completeness}%`);
    
    if (result.metadata.quality) {
      const quality = result.metadata.quality;
      console.log(`  Overall Quality: ${(quality.overall * 100).toFixed(0)}% (Grade: ${quality.grade})`);
      console.log(`  Component Scores:`);
      console.log(`    - Financials: ${(quality.financials * 100).toFixed(0)}%`);
      console.log(`    - News: ${(quality.news * 100).toFixed(0)}%`);
      console.log(`    - Technicals: ${(quality.technicals * 100).toFixed(0)}%`);
      console.log(`    - Analysts: ${(quality.analysts * 100).toFixed(0)}%`);
    }
    
    // Data Source Status
    console.log('\n🔌 Data Source Status:');
    const sources = result.metadata.sources;
    const successCount = Object.values(sources).filter((s: any) => typeof s === 'object' && s.status === 'success').length;
    const totalCount = Object.keys(sources).length;
    console.log(`  Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);
    
    Object.entries(sources).forEach(([source, info]) => {
      const status = info.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${source}: ${info.status}`);
      if (info.error) {
        console.log(`     Error: ${info.error}`);
      }
      if (info.recordCount) {
        console.log(`     Records: ${info.recordCount}`);
      }
    });
    
    // Warnings and Errors
    if (result.metadata.warnings && result.metadata.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.metadata.warnings.slice(0, 5).forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
      if (result.metadata.warnings.length > 5) {
        console.log(`  ... and ${result.metadata.warnings.length - 5} more warnings`);
      }
    }
    
    if (result.metadata.errors && result.metadata.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.metadata.errors.forEach(error => {
        console.log(`  - [${error.source}] ${error.message}`);
      });
    }
    
    // Cache Statistics
    console.log('\n💾 Cache Performance:');
    const cacheStats = cache.getStats();
    console.log(`  Entries: ${cacheStats.size}`);
    console.log(`  Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`  Memory Usage: ${cacheStats.totalMemoryMB.toFixed(2)}MB`);
    
    // Sample News Items
    if (result.news.length > 0) {
      console.log('\n📰 Recent News Headlines:');
      result.news.slice(0, 3).forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.title}`);
        console.log(`     ${article.source} | ${new Date(article.publishedDate).toLocaleDateString()}`);
        console.log(`     Sentiment: ${article.sentiment} | Relevance: ${(article.relevanceScore || 0) * 100}%`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Example usage function for documentation
export async function demonstrateDataFetcher() {
  const dataFetcher = createDataFetcher({
    ticker: 'AAPL',
    debugMode: true,
    includeNews: true,
    includeTranscripts: true
  });
  
  try {
    console.log('Fetching comprehensive data for Apple Inc...');
    
    const data = await dataFetcher.fetchAll('AAPL', (stage, progress) => {
      console.log(`[${progress}%] ${stage}`);
    });
    
    console.log('\nData fetched successfully!');
    console.log('Company:', data.companyName);
    console.log('Market Cap:', `$${(data.financials.keyMetrics.marketCap / 1e9).toFixed(2)}B`);
    console.log('P/E Ratio:', data.financials.keyMetrics.peRatio.toFixed(2));
    console.log('News Articles:', data.news.length);
    console.log('Data Quality:', data.metadata.quality?.grade || 'N/A');
    console.log('Completeness:', `${data.metadata.completeness}%`);
    
    // Demonstrate resilience
    console.log('\nData Sources Status:');
    Object.entries(data.metadata.sources).forEach(([source, info]) => {
      console.log(`- ${source}: ${info.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test different scenarios
export async function testScenarios() {
  console.log('Testing various scenarios...\n');
  
  // Scenario 1: Minimal data fetch (fast mode)
  console.log('1. Fast mode - Core data only:');
  const fastFetcher = createDataFetcher({
    ticker: 'MSFT',
    includeNews: false,
    includeTranscripts: false
  });
  
  const fastStart = Date.now();
  await fastFetcher.fetchAll('MSFT');
  console.log(`   Completed in ${Date.now() - fastStart}ms\n`);
  
  // Scenario 2: Full data fetch
  console.log('2. Full mode - All data sources:');
  const fullFetcher = createDataFetcher({
    ticker: 'GOOGL',
    includeNews: true,
    includeTranscripts: true
  });
  
  const fullStart = Date.now();
  await fullFetcher.fetchAll('GOOGL');
  console.log(`   Completed in ${Date.now() - fullStart}ms\n`);
  
  // Scenario 3: Error resilience
  console.log('3. Testing error resilience with invalid ticker:');
  const errorFetcher = createDataFetcher({
    ticker: 'INVALID123'
  });
  
  try {
    await errorFetcher.fetchAll('INVALID123');
  } catch (error: any) {
    console.log(`   Handled gracefully: ${error.message}\n`);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runManualTest().catch(console.error);
}