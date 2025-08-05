// src/utils/twelveDataEnhanced.ts
// Enhanced TwelveData integration with Ultra plan capabilities
// Context: Leverages full TwelveData Ultra features for superior market data

import axios from 'axios';
import { logDebug, logError } from './logger';

interface TwelveDataConfig {
  enableCaching?: boolean;
  debugMode?: boolean;
  rateLimitCreditsPerMinute?: number;
}

interface TechnicalIndicatorParams {
  time_period?: number;
  fast_period?: number;
  slow_period?: number;
  signal_period?: number;
  sd?: number;
}

/**
 * Enhanced TwelveData client with Ultra plan capabilities
 * Provides comprehensive market data with advanced features
 */
class TwelveDataEnhanced {
  private apiKey: string;
  private baseUrl: string;
  private config: TwelveDataConfig;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor(config: TwelveDataConfig = {}) {
    this.apiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY || '';
    this.baseUrl = 'https://api.twelvedata.com';
    this.config = {
      enableCaching: true,
      debugMode: false,
      rateLimitCreditsPerMinute: 10946, // Ultra plan limit
      ...config
    };

    if (!this.apiKey) {
      throw new Error('TwelveData API key is required. Set TWELVE_DATA_API_KEY or REACT_APP_TWELVE_DATA_API_KEY');
    }

    logDebug('TwelveDataEnhanced', 'Initialized with Ultra plan capabilities');
  }

  /**
   * Get real-time quote with enhanced data
   */
  async getQuote(symbol: string): Promise<any> {
    return this.makeRequest('/quote', { symbol });
  }

  /**
   * Get time series data with extended history
   */
  async getTimeSeries(symbol: string, interval: string, outputsize: number = 5000): Promise<any> {
    return this.makeRequest('/time_series', {
      symbol,
      interval,
      outputsize: Math.min(outputsize, 5000) // Ultra plan limit
    });
  }

  /**
   * Get earnings data
   */
  async getEarnings(symbol: string): Promise<any> {
    return this.makeRequest('/earnings', { symbol });
  }

  /**
   * Get technical indicator with custom parameters
   */
  async getTechnicalIndicator(
    symbol: string, 
    indicator: string, 
    interval: string, 
    params: TechnicalIndicatorParams = {}
  ): Promise<any> {
    const requestParams = {
      symbol,
      interval,
      ...params
    };

    return this.makeRequest(`/${indicator}`, requestParams);
  }

  /**
   * Get company profile and fundamentals
   */
  async getProfile(symbol: string): Promise<any> {
    return this.makeRequest('/profile', { symbol });
  }

  /**
   * Get financial statements
   */
  async getFinancials(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
    return this.makeRequest('/income_statement', { symbol, period });
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
    return this.makeRequest('/balance_sheet', { symbol, period });
  }

  /**
   * Get cash flow statement
   */
  async getCashFlow(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
    return this.makeRequest('/cash_flow', { symbol, period });
  }

  /**
   * Get analyst recommendations
   */
  async getRecommendations(symbol: string): Promise<any> {
    return this.makeRequest('/recommendations', { symbol });
  }

  /**
   * Get insider transactions
   */
  async getInsiderTransactions(symbol: string): Promise<any> {
    return this.makeRequest('/insider_transactions', { symbol });
  }

  /**
   * Get institutional holdings
   */
  async getInstitutionalHoldings(symbol: string): Promise<any> {
    return this.makeRequest('/institutional_holders', { symbol });
  }

  /**
   * Get options data (Ultra plan feature)
   */
  async getOptionsData(symbol: string, expiration_date?: string): Promise<any> {
    const params: any = { symbol };
    if (expiration_date) {
      params.expiration_date = expiration_date;
    }
    return this.makeRequest('/options', params);
  }

