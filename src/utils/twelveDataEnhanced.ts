// src/utils/twelveDataEnhanced.ts
// Enhanced TwelveData integration using official package + Ultra plan
// Context: Combines official package with existing custom rate limiting and caching

import twelvedata from 'twelvedata';
import { logDebug, logError } from './debug';

interface TwelveDataConfig {
  apiKey: string;
  enableCaching?: boolean;
  debugMode?: boolean;
  rateLimitCreditsPerMinute?: number;
}

interface UltraFeatures {
  extendedHistory: boolean;
  technicalIndicators: boolean;
  batchRequests: boolean;
  realTimeData: boolean;
  highRateLimits: boolean;
  websocketStreaming: boolean;
}

/**
 * Enhanced TwelveData client that combines official package with Ultra plan features
 * Provides enterprise-grade rate limiting, caching, and error handling
 */
export class TwelveDataEnhanced {
  private client: any;
  private config: TwelveDataConfig;
  private cache: Map<string, { data: any; expires: number }>;
  private rateLimitTokens: number;
  private lastTokenRefill: number;
  private ultraFeatures: UltraFeatures;

  constructor(config: TwelveDataConfig) {
    this.config = {
      enableCaching: true,
      debugMode: false,
      rateLimitCreditsPerMinute: 10946, // Ultra plan default
      ...config
    };

    // Initialize official TwelveData client
    this.client = twelvedata({ key: this.config.apiKey });
    
    // Initialize caching
    this.cache = new Map();
    
    // Initialize rate limiting (Ultra plan: 10,946 credits/minute)
    this.rateLimitTokens = this.config.rateLimitCreditsPerMinute!;
    this.lastTokenRefill = Date.now();
    
    // Ultra plan features
    this.ultraFeatures = {
      extendedHistory: true,
      technicalIndicators: true,
      batchRequests: true,
      realTimeData: true,
      highRateLimits: true,
      websocketStreaming: true
    };

    if (this.config.debugMode) {
      logDebug('TwelveDataEnhanced', 'Initialized with Ultra plan features', this.ultraFeatures);
    }
  }

  /**
   * Get API usage statistics (Ultra plan specific)
   */
  async getApiUsage(): Promise<any> {
    return this.executeWithRateLimit('apiUsage', 1, () => this.client.apiUsage());
  }

  /**
   * Get real-time quote with Ultra plan features
   */
  async getQuote(symbol: string): Promise<any> {
    const cacheKey = `quote_${symbol}`;
    return this.executeWithCache(cacheKey, 60000, () => 
      this.executeWithRateLimit('quote', 1, () => this.client.quote({ symbol }))
    );
  }

  /**
   * Get time series with extended history (Ultra plan: 30+ years)
   */
  async getTimeSeries(
    symbol: string, 
    interval: string = '1day', 
    outputsize: number = 5000
  ): Promise<any> {
    const cacheKey = `timeseries_${symbol}_${interval}_${outputsize}`;
    return this.executeWithCache(cacheKey, 300000, () => 
      this.executeWithRateLimit('timeSeries', 10, () => 
        this.client.timeSeries({ symbol, interval, outputsize })
      )
    );
  }

  /**
   * Get technical indicators (Ultra plan feature)
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval: string = '1day',
    params: Record<string, any> = {}
  ): Promise<any> {
    const cacheKey = `indicator_${symbol}_${indicator}_${interval}_${JSON.stringify(params)}`;
    return this.executeWithCache(cacheKey, 600000, () => 
      this.executeWithRateLimit('technicalIndicator', 5, () => 
        this.client.technicalIndicators({ symbol, interval, indicator, ...params })
      )
    );
  }

  /**
   * Get earnings data
   */
  async getEarnings(symbol: string): Promise<any> {
    const cacheKey = `earnings_${symbol}`;
    return this.executeWithCache(cacheKey, 3600000, () => 
      this.executeWithRateLimit('earnings', 50, () => this.client.earnings({ symbol }))
    );
  }

