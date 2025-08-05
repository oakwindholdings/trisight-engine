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
  FinancialStatement,
  EarningsData
} from '../models/reportTypes';
import { RetryableError, ErrorCategory } from '../utils/errorHandler';
import { storageAdapter } from '../utils/storageAdapter';
import { 
  isValidQuoteResponse, 
  isValidTimeSeriesResponse,
  isValidIndicatorResponse,
  safeParseFloat,
  safeParseInt,
  isRateLimitError,
  isAuthError
} from '../utils/typeGuards';
import { logDebug, logError } from '../../utils/logger';

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

interface TwelveDataEarnings {
  earnings_announcements?: Array<{
    date: string;
    time: string;
    eps_estimate: string;
    eps_actual: string;
    revenue_estimate: string;
    revenue_actual: string;
    fiscal_year: string;
    fiscal_quarter: string;
  }>;
  earnings_calendar?: Array<{
    date: string;
    time: string;
    eps_estimate: string;
    revenue_estimate: string;
    fiscal_year: string;
    fiscal_quarter: string;
  }>;
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
    
    this.apiKey = config.apiKey || process.env.REACT_APP_TWELVE_DATA_API_KEY || '';
    if (!this.apiKey) {
      logDebug('TwelveDataAdapter', 'API key not found - adapter will operate in mock mode');
    }
    this.baseUrl = config.baseUrl || 'https://api.twelvedata.com';
    this.isUltraTier = config.isUltraTier !== false; // Default to true
    
    // Initialize token bucket with Ultra tier limits (10,946 credits/minute)
    const creditsPerMinute = this.isUltraTier ? 10946 : 60;
    this.tokenBucket = new TokenBucket(creditsPerMinute, creditsPerMinute);
    
    // Initialize localStorage cache layer
    this.initializeLocalStorageCache();
    
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
    
    this.getFundamentals = this.createCachedMethod(
      this.getFundamentals,
      'fundamentals',
      3600000 // Cache fundamentals for 1 hour
    );
    
