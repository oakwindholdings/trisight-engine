// src/reportGeneration/adapters/twelveDataAdapter.ts
// TwelveData API integration with intelligent rate limiting and response transformation
// Context: Primary data source for all market data, fundamentals, and analyst information

import { BaseAdapter } from '../core/baseAdapter';
import { 
  FinancialData, 
  PriceData, 
  TechnicalIndicators,
  AnalystData,
  KeyFinancialMetrics,
  FinancialStatement
} from '../models/reportTypes';
import { RetryableError, ErrorCategory } from '../utils/errorHandler';
import { 
  isValidQuoteResponse, 
  isValidTimeSeriesResponse,
  isValidIndicatorResponse,
  safeParseFloat,
  safeParseInt,
  isRateLimitError,
  isAuthError
} from '../utils/typeGuards';

/**
 * TwelveData API response interfaces
 * These match the actual API response structure for type safety
 */
interface TwelveDataQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  datetime: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  market_cap?: string;
  pe?: string;
  pb?: string;
  dividend_yield?: string;
  fifty_two_week: {
    low: string;
    high: string;
    low_change: string;
    high_change: string;
    low_change_percent: string;
    high_change_percent: string;
    range: string;
  };
}

interface TwelveDataTimeSeries {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    type: string;
  };
  values: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status: string;
}

interface TwelveDataFundamentals {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
  };
  income_statement?: {
    annual?: FinancialStatement[];
    quarterly?: FinancialStatement[];
  };
  balance_sheet?: {
    annual?: FinancialStatement[];
    quarterly?: FinancialStatement[];
  };
  cash_flow?: {
    annual?: FinancialStatement[];
    quarterly?: FinancialStatement[];
  };
  statistics?: {
    valuations_metrics?: {
      market_capitalization?: number;
      enterprise_value?: number;
      trailing_pe?: number;
      forward_pe?: number;
      peg_ratio?: number;
      price_to_book?: number;
      price_to_sales?: number;
      enterprise_to_revenue?: number;
      enterprise_to_ebitda?: number;
    };
    financials?: {
      current_ratio?: number;
      debt_to_equity?: number;
      return_on_equity?: number;
      return_on_assets?: number;
      profit_margin?: number;
      operating_margin?: number;
      revenue_growth_yoy?: number;
      earnings_growth_yoy?: number;
    };
  };
}

interface TwelveDataAnalystRating {
  date: string;
  firm: string;
  analyst_name?: string;
  rating: string;
  rating_change?: string;
  price_target?: string;
  price_target_change?: string;
}

/**
 * Configuration specific to TwelveData API
 */
interface TwelveDataConfig {
  apiKey: string;
  baseUrl?: string;
  isUltraTier?: boolean;
  useMCP?: boolean;
}

/**
 * Token bucket implementation for rate limiting
 * This ensures we never exceed our API credits even under heavy load
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  
  constructor(maxTokens: number, tokensPerMinute: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = tokensPerMinute / 60000; // Convert to per millisecond
  }
  
  async waitForTokens(count: number): Promise<void> {
    while (true) {
      this.refill();
      
      if (this.tokens >= count) {
        this.tokens -= count;
        return;
      }
      
      // Calculate wait time for required tokens
      const tokensNeeded = count - this.tokens;
      const waitTime = Math.ceil(tokensNeeded / this.refillRate);
      
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000)));
    }
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

/**
 * TwelveData adapter implementation
 * Handles all interactions with the TwelveData API including rate limiting and response transformation
 */
export class TwelveDataAdapter extends BaseAdapter {
  private apiKey: string;
  private baseUrl: string;
  private tokenBucket: TokenBucket;
  private isUltraTier: boolean;
  
  // API credit costs for different endpoints (Ultra tier)
  private readonly CREDIT_COSTS = {
    quote: 1,
    timeSeries: 10, // per symbol
    fundamentals: 50,
    analystRatings: 5,
    technicalIndicator: 5, // per indicator
    statistics: 25
  };
  
