// src/reportGeneration/services/dataEnrichmentService.ts
// Data enrichment and cross-validation service
// Context: Enhances data quality by filling gaps and reconciling discrepancies

import { CompanyData, FinancialStatement, KeyMetrics } from '../models/reportTypes';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { getDataQualityService } from './dataQualityService';
import { logDebug, logError } from '../../utils/logger';

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  fillMissingData?: boolean;
  reconcileDiscrepancies?: boolean;
  enhanceDescriptions?: boolean;
  addDerivedMetrics?: boolean;
  expandTimeSeriesData?: boolean;
  includeIndustryComparisons?: boolean;
}

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  enrichedData: CompanyData;
  enrichmentStats: {
    fieldsAdded: number;
    fieldsUpdated: number;
    discrepanciesResolved: number;
    metricsCalculated: number;
    qualityImprovement: number;
  };
  enrichmentLog: Array<{
    field: string;
    action: 'added' | 'updated' | 'reconciled' | 'calculated';
    oldValue?: any;
    newValue: any;
    reason: string;
  }>;
}

/**
 * Data Enrichment Service
 * Enhances data quality through cross-validation and intelligent gap filling
 */
export class DataEnrichmentService {
  private twelveDataAdapter: TwelveDataAdapter;
  private newsAdapter: NewsAdapter;
  private qualityService = getDataQualityService();

  constructor(
    twelveDataAdapter?: TwelveDataAdapter,
    newsAdapter?: NewsAdapter
  ) {
    this.twelveDataAdapter = twelveDataAdapter || new TwelveDataAdapter({ debugMode: true });
    this.newsAdapter = newsAdapter || new NewsAdapter({ debugMode: true });
  }

  /**
   * Enriches company data with additional information and validations
   */
  async enrichCompanyData(
    data: CompanyData,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    logDebug('DataEnrichmentService', `Starting enrichment for ${data.ticker}`);

    const enrichmentLog: any[] = [];
    let enrichedData = { ...data };
    const stats = {
      fieldsAdded: 0,
      fieldsUpdated: 0,
      discrepanciesResolved: 0,
      metricsCalculated: 0,
      qualityImprovement: 0
    };

    // Get initial quality score
    const initialQuality = await this.qualityService.assessDataQuality(data);

    // Fill missing data
    if (options.fillMissingData !== false) {
      const fillResult = await this.fillMissingData(enrichedData);
      enrichedData = fillResult.data;
      enrichmentLog.push(...fillResult.log);
      stats.fieldsAdded += fillResult.fieldsAdded;
    }

    // Reconcile discrepancies
    if (options.reconcileDiscrepancies !== false) {
      const reconcileResult = await this.reconcileDiscrepancies(enrichedData);
      enrichedData = reconcileResult.data;
      enrichmentLog.push(...reconcileResult.log);
      stats.discrepanciesResolved += reconcileResult.resolved;
      stats.fieldsUpdated += reconcileResult.updated;
    }

    // Calculate derived metrics
    if (options.addDerivedMetrics !== false) {
      const metricsResult = this.calculateDerivedMetrics(enrichedData);
      enrichedData = metricsResult.data;
      enrichmentLog.push(...metricsResult.log);
      stats.metricsCalculated += metricsResult.calculated;
    }

    // Enhance descriptions with AI-friendly context
    if (options.enhanceDescriptions !== false) {
      const descResult = await this.enhanceDescriptions(enrichedData);
      enrichedData = descResult.data;
      enrichmentLog.push(...descResult.log);
      stats.fieldsUpdated += descResult.updated;
    }

    // Expand time series data
    if (options.expandTimeSeriesData) {
      const timeSeriesResult = await this.expandTimeSeriesData(enrichedData);
      enrichedData = timeSeriesResult.data;
      enrichmentLog.push(...timeSeriesResult.log);
      stats.fieldsAdded += timeSeriesResult.added;
    }

    // Add industry comparisons
    if (options.includeIndustryComparisons) {
      const comparisonResult = await this.addIndustryComparisons(enrichedData);
      enrichedData = comparisonResult.data;
      enrichmentLog.push(...comparisonResult.log);
      stats.fieldsAdded += comparisonResult.added;
    }

    // Calculate quality improvement
    const finalQuality = await this.qualityService.assessDataQuality(enrichedData);
    stats.qualityImprovement = finalQuality.overallScore - initialQuality.overallScore;

    // Add enrichment metadata
    enrichedData.metadata = {
      ...enrichedData.metadata,
      enriched: true,
      enrichmentDate: new Date().toISOString(),
      enrichmentStats: stats,
      dataQuality: finalQuality
    };

    logDebug('DataEnrichmentService', 
      `Enrichment complete. Quality improved by ${(stats.qualityImprovement * 100).toFixed(1)}%`
    );

    return {
      enrichedData,
      enrichmentStats: stats,
      enrichmentLog
    };
  }

