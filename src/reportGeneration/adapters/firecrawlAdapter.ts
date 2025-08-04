// src/reportGeneration/adapters/firecrawlAdapter.ts
// Firecrawl integration for intelligent web scraping and content extraction
// Context: Handles all web scraping needs with AI-powered extraction capabilities

import { BaseAdapter } from '../core/baseAdapter';
import { RetryableError, ErrorCategory, wrapDataFetchError } from '../utils/errorHandler';
import { NewsItem, TranscriptData } from '../models/reportTypes';
import { logDebug, logError } from '../../utils/logger';
import axios from 'axios';

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
    
    // Debug environment variables
    logDebug('FirecrawlAdapter', 'Available env vars:', {
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ? '***set***' : 'undefined',
      REACT_APP_FIRECRAWL_API_KEY: process.env.REACT_APP_FIRECRAWL_API_KEY ? '***set***' : 'undefined',
      configApiKey: config.apiKey ? '***set***' : 'undefined'
    });
    
    this.apiKey = config.apiKey || process.env.FIRECRAWL_API_KEY || process.env.REACT_APP_FIRECRAWL_API_KEY;
    if (!this.apiKey) {
      logDebug('FirecrawlAdapter', 'No Firecrawl API key found, will use alternative scraping methods');
      // Don't throw - we'll use alternative methods
    }
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
    this.maxConcurrent = config.maxConcurrent || 5;
    
    // Override request config for Firecrawl if API key is available
    if (this.apiKey) {
      this.requestConfig.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
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
      // If no API key, use alternative web scraping
      if (!this.apiKey) {
        return this.getCompanyNewsAlternative(companyName, ticker, limit);
      }
      
      // Step 1: Search for recent news articles
      const searchQuery = `${companyName} ${ticker} news ${new Date().getFullYear()}`;
      const searchResults = await this.searchWeb(searchQuery, limit * 2); // Get extra in case some fail
      
      if (!searchResults || searchResults.length === 0) {
        logDebug('FirecrawlAdapter', `No search results found for ${companyName}`);
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
      const validItems = newsItems
        .filter(item => item !== null)
        .map(article => this.transformToNewsItem(article, ticker));
        
      // Add data quality scores
      return this.addDataQualityScores(validItems);
        
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
        logDebug('FirecrawlAdapter', `Failed to extract from ${url}: ${response.error}`);
        return null;
      }
      
      // Log credits used and update tracking
      if (response.creditsUsed) {
        logDebug('FirecrawlAdapter', `Credits used for extraction: ${response.creditsUsed}`);
        this.updateCreditUsage(response.creditsUsed);
      }
      
      return response.data;
      
    } catch (error) {
      // Don't let individual article failures break the entire news fetch
      logDebug('FirecrawlAdapter', `Error extracting ${url}:`, error);
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
   * Alternative news fetching without Firecrawl API
   * Uses direct HTTP requests with content extraction
   */
  private async getCompanyNewsAlternative(
    companyName: string,
    ticker: string,
    limit: number
  ): Promise<NewsItem[]> {
    logDebug('FirecrawlAdapter', 'Using alternative news fetching method');
    
    // For now, return empty array - this would be implemented with
    // direct RSS feeds, Google News RSS, or other public APIs
    return [];
  }
  
  /**
   * Adds data quality scores to news items
   * This helps AI models understand data reliability
   */
  private addDataQualityScores(items: NewsItem[]): NewsItem[] {
    return items.map(item => {
      const qualityScore = this.calculateDataQuality(item);
      
      return {
        ...item,
        metadata: {
          ...item.metadata,
          dataQuality: {
            score: qualityScore,
            completeness: this.assessCompleteness(item),
            freshness: this.assessFreshness(item.publishedDate),
            sourceReliability: this.assessSourceReliability(item.source),
            contentDepth: this.assessContentDepth(item)
          }
        }
      };
    });
  }
  
  /**
   * Calculates overall data quality score
   */
  private calculateDataQuality(item: NewsItem): number {
    const scores = [
      this.assessCompleteness(item),
      this.assessFreshness(item.publishedDate),
      this.assessSourceReliability(item.source),
      this.assessContentDepth(item)
    ];
    
    // Weighted average
    const weights = [0.2, 0.3, 0.3, 0.2];
    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    
    return Math.round(weightedSum * 100) / 100;
  }
  
  /**
   * Assesses completeness of news item data
   */
  private assessCompleteness(item: NewsItem): number {
    const requiredFields = ['title', 'url', 'source', 'publishedDate', 'summary'];
    const optionalFields = ['sentiment', 'relevanceScore', 'metadata'];
    
    let score = 0;
    const requiredWeight = 0.7 / requiredFields.length;
    const optionalWeight = 0.3 / optionalFields.length;
    
    // Check required fields
    requiredFields.forEach(field => {
      if (item[field as keyof NewsItem]) score += requiredWeight;
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      if (item[field as keyof NewsItem]) score += optionalWeight;
    });
    
    return score;
  }
  
  /**
   * Assesses freshness of the data
   */
  private assessFreshness(publishedDate: string): number {
    const ageInHours = (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60);
    
    if (ageInHours < 1) return 1.0;
    if (ageInHours < 6) return 0.95;
    if (ageInHours < 24) return 0.9;
    if (ageInHours < 72) return 0.7;
    if (ageInHours < 168) return 0.5;
    if (ageInHours < 720) return 0.3;
    return 0.1;
  }
  
  /**
   * Assesses source reliability
   */
  private assessSourceReliability(source: string): number {
    const trustedSources = [
      'reuters', 'bloomberg', 'wsj', 'ft', 'cnbc', 
      'marketwatch', 'barrons', 'businesswire'
    ];
    
    const sourceLower = source.toLowerCase();
    if (trustedSources.some(trusted => sourceLower.includes(trusted))) {
      return 1.0;
    }
    
    // Medium reliability sources
    const mediumSources = ['yahoo', 'seekingalpha', 'fool', 'benzinga'];
    if (mediumSources.some(medium => sourceLower.includes(medium))) {
      return 0.7;
    }
    
    return 0.5; // Unknown sources
  }
  
  /**
   * Assesses content depth
   */
  private assessContentDepth(item: NewsItem): number {
    let score = 0;
    
    // Check summary length
    if (item.summary) {
      const summaryLength = item.summary.length;
      if (summaryLength > 200) score += 0.3;
      else if (summaryLength > 100) score += 0.2;
      else if (summaryLength > 50) score += 0.1;
    }
    
    // Check for metadata richness
    if (item.metadata) {
      if (item.metadata.keyTopics && item.metadata.keyTopics.length > 0) score += 0.2;
      if (item.metadata.quotes && item.metadata.quotes.length > 0) score += 0.3;
      if (item.metadata.impactScore) score += 0.1;
      if (item.metadata.sourceCredibility) score += 0.1;
    }
    
    return Math.min(score, 1.0);
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
    // Track credits locally since Firecrawl v1 doesn't provide usage endpoint
    const usageKey = 'trisight_firecrawl_usage';
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const stored = localStorage.getItem(usageKey);
      const usage = stored ? JSON.parse(stored) : { date: today, credits: 0 };
      
      // Reset daily if new day
      if (usage.date !== today) {
        usage.date = today;
        usage.credits = 0;
      }
      
      // Firecrawl typical limits: 500 credits/month for starter
      const monthlyLimit = 500;
      const dailyLimit = Math.floor(monthlyLimit / 30);
      
      return {
        creditsUsed: usage.credits,
        creditsRemaining: Math.max(0, dailyLimit - usage.credits)
      };
    } catch (error) {
      // If localStorage fails, return conservative estimate
      return {
        creditsUsed: 0,
        creditsRemaining: 10 // Conservative daily limit
      };
    }
  }
  
  /**
   * Updates credit usage after API call
   */
  private updateCreditUsage(credits: number): void {
    try {
      const usageKey = 'trisight_firecrawl_usage';
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(usageKey);
      const usage = stored ? JSON.parse(stored) : { date: today, credits: 0 };
      
      if (usage.date !== today) {
        usage.date = today;
        usage.credits = 0;
      }
      
      usage.credits += credits;
      localStorage.setItem(usageKey, JSON.stringify(usage));
    } catch (error) {
      console.warn('[Firecrawl] Failed to update credit usage:', error);
    }
  }

}