  /**
   * Get market movers
   */
  async getMarketMovers(direction: 'gainers' | 'losers' = 'gainers'): Promise<any> {
    return this.makeRequest('/market_movers', { direction });
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance(): Promise<any> {
    return this.makeRequest('/sector_performance');
  }

  /**
   * Get economic indicators
   */
  async getEconomicIndicators(indicator: string, country: string = 'US'): Promise<any> {
    return this.makeRequest('/economic_indicators', { indicator, country });
  }

  /**
   * Get forex rates
   */
  async getForexRates(symbol: string): Promise<any> {
    return this.makeRequest('/exchange_rate', { symbol });
  }

  /**
   * Get cryptocurrency data
   */
  async getCryptoData(symbol: string): Promise<any> {
    return this.makeRequest('/price', { symbol });
  }

  /**
   * Get Ultra plan specific features
   */
  getUltraFeatures(): any {
    return {
      realTimeData: true,
      extendedHistory: true,
      advancedTechnicals: true,
      fundamentalData: true,
      optionsData: true,
      economicIndicators: true,
      institutionalData: true,
      rateLimitCredits: this.config.rateLimitCreditsPerMinute,
      supportLevel: 'premium'
    };
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): any {
    return {
      requestCount: this.requestCount,
      creditsUsed: this.requestCount,
      creditsRemaining: (this.config.rateLimitCreditsPerMinute || 0) - this.requestCount,
      resetTime: new Date(this.lastResetTime + 60000).toISOString()
    };
  }

  /**
   * Make API request with rate limiting and error handling
   */
  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    try {
      // Check rate limits
      this.checkRateLimit();

      const url = `${this.baseUrl}${endpoint}`;
      const requestParams = {
        ...params,
        apikey: this.apiKey
      };

      if (this.config.debugMode) {
        logDebug('TwelveDataEnhanced', `Making request to ${endpoint}`, requestParams);
      }

      const response = await axios.get(url, {
        params: requestParams,
        timeout: 30000 // 30 second timeout
      });

      this.requestCount++;

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'TwelveData API error');
      }

      if (this.config.debugMode) {
        logDebug('TwelveDataEnhanced', `Request successful for ${endpoint}`);
      }

      return response.data;

    } catch (error) {
      logError('TwelveDataEnhanced', `Request failed for ${endpoint}`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your TwelveData API key.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden. This feature may require a higher plan.');
        }
      }

      throw error;
    }
  }

  /**
   * Check and enforce rate limits
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every minute
    if (timeSinceReset >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if we're approaching the limit
    const creditsPerMinute = this.config.rateLimitCreditsPerMinute || 0;
    if (this.requestCount >= creditsPerMinute) {
      const waitTime = 60000 - timeSinceReset;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
  }

  /**
   * Batch request multiple symbols
   */
  async batchRequest(symbols: string[], endpoint: string, params: any = {}): Promise<any> {
    const symbolString = symbols.join(',');
    return this.makeRequest(endpoint, { ...params, symbol: symbolString });
  }

  /**
   * Get comprehensive market data for a symbol
   */
  async getComprehensiveData(symbol: string): Promise<any> {
    try {
      const [quote, timeSeries, profile, earnings, recommendations] = await Promise.all([
        this.getQuote(symbol),
        this.getTimeSeries(symbol, '1day', 252),
        this.getProfile(symbol),
        this.getEarnings(symbol),
        this.getRecommendations(symbol)
      ]);

      return {
        quote,
        timeSeries,
        profile,
        earnings,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('TwelveDataEnhanced', 'Comprehensive data request failed', error);
      throw error;
    }
  }
}

// Singleton instance
let instance: TwelveDataEnhanced | null = null;

/**
 * Get enhanced TwelveData instance
 */
export function getTwelveDataEnhanced(config?: TwelveDataConfig): TwelveDataEnhanced {
  if (!instance) {
    instance = new TwelveDataEnhanced(config);
  }
  return instance;
}

export default TwelveDataEnhanced;
