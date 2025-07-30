// src/reportGeneration/__tests__/manualTestWebScraping.ts
// Manual test script for web scraping functionality
// Context: Quick verification of Firecrawl and EDGAR integration

import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { EdgarAdapter } from '../adapters/edgarAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { MemoryCache } from '../utils/cache';

async function runManualTest() {
  console.log('=== Web Scraping Manual Test ===\n');
  
  // Check for API key
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || 'fc-79d2302cc006490fbde0e0373a4227fe';
  if (!firecrawlKey) {
    console.error('❌ No Firecrawl API key found!');
    console.log('Please set FIRECRAWL_API_KEY environment variable');
    return;
  }
  
  console.log('✅ Firecrawl API key found');
  console.log('Creating adapters...\n');
  
  const cache = new MemoryCache();
  
  // Create Firecrawl adapter
  const firecrawl = new FirecrawlAdapter({
    apiKey: firecrawlKey,
    cache,
    debugMode: true
  });
  
  // Create News adapter
  const news = new NewsAdapter({
    firecrawlAdapter: firecrawl,
    cache,
    debugMode: true
  });
  
  // Create EDGAR adapter
  const edgar = new EdgarAdapter({
    firecrawlAdapter: firecrawl,
    cache,
    debugMode: true
  });
  
  const testCompany = 'NVIDIA Corporation';
  const testTicker = 'NVDA';
  
  try {
    // Test 1: Fetch company news
    console.log(`📰 Test 1: Fetching news for ${testCompany}...`);
    const newsItems = await news.getCompanyNews(testTicker, 5, testCompany);
    console.log(`✅ Found ${newsItems.length} news articles:`);
    
    newsItems.slice(0, 3).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`);
      console.log(`   Source: ${item.source} | Date: ${new Date(item.publishedDate).toLocaleDateString()}`);
      console.log(`   Sentiment: ${item.sentiment} | Relevance: ${(item.relevanceScore * 100).toFixed(0)}%`);
      console.log(`   Summary: ${item.summary.substring(0, 150)}...`);
    });
    
    // Test 2: Analyze sentiment
    console.log(`\n📊 Test 2: Analyzing news sentiment...`);
    const sentiment = await news.getNewsSentiment(testTicker, testCompany);
    console.log('✅ Sentiment analysis:');
    console.log(`   Overall: ${sentiment.overall} (Score: ${sentiment.score.toFixed(2)})`);
    console.log(`   Positive: ${sentiment.positiveCount} | Neutral: ${sentiment.neutralCount} | Negative: ${sentiment.negativeCount}`);
    
    if (sentiment.trend) {
      console.log(`   Trend: ${sentiment.trend}`);
    }
    
    if (sentiment.keyTopics && sentiment.keyTopics.length > 0) {
      console.log(`   Key topics: ${sentiment.keyTopics.slice(0, 5).map(t => t.topic).join(', ')}`);
    }
    
    // Test 3: Find company events
    console.log(`\n📅 Test 3: Identifying company events...`);
    const events = await news.getCompanyEvents(testTicker, testCompany);
    console.log(`✅ Found ${events.length} notable events:`);
    
    events.slice(0, 3).forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.type.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   ${event.headline}`);
      console.log(`   Date: ${new Date(event.date).toLocaleDateString()} | Impact: ${event.impact}`);
    });
    
    // Test 4: SEC filing extraction
    console.log(`\n📄 Test 4: Extracting SEC filings...`);
    
    try {
      console.log('   Fetching company description from 10-K...');
      const description = await edgar.getCompanyDescription(testTicker);
      console.log(`✅ Company description (${description.length} chars):`);
      console.log(`   ${description.substring(0, 200)}...`);
    } catch (error: any) {
      console.log(`⚠️  Could not fetch 10-K description: ${error.message}`);
    }
    
    try {
      console.log('\n   Fetching recent 8-K filings...');
      const eightKs = await edgar.get8K(testTicker, 3);
      console.log(`✅ Found ${eightKs.length} recent 8-K filings`);
      
      if (eightKs.length > 0) {
        console.log(`   Latest: ${eightKs[0].filingDate} - ${eightKs[0].formType}`);
      }
    } catch (error: any) {
      console.log(`⚠️  Could not fetch 8-K filings: ${error.message}`);
    }
    
    // Test 5: Direct Firecrawl scraping
    console.log(`\n🔍 Test 5: Direct web scraping test...`);
    const testUrl = 'https://www.nvidia.com/en-us/about-nvidia/';
    console.log(`   Scraping ${testUrl}...`);
    
    try {
      const content = await firecrawl.scrapeUrl(testUrl);
      console.log(`✅ Scraped content (${content.length} chars)`);
      console.log(`   First line: ${content.split('\n')[0]}`);
    } catch (error: any) {
      console.log(`⚠️  Could not scrape URL: ${error.message}`);
    }
    
    // Test 6: Company profile extraction
    console.log(`\n🏢 Test 6: Extracting company profile...`);
    try {
      const profile = await firecrawl.extractCompanyProfile(testUrl);
      console.log('✅ Extracted company profile:');
      console.log(`   Name: ${profile.companyName || 'N/A'}`);
      console.log(`   Industry: ${profile.industry || 'N/A'}`);
      console.log(`   Founded: ${profile.founded || 'N/A'}`);
      console.log(`   Headquarters: ${profile.headquarters || 'N/A'}`);
    } catch (error: any) {
      console.log(`⚠️  Could not extract profile: ${error.message}`);
    }
    
    // Cache statistics
    console.log(`\n💾 Cache Statistics:`);
    const cacheStats = news.getCacheStats();
    console.log(`   Adapter: ${cacheStats.adapter}`);
    console.log(`   Entries: ${cacheStats.size}`);
    console.log(`   Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`   Memory: ${cacheStats.totalMemoryMB.toFixed(2)}MB`);
    
    console.log('\n✅ All tests completed!');
    
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

// Example usage function for documentation
export async function testWebScrapingIntegration() {
  const firecrawl = new FirecrawlAdapter({
    debugMode: true,
    apiKey: process.env.FIRECRAWL_API_KEY || 'fc-79d2302cc006490fbde0e0373a4227fe'
  });
  
  const news = new NewsAdapter({
    firecrawlAdapter: firecrawl,
    debugMode: true
  });
  
  try {
    // Get news with AI-powered extraction
    console.log('Fetching news for Apple...');
    const newsItems = await news.getCompanyNews('AAPL', 10, 'Apple Inc');
    console.log('Found', newsItems.length, 'articles');
    
    // Analyze sentiment
    console.log('\nAnalyzing sentiment...');
    const sentiment = await news.getNewsSentiment('AAPL', 'Apple Inc');
    console.log('Overall sentiment:', sentiment.overall);
    console.log('Sentiment score:', sentiment.score);
    
    // Find key events
    console.log('\nIdentifying events...');
    const events = await news.getCompanyEvents('AAPL', 'Apple Inc');
    console.log('Found', events.length, 'notable events');
    
    events.slice(0, 3).forEach(event => {
      console.log(`- ${event.type}: ${event.headline} (${event.impact} impact)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runManualTest().catch(console.error);
}