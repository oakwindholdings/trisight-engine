// src/reportGeneration/__tests__/manualTestTwelveData.ts
// Manual test script for TwelveData integration
// Context: Quick verification of API functionality

import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { MemoryCache } from '../utils/cache';

async function runManualTest() {
  console.log('=== TwelveData Manual Integration Test ===\n');
  
  // Check for API key
  const apiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found!');
    console.log('Please set REACT_APP_TWELVE_DATA_API_KEY environment variable');
    return;
  }
  
  console.log('✅ API key found');
  console.log('Creating adapter with Ultra tier settings...\n');
  
  const cache = new MemoryCache();
  const adapter = new TwelveDataAdapter({
    apiKey,
    cache,
    debugMode: true,
    isUltraTier: true
  });
  
  const testSymbol = 'NVDA';
  
  try {
    // Test 1: Basic Quote
    console.log(`📊 Test 1: Fetching quote for ${testSymbol}...`);
    const quote = await adapter.getQuote(testSymbol);
    console.log('✅ Quote received:');
    console.log(`  - Price: $${quote.close}`);
    console.log(`  - Volume: ${parseInt(quote.volume).toLocaleString()}`);
    console.log(`  - Change: ${quote.percent_change}%`);
    console.log(`  - Market Cap: $${(parseFloat(quote.market_cap || '0') / 1e9).toFixed(2)}B`);
    
    // Test 2: Historical Prices
    console.log(`\n📈 Test 2: Fetching historical prices...`);
    const prices = await adapter.getTimeSeries(testSymbol, '1day', 5);
    console.log(`✅ Got ${prices.length} days of data:`);
    prices.slice(0, 3).forEach(price => {
      console.log(`  - ${price.date}: $${price.close.toFixed(2)} (Vol: ${price.volume.toLocaleString()})`);
    });
    
    // Test 3: Technical Indicators
    console.log(`\n📉 Test 3: Fetching technical indicators...`);
    const technicals = await adapter.getTechnicalIndicators(testSymbol);
    console.log('✅ Technical indicators:');
    console.log(`  - SMA20: $${technicals.sma20.toFixed(2)}`);
    console.log(`  - SMA50: $${technicals.sma50.toFixed(2)}`);
    console.log(`  - RSI: ${technicals.rsi.toFixed(2)}`);
    console.log(`  - MACD: ${technicals.macd.macd.toFixed(2)}`);
    console.log(`  - Volume Trend: ${technicals.volume.trend}`);
    
    // Test 4: Fundamentals (expensive - 50 credits)
    console.log(`\n💰 Test 4: Fetching fundamentals (50 credits)...`);
    const fundamentals = await adapter.getFundamentals(testSymbol);
    console.log('✅ Fundamental data:');
    if (fundamentals.keyMetrics) {
      console.log(`  - P/E Ratio: ${fundamentals.keyMetrics.peRatio}`);
      console.log(`  - ROE: ${(fundamentals.keyMetrics.roe * 100).toFixed(2)}%`);
      console.log(`  - Debt/Equity: ${fundamentals.keyMetrics.debtToEquity}`);
    }
    if (fundamentals.incomeStatement?.length) {
      const latest = fundamentals.incomeStatement[0];
      console.log(`  - Latest Revenue: $${(latest.revenue / 1e9).toFixed(2)}B`);
      console.log(`  - Latest EPS: $${latest.eps}`);
    }
    
    // Test 5: Analyst Ratings (Ultra tier only)
    console.log(`\n🎯 Test 5: Fetching analyst ratings (Ultra tier)...`);
    const ratings = await adapter.getAnalystRatings(testSymbol);
    console.log('✅ Analyst consensus:');
    console.log(`  - Rating: ${ratings.consensus.rating}`);
    console.log(`  - Score: ${ratings.consensus.score}/5`);
    console.log(`  - Analysts: ${ratings.consensus.count}`);
    if (ratings.priceTargets.length > 0) {
      const avgTarget = ratings.priceTargets.reduce((sum, t) => sum + t.target, 0) / ratings.priceTargets.length;
      console.log(`  - Avg Price Target: $${avgTarget.toFixed(2)}`);
    }
    
    // Test 6: Cache Performance
    console.log(`\n⚡ Test 6: Testing cache performance...`);
    const start1 = Date.now();
    await adapter.getQuote(testSymbol);
    const apiTime = Date.now() - start1;
    
    const start2 = Date.now();
    await adapter.getQuote(testSymbol); // Should hit cache
    const cacheTime = Date.now() - start2;
    
    console.log(`✅ Cache working:`);
    console.log(`  - API call: ${apiTime}ms`);
    console.log(`  - Cache hit: ${cacheTime}ms`);
    console.log(`  - Speed improvement: ${(apiTime / cacheTime).toFixed(1)}x faster`);
    
    // API Usage Summary
    console.log(`\n📊 API Usage Summary:`);
    const usage = adapter.getApiUsageInfo();
    console.log(`  - Credits available: ${usage.availableCredits}/${usage.creditsPerMinute}`);
    console.log(`  - Ultra tier: ${usage.isUltraTier ? 'Yes' : 'No'}`);
    
    // Cache Stats
    const cacheStats = adapter.getCacheStats();
    console.log(`\n💾 Cache Statistics:`);
    console.log(`  - Entries: ${cacheStats.size}`);
    console.log(`  - Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`  - Memory: ${cacheStats.totalMemoryMB.toFixed(2)}MB`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.category) {
      console.error(`Error category: ${error.category}`);
      console.error(`Retryable: ${error.retryable}`);
    }
    
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
runManualTest().catch(console.error);