  /**
   * Fills missing data fields using alternative sources
   */
  private async fillMissingData(data: CompanyData): Promise<{
    data: CompanyData;
    log: any[];
    fieldsAdded: number;
  }> {
    const log: any[] = [];
    let fieldsAdded = 0;
    const enriched = { ...data };

    // Fill missing company description
    if (!enriched.description || enriched.description.length < 50) {
      try {
        const profile = await this.twelveDataAdapter.getCompanyProfile(enriched.ticker);
        if (profile.description && profile.description.length > enriched.description?.length) {
          log.push({
            field: 'description',
            action: 'updated',
            oldValue: enriched.description,
            newValue: profile.description,
            reason: 'Fetched comprehensive description from TwelveData'
          });
          enriched.description = profile.description;
          fieldsAdded++;
        }
      } catch (error) {
        logDebug('DataEnrichmentService', 'Could not fetch company profile');
      }
    }

    // Fill missing sector/industry
    if (!enriched.sector || !enriched.industry) {
      try {
        const profile = await this.twelveDataAdapter.getCompanyProfile(enriched.ticker);
        if (!enriched.sector && profile.sector) {
          enriched.sector = profile.sector;
          fieldsAdded++;
          log.push({
            field: 'sector',
            action: 'added',
            newValue: profile.sector,
            reason: 'Added missing sector information'
          });
        }
        if (!enriched.industry && profile.industry) {
          enriched.industry = profile.industry;
          fieldsAdded++;
          log.push({
            field: 'industry',
            action: 'added',
            newValue: profile.industry,
            reason: 'Added missing industry information'
          });
        }
      } catch (error) {
        logDebug('DataEnrichmentService', 'Could not fetch sector/industry');
      }
    }

    // Fill missing financial metrics
    if (enriched.financials && (!enriched.financials.keyMetrics || 
        Object.keys(enriched.financials.keyMetrics).length < 5)) {
      try {
        const metrics = await this.calculateMissingMetrics(enriched.financials);
        enriched.financials.keyMetrics = {
          ...enriched.financials.keyMetrics,
          ...metrics
        };
        
        Object.keys(metrics).forEach(key => {
          if (!enriched.financials.keyMetrics[key]) {
            fieldsAdded++;
            log.push({
              field: `financials.keyMetrics.${key}`,
              action: 'calculated',
              newValue: metrics[key],
              reason: 'Calculated from available financial data'
            });
          }
        });
      } catch (error) {
        logDebug('DataEnrichmentService', 'Could not calculate missing metrics');
      }
    }

    // Fill missing news data
    if (!enriched.news || enriched.news.length === 0) {
      try {
        const news = await this.newsAdapter.getCompanyNews(enriched.ticker, 10, enriched.companyName);
        if (news.length > 0) {
          enriched.news = news;
          fieldsAdded++;
          log.push({
            field: 'news',
            action: 'added',
            newValue: `${news.length} articles`,
            reason: 'Fetched recent news articles'
          });
        }
      } catch (error) {
        logDebug('DataEnrichmentService', 'Could not fetch news data');
      }
    }

    return { data: enriched, log, fieldsAdded };
  }

