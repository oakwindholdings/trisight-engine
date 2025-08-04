// src/reportGeneration/core/baseAdapter.ts
// Abstract base class providing common functionality for all data adapters
// Context: Ensures consistent behavior across all external data sources

import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG, wrapDataFetchError } from '../utils/errorHandler';
import { DataCache as MemoryCache, memoizeAsync as withCache } from '../utils/cache';

/**
 * Configuration for HTTP requests
 * These defaults work well for financial APIs but can be overridden
 */
export interface RequestConfig {
  timeout: number;
  headers: Record<string, string>;
  retryConfig: RetryConfig;
}

/**
 * Rate limiting configuration
 * Essential for respecting API limits, especially for TwelveData
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
}

/**
 * Abstract base class for all data source adapters
 * Provides common functionality like retries, caching, and rate limiting
 */
export abstract class BaseAdapter {
  protected cache: MemoryCache;
  protected requestConfig: RequestConfig;
  protected rateLimitConfig?: RateLimitConfig;
  protected requestTimestamps: number[] = [];
  protected debugMode: boolean;
  
  constructor(
    protected adapterName: string,
    options: {
      cache?: MemoryCache;
      requestConfig?: Partial<RequestConfig>;
      rateLimitConfig?: RateLimitConfig;
      debugMode?: boolean;
    } = {}
  ) {
    this.cache = options.cache || new MemoryCache({});
    this.debugMode = options.debugMode || false;
    
    // Set up default request configuration
    this.requestConfig = {
      timeout: 30000, // 30 seconds default
      headers: {
        'User-Agent': 'TriSight-ReportGenerator/1.0',
        'Accept': 'application/json',
      },
      retryConfig: DEFAULT_RETRY_CONFIG,
      ...options.requestConfig
    };
    
    this.rateLimitConfig = options.rateLimitConfig;
  }
  
  /**
   * Makes an HTTP request with built-in retry logic and error handling
   * This is the core method that all adapters will use for external calls
   */
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check rate limits before making request
    await this.checkRateLimit();
    
    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.requestConfig.timeout
    );
    
    try {
      // Add default headers and merge with provided options
      const finalOptions: RequestInit = {
        ...options,
        headers: {
          ...this.requestConfig.headers,
          ...options.headers
        },
        signal: controller.signal
      };
      
      // Log request in debug mode
      if (this.debugMode) {
        console.log(`[${this.adapterName}] Making request to:`, url);
      }
      
      // Make request with retry logic
      const response = await withRetry(
        async () => {
          const res = await fetch(url, finalOptions);
          
          // Handle non-success status codes
          if (!res.ok) {
            const errorText = await res.text().catch(() => 'No error details');
            throw new Error(
              `HTTP ${res.status}: ${res.statusText}. Details: ${errorText}`
            );
          }
          
          return res;
        },
        this.requestConfig.retryConfig,
        (attempt, error, delayMs) => {
          if (this.debugMode) {
            console.log(
              `[${this.adapterName}] Retry attempt ${attempt} after error:`,
              error.message,
              `Waiting ${delayMs}ms...`
            );
          }
        }
      );
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type') || '';
      let data: T;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = (await response.text()) as unknown as T;
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
      // Record successful request timestamp for rate limiting
      this.recordRequestTimestamp();
      
      return data;
      
    } catch (error) {
      // Wrap error with context for better debugging
      throw wrapDataFetchError(error as Error, {
        source: this.adapterName,
        operation: 'fetch',
        ticker: this.extractTickerFromUrl(url)
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Checks rate limits and waits if necessary
   * This prevents hitting API rate limits which can result in bans
   */
  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimitConfig) return;
    
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > windowStart
    );
    
    // Check if we're at the limit
    if (this.requestTimestamps.length >= this.rateLimitConfig.requestsPerMinute) {
      // Calculate how long to wait
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = oldestTimestamp + 60000 - now;
      
      if (waitTime > 0) {
        if (this.debugMode) {
          console.log(
            `[${this.adapterName}] Rate limit reached. Waiting ${waitTime}ms...`
          );
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  /**
   * Records timestamp of successful request for rate limiting
   */
  private recordRequestTimestamp(): void {
    this.requestTimestamps.push(Date.now());
  }
  
  /**
   * Extracts ticker from URL for error context
   * Override in subclasses for API-specific URL patterns
   */
  protected extractTickerFromUrl(url: string): string | undefined {
    // Basic implementation - subclasses can override for specific patterns
    const tickerMatch = url.match(/symbol=([A-Z]+)/i) || 
                       url.match(/ticker=([A-Z]+)/i) ||
                       url.match(/\/([A-Z]+)\//i);
    return tickerMatch ? tickerMatch[1] : undefined;
  }
  
  /**
   * Creates a cached version of an API method
   * This is a convenience method for subclasses
   */
  protected createCachedMethod<T extends (...args: any[]) => Promise<any>>(
    method: T,
    keyPrefix: string,
    ttlMs?: number
  ): T {
    return withCache(method.bind(this), {
      cache: this.cache,
      keyPrefix: `${this.adapterName}:${keyPrefix}`,
      ttlMs
    });
  }
  
  /**
   * Validates that required environment variables are set
   * Subclasses should call this in their constructor
   */
  protected validateApiKey(envVar: string): string {
    const apiKey = process.env[envVar];
    if (!apiKey) {
      throw new Error(
        `${envVar} environment variable is not set. ` +
        `Please add it to your .env file.`
      );
    }
    return apiKey;
  }
  
  /**
   * Gets current cache statistics for monitoring
   */
  getCacheStats() {
    return {
      adapter: this.adapterName,
      ...this.cache.getStats()
    };
  }
  
  /**
   * Clears the cache for this adapter
   */
  clearCache(): void {
    this.cache.clear();
  }
}