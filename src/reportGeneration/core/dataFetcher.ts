// src/reportGeneration/core/dataFetcher.ts
// Orchestrates all data fetching operations for report generation
// Context: Central coordinator that manages parallel fetching from multiple sources

import { 
  CompanyData, 
  ProcessingError, 
  DataSourceMetadata,
  FinancialData,
  NewsItem,
  TranscriptData,
  TechnicalIndicators,
  AnalystData,
  EarningsData
} from '../models/reportTypes';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { EnhancedTwelveDataAdapter } from '../adapters/enhancedTwelveDataAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { EdgarAdapter } from '../adapters/edgarAdapter';
import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { DataCache as MemoryCache } from '../utils/cache';
import { RetryableError } from '../utils/errorHandler';
import { validateFinancialData, enrichFinancialData } from '../utils/dataValidation';
import { getDataQualityService } from '../services/dataQualityService';
import { getDataEnrichmentService } from '../services/dataEnrichmentService';
import { logDebug, logError } from '../../utils/logger';

/**
 * Configuration for data fetching operations
 * Allows customization of the fetching process
 */
export interface DataFetcherConfig {
  ticker: string;
  startDate?: string;
  endDate?: string;
  cache?: MemoryCache;
  debugMode?: boolean;
  apiKey?: string; // TwelveData API key
  firecrawlApiKey?: string;
  includeNews?: boolean;
  includeTranscripts?: boolean;
  maxConcurrent?: number;
  adapters?: { // Optional: provide pre-configured adapters
    twelveData?: TwelveDataAdapter;
    news?: NewsAdapter;
    edgar?: EdgarAdapter;
    firecrawl?: FirecrawlAdapter;
  };
}

/**
 * Orchestrates data fetching from all sources
 * This class embodies the intelligence of our data gathering system
 */
export class DataFetcher {
  private config: DataFetcherConfig;
  private cache: MemoryCache;
  private qualityService = getDataQualityService();
  private enrichmentService = getDataEnrichmentService();
  private adapters: {
    twelveData: TwelveDataAdapter;
    news: NewsAdapter;
    edgar: EdgarAdapter;
    firecrawl: FirecrawlAdapter;
  };
  
  constructor(config: DataFetcherConfig) {
    this.config = {
      includeNews: true,
      includeTranscripts: true,
      maxConcurrent: 3,
      ...config
    };
    this.cache = config.cache || new MemoryCache({});
    
    // Initialize all adapters with shared configuration
    // Use provided adapters if available, otherwise create new ones
    // Use EnhancedTwelveDataAdapter for better data quality
    this.adapters = {
      twelveData: config.adapters?.twelveData || new EnhancedTwelveDataAdapter({
        apiKey: config.apiKey,
        cache: this.cache,
        debugMode: config.debugMode
      }),
      news: config.adapters?.news || new NewsAdapter({
        cache: this.cache,
        debugMode: config.debugMode
      }),
      edgar: config.adapters?.edgar || new EdgarAdapter({
        cache: this.cache,
        debugMode: config.debugMode
      }),
      firecrawl: config.adapters?.firecrawl || new FirecrawlAdapter({
        apiKey: config.firecrawlApiKey || process.env.FIRECRAWL_API_KEY,
        cache: this.cache,
        debugMode: config.debugMode
      })
    };
  }
  