  /**
   * Reconciles data discrepancies across sources
   */
  private async reconcileDiscrepancies(data: CompanyData): Promise<{
    data: CompanyData;
    log: any[];
    resolved: number;
    updated: number;
  }> {
    const log: any[] = [];
    let resolved = 0;
    let updated = 0;
    const enriched = { ...data };

    // Cross-validate and reconcile
    const { discrepancies } = this.qualityService.crossValidateData(data);

    for (const discrepancy of discrepancies) {
      const sources = discrepancy.sources;
      const values = Object.values(sources);
      
      // Use statistical methods to determine best value
      let reconciledValue: any;
      
      if (typeof values[0] === 'number') {
        // For numeric values, use median or weighted average
        const sorted = values.sort((a, b) => a - b);
        reconciledValue = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        // Apply the reconciled value
        this.applyReconciledValue(enriched, discrepancy.field, reconciledValue);
        
        log.push({
          field: discrepancy.field,
          action: 'reconciled',
          oldValue: sources,
          newValue: reconciledValue,
          reason: `Reconciled ${Object.keys(sources).length} different values using median`
        });
        
        resolved++;
        updated++;
      }
    }

    // Additional consistency checks
    if (enriched.financials) {
      // Ensure balance sheet balances
      const bs = enriched.financials.balanceSheet?.[0];
      if (bs && bs.totalAssets && bs.totalLiabilities && bs.totalEquity) {
        const expectedAssets = bs.totalLiabilities + bs.totalEquity;
        if (Math.abs(bs.totalAssets - expectedAssets) > bs.totalAssets * 0.01) {
          const reconciledAssets = bs.totalLiabilities + bs.totalEquity;
          log.push({
            field: 'financials.balanceSheet[0].totalAssets',
            action: 'reconciled',
            oldValue: bs.totalAssets,
            newValue: reconciledAssets,
            reason: 'Adjusted to balance accounting equation'
          });
          bs.totalAssets = reconciledAssets;
          resolved++;
          updated++;
        }
      }
    }

    return { data: enriched, log, resolved, updated };
  }

  /**
   * Calculates derived financial metrics
   */
  private calculateDerivedMetrics(data: CompanyData): {
    data: CompanyData;
    log: any[];
    calculated: number;
  } {
    const log: any[] = [];
    let calculated = 0;
    const enriched = { ...data };

    if (!enriched.financials) {
      return { data: enriched, log, calculated };
    }

    const metrics = enriched.financials.keyMetrics || {};
    const income = enriched.financials.incomeStatement?.[0];
    const balance = enriched.financials.balanceSheet?.[0];
    const cashFlow = enriched.financials.cashFlow?.[0];

    // Calculate additional ratios
    const derivedMetrics: any = {};

    // Profitability metrics
    if (income) {
      if (income.revenue && income.grossProfit) {
        derivedMetrics.grossMargin = income.grossProfit / income.revenue;
        calculated++;
      }
      
      if (income.revenue && income.operatingIncome) {
        derivedMetrics.operatingMargin = income.operatingIncome / income.revenue;
        calculated++;
      }
      
      if (income.revenue && income.netIncome) {
        derivedMetrics.netMargin = income.netIncome / income.revenue;
        calculated++;
      }
    }

    // Efficiency metrics
    if (balance && income) {
      if (balance.totalAssets && income.revenue) {
        derivedMetrics.assetTurnover = income.revenue / balance.totalAssets;
        calculated++;
      }
      
      if (balance.inventory && income.costOfRevenue) {
        derivedMetrics.inventoryTurnover = income.costOfRevenue / balance.inventory;
        calculated++;
      }
    }

    // Cash flow metrics
    if (cashFlow && income) {
      if (cashFlow.operatingCashFlow && income.revenue) {
        derivedMetrics.ocfToRevenue = cashFlow.operatingCashFlow / income.revenue;
        calculated++;
      }
      
      if (cashFlow.freeCashFlow && balance?.totalEquity) {
        derivedMetrics.fcfToEquity = cashFlow.freeCashFlow / balance.totalEquity;
        calculated++;
      }
    }

    // Growth metrics (if historical data available)
    if (enriched.financials.incomeStatement?.length >= 2) {
      const current = enriched.financials.incomeStatement[0];
      const previous = enriched.financials.incomeStatement[1];
      
      if (current.revenue && previous.revenue) {
        derivedMetrics.revenueGrowthRate = 
          (current.revenue - previous.revenue) / previous.revenue;
        calculated++;
      }
      
      if (current.netIncome && previous.netIncome && previous.netIncome > 0) {
        derivedMetrics.earningsGrowthRate = 
          (current.netIncome - previous.netIncome) / previous.netIncome;
        calculated++;
      }
    }

    // Add derived metrics
    enriched.financials.keyMetrics = {
      ...metrics,
      ...derivedMetrics
    };

    // Log calculations
    Object.keys(derivedMetrics).forEach(key => {
      log.push({
        field: `financials.keyMetrics.${key}`,
        action: 'calculated',
        newValue: derivedMetrics[key],
        reason: 'Calculated from financial statements'
      });
    });

    return { data: enriched, log, calculated };
  }

