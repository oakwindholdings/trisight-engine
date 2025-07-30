// src/reportGeneration/__tests__/firecrawlAdapter.test.ts
// Tests for Firecrawl adapter
// Context: Validates AI-powered web scraping and extraction functionality

import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { MemoryCache } from '../utils/cache';
import {
  setupMockFirecrawlAPI,
  mockSearchResponse,
  mockExtractNewsResponse,
  mockExtractCompanyProfileResponse,
  mockScrapeResponse,
  mockNewsArticles
} from './mockFirecrawlResponses';

describe('FirecrawlAdapter', () => {
  let adapter: FirecrawlAdapter;
  let cache: MemoryCache;
  let cleanup: () => void;

  beforeEach(() => {
    cache = new MemoryCache();
    adapter = new FirecrawlAdapter({
      apiKey: 'test-api-key',
      cache,
      debugMode: false
    });
    cleanup = setupMockFirecrawlAPI();
  });

  afterEach(() => {
    cleanup();
    cache.clear();
  });

  describe('getCompanyNews', () => {
    it('should search and extract news articles successfully', async () => {
      const news = await adapter.getCompanyNews('NVIDIA Corporation', 'NVDA', 5);
      
      expect(news).toBeDefined();
      expect(news.length).toBeGreaterThan(0);
      expect(news[0]).toHaveProperty('title');
      expect(news[0]).toHaveProperty('sentiment');
      expect(news[0]).toHaveProperty('relevanceScore');
    });

    it('should handle empty search results gracefully', async () => {
      // Mock empty search results
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] })
        } as Response)
      );
      
      const news = await adapter.getCompanyNews('Unknown Company', 'UNK', 5);
      expect(news).toEqual([]);
    });

    it('should calculate relevance scores based on ticker mentions', async () => {
      const news = await adapter.getCompanyNews('NVIDIA Corporation', 'NVDA', 5);
      
      // Should have relevance scores between 0 and 1
      news.forEach(item => {
        expect(item.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(item.relevanceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should properly transform extracted data to NewsItem format', async () => {
      const news = await adapter.getCompanyNews('NVIDIA Corporation', 'NVDA', 1);
      const item = news[0];
      
      expect(item).toMatchObject({
        title: expect.any(String),
        url: expect.any(String),
        source: expect.any(String),
        publishedDate: expect.any(String),
        summary: expect.any(String),
        sentiment: expect.stringMatching(/positive|neutral|negative/),
        relevanceScore: expect.any(Number),
        metadata: expect.objectContaining({
          keyTopics: expect.any(Array),
          quotes: expect.any(Array)
        })
      });
    });
  });

  describe('scrapeUrl', () => {
    it('should scrape content from a URL', async () => {
      const content = await adapter.scrapeUrl('https://example.com/article');
      
      expect(content).toBeDefined();
      expect(content).toContain('NVIDIA Announces Financial Results');
    });

    it('should prefer markdown format when available', async () => {
      const content = await adapter.scrapeUrl('https://example.com/article');
      
      // Should contain markdown formatting
      expect(content).toContain('#');
      expect(content).toContain('**');
    });

    it('should handle scrape failures', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: 'Failed to scrape page'
          })
        } as Response)
      );
      
      await expect(adapter.scrapeUrl('https://invalid.com'))
        .rejects.toThrow(/Scrape failed/);
    });
  });

  describe('extractCompanyProfile', () => {
    it('should extract company profile information', async () => {
      const profile = await adapter.extractCompanyProfile('https://nvidia.com/about');
      
      expect(profile).toMatchObject({
        companyName: 'NVIDIA Corporation',
        description: expect.any(String),
        industry: 'Semiconductors',
        founded: '1993',
        headquarters: expect.any(String),
        employees: expect.any(Number),
        executives: expect.arrayContaining([
          expect.objectContaining({
            name: 'Jensen Huang',
            title: expect.any(String)
          })
        ])
      });
    });
  });

  describe('Rate limiting and concurrency', () => {
    it('should respect concurrent request limits', async () => {
      // Create multiple requests
      const promises = Array(10).fill(null).map((_, i) => 
        adapter.scrapeUrl(`https://example.com/article-${i}`)
      );
      
      // Should process them with concurrency limit
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(r => r !== null)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle API authentication errors', async () => {
      const noAuthAdapter = new FirecrawlAdapter({
        apiKey: '', // No API key
        cache
      });
      
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: 'Unauthorized'
          })
        } as Response)
      );
      
      await expect(noAuthAdapter.getCompanyNews('NVIDIA', 'NVDA'))
        .rejects.toThrow();
    });

    it('should handle individual extraction failures gracefully', async () => {
      // Mock mixed success/failure responses
      let callCount = 0;
      global.fetch = jest.fn(() => {
        callCount++;
        
        // First call is search - success
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSearchResponse)
          } as Response);
        }
        
        // Alternate between success and failure for extractions
        if (callCount % 2 === 0) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExtractNewsResponse)
          } as Response);
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: false,
              error: 'Extraction failed'
            })
          } as Response);
        }
      });
      
      const news = await adapter.getCompanyNews('NVIDIA', 'NVDA', 5);
      
      // Should have some results despite failures
      expect(news.length).toBeGreaterThan(0);
      expect(news.length).toBeLessThan(5);
    });
  });

  describe('Utility functions', () => {
    it('should extract domain from URL correctly', async () => {
      const news = await adapter.getCompanyNews('NVIDIA', 'NVDA', 1);
      
      // Reuters URL should result in 'reuters' source
      expect(news[0].source).toBe('Reuters Staff');
    });

    it('should normalize dates properly', async () => {
      const news = await adapter.getCompanyNews('NVIDIA', 'NVDA', 1);
      
      // Should be valid ISO date string
      const date = new Date(news[0].publishedDate);
      expect(date.toISOString()).toBe(news[0].publishedDate);
    });

    it('should generate summaries when not provided', async () => {
      // Mock response without summary
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [{
              url: 'https://example.com',
              title: 'Test Article',
              description: 'Test'
            }]
          })
        } as Response)
      ).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              title: 'Test Article',
              content: 'This is the first sentence. This is the second sentence. This is the third sentence.',
              publishedDate: new Date().toISOString(),
              sentiment: 'neutral'
            }
          })
        } as Response)
      );
      
      const news = await adapter.getCompanyNews('Test', 'TST', 1);
      
      expect(news[0].summary).toBe('This is the first sentence. This is the second sentence.');
    });
  });
});