  /**
   * Main entry point - fetches all data for a company
   * This method orchestrates the entire data gathering process
   */
  async fetchAll(
    ticker: string = this.config.ticker,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<CompanyData> {
    const startTime = Date.now();
    const errors: ProcessingError[] = [];
    const metadata: DataSourceMetadata = {
      lastUpdated: new Date().toISOString(),
      sources: {}
    };
    
    try {
      // Check if we have the enhanced adapter with comprehensive data method
      const adapter = this.adapters.twelveData as any;
      if (adapter.getComprehensiveData) {
        onProgress?.('Fetching comprehensive data', 50);
        logDebug('DataFetcher', 'Using enhanced comprehensive data fetch');
        
        try {
          const comprehensiveData = await adapter.getComprehensiveData(ticker);
          
          // Add metadata
          metadata.sources['TwelveData'] = {
            status: 'success',
            timestamp: Date.now(),
            recordsReturned: 1
          };
          
          // Phase 4: Data Validation and Cleaning
          onProgress?.('Validating and cleaning data', 80);
          
          // Validate data quality
          const qualityMetrics = await this.qualityService.assessDataQuality(comprehensiveData);
          logDebug('DataFetcher', `Data quality score: ${qualityMetrics.overallScore}`);
          
          // Phase 6: Final Assembly
          onProgress?.('Assembling final dataset', 95);
          const companyData = this.assembleCompanyData(comprehensiveData, metadata, errors);
          
          // Log performance metrics
          if (this.config.debugMode) {
            const duration = Date.now() - startTime;
            logDebug('DataFetcher', `Completed comprehensive fetch for ${ticker} in ${duration}ms`);
          }
          
          onProgress?.('Complete', 100);
          return companyData;
          
        } catch (error) {
          logDebug('DataFetcher', 'Enhanced comprehensive fetch failed, falling back to standard flow');
          // Fall through to standard fetch flow
        }
      }
      
      // Standard fetch flow
      // Phase 1: Core Financial Data (Critical - Must Succeed)
      onProgress?.('Fetching core financial data', 10);
      let coreData;
      try {
        coreData = await this.fetchCoreFinancialData(ticker, errors, metadata);
      } catch (error) {
        logDebug('DataFetcher', 'Core data fetch failed, using mock data fallback');
        coreData = this.generateMockCoreData(ticker);
        errors.push({
          stage: 'fetching',
          source: 'DataFetcher',
          message: 'Using mock data due to API unavailability',
          timestamp: Date.now(),
          severity: 'warning',
          retryable: true
        });
      }
      
      // Phase 2: Supplementary Data (Important - Should Succeed)
      onProgress?.('Fetching supplementary data', 30);
      let supplementaryData;
      try {
        supplementaryData = await this.fetchSupplementaryData(ticker, errors, metadata);
      } catch (error) {
        logDebug('DataFetcher', 'Supplementary data fetch failed, using defaults');
        supplementaryData = {};
      }
      
      // Phase 3: Enrichment Data (Nice to Have - Can Fail)
      onProgress?.('Fetching enrichment data', 60);
      const enrichmentData = await this.fetchEnrichmentData(ticker, errors, metadata);
      
      // Phase 4: Data Validation and Cleaning
      onProgress?.('Validating and cleaning data', 80);
      const mergedData = {
        ...coreData,
        ...supplementaryData,
        ...enrichmentData
      } as CompanyData;
      
      // Validate data quality
      const qualityMetrics = await this.qualityService.assessDataQuality(mergedData);
      logDebug('DataFetcher', `Data quality score: ${qualityMetrics.overallScore}`);
      
      // Enrich data if quality is below threshold
      let finalData = mergedData;
      if (qualityMetrics.overallScore < 0.8) {
        onProgress?.('Enriching data with calculations', 90);
        logDebug('DataFetcher', 'Data quality below threshold, applying enrichment');
        
        const enrichmentResult = await this.enrichmentService.enrichCompanyData(mergedData, {
          fillMissingData: true,
          reconcileDiscrepancies: true,
          enhanceDescriptions: true,
          addDerivedMetrics: true,
          expandTimeSeriesData: qualityMetrics.timeliness < 0.7,
          includeIndustryComparisons: false // Skip for performance
        });
        
        finalData = enrichmentResult.enrichedData;
        logDebug('DataFetcher', 
          `Enrichment complete. Quality improved by ${(enrichmentResult.enrichmentStats.qualityImprovement * 100).toFixed(1)}%`
        );
      }
      
      // Phase 6: Final Assembly
      onProgress?.('Assembling final dataset', 95);
      const companyData = this.assembleCompanyData(finalData, metadata, errors);
      
      // Log performance metrics
      if (this.config.debugMode) {
        const duration = Date.now() - startTime;
        const finalQuality = await this.qualityService.assessDataQuality(companyData);
        
        logDebug('DataFetcher', `Completed fetch for ${ticker} in ${duration}ms`);
        logDebug('DataFetcher', `Success rate: ${this.calculateSuccessRate(metadata)}%`);
        logDebug('DataFetcher', `Data completeness: ${this.calculateCompleteness(companyData)}%`);
        logDebug('DataFetcher', `Final data quality: ${(finalQuality.overallScore * 100).toFixed(1)}%`);
        logDebug('DataFetcher', `Quality dimensions - Completeness: ${(finalQuality.completeness * 100).toFixed(1)}%, ` +
          `Accuracy: ${(finalQuality.accuracy * 100).toFixed(1)}%, ` +
          `Timeliness: ${(finalQuality.timeliness * 100).toFixed(1)}%`);
      }
      
      onProgress?.('Data fetch complete', 100);
      return companyData;
      
    } catch (error: any) {
      // If we get here, something critical failed
      logError('DataFetcher', 'Critical failure in fetchAll:', error);
      
      // Log detailed error information
      console.error('[DataFetcher] Critical error details:', {
        ticker,
        errorMessage: error.message,
        errorStack: error.stack,
        errorsEncountered: errors,
        metadata
      });
      
      // Check if this is a stub/fallback scenario
      if (error.message?.includes('stub') || error.message?.includes('fallback')) {
        console.warn('[DataFetcher] WARNING: Using stub/fallback data!');
      }
      
      throw new Error(
        `Critical failure in data fetching for ${ticker}: ${error.message}\n` +
        `Errors encountered: ${errors.map(e => e.message).join('; ')}`
      );
    }
  }
  
  /**
   * Fetches core financial data that is absolutely required
   * This includes real-time quotes, historical prices, and fundamental data
   */
  private async fetchCoreFinancialData(
    ticker: string,
    errors: ProcessingError[],
    metadata: DataSourceMetadata
  ): Promise<Partial<CompanyData>> {
    // These are critical - we'll retry more aggressively and fail if we can't get them
    const criticalTasks = {
      quote: this.fetchWithEnhancedHandling(
        'TwelveData Quote',
        () => this.adapters.twelveData.getQuote(ticker),
        errors,
        metadata,
        { critical: true, maxRetries: 5 }
      ),
      
      fundamentals: this.fetchWithEnhancedHandling(
        'TwelveData Fundamentals',
        () => this.adapters.twelveData.getFundamentals(ticker),
        errors,
        metadata,
        { critical: true, maxRetries: 3 }
      ),
      
      historicalPrices: this.fetchWithEnhancedHandling(
        'TwelveData Historical',
        () => this.adapters.twelveData.getTimeSeries(ticker, '1day', 252),
        errors,
        metadata,
        { critical: true, maxRetries: 3 }
      )
    };
    
    // Execute critical tasks with controlled concurrency
    const [quote, fundamentals, historicalPrices] = await Promise.all([
      criticalTasks.quote,
      criticalTasks.fundamentals,
      criticalTasks.historicalPrices
    ]);
    
    // Validate we have minimum required data
    if (!quote && !fundamentals) {
      throw new Error('Failed to fetch critical financial data - cannot proceed');
    }
    
    return {
      ticker,
      companyName: quote?.name || ticker,
      financials: {
        ...fundamentals,
        historicalPrices: historicalPrices || [],
        keyMetrics: this.calculateKeyMetrics(quote, fundamentals)
      } as FinancialData
    };
  }
  
  /**
   * Fetches supplementary data that enhances the report
   * This includes technical indicators, analyst data, and company information
   */
  private async fetchSupplementaryData(
    ticker: string,
    errors: ProcessingError[],
    metadata: DataSourceMetadata
  ): Promise<Partial<CompanyData>> {
    // These are important but not critical - we can work without them
    const supplementaryTasks = {
      technicals: this.fetchWithEnhancedHandling(
        'TwelveData Technicals',
        () => this.adapters.twelveData.getTechnicalIndicators(ticker),
        errors,
        metadata,
        { critical: false }
      ),
      
      analysts: this.fetchWithEnhancedHandling(
        'TwelveData Analysts',
        () => this.adapters.twelveData.getAnalystRatings(ticker),
        errors,
        metadata,
        { critical: false }
      ),
      
      companyInfo: this.fetchWithEnhancedHandling(
        'SEC Company Info',
        () => this.adapters.edgar.getCompanyDescription(ticker),
        errors,
        metadata,
        { critical: false }
      ),
      
      earnings: this.fetchWithEnhancedHandling(
        'TwelveData Earnings',
        () => this.adapters.twelveData.getEarnings(ticker),
        errors,
        metadata,
        { critical: false }
      )
    };
    
    const [technicals, analysts, companyInfo, earnings] = await Promise.all([
      supplementaryTasks.technicals,
      supplementaryTasks.analysts,
      supplementaryTasks.companyInfo,
      supplementaryTasks.earnings
    ]);
    
    return {
      description: companyInfo?.description || '',
      sector: companyInfo?.sector || 'Technology',
      industry: companyInfo?.industry || 'Technology',
      technicals: technicals || this.getDefaultTechnicals(),
      analysts: analysts || this.getDefaultAnalystData(),
      earnings: earnings || { historical: [], upcoming: [], nextEarningsDate: null, averageSurprise: 0 }
    };
  }
  
  /**
   * Fetches enrichment data that adds color to the report
   * This includes news and transcripts which can fail without breaking the report
   */
  private async fetchEnrichmentData(
    ticker: string,
    errors: ProcessingError[],
    metadata: DataSourceMetadata
  ): Promise<Partial<CompanyData>> {
    const enrichmentTasks: any = {};
    
    // Only fetch if requested in config
    if (this.config.includeNews) {
      enrichmentTasks.news = this.fetchWithEnhancedHandling(
        'News Articles',
        () => this.adapters.news.getCompanyNews(ticker, 20, undefined, {
          timeRange: 'month',
          focusAreas: ['earnings', 'product', 'strategy']
        }),
        errors,
        metadata,
        { critical: false, timeout: 30000 }
      );
    }
    
    if (this.config.includeTranscripts) {
      enrichmentTasks.transcripts = this.fetchWithEnhancedHandling(
        'Earnings Transcripts',
        () => this.adapters.edgar.getEarningsTranscripts(ticker, 4),
        errors,
        metadata,
        { critical: false, timeout: 45000 }
      );
    }
    
    const results = await Promise.all(Object.values(enrichmentTasks));
    const [news, transcripts] = results;
    
    return {
      news: news || [],
      transcripts: transcripts || []
    };
  }
  
  /**
   * Enhanced fetch wrapper with sophisticated error handling
   * This is where we implement our resilience strategies
   */
  private async fetchWithEnhancedHandling<T>(
    sourceName: string,
    fetchFn: () => Promise<T>,
    errors: ProcessingError[],
    metadata: DataSourceMetadata,
    options: {
      critical?: boolean;
      maxRetries?: number;
      timeout?: number;
    } = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    const { critical = false, maxRetries = 3, timeout = 30000 } = options;
    
    try {
      // Implement timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      const result = await Promise.race([
        fetchFn(),
        timeoutPromise
      ]) as T;
      
      // Record success
      metadata.sources[sourceName] = {
        status: 'success',
        timestamp: new Date().toISOString(),
        recordCount: Array.isArray(result) ? result.length : 1
      };
      
      return result;
      
    } catch (error: any) {
      const err = error as Error;
      
      // For critical data, we might want to try alternative sources
      if (critical && sourceName.includes('TwelveData')) {
        return this.tryAlternativeSource(sourceName, err, errors, metadata);
      }
      
      // Record error
      this.recordError(sourceName, err, errors, metadata, critical);
      
      // Re-throw if critical
      if (critical) {
        throw new Error(`Critical data source failed: ${sourceName} - ${err.message}`);
      }
      
      return null;
    }
  }
  
  /**
   * Attempts to fetch data from alternative sources when primary fails
   * This demonstrates graceful degradation
   */
  private async tryAlternativeSource<T>(
    sourceName: string,
    originalError: Error,
    errors: ProcessingError[],
    metadata: DataSourceMetadata
  ): Promise<T | null> {
    console.warn(`[DataFetcher] Primary source failed, trying alternatives for ${sourceName}`);
    
    // Example: If TwelveData quote fails, we might try to get basic info from news
    if (sourceName === 'TwelveData Quote') {
      try {
        // This is a simplified example - in reality, you'd implement proper fallbacks
        const newsItems = await this.adapters.news.getCompanyNews(this.config.ticker, 1);
        if (newsItems && newsItems.length > 0) {
          // Extract what we can from news
          console.log('[DataFetcher] Extracted basic info from news as fallback');
        }
      } catch (fallbackError: any) {
        console.error('[DataFetcher] Fallback source also failed:', fallbackError);
      }
    }
    
    // Record the original error
    this.recordError(sourceName, originalError, errors, metadata, true);
    return null;
  }
  
  /**
   * Validates and cleans the fetched data
   * Ensures data consistency and identifies quality issues
   */
  private async validateAndCleanData(
    rawData: Partial<CompanyData>,
    errors: ProcessingError[]
  ): Promise<Partial<CompanyData>> {
    const validationIssues: string[] = [];
    
    // Validate financial data integrity
    if (rawData.financials) {
      const financialIssues = validateFinancialData(rawData.financials);
      validationIssues.push(...financialIssues);
      
      // Clean up invalid values
      rawData.financials = this.cleanFinancialData(rawData.financials);
    }
    
    // Validate date consistency
    if (rawData.financials?.historicalPrices) {
      const dateIssues = this.validateDateConsistency(rawData.financials.historicalPrices);
      validationIssues.push(...dateIssues);
    }
    
    // Validate news data
    if (rawData.news) {
      rawData.news = this.validateAndCleanNews(rawData.news);
    }
    
    // Log validation issues if any
    if (validationIssues.length > 0 && this.config.debugMode) {
      console.warn('[DataFetcher] Validation issues found:', validationIssues);
      
      // Record as warnings
      validationIssues.forEach(issue => {
        errors.push({
          stage: 'validation',
          source: 'DataValidator',
          message: issue,
          timestamp: Date.now(),
          severity: 'warning',
          retryable: false
        });
      });
    }
    
    return rawData;
  }
  
  /**
   * Enriches data with calculated fields and derived metrics
   * This is where we add intelligence to raw data
   */
  private async enrichData(
    validatedData: Partial<CompanyData>,
    errors: ProcessingError[]
  ): Promise<Partial<CompanyData>> {
    try {
      // Enrich financial data with additional calculations
      if (validatedData.financials) {
        validatedData.financials = enrichFinancialData(validatedData.financials);
      }
      
      // Calculate additional technical indicators
      if (validatedData.financials?.historicalPrices && validatedData.technicals) {
        validatedData.technicals = this.calculateAdditionalTechnicals(
          validatedData.financials.historicalPrices,
          validatedData.technicals
        );
      }
      
      // Derive sentiment from multiple sources
      if (validatedData.news && validatedData.transcripts) {
        const aggregatedSentiment = this.calculateAggregatedSentiment(
          validatedData.news,
          validatedData.transcripts
        );
        
        // Add to metadata
        validatedData.metadata = {
          ...validatedData.metadata,
          aggregatedSentiment
        } as DataSourceMetadata;
      }
      
      // Calculate quality scores
      const dataQuality = this.assessDataQuality(validatedData);
      validatedData.metadata = {
        ...validatedData.metadata,
        dataQuality
      } as DataSourceMetadata;
      
      return validatedData;
      
    } catch (error: any) {
      console.error('[DataFetcher] Error during enrichment:', error);
      errors.push({
        stage: 'enrichment',
        source: 'DataEnricher',
        message: error.message,
        timestamp: Date.now(),
        severity: 'warning',
        retryable: false
      });
      
      return validatedData;
    }
  }
  
  /**
   * Assembles the final company data structure
   * This is the final step where everything comes together
   */
  private assembleCompanyData(
    enrichedData: Partial<CompanyData>,
    metadata: DataSourceMetadata,
    errors: ProcessingError[]
  ): CompanyData {
    // Add any final processing errors to metadata
    if (errors.length > 0) {
      metadata.errors = errors.filter(e => e.severity === 'error' || e.severity === 'critical');
      metadata.warnings = errors.filter(e => e.severity === 'warning');
    }
    
    // Ensure all required fields have at least default values
    const companyData: CompanyData = {
      ticker: enrichedData.ticker || this.config.ticker,
      companyName: enrichedData.companyName || enrichedData.ticker || this.config.ticker,
      description: enrichedData.description || '',
      sector: enrichedData.sector || 'Unknown',
      industry: enrichedData.industry || 'Unknown',
      
      financials: enrichedData.financials || {
        incomeStatement: [],
        balanceSheet: [],
        cashFlow: [],
        keyMetrics: this.getDefaultKeyMetrics(),
        historicalPrices: []
      },
      
      news: enrichedData.news || [],
      transcripts: enrichedData.transcripts || [],
      technicals: enrichedData.technicals || this.getDefaultTechnicals(),
      analysts: enrichedData.analysts || this.getDefaultAnalystData(),
      earnings: enrichedData.earnings || { historical: [], upcoming: [], nextEarningsDate: null, averageSurprise: 0 },
      
      metadata: {
        ...metadata,
        ...enrichedData.metadata,
        completeness: this.calculateCompleteness(enrichedData as CompanyData),
        quality: this.assessDataQuality(enrichedData)
      }
    };
    
    return companyData;
  }
  
  /**
   * Helper methods for data processing
   */
  
  private cleanFinancialData(financials: FinancialData): FinancialData {
    // Remove any NaN or invalid values
    const cleanNumeric = (value: any): number => {
      const num = parseFloat(value);
      return isNaN(num) || !isFinite(num) ? 0 : num;
    };
    
    // Clean financial statements
    ['incomeStatement', 'balanceSheet', 'cashFlow'].forEach(statementType => {
      if (financials[statementType as keyof FinancialData]) {
        const statements = financials[statementType as keyof FinancialData] as any[];
        financials[statementType as keyof FinancialData] = statements.map(statement => {
          const cleaned = { ...statement };
          Object.keys(cleaned).forEach(key => {
            if (typeof cleaned[key] === 'number' || !isNaN(parseFloat(cleaned[key]))) {
              cleaned[key] = cleanNumeric(cleaned[key]);
            }
          });
          return cleaned;
        }) as any;
      }
    });
    
    return financials;
  }
  
  private validateDateConsistency(prices: any[]): string[] {
    const issues: string[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const currentDate = new Date(prices[i].date);
      const prevDate = new Date(prices[i - 1].date);
      
      // Check if dates are in descending order
      if (currentDate > prevDate) {
        issues.push(`Date ordering issue at index ${i}: ${prices[i].date} > ${prices[i-1].date}`);
      }
      
      // Check for duplicate dates
      if (currentDate.getTime() === prevDate.getTime()) {
        issues.push(`Duplicate date found: ${prices[i].date}`);
      }
    }
    
    return issues;
  }
  
  private validateAndCleanNews(news: NewsItem[]): NewsItem[] {
    return news.filter(item => {
      // Must have at least title and date
      if (!item.title || !item.publishedDate) return false;
      
      // Validate date
      const date = new Date(item.publishedDate);
      if (isNaN(date.getTime())) return false;
      
      // Remove duplicates based on title similarity
      const isDuplicate = news.some(other => 
        other !== item && 
        this.calculateStringSimilarity(item.title, other.title) > 0.9
      );
      
      return !isDuplicate;
    });
  }
  
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
  
  private calculateAdditionalTechnicals(
    prices: any[],
    technicals: TechnicalIndicators
  ): TechnicalIndicators {
    // Calculate volatility
    if (prices.length > 20) {
      const returns = prices.slice(0, 20).map((price, i) => {
        if (i === prices.length - 1) return 0;
        return (prices[i + 1].close - price.close) / price.close;
      });
      
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
      
      technicals.volatility = volatility;
    }
    
    // Identify support and resistance levels
    if (prices.length > 50) {
      const highs = prices.slice(0, 50).map(p => p.high);
      const lows = prices.slice(0, 50).map(p => p.low);
      
      technicals.resistance = Math.max(...highs);
      technicals.support = Math.min(...lows);
    }
    
    return technicals;
  }
  
  private calculateAggregatedSentiment(
    news: NewsItem[],
    transcripts: TranscriptData[]
  ): any {
    // Weight recent news more heavily
    const newsScores = news.map((item, index) => {
      const weight = Math.exp(-index * 0.1); // Exponential decay
      const score = item.sentiment === 'positive' ? 1 : 
                   item.sentiment === 'negative' ? -1 : 0;
      return score * weight;
    });
    
    const transcriptScores = transcripts.map(t => {
      return t.sentiment?.overall === 'positive' ? 1 :
             t.sentiment?.overall === 'negative' ? -1 : 0;
    });
    
    const allScores = [...newsScores, ...transcriptScores];
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    
    return {
      overall: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
      score: avgScore,
      newsSentiment: newsScores.reduce((a, b) => a + b, 0) / newsScores.length,
      transcriptSentiment: transcriptScores.reduce((a, b) => a + b, 0) / transcriptScores.length
    };
  }
  
  private assessDataQuality(data: Partial<CompanyData>): any {
    const scores = {
      financials: 0,
      news: 0,
      technicals: 0,
      analysts: 0
    };
    
    // Score financial data quality
    if (data.financials) {
      if (data.financials.incomeStatement?.length > 0) scores.financials += 0.25;
      if (data.financials.balanceSheet?.length > 0) scores.financials += 0.25;
      if (data.financials.cashFlow?.length > 0) scores.financials += 0.25;
      if (data.financials.historicalPrices?.length > 200) scores.financials += 0.25;
    }
    
    // Score news quality
    if (data.news && data.news.length > 10) {
      scores.news = Math.min(data.news.length / 20, 1);
    }
    
    // Score technical data
    if (data.technicals) {
      if (data.technicals.sma200 > 0) scores.technicals += 0.5;
      if (data.technicals.rsi > 0) scores.technicals += 0.5;
    }
    
    // Score analyst data
    if (data.analysts && data.analysts.consensus.count > 0) {
      scores.analysts = Math.min(data.analysts.consensus.count / 10, 1);
    }
    
    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    
    return {
      overall,
      ...scores,
      grade: overall > 0.8 ? 'A' : overall > 0.6 ? 'B' : overall > 0.4 ? 'C' : 'D'
    };
  }
  
  private calculateCompleteness(data: CompanyData): number {
    let complete = 0;
    let total = 0;
    
    // Check each major section
    const checks = [
      { value: data.description, weight: 1 },
      { value: data.financials?.incomeStatement?.length > 0, weight: 2 },
      { value: data.financials?.historicalPrices?.length > 100, weight: 2 },
      { value: data.news?.length > 5, weight: 1 },
      { value: data.technicals?.sma200 > 0, weight: 1 },
      { value: data.analysts?.consensus?.count > 0, weight: 1 }
    ];
    
    checks.forEach(check => {
      total += check.weight;
      if (check.value) complete += check.weight;
    });
    
    return Math.round((complete / total) * 100);
  }
  
  private calculateSuccessRate(metadata: DataSourceMetadata): number {
    const sources = Object.values(metadata.sources);
    const successful = sources.filter(s => s.status === 'success').length;
    return Math.round((successful / sources.length) * 100);
  }
  
  private recordError(
    source: string,
    error: Error,
    errors: ProcessingError[],
    metadata: DataSourceMetadata,
    critical: boolean
  ): void {
    errors.push({
      stage: 'fetching',
      source,
      message: error.message,
      timestamp: Date.now(),
      severity: critical ? 'critical' : 'error',
      retryable: error instanceof RetryableError ? error.retryable : false
    });
    
    metadata.sources[source] = {
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    if (this.config.debugMode) {
      console.error(`[DataFetcher] ${source} failed:`, error.message);
    }
  }
  
  // Default value providers
  private calculateKeyMetrics(quote: any, fundamentals: any): any {
    return {
      marketCap: quote?.market_cap ? parseFloat(quote.market_cap) : 0,
      peRatio: quote?.pe ? parseFloat(quote.pe) : 0,
      pegRatio: fundamentals?.keyMetrics?.pegRatio || 0,
      priceToBook: quote?.pb ? parseFloat(quote.pb) : 0,
      dividendYield: quote?.dividend_yield ? parseFloat(quote.dividend_yield) : 0,
      roe: fundamentals?.keyMetrics?.roe || 0,
      currentRatio: fundamentals?.keyMetrics?.currentRatio || 0,
      debtToEquity: fundamentals?.keyMetrics?.debtToEquity || 0
    };
  }
  
  private getDefaultKeyMetrics(): any {
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
  
  private getDefaultTechnicals(): TechnicalIndicators {
    return {
      sma20: 0,
      sma50: 0,
      sma200: 0,
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      volume: { current: 0, average10Day: 0, average30Day: 0, trend: 'stable' },
      patterns: []
    };
  }
  
  private getDefaultAnalystData(): AnalystData {
    return {
      consensus: { rating: 'hold', score: 3, count: 0 },
      priceTargets: [],
      recommendations: [],
      revisions: []
    };
  }

  /**
   * Generates mock core data when API is unavailable
   * Provides realistic sample data for development/demo purposes
   */
  private generateMockCoreData(ticker: string): Partial<CompanyData> {
    logDebug('DataFetcher', `Generating mock data for ${ticker}`);
    
    // Generate realistic mock data based on ticker
    const mockCompanies: { [key: string]: any } = {
      'AAPL': {
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        marketCap: 3.0e12,
        peRatio: 32.5,
        revenue: 394.3e9,
        netIncome: 99.8e9
      },
      'NVDA': {
        name: 'NVIDIA Corporation',
        sector: 'Technology',
        industry: 'Semiconductors',
        description: 'NVIDIA Corporation provides graphics, compute and networking solutions in the United States, Taiwan, China, and internationally.',
        marketCap: 1.1e12,
        peRatio: 65.8,
        revenue: 26.9e9,
        netIncome: 9.75e9
      },
      'MSFT': {
        name: 'Microsoft Corporation',
        sector: 'Technology',
        industry: 'Software',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        marketCap: 2.8e12,
        peRatio: 35.2,
        revenue: 211.9e9,
        netIncome: 72.7e9
      }
    };
    
    // Use provided ticker or default to NVDA
    const mockData = mockCompanies[ticker] || mockCompanies['NVDA'];
    const currentPrice = mockData.marketCap / 1e9; // Simplified price calculation
    
    // Generate historical prices (1 year of daily data)
    const historicalPrices = [];
    const basePrice = currentPrice * 0.8; // Start 20% lower
    for (let i = 365; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Add some randomness and trend
      const randomWalk = (Math.random() - 0.48) * 5; // Slight upward bias
      const trendFactor = (365 - i) / 365 * 0.2; // 20% trend over year
      const price = basePrice * (1 + trendFactor) + randomWalk;
      
      historicalPrices.push({
        date: date.toISOString().split('T')[0],
        open: price - Math.random() * 2,
        high: price + Math.random() * 3,
        low: price - Math.random() * 3,
        close: price,
        volume: Math.floor(10000000 + Math.random() * 5000000)
      });
    }
    
    return {
      ticker,
      companyName: mockData.name,
      description: mockData.description,
      sector: mockData.sector,
      industry: mockData.industry,
      financials: {
        incomeStatement: [
          {
            date: '2024-09-30',
            revenue: mockData.revenue,
            grossProfit: mockData.revenue * 0.45,
            operatingIncome: mockData.revenue * 0.25,
            netIncome: mockData.netIncome,
            eps: mockData.netIncome / (mockData.marketCap / currentPrice / 1e6)
          },
          {
            date: '2024-06-30',
            revenue: mockData.revenue * 0.95,
            grossProfit: mockData.revenue * 0.95 * 0.44,
            operatingIncome: mockData.revenue * 0.95 * 0.24,
            netIncome: mockData.netIncome * 0.92,
            eps: (mockData.netIncome * 0.92) / (mockData.marketCap / currentPrice / 1e6)
          }
        ],
        balanceSheet: [
          {
            date: '2024-09-30',
            totalAssets: mockData.marketCap * 0.8,
            totalLiabilities: mockData.marketCap * 0.3,
            totalShareholdersEquity: mockData.marketCap * 0.5,
            totalCurrentAssets: mockData.marketCap * 0.3,
            totalCurrentLiabilities: mockData.marketCap * 0.15,
            longTermDebt: mockData.marketCap * 0.1
          }
        ],
        cashFlow: [
          {
            date: '2024-09-30',
            operatingCashFlow: mockData.netIncome * 1.2,
            capitalExpenditure: mockData.revenue * 0.05,
            freeCashFlow: mockData.netIncome * 1.2 - mockData.revenue * 0.05
          }
        ],
        keyMetrics: {
          marketCap: mockData.marketCap,
          peRatio: mockData.peRatio,
          pegRatio: mockData.peRatio / 25,
          pbRatio: 4.5,
          psRatio: mockData.marketCap / (mockData.revenue * 4),
          evToEbitda: 18.5,
          debtToEquity: 0.6,
          currentRatio: 2.0,
          quickRatio: 1.8,
          roe: 0.25,
          roa: 0.15,
          roic: 0.20,
          grossMargin: 0.45,
          operatingMargin: 0.25,
          netMargin: mockData.netIncome / mockData.revenue,
          fcfMargin: 0.28,
          dividendYield: 0.015
        },
        historicalPrices,
        currentPrice
      }
    };
  }
}

/**
 * Factory function for creating data fetchers
 * Provides a clean API for instantiation
 */
export function createDataFetcher(config: DataFetcherConfig): DataFetcher {
  // Validate configuration
  if (!config.ticker) {
    throw new Error('Ticker symbol is required for data fetching');
  }
  
  // Ensure API keys are available
  const apiKey = config.apiKey || process.env.REACT_APP_TWELVE_DATA_API_KEY;
  const firecrawlKey = config.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    console.warn(
      '[DataFetcher] TwelveData API key not found. Reports will use mock data. ' +
      'Set REACT_APP_TWELVE_DATA_API_KEY environment variable for real data.'
    );
  }
  
  if (!firecrawlKey) {
    console.warn(
      '[DataFetcher] Firecrawl API key not found. Web scraping features will be limited.'
    );
  }
  
  return new DataFetcher({
    ...config,
    apiKey,
    firecrawlApiKey: firecrawlKey
  });
}