  constructor(config: Partial<TwelveDataConfig> & { cache?: any; debugMode?: boolean }) {
    super('TwelveData', {
      cache: config.cache,
      debugMode: config.debugMode,
      rateLimitConfig: {
        requestsPerMinute: 60, // Requests, not credits
        burstSize: 10
      }
    });
    
    this.apiKey = config.apiKey || this.validateApiKey('REACT_APP_TWELVE_DATA_API_KEY');
    this.baseUrl = config.baseUrl || 'https://api.twelvedata.com';
    this.isUltraTier = config.isUltraTier !== false; // Default to true
    
    // Initialize token bucket with Ultra tier limits (10,946 credits/minute)
    const creditsPerMinute = this.isUltraTier ? 10946 : 60;
    this.tokenBucket = new TokenBucket(creditsPerMinute, creditsPerMinute);
    
    // Create cached versions of frequently called methods
    this.getQuote = this.createCachedMethod(
      this.getQuote,
      'quote',
      60000 // Cache quotes for 1 minute
    );
    
    this.getTimeSeries = this.createCachedMethod(
      this.getTimeSeries,
      'timeseries',
      300000 // Cache time series for 5 minutes
    );
  }
  
  /**
   * Fetches current quote data for a symbol
   * This provides real-time price information and key statistics
   */
  async getQuote(symbol: string): Promise<TwelveDataQuote & { name: string }> {
    await this.tokenBucket.waitForTokens(this.CREDIT_COSTS.quote);
    
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    const data = await this.makeRequest<TwelveDataQuote>(url.toString());
    
    // Validate response
    if (!isValidQuoteResponse(data) || data.symbol !== symbol) {
      throw new RetryableError(
        `Invalid quote response for ${symbol}`,
        ErrorCategory.PARSING,
        false
      );
    }
    
    return data as TwelveDataQuote & { name: string };
  }
  