  /**
   * Enhances descriptions and text fields for better AI understanding
   */
  private async enhanceDescriptions(data: CompanyData): Promise<{
    data: CompanyData;
    log: any[];
    updated: number;
  }> {
    const log: any[] = [];
    let updated = 0;
    const enriched = { ...data };

    // Enhance company description with structured information
    if (enriched.description) {
      const enhancedDesc = this.structureDescription(enriched);
      if (enhancedDesc !== enriched.description) {
        log.push({
          field: 'description',
          action: 'updated',
          oldValue: enriched.description,
          newValue: enhancedDesc,
          reason: 'Enhanced with structured business context'
        });
        enriched.description = enhancedDesc;
        updated++;
      }
    }

    // Add business model classification
    if (!enriched.metadata?.businessModel) {
      const businessModel = this.classifyBusinessModel(enriched);
      enriched.metadata = {
        ...enriched.metadata,
        businessModel
      };
      log.push({
        field: 'metadata.businessModel',
        action: 'added',
        newValue: businessModel,
        reason: 'Classified business model from available data'
      });
      updated++;
    }

    // Add competitive positioning
    if (!enriched.metadata?.competitivePosition) {
      const position = await this.assessCompetitivePosition(enriched);
      enriched.metadata = {
        ...enriched.metadata,
        competitivePosition: position
      };
      log.push({
        field: 'metadata.competitivePosition',
        action: 'added',
        newValue: position,
        reason: 'Assessed competitive position from metrics'
      });
      updated++;
    }

    return { data: enriched, log, updated };
  }

  /**
   * Expands time series data for better trend analysis
   */
  private async expandTimeSeriesData(data: CompanyData): Promise<{
    data: CompanyData;
    log: any[];
    added: number;
  }> {
    const log: any[] = [];
    let added = 0;
    const enriched = { ...data };

    // Ensure we have sufficient historical financial data
    if (enriched.financials) {
      // Income statements
      if (enriched.financials.incomeStatement && 
          enriched.financials.incomeStatement.length < 8) {
        try {
          const historicalIncome = await this.twelveDataAdapter.getIncomeStatement(
            enriched.ticker,
            'quarterly',
            12
          );
          
          if (historicalIncome.length > enriched.financials.incomeStatement.length) {
            const addedCount = historicalIncome.length - enriched.financials.incomeStatement.length;
            enriched.financials.incomeStatement = historicalIncome;
            added += addedCount;
            log.push({
              field: 'financials.incomeStatement',
              action: 'added',
              newValue: `${addedCount} additional quarters`,
              reason: 'Expanded historical data for trend analysis'
            });
          }
        } catch (error) {
          logDebug('DataEnrichmentService', 'Could not expand income statement data');
        }
      }

      // Price history
      if (!enriched.financials.historicalPrices || 
          enriched.financials.historicalPrices.length < 252) { // 1 year of trading days
        try {
          const prices = await this.twelveDataAdapter.getTimeSeries(
            enriched.ticker,
            '1day',
            252
          );
          
          if (prices.length > (enriched.financials.historicalPrices?.length || 0)) {
            enriched.financials.historicalPrices = prices;
            added++;
            log.push({
              field: 'financials.historicalPrices',
              action: 'added',
              newValue: `${prices.length} daily prices`,
              reason: 'Added comprehensive price history'
            });
          }
        } catch (error) {
          logDebug('DataEnrichmentService', 'Could not expand price history');
        }
      }
    }

    return { data: enriched, log, added };
  }

