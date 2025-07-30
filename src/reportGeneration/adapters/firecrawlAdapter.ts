// src/reportGeneration/adapters/firecrawlAdapter.ts
// Firecrawl integration for intelligent web scraping and content extraction
// Context: Handles all web scraping needs with AI-powered extraction capabilities

import { BaseAdapter } from '../core/baseAdapter';
import { RetryableError, ErrorCategory, wrapDataFetchError } from '../utils/errorHandler';
import { NewsItem, TranscriptData } from '../models/reportTypes';

/**
 * Firecrawl API response interfaces
 * These match the actual API response structure for type safety
 */
interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    url: string;
    content: string;
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      publishedTime?: string;
      author?: string;
      site?: string;
    };
    llm_extraction?: Record<string, any>;
  };
  error?: string;
}

interface FirecrawlExtractResponse {
  success: boolean;
  data?: any; // Structured based on our schema
  error?: string;
  creditsUsed?: number;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: Array<{
    url: string;
    title: string;
    description: string;
  }>;
  error?: string;
}

/**
 * Schema definitions for Firecrawl EXTRACT
 * These tell Firecrawl's AI what information we want to extract
 */
const EXTRACTION_SCHEMAS = {
  newsArticle: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The main headline of the article'
      },
      author: {
        type: 'string',
        description: 'Author name or news organization'
      },
      publishedDate: {
        type: 'string',
        description: 'Publication date in ISO format'
      },
      content: {
        type: 'string',
        description: 'Main article text, excluding ads and navigation'
      },
      summary: {
        type: 'string',
        description: 'First 2-3 sentences that summarize the article'
      },
      sentiment: {
        type: 'string',
        enum: ['positive', 'neutral', 'negative'],
        description: 'Overall sentiment of the article towards the subject company'
      },
      keyTopics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Main topics discussed (e.g., earnings, product launch, regulation)'
      },
      quotes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            speaker: { type: 'string' },
            quote: { type: 'string' }
          }
        },
        description: 'Important quotes from executives or analysts'
      }
    },
    required: ['title', 'content', 'publishedDate']
  },
  
  companyProfile: {
    type: 'object',
    properties: {
      companyName: {
        type: 'string',
        description: 'Official company name'
      },
      description: {
        type: 'string',
        description: 'Company business description'
      },
      industry: {
        type: 'string',
        description: 'Primary industry classification'
      },
      founded: {
        type: 'string',
        description: 'Year company was founded'
      },
      headquarters: {
        type: 'string',
        description: 'Headquarters location'
      },
      employees: {
        type: 'number',
        description: 'Number of employees'
      },
      website: {
        type: 'string',
        description: 'Official company website'
      },
      executives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' }
          }
        },
        description: 'Key executives and their titles'
      }
    }
  },
  
  financialFiling: {
    type: 'object',
    properties: {
      formType: {
        type: 'string',
        description: 'SEC form type (10-K, 10-Q, 8-K, etc.)'
      },
      filingDate: {
        type: 'string',
        description: 'Filing date in ISO format'
      },
      periodEndDate: {
        type: 'string',
        description: 'Period end date for the filing'
      },
      businessDescription: {
        type: 'string',
        description: 'Item 1 - Business description section'
      },
      riskFactors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Key risk factors mentioned'
      },
      mdAndA: {
        type: 'string',
        description: 'Management Discussion and Analysis section'
      },
      financialHighlights: {
        type: 'object',
        properties: {
          revenue: { type: 'number' },
          netIncome: { type: 'number' },
          eps: { type: 'number' },
          totalAssets: { type: 'number' },
          totalLiabilities: { type: 'number' }
        },
        description: 'Key financial metrics from the filing'
      }
    }
  }
};

/**
 * Configuration for Firecrawl API
 */
interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
  maxConcurrent?: number;
  useMCP?: boolean;
}

/**
 * Firecrawl adapter implementation
 * Provides intelligent web scraping with AI-powered extraction
 */
export class FirecrawlAdapter extends BaseAdapter {
  private apiKey: string;
  private baseUrl: string;
  private maxConcurrent: number;
  private activeRequests: number = 0;
  