  /**
   * Batch request multiple data points (Ultra plan feature)
   */
  async getComplexData(params: {
    symbols: string[];
    intervals: string[];
    methods: (string | { name: string; [key: string]: any })[];
    outputsize?: number;
  }): Promise<any> {
    const cacheKey = `complex_${JSON.stringify(params)}`;
    const creditCost = params.symbols.length * params.intervals.length * params.methods.length * 10;
    
    return this.executeWithCache(cacheKey, 300000, () => 
      this.executeWithRateLimit('complexData', creditCost, () => 
        this.client.complexData(params)
      )
    );
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<any> {
    const cacheKey = `search_${query}`;
    return this.executeWithCache(cacheKey, 3600000, () => 
      this.executeWithRateLimit('symbolSearch', 1, () => 
        this.client.symbolSearch({ symbol: query })
      )
    );
  }

  /**
   * Get cryptocurrency data (Ultra plan feature)
   */
  async getCryptocurrencies(): Promise<any> {
    const cacheKey = 'cryptocurrencies';
    return this.executeWithCache(cacheKey, 3600000, () => 
      this.executeWithRateLimit('cryptocurrencies', 1, () => this.client.cryptocurrencies())
    );
  }

  /**
   * Execute request with rate limiting
   */
  private async executeWithRateLimit<T>(
    operation: string, 
    creditCost: number, 
    fn: () => Promise<T>
  ): Promise<T> {
    await this.waitForTokens(creditCost);
    
    try {
      const result = await fn();
      
      if (this.config.debugMode) {
        logDebug('TwelveDataEnhanced', `${operation} completed`, { creditCost, tokensRemaining: this.rateLimitTokens });
      }
      
      return result;
    } catch (error) {
      logError('TwelveDataEnhanced', `${operation} failed`, error);
      throw error;
    }
  }

  /**
   * Execute request with caching
   */
  private async executeWithCache<T>(
    cacheKey: string, 
    ttlMs: number, 
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        if (this.config.debugMode) {
          logDebug('TwelveDataEnhanced', `Cache hit for ${cacheKey}`);
        }
        return cached.data;
      }
    }

    const result = await fn();
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + ttlMs
      });
    }

    return result;
  }

  /**
   * Token bucket rate limiting for Ultra plan
   */
  private async waitForTokens(creditCost: number): Promise<void> {
    // Refill tokens based on time elapsed
    const now = Date.now();
    const timeDelta = now - this.lastTokenRefill;
    const tokensToAdd = (timeDelta / 60000) * this.config.rateLimitCreditsPerMinute!;
    
    this.rateLimitTokens = Math.min(
      this.config.rateLimitCreditsPerMinute!,
      this.rateLimitTokens + tokensToAdd
    );
    this.lastTokenRefill = now;

    // Wait if we don't have enough tokens
    if (this.rateLimitTokens < creditCost) {
      const waitTime = ((creditCost - this.rateLimitTokens) / this.config.rateLimitCreditsPerMinute!) * 60000;
      
      if (this.config.debugMode) {
        logDebug('TwelveDataEnhanced', `Rate limit hit, waiting ${waitTime}ms`);
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitTokens = creditCost;
    }

    this.rateLimitTokens -= creditCost;
  }

  /**
   * Get Ultra plan features status
   */
  getUltraFeatures(): UltraFeatures {
    return { ...this.ultraFeatures };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.config.debugMode) {
      logDebug('TwelveDataEnhanced', 'Cache cleared');
    }
  }
}

// Export singleton instance
let enhancedClient: TwelveDataEnhanced | null = null;

export const getTwelveDataEnhanced = (config?: Partial<TwelveDataConfig>): TwelveDataEnhanced => {
  if (!enhancedClient) {
    const apiKey = config?.apiKey || process.env.REACT_APP_TWELVE_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('TwelveData API key is required');
    }
    
    enhancedClient = new TwelveDataEnhanced({
      apiKey,
      enableCaching: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    });
  }
  
  return enhancedClient;
};

export default TwelveDataEnhanced;