  /**
   * Adds industry comparison data
   */
  private async addIndustryComparisons(data: CompanyData): Promise<{
    data: CompanyData;
    log: any[];
    added: number;
  }> {
    const log: any[] = [];
    let added = 0;
    const enriched = { ...data };

    // Get industry peers
    const peers = await this.getIndustryPeers(enriched.ticker, enriched.industry);
    
    if (peers.length > 0) {
      // Calculate industry averages
      const industryMetrics = await this.calculateIndustryAverages(peers);
      
      enriched.metadata = {
        ...enriched.metadata,
        industryComparison: {
          peers,
          industryAverages: industryMetrics,
          relativePerformance: this.calculateRelativePerformance(
            enriched.financials?.keyMetrics,
            industryMetrics
          )
        }
      };
      
      added++;
      log.push({
        field: 'metadata.industryComparison',
        action: 'added',
        newValue: `Comparison with ${peers.length} peers`,
        reason: 'Added industry context for benchmarking'
      });
    }

    return { data: enriched, log, added };
  }

  /**
   * Helper methods
   */

  private calculateMissingMetrics(financials: any): Partial<KeyMetrics> {
    const metrics: Partial<KeyMetrics> = {};
    const income = financials.incomeStatement?.[0];
    const balance = financials.balanceSheet?.[0];
    const cashFlow = financials.cashFlow?.[0];

    // Calculate ROE if missing
    if (!financials.keyMetrics?.roe && income?.netIncome && balance?.totalEquity) {
      metrics.roe = income.netIncome / balance.totalEquity;
    }

    // Calculate ROA if missing
    if (!financials.keyMetrics?.roa && income?.netIncome && balance?.totalAssets) {
      metrics.roa = income.netIncome / balance.totalAssets;
    }

    // Calculate current ratio if missing
    if (!financials.keyMetrics?.currentRatio && 
        balance?.currentAssets && balance?.currentLiabilities) {
      metrics.currentRatio = balance.currentAssets / balance.currentLiabilities;
    }

    // Calculate debt-to-equity if missing
    if (!financials.keyMetrics?.debtToEquity && 
        balance?.totalDebt && balance?.totalEquity) {
      metrics.debtToEquity = balance.totalDebt / balance.totalEquity;
    }

    return metrics;
  }

