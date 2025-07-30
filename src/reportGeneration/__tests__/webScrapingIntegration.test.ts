// src/reportGeneration/__tests__/webScrapingIntegration.test.ts
// Integration tests for web scraping capabilities
// Context: Tests full flow of news aggregation and SEC filing extraction

import { NewsAdapter } from '../adapters/newsAdapter';
import { EdgarAdapter } from '../adapters/edgarAdapter';
import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { DataFetcher } from '../core/dataFetcher';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { MemoryCache } from '../utils/cache';

// Skip these tests in CI or when no API keys are available
const hasFirecrawlKey = process.env.FIRECRAWL_API_KEY || false;
const hasTwelveDataKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || false;
const describeif = (hasFirecrawlKey && hasTwelveDataKey) ? describe : describe.skip;

describe('Web Scraping Integration Tests', () => {
  let cache: MemoryCache;
  let firecrawl: FirecrawlAdapter;
  let news: NewsAdapter;
  let edgar: EdgarAdapter;
  let dataFetcher: DataFetcher;
  
  beforeEach(() => {
    cache = new MemoryCache();
    
    // Create shared Firecrawl instance
    firecrawl = new FirecrawlAdapter({
      cache,
      debugMode: false,
      apiKey: process.env.FIRECRAWL_API_KEY || 'test-key'
    });
    
    // Create adapters
    news = new NewsAdapter({
      firecrawlAdapter: firecrawl,
      cache,
      debugMode: false
    });
    
    edgar = new EdgarAdapter({
      firecrawlAdapter: firecrawl,
      cache,
      debugMode: false
    });
  });
  
  afterEach(() => {
    cache.clear();
  });
  
  describe('News and Sentiment Analysis', () => {
    it('should aggregate news from multiple sources', async () => {
      const newsItems = await news.getCompanyNews('NVDA', 10, 'NVIDIA Corporation');
      
      expect(newsItems).toBeDefined();
      expect(newsItems.length).toBeGreaterThan(0);
      
      // Verify news item structure
      newsItems.forEach(item => {
        expect(item).toMatchObject({
          title: expect.any(String),
          url: expect.any(String),
          source: expect.any(String),
          publishedDate: expect.any(String),
          summary: expect.any(String),
          sentiment: expect.stringMatching(/positive|neutral|negative/),
          relevanceScore: expect.any(Number)
        });
      });
    });
    
    it('should analyze sentiment across news articles', async () => {
      const sentiment = await news.getNewsSentiment('NVDA', 'NVIDIA Corporation');
      
      expect(sentiment).toMatchObject({
        overall: expect.stringMatching(/positive|neutral|negative/),
        score: expect.any(Number),
        positiveCount: expect.any(Number),
        negativeCount: expect.any(Number),
        neutralCount: expect.any(Number),
        articles: expect.any(Array)
      });
      
      // Score should be between -1 and 1
      expect(sentiment.score).toBeGreaterThanOrEqual(-1);
      expect(sentiment.score).toBeLessThanOrEqual(1);
    });
    
    it('should identify key events from news', async () => {
      const events = await news.getCompanyEvents('NVDA', 'NVIDIA Corporation');
      
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
      
      // If events found, verify structure
      if (events.length > 0) {
        expect(events[0]).toMatchObject({
          date: expect.any(String),
          type: expect.any(String),
          headline: expect.any(String),
          description: expect.any(String),
          impact: expect.stringMatching(/high|medium|low/),
          source: expect.any(String),
          url: expect.any(String)
        });
      }
    });
    
    it('should extract earnings-related events', async () => {
      const earningsEvents = await news.getEarningsEvents('NVDA', 'NVIDIA Corporation');
      
      expect(earningsEvents).toBeDefined();
      expect(Array.isArray(earningsEvents)).toBe(true);
      
      // Earnings events should have specific types
      earningsEvents.forEach(event => {
        expect(event.type).toMatch(
          /earnings_beat|earnings_miss|guidance_update|forecast_revision|earnings_announcement/
        );
      });
    });
  });
  
  describe('SEC Filing Integration', () => {
    it('should extract business description from 10-K', async () => {
      const description = await edgar.getCompanyDescription('NVDA');
      
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(100);
      expect(typeof description).toBe('string');
    });
    
    it('should fetch and parse 10-K filing', async () => {
      const tenK = await edgar.get10K('NVDA');
      
      expect(tenK).toMatchObject({
        formType: '10-K',
        filingDate: expect.any(String),
        url: expect.stringContaining('sec.gov')
      });
      
      // Should have extracted data
      if (tenK.businessDescription) {
        expect(tenK.businessDescription.length).toBeGreaterThan(0);
      }
      
      if (tenK.riskFactors) {
        expect(Array.isArray(tenK.riskFactors)).toBe(true);
      }
    });
    
    it('should fetch recent 8-K filings', async () => {
      const eightKs = await edgar.get8K('NVDA', 3);
      
      expect(Array.isArray(eightKs)).toBe(true);
      expect(eightKs.length).toBeLessThanOrEqual(3);
      
      // Verify 8-K structure
      eightKs.forEach(filing => {
        expect(filing).toMatchObject({
          formType: '8-K',
          filingDate: expect.any(String),
          url: expect.any(String)
        });
      });
    });
  });
  
  describe('Full Data Fetcher Integration', () => {
    beforeEach(() => {
      // Create full data fetcher with all adapters
      const twelveData = new TwelveDataAdapter({
        cache,
        debugMode: false
      });
      
      dataFetcher = new DataFetcher({
        ticker: 'NVDA',
        cache,
        adapters: {
          twelveData,
          edgar,
          news,
          firecrawl
        }
      });
    });
    
    it('should fetch comprehensive company data including news', async () => {
      const companyData = await dataFetcher.fetchAll('NVDA', (stage, progress) => {
        console.log(`${stage}: ${Math.round(progress * 100)}%`);
      });
      
      expect(companyData).toMatchObject({
        ticker: 'NVDA',
        companyName: expect.any(String),
        description: expect.any(String),
        sector: expect.any(String),
        industry: expect.any(String),
        financials: expect.any(Object),
        news: expect.any(Array),
        transcripts: expect.any(Array),
        technicals: expect.any(Object),
        analysts: expect.any(Object),
        metadata: expect.any(Object)
      });
      
      // Should have news articles
      expect(companyData.news.length).toBeGreaterThan(0);
    });
  });
  
  describe('Cache and Performance', () => {
    it('should cache news articles effectively', async () => {
      const start1 = Date.now();
      const news1 = await news.getCompanyNews('NVDA', 5);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      const news2 = await news.getCompanyNews('NVDA', 5);
      const time2 = Date.now() - start2;
      
      // Cache should be much faster
      expect(time2).toBeLessThan(time1 / 10);
      expect(news1).toEqual(news2);
    });
    
    it('should handle concurrent requests efficiently', async () => {
      const tickers = ['NVDA', 'AAPL', 'MSFT'];
      
      const promises = tickers.map(ticker => 
        news.getCompanyNews(ticker, 5)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(newsItems => {
        expect(Array.isArray(newsItems)).toBe(true);
      });
    });
  });
});

// Real API integration tests (only run with actual API keys)
describeif('Real Firecrawl API Integration', () => {
  let adapter: FirecrawlAdapter;
  
  beforeEach(() => {
    adapter = new FirecrawlAdapter({
      apiKey: process.env.FIRECRAWL_API_KEY,
      debugMode: true
    });
  });
  
  it('should fetch real news about a company', async () => {
    const news = await adapter.getCompanyNews('Apple Inc', 'AAPL', 3);
    
    expect(news).toBeDefined();
    expect(news.length).toBeGreaterThan(0);
    
    console.log('Sample news item:', {
      title: news[0].title,
      source: news[0].source,
      sentiment: news[0].sentiment,
      date: news[0].publishedDate
    });
  }, 30000); // 30 second timeout for real API calls
  
  it('should extract company profile from website', async () => {
    const profile = await adapter.extractCompanyProfile('https://www.apple.com/newsroom/');
    
    expect(profile).toBeDefined();
    console.log('Extracted profile:', profile);
  }, 30000);
  
  it('should scrape and extract content from URL', async () => {
    const content = await adapter.scrapeUrl('https://www.reuters.com/technology/');
    
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(1000);
    console.log('Content length:', content.length);
  }, 30000);
});