    this.getEarnings = this.createCachedMethod(
      this.getEarnings,
      'earnings',
      3600000 // Cache earnings for 1 hour
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
   * NOTE: TwelveData doesn't have a /fundamentals endpoint, so we fetch individual components
   */
  async getFundamentals(symbol: string): Promise<Partial<FinancialData>> {
    // We need to make multiple API calls to get all the data
    // Each endpoint costs credits, so we'll charge for all of them
    const totalCredits = this.CREDIT_COSTS.fundamentals * 4; // statistics + income + balance + cash flow
    await this.tokenBucket.waitForTokens(totalCredits);
    
    if (this.debugMode) {
      console.log(`[TwelveData] Fetching fundamentals for ${symbol} using individual endpoints`);
    }
    
    // Fetch all data in parallel for efficiency
    const [statistics, incomeStatement, balanceSheet, cashFlow] = await Promise.allSettled([
      this.fetchStatistics(symbol),
      this.fetchIncomeStatement(symbol),
      this.fetchBalanceSheet(symbol),
      this.fetchCashFlow(symbol)
    ]);
    
    // Transform financial statements to our format with safe parsing
    const transformStatement = (statement: any): FinancialStatement => {
      // Income statement fields
      if (statement.sales !== undefined || statement.revenue !== undefined) {
        return {
          date: statement.fiscal_date || statement.date,
          period: statement.quarter ? 'quarterly' : 'annual',
          revenue: statement.sales || statement.revenue || 0,
          grossProfit: statement.gross_profit || 0,
          operatingIncome: statement.operating_income || 0,
          netIncome: statement.net_income || 0,
          eps: statement.eps_diluted || statement.eps_basic || 0,
          ebitda: statement.ebitda || 0,
          // Additional fields
          costOfRevenue: statement.cost_of_goods || 0,
          researchDevelopment: statement.operating_expense?.research_and_development || 0,
          sellingGeneralAdmin: statement.operating_expense?.selling_general_and_administrative || 0,
          incomeTax: statement.income_tax || 0,
          sharesOutstanding: statement.diluted_shares_outstanding || statement.basic_shares_outstanding || 0
        };
      }
      
      // Balance sheet fields
      if (statement.assets !== undefined) {
        const assets = statement.assets || {};
        const liabilities = statement.liabilities || {};
        const equity = statement.shareholders_equity || {};
        
        return {
          date: statement.fiscal_date || statement.date,
          period: statement.quarter ? 'quarterly' : 'annual',
          // Assets
          totalAssets: assets.total_assets || 0,
          currentAssets: assets.current_assets?.total_current_assets || 0,
          cash: assets.current_assets?.cash_and_cash_equivalents || 0,
          inventory: assets.current_assets?.inventory || 0,
          accountsReceivable: assets.current_assets?.accounts_receivable || 0,
          // Liabilities
          totalLiabilities: liabilities.total_liabilities || 0,
          currentLiabilities: liabilities.current_liabilities?.total_current_liabilities || 0,
          longTermDebt: liabilities.non_current_liabilities?.long_term_debt || 0,
          // Equity
          totalEquity: equity.total_shareholders_equity || 0,
          retainedEarnings: equity.retained_earnings || 0,
          commonStock: equity.common_stock || 0
        };
      }
      
      // Cash flow statement fields (if needed)
      return {
        date: statement.date || statement.fiscal_date,
        period: statement.period || 'annual',
        ...statement
      };
    };
    
    // Extract key metrics from statistics if available
    let keyMetrics: KeyFinancialMetrics = this.getDefaultKeyMetrics();
    if (statistics.status === 'fulfilled' && statistics.value) {
      keyMetrics = this.extractKeyMetrics(statistics.value);
    }
    
    // Process income statements
    let incomeStatements: FinancialStatement[] = [];
    if (incomeStatement.status === 'fulfilled' && incomeStatement.value) {
      const data = incomeStatement.value;
      incomeStatements = data.income_statement?.map(transformStatement) || [];
    }
    
    // Process balance sheets
    let balanceSheets: FinancialStatement[] = [];
    if (balanceSheet.status === 'fulfilled' && balanceSheet.value) {
      const data = balanceSheet.value;
      balanceSheets = data.balance_sheet?.map(transformStatement) || [];
    }
    
    // Process cash flow statements
    let cashFlows: FinancialStatement[] = [];
    if (cashFlow.status === 'fulfilled' && cashFlow.value) {
      const data = cashFlow.value;
      cashFlows = data.cash_flow?.map(transformStatement) || [];
    }
    
    // Log any failures for debugging
    if (this.debugMode) {
      if (statistics.status === 'rejected') console.error('[TwelveData] Statistics fetch failed:', statistics.reason);
      if (incomeStatement.status === 'rejected') console.error('[TwelveData] Income statement fetch failed:', incomeStatement.reason);
      if (balanceSheet.status === 'rejected') console.error('[TwelveData] Balance sheet fetch failed:', balanceSheet.reason);
      if (cashFlow.status === 'rejected') console.error('[TwelveData] Cash flow fetch failed:', cashFlow.reason);
    }
    
    return {
      incomeStatement: incomeStatements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      balanceSheet: balanceSheets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      cashFlow: cashFlows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      keyMetrics,
      historicalPrices: [] // Will be filled by getTimeSeries
    };
  }
  
  /**
   * Fetches statistics data for key metrics
   */
  private async fetchStatistics(symbol: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/statistics`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    try {
      const response = await this.makeRequest<any>(url.toString());
      return response;
    } catch (error) {
      console.warn(`[TwelveData] Failed to fetch statistics for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fetches income statement data
   */
  private async fetchIncomeStatement(symbol: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/income_statement`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    try {
      const response = await this.makeRequest<any>(url.toString());
      return response;
    } catch (error) {
      console.warn(`[TwelveData] Failed to fetch income statement for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fetches balance sheet data
   */
  private async fetchBalanceSheet(symbol: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/balance_sheet`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    try {
      const response = await this.makeRequest<any>(url.toString());
      return response;
    } catch (error) {
      console.warn(`[TwelveData] Failed to fetch balance sheet for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fetches cash flow data
   */
  private async fetchCashFlow(symbol: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/cash_flow`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    try {
      const response = await this.makeRequest<any>(url.toString());
      return response;
    } catch (error) {
      console.warn(`[TwelveData] Failed to fetch cash flow for ${symbol}:`, error);
      return null;
    }
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
   * Extracts key financial metrics from statistics data
   * Transforms TwelveData's statistics response into our standardized format
   */
  private extractKeyMetrics(data: any): KeyFinancialMetrics {
    // Handle the nested statistics structure from API
    const stats = data?.statistics || {};
    const valuations = stats?.valuations_metrics || {};
    const financials = stats?.financials || {};
    const balanceSheet = financials?.balance_sheet || {};
    
    // Extract values from the correct locations
    const marketCap = valuations.market_capitalization || 0;
    const peRatio = valuations.trailing_pe || 0;
    const pegRatio = valuations.peg_ratio || 0;
    const priceToBook = valuations.price_to_book_mrq || 0;
    
    // Dividend yield is in the dividends_and_splits section
    const dividendYield = stats?.dividends_and_splits?.trailing_annual_dividend_yield || 0;
    
    // ROE calculation with proper validation
    // TwelveData may return ROE in different formats - handle both decimal and percentage
    let roe = financials.return_on_equity_ttm || 0;

    // If ROE is in decimal form (0.15 = 15%), convert to percentage
    // If already in percentage form (15 = 15%), use as-is
    // Rule: MVP - Fix unrealistic ROE calculation causing 11546.3% values
    if (Math.abs(roe) <= 5) {
      // Likely decimal form (e.g., 0.15 = 15%)
      roe = roe * 100;
    }
    // If roe > 5, assume it's already in percentage form
    
    // Current ratio and debt to equity from balance_sheet section
    const currentRatio = balanceSheet.current_ratio_mrq || 0;
    const debtToEquity = balanceSheet.total_debt_to_equity_mrq || 0;
    
    const metrics = {
      marketCap: marketCap,
      peRatio: peRatio,
      pegRatio: pegRatio,
      priceToBook: priceToBook,
      dividendYield: dividendYield * 100, // Convert to percentage
      roe: roe,
      currentRatio: currentRatio,
      debtToEquity: debtToEquity
    };
    
    // Validate metrics before returning
    return this.validateKeyMetrics(metrics);
  }
  
  /**
   * Returns default key metrics when data is unavailable
   */
  private getDefaultKeyMetrics(): KeyFinancialMetrics {
    return {
      marketCap: 0,
      peRatio: 0,
      pegRatio: 0,
      priceToBook: 0,
      dividendYield: 0,
      roe: 0,
      currentRatio: 0,
      debtToEquity: 0
    };
  }
  
  /**
   * Validates and sanitizes key financial metrics
   * Ensures values are within reasonable ranges
   */
  private validateKeyMetrics(metrics: KeyFinancialMetrics): KeyFinancialMetrics {
    // P/E Ratio: typically 0-100, can be negative if company has losses
    if (metrics.peRatio < -100 || metrics.peRatio > 1000) {
      logDebug('TwelveDataAdapter', `Invalid P/E ratio: ${metrics.peRatio}, setting to 0`);
      metrics.peRatio = 0;
    }
    
    // ROE: typically -50% to 100%, extreme values indicate calculation errors
    // Rule: MVP - Implement strict ROE validation for professional standards
    if (metrics.roe < -100 || metrics.roe > 200) {
      logDebug('TwelveDataAdapter', `Invalid ROE: ${metrics.roe}%, capping at reasonable range`);
      // Cap at more conservative ranges for professional reports
      metrics.roe = metrics.roe > 200 ? 50 : -20; // Conservative caps
    }
    
    // Debt/Equity: typically 0-5, but can be much higher for certain companies
    // Apple specifically has a high debt/equity ratio by design
    if (metrics.debtToEquity < 0) {
      logDebug('TwelveDataAdapter', `Invalid Debt/Equity: ${metrics.debtToEquity}, setting to 0`);
      metrics.debtToEquity = 0;
    } else if (metrics.debtToEquity > 500) {
      // Only cap extremely unreasonable values
      logDebug('TwelveDataAdapter', `Extremely high Debt/Equity: ${metrics.debtToEquity}, capping at 200`);
      metrics.debtToEquity = 200;
    }
    
    // Current Ratio: typically 0.5-3
    if (metrics.currentRatio < 0 || metrics.currentRatio > 10) {
      logDebug('TwelveDataAdapter', `Invalid Current Ratio: ${metrics.currentRatio}, setting to 1`);
      metrics.currentRatio = 1;
    }
    
    // Market Cap: must be positive
    if (metrics.marketCap < 0) {
      logDebug('TwelveDataAdapter', `Invalid Market Cap: ${metrics.marketCap}, setting to 0`);
      metrics.marketCap = 0;
    }
    
    // Dividend Yield: typically 0-10%
    if (metrics.dividendYield < 0 || metrics.dividendYield > 20) {
      logDebug('TwelveDataAdapter', `Invalid Dividend Yield: ${metrics.dividendYield}%, capping at reasonable range`);
      metrics.dividendYield = metrics.dividendYield > 20 ? 10 : 0;
    }
    
    return metrics;
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
  
  /**
   * Fetches earnings data including historical and upcoming earnings
   * This provides crucial quarterly performance data
   */
  async getEarnings(symbol: string): Promise<EarningsData> {
    await this.tokenBucket.waitForTokens(this.CREDIT_COSTS.fundamentals);
    
    const url = new URL(`${this.baseUrl}/earnings`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', this.apiKey);
    
    try {
      const data = await this.makeRequest<TwelveDataEarnings>(url.toString());
      
      // Transform to our format
      const historical = (data.earnings_announcements || []).map(e => ({
        date: e.date,
        fiscalQuarter: e.fiscal_quarter,
        fiscalYear: parseInt(e.fiscal_year),
        epsEstimate: safeParseFloat(e.eps_estimate),
        epsActual: safeParseFloat(e.eps_actual),
        epsSurprise: safeParseFloat(e.eps_actual) - safeParseFloat(e.eps_estimate),
        revenueEstimate: safeParseFloat(e.revenue_estimate),
        revenueActual: safeParseFloat(e.revenue_actual),
        revenueSurprise: safeParseFloat(e.revenue_actual) - safeParseFloat(e.revenue_estimate)
      }));
      
      const upcoming = (data.earnings_calendar || []).map(e => ({
        date: e.date,
        fiscalQuarter: e.fiscal_quarter,
        fiscalYear: parseInt(e.fiscal_year),
        epsEstimate: safeParseFloat(e.eps_estimate),
        revenueEstimate: safeParseFloat(e.revenue_estimate)
      }));
      
      return {
        historical: historical.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        upcoming: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        nextEarningsDate: upcoming[0]?.date || null,
        averageSurprise: this.calculateAverageSurprise(historical)
      };
    } catch (error) {
      // Fallback to extracting from fundamentals if earnings endpoint fails
      console.warn('[TwelveData] Earnings endpoint failed, falling back to fundamentals');
      const fundamentals = await this.getFundamentals(symbol);
      return this.extractEarningsFromFundamentals(fundamentals);
    }
  }
  
  /**
   * Alias for getFundamentals to match expected interface
   * Returns complete financial statements data
   */
  async getFinancials(symbol: string): Promise<Partial<FinancialData>> {
    return this.getFundamentals(symbol);
  }
  
  /**
   * Initializes storage caching with proper expiration
   */
  private initializeLocalStorageCache(): void {
    // Clean up expired cache entries on initialization
    try {
      const keys = storageAdapter.keys();
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith('trisight_td_')) {
          try {
            const cached = JSON.parse(storageAdapter.getItem(key) || '{}');
            if (cached.expires && cached.expires < now) {
              storageAdapter.removeItem(key);
            }
          } catch (e) {
            // Remove corrupted entries
            storageAdapter.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('[TwelveData] storage cleanup failed:', error);
    }
  }
  
  /**
   * Enhanced caching method that uses storage adapter for persistence
   */
  protected createCachedMethod<T extends (...args: any[]) => Promise<any>>(
    method: T,
    keyPrefix: string,
    ttlMs?: number
  ): T {
    const originalMethod = method.bind(this);
    
    return (async (...args: any[]) => {
      const cacheKey = `trisight_td_${keyPrefix}_${JSON.stringify(args)}`;
      
      // Check storage first
      try {
        const cached = storageAdapter.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.expires > Date.now()) {
            if (this.debugMode) {
              console.log(`[TwelveData] Cache hit for ${keyPrefix}`);
            }
            return parsedCache.data;
          }
        }
      } catch (error) {
        console.warn('[TwelveData] Cache read error:', error);
      }
      
      // Fetch fresh data
      const result = await originalMethod(...args);
      
      // Store in storage with expiration
      try {
        const cacheData = {
          data: result,
          expires: Date.now() + (ttlMs || 300000) // Default 5 min
        };
        storageAdapter.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        // Handle quota exceeded or other storage errors
        console.warn('[TwelveData] Cache write error:', error);
        // Try to clear old entries and retry
        this.clearOldCacheEntries();
      }
      
      return result;
    }) as T;
  }
  
  /**
   * Clears old cache entries when storage is full
   */
  private clearOldCacheEntries(): void {
    try {
      const entries: Array<{key: string, expires: number}> = [];
      const keys = storageAdapter.keys();
      
      keys.forEach(key => {
        if (key.startsWith('trisight_td_')) {
          try {
            const cached = JSON.parse(storageAdapter.getItem(key) || '{}');
            if (cached.expires) {
              entries.push({ key, expires: cached.expires });
            }
          } catch (e) {
            storageAdapter.removeItem(key);
          }
        }
      });
      
      // Sort by expiration and remove oldest 25%
      entries.sort((a, b) => a.expires - b.expires);
      const toRemove = Math.ceil(entries.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        storageAdapter.removeItem(entries[i].key);
      }
    } catch (error) {
      console.error('[TwelveData] Failed to clear cache:', error);
    }
  }
  
  /**
   * Calculates average earnings surprise from historical data
   */
  private calculateAverageSurprise(historical: any[]): number {
    if (historical.length === 0) return 0;
    
    const surprises = historical
      .filter(h => h.epsSurprise !== undefined && !isNaN(h.epsSurprise))
      .map(h => h.epsSurprise);
    
    if (surprises.length === 0) return 0;
    
    const avgSurprise = surprises.reduce((sum, s) => sum + s, 0) / surprises.length;
    return parseFloat(avgSurprise.toFixed(4));
  }
  
  /**
   * Extracts earnings data from fundamentals as fallback
   */
  private extractEarningsFromFundamentals(fundamentals: Partial<FinancialData>): EarningsData {
    const incomeStatements = fundamentals.incomeStatement || [];
    
    // Extract quarterly earnings from income statements
    const quarterlyStatements = incomeStatements.filter(s => s.period === 'quarterly');
    const historical = quarterlyStatements.slice(0, 8).map(statement => ({
      date: statement.date,
      fiscalQuarter: this.extractQuarter(statement.date),
      fiscalYear: new Date(statement.date).getFullYear(),
      epsActual: statement.eps || 0,
      epsEstimate: 0, // Not available in fundamentals
      epsSurprise: 0,
      revenueActual: statement.revenue || 0,
      revenueEstimate: 0,
      revenueSurprise: 0
    }));
    
    return {
      historical,
      upcoming: [],
      nextEarningsDate: null,
      averageSurprise: 0
    };
  }
  
  /**
   * Extracts quarter from date string
   */
  private extractQuarter(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter}`;
  }
}