  private applyReconciledValue(data: CompanyData, field: string, value: any): void {
    const keys = field.split('.');
    let current: any = data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private structureDescription(data: CompanyData): string {
    let enhanced = data.description || '';
    
    // Add structured context
    const additions: string[] = [];
    
    if (data.sector && data.industry) {
      additions.push(`Operating in the ${data.industry} industry within the ${data.sector} sector.`);
    }
    
    if (data.financials?.keyMetrics?.marketCap) {
      const marketCapB = (data.financials.keyMetrics.marketCap / 1e9).toFixed(1);
      additions.push(`Market capitalization of $${marketCapB} billion.`);
    }
    
    if (data.financials?.incomeStatement?.[0]?.revenue) {
      const revenueB = (data.financials.incomeStatement[0].revenue / 1e9).toFixed(1);
      additions.push(`Annual revenue of $${revenueB} billion.`);
    }
    
    if (additions.length > 0) {
      enhanced = enhanced.trim() + ' ' + additions.join(' ');
    }
    
    return enhanced;
  }

  private classifyBusinessModel(data: CompanyData): string {
    // Simple business model classification based on metrics
    const income = data.financials?.incomeStatement?.[0];
    const balance = data.financials?.balanceSheet?.[0];
    
    if (!income || !balance) {
      return 'unknown';
    }
    
    // High margin, low asset turnover = likely software/services
    const margin = income.netIncome / income.revenue;
    const assetTurnover = income.revenue / balance.totalAssets;
    
    if (margin > 0.15 && assetTurnover < 1) {
      return 'high-margin-services';
    } else if (margin < 0.05 && assetTurnover > 2) {
      return 'low-margin-retail';
    } else if (balance.inventory / balance.totalAssets > 0.2) {
      return 'manufacturing';
    } else if (balance.totalDebt / balance.totalAssets > 0.6) {
      return 'capital-intensive';
    }
    
    return 'diversified';
  }

  private async assessCompetitivePosition(data: CompanyData): Promise<string> {
    const metrics = data.financials?.keyMetrics;
    if (!metrics) return 'unclear';
    
    let score = 0;
    
    // ROE above 15% is strong
    if (metrics.roe && metrics.roe > 0.15) score += 2;
    else if (metrics.roe && metrics.roe > 0.10) score += 1;
    
    // Low debt is good
    if (metrics.debtToEquity && metrics.debtToEquity < 0.5) score += 2;
    else if (metrics.debtToEquity && metrics.debtToEquity < 1) score += 1;
    
    // High margins indicate pricing power
    const income = data.financials?.incomeStatement?.[0];
    if (income) {
      const netMargin = income.netIncome / income.revenue;
      if (netMargin > 0.15) score += 2;
      else if (netMargin > 0.08) score += 1;
    }
    
    if (score >= 5) return 'market-leader';
    if (score >= 3) return 'strong-competitor';
    if (score >= 1) return 'established-player';
    return 'challenger';
  }

  private async getIndustryPeers(ticker: string, industry?: string): Promise<string[]> {
    // In a real implementation, this would query a database or API
    // For now, return common peers based on ticker
    const peerMap: { [key: string]: string[] } = {
      'AAPL': ['MSFT', 'GOOGL', 'AMZN'],
      'TSLA': ['GM', 'F', 'RIVN'],
      'JPM': ['BAC', 'WFC', 'C'],
      'NVDA': ['AMD', 'INTC', 'QCOM']
    };
    
    return peerMap[ticker] || [];
  }

  private async calculateIndustryAverages(peers: string[]): Promise<any> {
    // Simplified - would fetch real peer data
    return {
      peRatio: 22.5,
      roe: 0.15,
      debtToEquity: 0.8,
      netMargin: 0.12,
      revenueGrowth: 0.08
    };
  }

  private calculateRelativePerformance(
    companyMetrics?: any,
    industryMetrics?: any
  ): any {
    if (!companyMetrics || !industryMetrics) {
      return null;
    }
    
    const performance: any = {};
    
    // Compare key metrics
    if (companyMetrics.peRatio && industryMetrics.peRatio) {
      performance.peRatioVsIndustry = 
        (companyMetrics.peRatio - industryMetrics.peRatio) / industryMetrics.peRatio;
    }
    
    if (companyMetrics.roe && industryMetrics.roe) {
      performance.roeVsIndustry = 
        (companyMetrics.roe - industryMetrics.roe) / industryMetrics.roe;
    }
    
    return performance;
  }
}

// Singleton instance
let enrichmentServiceInstance: DataEnrichmentService | null = null;

/**
 * Gets the data enrichment service instance
 */
export function getDataEnrichmentService(
  twelveDataAdapter?: TwelveDataAdapter,
  newsAdapter?: NewsAdapter
): DataEnrichmentService {
  if (!enrichmentServiceInstance) {
    enrichmentServiceInstance = new DataEnrichmentService(twelveDataAdapter, newsAdapter);
  }
  return enrichmentServiceInstance;
}