  constructor(config: Partial<FirecrawlConfig> & { cache?: any; debugMode?: boolean }) {
    super('Firecrawl', {
      cache: config.cache,
      debugMode: config.debugMode,
      rateLimitConfig: {
        requestsPerMinute: 60, // Firecrawl's default rate limit
        burstSize: 10
      }
    });
    
    this.apiKey = config.apiKey || this.validateApiKey('FIRECRAWL_API_KEY');
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
    this.maxConcurrent = config.maxConcurrent || 5;
    
    // Override request config for Firecrawl
    this.requestConfig.headers['Authorization'] = `Bearer ${this.apiKey}`;
  }
  
  /**
   * Searches for news articles about a company
   * Uses web search to find relevant URLs, then extracts content
   */
  async getCompanyNews(
    companyName: string,
    ticker: string,
    limit: number = 10
  ): Promise<NewsItem[]> {
    try {
      // Step 1: Search for recent news articles
      const searchQuery = `${companyName} ${ticker} news ${new Date().getFullYear()}`;
      const searchResults = await this.searchWeb(searchQuery, limit * 2); // Get extra in case some fail
      
      if (!searchResults || searchResults.length === 0) {
        console.warn(`[Firecrawl] No search results found for ${companyName}`);
        return [];
      }
      
      // Step 2: Extract content from each URL using EXTRACT
      const extractionPromises = searchResults
        .slice(0, limit)
        .map(result => this.extractNewsArticle(result.url, companyName));
      
      // Process in batches to respect concurrency limits
      const newsItems = await this.processConcurrently(
        extractionPromises,
        this.maxConcurrent
      );
      
      // Filter out failed extractions and transform to NewsItem format
      return newsItems
        .filter(item => item !== null)
        .map(article => this.transformToNewsItem(article, ticker));
        
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'Firecrawl',
        operation: 'getCompanyNews',
        ticker
      });
    }
  }
  
  /**
   * Searches the web for relevant URLs
   * This is a lightweight operation that doesn't extract content
   */
  private async searchWeb(query: string, limit: number): Promise<FirecrawlSearchResponse['data']> {
    const url = new URL(`${this.baseUrl}/search`);
    
    const response = await this.makeRequest<FirecrawlSearchResponse>(
      url.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.requestConfig.headers
        },
        body: JSON.stringify({
          query,
          limit,
          includeDomains: [
            'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com',
            'ft.com', 'marketwatch.com', 'seekingalpha.com',
            'yahoo.com/finance', 'businesswire.com'
          ], // Focus on reputable financial news sources
          excludeDomains: [
            'reddit.com', 'twitter.com', 'facebook.com' // Avoid social media
          ]
        })
      }
    );
    
    if (!response.success) {
      throw new RetryableError(
        `Search failed: ${response.error}`,
        ErrorCategory.NETWORK,
        true
      );
    }
    
    return response.data || [];
  }
  
  /**
   * Extracts structured data from a news article using AI
   * This is where Firecrawl's EXTRACT magic happens
   */
  private async extractNewsArticle(
    url: string,
    companyName: string
  ): Promise<any | null> {
    try {
      const extractUrl = new URL(`${this.baseUrl}/extract`);
      
      const response = await this.makeRequest<FirecrawlExtractResponse>(
        extractUrl.toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.requestConfig.headers
          },
          body: JSON.stringify({
            url,
            schema: EXTRACTION_SCHEMAS.newsArticle,
            options: {
              formats: ['markdown', 'llm_extraction'],
              waitFor: 3000, // Wait for JavaScript to load
              screenshot: false,
              removeImages: true,
              removeForms: true
            },
            prompt: `Extract information about ${companyName} from this article. 
                    Focus on financial impact, strategic decisions, and market implications.
                    Determine sentiment based on how the article portrays the company's prospects.`
          })
        }
      );
      
      if (!response.success || !response.data) {
        if (this.debugMode) {
          console.warn(`[Firecrawl] Failed to extract from ${url}: ${response.error}`);
        }
        return null;
      }
      
      // Log credits used if in debug mode
      if (this.debugMode && response.creditsUsed) {
        console.log(`[Firecrawl] Credits used for extraction: ${response.creditsUsed}`);
      }
      
      return response.data;
      
    } catch (error) {
      // Don't let individual article failures break the entire news fetch
      if (this.debugMode) {
        console.error(`[Firecrawl] Error extracting ${url}:`, error);
      }
      return null;
    }
  }
  
  /**
   * Transforms extracted article data into our NewsItem format
   * Handles missing fields gracefully
   */
  private transformToNewsItem(article: any, ticker: string): NewsItem {
    // Calculate relevance score based on how often the company is mentioned
    const content = article.content || '';
    const mentions = (content.match(new RegExp(ticker, 'gi')) || []).length;
    const relevanceScore = Math.min(mentions / 10, 1); // Normalize to 0-1
    
    return {
      title: article.title || 'Untitled Article',
      url: article.url || '',
      source: article.author || this.extractDomain(article.url),
      publishedDate: this.normalizeDate(article.publishedDate),
      summary: article.summary || this.generateSummary(article.content),
      sentiment: article.sentiment || 'neutral',
      relevanceScore,
      // Store additional extracted data for potential use
      metadata: {
        keyTopics: article.keyTopics,
        quotes: article.quotes
      }
    } as NewsItem;
  }
  
  /**
   * Scrapes a single URL and returns raw content
   * Useful for pages that don't need structured extraction
   */
  async scrapeUrl(url: string): Promise<string> {
    const scrapeUrl = new URL(`${this.baseUrl}/scrape`);
    
    const response = await this.makeRequest<FirecrawlScrapeResponse>(
      scrapeUrl.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.requestConfig.headers
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          waitFor: 3000,
          removeImages: true
        })
      }
    );
    
    if (!response.success || !response.data) {
      throw new RetryableError(
        `Scrape failed: ${response.error}`,
        ErrorCategory.NETWORK,
        true
      );
    }
    
    return response.data.markdown || response.data.content || '';
  }
  
  /**
   * Extracts company profile information from a corporate website
   * Useful for getting official company information
   */
  async extractCompanyProfile(websiteUrl: string): Promise<any> {
    const response = await this.makeRequest<FirecrawlExtractResponse>(
      `${this.baseUrl}/extract`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.requestConfig.headers
        },
        body: JSON.stringify({
          url: websiteUrl,
          schema: EXTRACTION_SCHEMAS.companyProfile,
          options: {
            formats: ['llm_extraction'],
            waitFor: 5000
          },
          prompt: 'Extract company information from the about/company page. Focus on official information.'
        })
      }
    );
    
    if (!response.success) {
      throw new RetryableError(
        `Company profile extraction failed: ${response.error}`,
        ErrorCategory.PARSING,
        false
      );
    }
    
    return response.data;
  }
  
  /**
   * Processes promises concurrently with a limit
   * Prevents overwhelming Firecrawl's API with too many simultaneous requests
   */
  private async processConcurrently<T>(
    promises: Promise<T>[],
    maxConcurrent: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const promise of promises) {
      const wrapped = promise
        .then(result => {
          results.push(result);
        })
        .catch(error => {
          if (this.debugMode) {
            console.error('[Firecrawl] Concurrent processing error:', error);
          }
          results.push(null as any); // Push null for failed items
        });
      
      executing.push(wrapped);
      
      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === wrapped), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
  
  /**
   * Utility functions for data transformation
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown Source';
    }
  }
  
  private normalizeDate(dateStr: any): string {
    if (!dateStr) return new Date().toISOString();
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  
  private generateSummary(content: string, maxLength: number = 200): string {
    if (!content) return '';
    
    // Simple summary: first two sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 2).join(' ').trim();
    
    return summary.length > maxLength 
      ? summary.substring(0, maxLength - 3) + '...'
      : summary;
  }
  
  /**
   * Gets current API usage information
   * Firecrawl provides credit-based billing
   */
  async getUsageInfo(): Promise<{
    creditsUsed: number;
    creditsRemaining: number;
  }> {
    // Firecrawl doesn't provide a usage endpoint in v1
    // This would need to be tracked locally or via their dashboard
    return {
      creditsUsed: 0,
      creditsRemaining: 1000 // Placeholder
    };
  }
}