  /**
   * Fetches historical price data
   * Supports multiple intervals and output sizes for different analysis needs
   */
  async getTimeSeries(
    symbol: string,
    interval: string = '1day',
    outputsize: number = 252 // Default to 1 year of daily data
  ): Promise<PriceData[]> {
    const credits = this.CREDIT_COSTS.timeSeries;
    await this.tokenBucket.waitForTokens(credits);
    
    const url = new URL(`${this.baseUrl}/time_series`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('interval', interval);
    url.searchParams.append('outputsize', outputsize.toString());
    url.searchParams.append('apikey', this.apiKey);
    
    const data = await this.makeRequest<TwelveDataTimeSeries>(url.toString());
    
    // Validate response
    if (!isValidTimeSeriesResponse(data)) {
      throw new RetryableError(
        `Failed to fetch time series for ${symbol}: Invalid response structure`,
        ErrorCategory.PARSING,
        false
      );
    }
    
    // Transform to our format with safe parsing
    return data.values.map(candle => ({
      date: candle.datetime,
      open: safeParseFloat(candle.open),
      high: safeParseFloat(candle.high),
      low: safeParseFloat(candle.low),
      close: safeParseFloat(candle.close),
      volume: safeParseInt(candle.volume),
      adjustedClose: safeParseFloat(candle.close) // TwelveData returns adjusted prices by default
    }));
  }
  
  /**
   * Fetches comprehensive fundamental data
   * This is one of the most credit-expensive operations but provides rich financial data
   */
  async getFundamentals(symbol: string): Promise<Partial<FinancialData>> {
    await this.tokenBucket.waitForTokens(this.CREDIT_COSTS.fundamentals);
    
    const url = new URL(`${this.baseUrl}/fundamentals`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('module', 'income_statement,balance_sheet,cash_flow,statistics');
    url.searchParams.append('apikey', this.apiKey);
    
    const data = await this.makeRequest<TwelveDataFundamentals>(url.toString());
    
    // Transform financial statements to our format with safe parsing
    const transformStatement = (statement: any): FinancialStatement => ({
      date: statement.date || statement.fiscal_date,
      period: statement.period || 'annual',
      revenue: safeParseFloat(statement.sales || statement.revenue),
      grossProfit: safeParseFloat(statement.gross_profit),
      operatingIncome: safeParseFloat(statement.operating_income),
      netIncome: safeParseFloat(statement.net_income),
      eps: safeParseFloat(statement.eps_basic || statement.eps),
      // Preserve all other fields
      ...statement
    });
    
    // Extract key metrics from statistics
    const keyMetrics = this.extractKeyMetrics(data);
    
    return {
      incomeStatement: [
        ...(data.income_statement?.annual?.map(transformStatement) || []),
        ...(data.income_statement?.quarterly?.map(transformStatement) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      
      balanceSheet: [
        ...(data.balance_sheet?.annual?.map(transformStatement) || []),
        ...(data.balance_sheet?.quarterly?.map(transformStatement) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      
      cashFlow: [
        ...(data.cash_flow?.annual?.map(transformStatement) || []),
        ...(data.cash_flow?.quarterly?.map(transformStatement) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      
      keyMetrics,
      historicalPrices: [] // Will be filled by getTimeSeries
    };
  }
  
  /**
   * Fetches analyst ratings and price targets
   * Ultra tier exclusive feature that provides valuable consensus data
   */
  async getAnalystRatings(symbol: string): Promise<AnalystData> {
    if (!this.isUltraTier) {
      // Return empty data for non-Ultra subscriptions
      return {
        consensus: { rating: 'hold', score: 3, count: 0 },
        priceTargets: [],
        recommendations: [],
        revisions: []
      };
    }
    
    await this.tokenBucket.waitForTokens(this.CREDIT_COSTS.analystRatings);
    
    const url = new URL(`${this.baseUrl}/analyst_ratings`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    const data = await this.makeRequest<{ ratings: TwelveDataAnalystRating[] }>(url.toString());
    
    // Process ratings to extract consensus and targets
    const ratings = data.ratings || [];
    const recentRatings = ratings.slice(0, 20); // Focus on most recent
    
    // Calculate consensus
    const ratingScores: { [key: string]: number } = {
      'strong buy': 5,
      'buy': 4,
      'hold': 3,
      'sell': 2,
      'strong sell': 1
    };
    
    let totalScore = 0;
    let ratingCount = 0;
    const priceTargets: any[] = [];
    const recommendations: any[] = [];
    
    recentRatings.forEach(rating => {
      // Add to recommendations
      recommendations.push({
        analyst: rating.analyst_name || 'Unknown',
        firm: rating.firm,
        rating: rating.rating,
        previousRating: rating.rating_change,
        date: rating.date
      });
      
      // Extract price targets
      if (rating.price_target) {
        priceTargets.push({
          analyst: rating.analyst_name || 'Unknown',
          firm: rating.firm,
          target: safeParseFloat(rating.price_target),
          date: rating.date,
          horizon: '12m' // TwelveData typically provides 12-month targets
        });
      }
      
      // Calculate consensus score
      const score = ratingScores[rating.rating.toLowerCase()];
      if (score) {
        totalScore += score;
        ratingCount++;
      }
    });
    
    const avgScore = ratingCount > 0 ? totalScore / ratingCount : 3;
    const consensusRating = this.scoreToRating(avgScore);
    
    return {
      consensus: {
        rating: consensusRating,
        score: parseFloat(avgScore.toFixed(2)),
        count: ratingCount
      },
      priceTargets,
      recommendations,
      revisions: [] // TwelveData doesn't provide revision history in standard API
    };
  }
  
  /**
   * Fetches technical indicators
   * Calculates common indicators like SMA, RSI, MACD for technical analysis
   */
  async getTechnicalIndicators(
    symbol: string,
    indicators: string[] = ['sma', 'rsi', 'macd']
  ): Promise<TechnicalIndicators> {
    // Each indicator costs credits
    const totalCredits = indicators.length * this.CREDIT_COSTS.technicalIndicator;
    await this.tokenBucket.waitForTokens(totalCredits);
    
    // Fetch indicators in parallel
    const indicatorPromises = indicators.map(async indicator => {
      const url = new URL(`${this.baseUrl}/${indicator}`);
      url.searchParams.append('symbol', symbol);
      url.searchParams.append('interval', '1day');
      url.searchParams.append('apikey', this.apiKey);
      
      // Add indicator-specific parameters
      switch (indicator) {
        case 'sma':
          url.searchParams.append('time_period', '20');
          break;
        case 'rsi':
          url.searchParams.append('time_period', '14');
          break;
        case 'macd':
          url.searchParams.append('fast_period', '12');
          url.searchParams.append('slow_period', '26');
          url.searchParams.append('signal_period', '9');
          break;
      }
      
      return this.makeRequest<any>(url.toString());
    });
    
    const results = await Promise.all(indicatorPromises);
    
    // Also fetch current volume data
    const quote = await this.getQuote(symbol);
    
    // Transform results into our format
    const technicals: TechnicalIndicators = {
      sma20: 0,
      sma50: 0,
      sma200: 0,
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      volume: {
        current: safeParseInt(quote.volume),
        average10Day: safeParseInt(quote.average_volume),
        average30Day: safeParseInt(quote.average_volume), // TwelveData provides one avg
        trend: this.calculateVolumeTrend(safeParseInt(quote.volume), safeParseInt(quote.average_volume))
      },
      patterns: [] // Will be filled by pattern detection engine
    };
    
    // Extract latest values from indicator responses
    results.forEach((result, index) => {
      const indicator = indicators[index];
      if (result.values && result.values.length > 0) {
        const latestValue = result.values[0];
        
        switch (indicator) {
          case 'sma':
            technicals.sma20 = safeParseFloat(latestValue.sma);
            break;
          case 'rsi':
            technicals.rsi = safeParseFloat(latestValue.rsi, 50);
            break;
          case 'macd':
            technicals.macd = {
              macd: safeParseFloat(latestValue.macd),
              signal: safeParseFloat(latestValue.macd_signal),
              histogram: safeParseFloat(latestValue.macd_hist)
            };
            break;
        }
      }
    });
    
    // Fetch additional SMAs for 50 and 200 periods
    await this.fetchAdditionalSMAs(symbol, technicals);
    
    return technicals;
  }
  
  /**
   * Fetches additional SMA periods
   * We need 50 and 200 day SMAs in addition to the 20 day
   */
  private async fetchAdditionalSMAs(
    symbol: string,
    technicals: TechnicalIndicators
  ): Promise<void> {
    const periods = [50, 200];
    const credits = periods.length * this.CREDIT_COSTS.technicalIndicator;
    await this.tokenBucket.waitForTokens(credits);
    
    const smaPromises = periods.map(async period => {
      const url = new URL(`${this.baseUrl}/sma`);
      url.searchParams.append('symbol', symbol);
      url.searchParams.append('interval', '1day');
      url.searchParams.append('time_period', period.toString());
      url.searchParams.append('apikey', this.apiKey);
      
      const result = await this.makeRequest<any>(url.toString());
      return { period, value: result.values?.[0]?.sma || 0 };
    });
    
    const smaResults = await Promise.all(smaPromises);
    
    smaResults.forEach(({ period, value }) => {
      if (period === 50) technicals.sma50 = safeParseFloat(value);
      if (period === 200) technicals.sma200 = safeParseFloat(value);
    });
  }
  
  /**
   * Extracts key financial metrics from fundamentals data
   * Transforms TwelveData's statistics into our standardized format
   */
  private extractKeyMetrics(data: TwelveDataFundamentals): KeyFinancialMetrics {
    const stats = data.statistics;
    const valuations = stats?.valuations_metrics || {};
    const financials = stats?.financials || {};
    
    return {
      marketCap: valuations.market_capitalization || 0,
      peRatio: valuations.trailing_pe || 0,
      pegRatio: valuations.peg_ratio || 0,
      priceToBook: valuations.price_to_book || 0,
      dividendYield: 0, // Will get from quote
      roe: financials.return_on_equity || 0,
      currentRatio: financials.current_ratio || 0,
      debtToEquity: financials.debt_to_equity || 0
    };
  }
  
  /**
   * Converts numeric score to rating category
   */
  private scoreToRating(score: number): 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell' {
    if (score >= 4.5) return 'strongBuy';
    if (score >= 3.5) return 'buy';
    if (score >= 2.5) return 'hold';
    if (score >= 1.5) return 'sell';
    return 'strongSell';
  }
  
  /**
   * Calculates volume trend based on current vs average
   */
  private calculateVolumeTrend(current: number, average: number): 'increasing' | 'stable' | 'decreasing' {
    const ratio = current / average;
    if (ratio > 1.2) return 'increasing';
    if (ratio < 0.8) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Gets information about current API usage
   * Useful for monitoring and debugging rate limit issues
   */
  getApiUsageInfo(): {
    availableCredits: number;
    creditsPerMinute: number;
    isUltraTier: boolean;
  } {
    return {
      availableCredits: this.tokenBucket.getAvailableTokens(),
      creditsPerMinute: this.isUltraTier ? 10946 : 60,
      isUltraTier: this.isUltraTier
    };
  }
  
  /**
   * Validates that we can make a request with given credit cost
   * Useful for pre-flight checks before expensive operations
   */
  canMakeRequest(creditCost: number): boolean {
    return this.tokenBucket.getAvailableTokens() >= creditCost;
  }
}