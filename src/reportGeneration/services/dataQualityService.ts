// src/reportGeneration/services/dataQualityService.ts
// Comprehensive data quality assessment and validation service
// Context: Ensures high-quality data for AI content generation

import { CompanyData, NewsItem, FinancialStatement } from '../models/reportTypes';
import { logDebug, logError } from '../../utils/logger';

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  overallScore: number; // 0-1
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  relevance: number; // 0-1
  details: {
    missingFields: string[];
    staleData: string[];
    inconsistencies: string[];
    warnings: string[];
    recommendations: string[];
  };
}

/**
 * Field-level quality assessment
 */
interface FieldQuality {
  field: string;
  value: any;
  quality: number;
  issues: string[];
}

/**
 * Data validation rules
 */
interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'format' | 'consistency' | 'freshness';
  validator: (value: any, context?: any) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Data Quality Service
 * Validates, scores, and enriches data for AI consumption
 */
export class DataQualityService {
  private readonly validationRules: ValidationRule[] = [
    // Financial data rules
    {
      field: 'financials.incomeStatement',
      type: 'required',
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: 'Income statement data is missing',
      severity: 'error'
    },
    {
      field: 'financials.balanceSheet',
      type: 'required',
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: 'Balance sheet data is missing',
      severity: 'error'
    },
    {
      field: 'financials.keyMetrics.peRatio',
      type: 'range',
      validator: (value) => value === null || (value > -100 && value < 1000),
      message: 'P/E ratio is outside reasonable range',
      severity: 'warning'
    },
    {
      field: 'financials.keyMetrics.marketCap',
      type: 'range',
      validator: (value) => value > 0,
      message: 'Market cap must be positive',
      severity: 'error'
    },
    // Company data rules
    {
      field: 'ticker',
      type: 'format',
      validator: (value) => /^[A-Z]{1,5}$/.test(value),
      message: 'Invalid ticker format',
      severity: 'error'
    },
    {
      field: 'companyName',
      type: 'required',
      validator: (value) => value && value.length > 0,
      message: 'Company name is required',
      severity: 'error'
    },
    // Freshness rules
    {
      field: 'metadata.lastUpdated',
      type: 'freshness',
      validator: (value) => {
        if (!value) return false;
        const age = Date.now() - new Date(value).getTime();
        return age < 24 * 60 * 60 * 1000; // Less than 24 hours old
      },
      message: 'Data is more than 24 hours old',
      severity: 'warning'
    }
  ];

  /**
   * Assesses overall data quality for company data
   */
  async assessDataQuality(data: CompanyData): Promise<DataQualityMetrics> {
    logDebug('DataQualityService', `Assessing data quality for ${data.ticker}`);

    const fieldAssessments: FieldQuality[] = [];
    const issues = {
      missingFields: [] as string[],
      staleData: [] as string[],
      inconsistencies: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };

    // Assess each major data category
    const financialQuality = this.assessFinancialData(data.financials, issues);
    const companyQuality = this.assessCompanyInfo(data, issues);
    const newsQuality = this.assessNewsData(data.news, issues);
    const technicalQuality = this.assessTechnicalData(data.technicals, issues);

    // Calculate dimension scores
    const completeness = this.calculateCompleteness(data, issues);
    const accuracy = this.calculateAccuracy(data, issues);
    const consistency = this.calculateConsistency(data, issues);
    const timeliness = this.calculateTimeliness(data, issues);
    const relevance = this.calculateRelevance(data, issues);

    // Overall score is weighted average
    const overallScore = (
      completeness * 0.25 +
      accuracy * 0.25 +
      consistency * 0.20 +
      timeliness * 0.20 +
      relevance * 0.10
    );

    // Generate recommendations
    this.generateRecommendations(data, issues, overallScore);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      relevance: Math.round(relevance * 100) / 100,
      details: issues
    };
  }

  /**
   * Validates data against predefined rules
   */
  validateData(data: CompanyData): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.validationRules) {
      const value = this.getNestedValue(data, rule.field);
      const isValid = rule.validator(value, data);

      if (!isValid) {
        if (rule.severity === 'error') {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enriches data with quality metadata
   */
  enrichWithQualityMetadata(data: CompanyData, metrics: DataQualityMetrics): CompanyData {
    return {
      ...data,
      metadata: {
        ...data.metadata,
        quality: {
          overall: metrics.overallScore,
          completeness: metrics.completeness,
          accuracy: metrics.accuracy,
          consistency: metrics.consistency,
          timeliness: metrics.timeliness,
          relevance: metrics.relevance,
          assessedAt: new Date().toISOString(),
          issues: metrics.details.warnings.length + metrics.details.inconsistencies.length,
          recommendations: metrics.details.recommendations
        }
      }
    };
  }

  /**
   * Cross-validates data across multiple sources
   */
  crossValidateData(data: CompanyData): { 
    discrepancies: Array<{ field: string; sources: { [source: string]: any } }>;
    confidence: number;
  } {
    const discrepancies: Array<{ field: string; sources: { [source: string]: any } }> = [];
    
    // Check market cap consistency
    if (data.financials?.keyMetrics?.marketCap && data.technicals?.marketCap) {
      const financialMktCap = data.financials.keyMetrics.marketCap;
      const technicalMktCap = data.technicals.marketCap;
      const diff = Math.abs(financialMktCap - technicalMktCap) / financialMktCap;
      
      if (diff > 0.05) { // More than 5% difference
        discrepancies.push({
          field: 'marketCap',
          sources: {
            financials: financialMktCap,
            technicals: technicalMktCap
          }
        });
      }
    }

    // Check P/E ratio consistency
    if (data.financials?.keyMetrics?.peRatio && data.financials?.incomeStatement?.[0]) {
      const reportedPE = data.financials.keyMetrics.peRatio;
      const latestIncome = data.financials.incomeStatement[0];
      if (latestIncome.eps && data.technicals?.currentPrice) {
        const calculatedPE = data.technicals.currentPrice / latestIncome.eps;
        const diff = Math.abs(reportedPE - calculatedPE) / reportedPE;
        
        if (diff > 0.1) { // More than 10% difference
          discrepancies.push({
            field: 'peRatio',
            sources: {
              reported: reportedPE,
              calculated: calculatedPE
            }
          });
        }
      }
    }

    // Calculate confidence based on discrepancies
    const confidence = Math.max(0, 1 - (discrepancies.length * 0.1));

    return { discrepancies, confidence };
  }

  /**
   * Private assessment methods
   */

  private assessFinancialData(financials: any, issues: any): number {
    if (!financials) {
      issues.missingFields.push('Financial data');
      return 0;
    }

    let score = 0;
    let checks = 0;

    // Check income statement
    if (financials.incomeStatement && financials.incomeStatement.length > 0) {
      score += 1;
      
      // Check data freshness
      const latestDate = new Date(financials.incomeStatement[0].date);
      const monthsOld = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 4) {
        issues.staleData.push('Income statement data is more than 4 months old');
      }
      
      // Check completeness
      const requiredFields = ['revenue', 'netIncome', 'eps'];
      const missingIncomeFields = requiredFields.filter(field => 
        !financials.incomeStatement[0][field]
      );
      if (missingIncomeFields.length > 0) {
        issues.missingFields.push(`Income statement: ${missingIncomeFields.join(', ')}`);
        score -= 0.1 * missingIncomeFields.length;
      }
    } else {
      issues.missingFields.push('Income statement');
    }
    checks += 1;

    // Check balance sheet
    if (financials.balanceSheet && financials.balanceSheet.length > 0) {
      score += 1;
      
      // Check accounting equation
      const bs = financials.balanceSheet[0];
      if (bs.totalAssets && bs.totalLiabilities && bs.totalEquity) {
        const diff = Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity));
        const tolerance = bs.totalAssets * 0.01; // 1% tolerance
        if (diff > tolerance) {
          issues.inconsistencies.push('Balance sheet equation does not balance');
        }
      }
    } else {
      issues.missingFields.push('Balance sheet');
    }
    checks += 1;

    // Check key metrics
    if (financials.keyMetrics) {
      score += 0.5;
      
      // Validate metric ranges
      const metrics = financials.keyMetrics;
      if (metrics.peRatio && (metrics.peRatio < -100 || metrics.peRatio > 1000)) {
        issues.warnings.push('P/E ratio appears unusual');
      }
      if (metrics.debtToEquity && metrics.debtToEquity < 0) {
        issues.inconsistencies.push('Debt-to-equity ratio cannot be negative');
      }
    } else {
      issues.missingFields.push('Key financial metrics');
    }
    checks += 0.5;

    return Math.max(0, score / checks);
  }

  private assessCompanyInfo(data: CompanyData, issues: any): number {
    let score = 0;
    let checks = 0;

    // Required fields
    const requiredFields = ['ticker', 'companyName', 'sector', 'industry'];
    requiredFields.forEach(field => {
      if (data[field as keyof CompanyData]) {
        score += 1;
      } else {
        issues.missingFields.push(field);
      }
      checks += 1;
    });

    // Description quality
    if (data.description) {
      score += 1;
      if (data.description.length < 50) {
        issues.warnings.push('Company description is very brief');
        score -= 0.3;
      }
    } else {
      issues.missingFields.push('Company description');
    }
    checks += 1;

    return score / checks;
  }

  private assessNewsData(news: NewsItem[] | undefined, issues: any): number {
    if (!news || news.length === 0) {
      issues.missingFields.push('News data');
      return 0.3; // Not critical
    }

    let totalScore = 0;
    let validArticles = 0;

    news.forEach(article => {
      let articleScore = 0;
      
      // Check required fields
      if (article.title) articleScore += 0.25;
      if (article.source) articleScore += 0.25;
      if (article.publishedDate) articleScore += 0.25;
      if (article.url) articleScore += 0.25;
      
      // Check metadata quality
      if (article.metadata?.dataQuality?.score) {
        articleScore *= article.metadata.dataQuality.score;
      }
      
      if (articleScore > 0.5) {
        validArticles++;
        totalScore += articleScore;
      }
    });

    const avgScore = validArticles > 0 ? totalScore / validArticles : 0;
    
    if (validArticles < 5) {
      issues.warnings.push(`Only ${validArticles} high-quality news articles found`);
    }

    return avgScore;
  }

  private assessTechnicalData(technicals: any, issues: any): number {
    if (!technicals) {
      issues.missingFields.push('Technical data');
      return 0.5; // Somewhat optional
    }

    let score = 0;
    let checks = 0;

    // Price data
    if (technicals.currentPrice && technicals.currentPrice > 0) {
      score += 1;
    } else {
      issues.missingFields.push('Current price');
    }
    checks += 1;

    // Historical prices
    if (technicals.historicalPrices && technicals.historicalPrices.length > 20) {
      score += 1;
      
      // Check data continuity
      const prices = technicals.historicalPrices;
      let gaps = 0;
      for (let i = 1; i < prices.length; i++) {
        const prevDate = new Date(prices[i-1].date);
        const currDate = new Date(prices[i].date);
        const daysDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 5) { // More than 5 days gap (accounting for weekends)
          gaps++;
        }
      }
      if (gaps > prices.length * 0.1) {
        issues.warnings.push('Historical price data has significant gaps');
        score -= 0.3;
      }
    } else {
      issues.missingFields.push('Sufficient historical price data');
    }
    checks += 1;

    return score / checks;
  }

  private calculateCompleteness(data: CompanyData, issues: any): number {
    const totalFields = issues.missingFields.length;
    const expectedFields = 20; // Approximate number of key fields
    
    return Math.max(0, 1 - (totalFields / expectedFields));
  }

  private calculateAccuracy(data: CompanyData, issues: any): number {
    const inconsistencies = issues.inconsistencies.length;
    const warnings = issues.warnings.length;
    
    // Start with perfect score and deduct
    let score = 1.0;
    score -= inconsistencies * 0.15; // Each inconsistency reduces score
    score -= warnings * 0.05; // Warnings have less impact
    
    return Math.max(0, score);
  }

  private calculateConsistency(data: CompanyData, issues: any): number {
    const { discrepancies, confidence } = this.crossValidateData(data);
    
    // Add discrepancies to issues
    discrepancies.forEach(d => {
      issues.inconsistencies.push(
        `${d.field} has different values across sources: ${JSON.stringify(d.sources)}`
      );
    });
    
    return confidence;
  }

  private calculateTimeliness(data: CompanyData, issues: any): number {
    const now = Date.now();
    let totalScore = 0;
    let weights = 0;

    // Check financial data freshness (most important)
    if (data.financials?.incomeStatement?.[0]) {
      const latestFinancialDate = new Date(data.financials.incomeStatement[0].date);
      const financialAge = (now - latestFinancialDate.getTime()) / (1000 * 60 * 60 * 24);
      
      let financialScore = 1.0;
      if (financialAge > 120) financialScore = 0.3; // More than 4 months
      else if (financialAge > 90) financialScore = 0.6; // More than 3 months
      else if (financialAge > 45) financialScore = 0.8; // More than 1.5 months
      
      totalScore += financialScore * 0.4;
      weights += 0.4;
    }

    // Check price data freshness
    if (data.technicals?.lastUpdated) {
      const priceAge = (now - new Date(data.technicals.lastUpdated).getTime()) / (1000 * 60 * 60);
      
      let priceScore = 1.0;
      if (priceAge > 24) priceScore = 0.5; // More than 1 day
      else if (priceAge > 1) priceScore = 0.9; // More than 1 hour
      
      totalScore += priceScore * 0.3;
      weights += 0.3;
    }

    // Check metadata freshness
    if (data.metadata?.lastUpdated) {
      const metadataAge = (now - new Date(data.metadata.lastUpdated).getTime()) / (1000 * 60 * 60);
      
      let metadataScore = 1.0;
      if (metadataAge > 24) metadataScore = 0.7;
      else if (metadataAge > 6) metadataScore = 0.9;
      
      totalScore += metadataScore * 0.3;
      weights += 0.3;
    }

    return weights > 0 ? totalScore / weights : 0.5;
  }

  private calculateRelevance(data: CompanyData, issues: any): number {
    // Relevance is contextual, but we can check for basic indicators
    let score = 0.8; // Base relevance
    
    // Check if we have recent pattern data
    if (data.patterns && data.patterns.length > 0) {
      const recentPatterns = data.patterns.filter(p => {
        const age = Date.now() - new Date(p.detectedAt).getTime();
        return age < 7 * 24 * 60 * 60 * 1000; // Within last week
      });
      if (recentPatterns.length > 0) {
        score += 0.1;
      }
    }
    
    // Check news relevance
    if (data.news && data.news.length > 0) {
      const avgRelevance = data.news.reduce((sum, n) => sum + (n.relevanceScore || 0), 0) / data.news.length;
      score += avgRelevance * 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private generateRecommendations(data: CompanyData, issues: any, overallScore: number): void {
    // High-priority recommendations
    if (issues.missingFields.includes('Income statement')) {
      issues.recommendations.push('Fetch latest financial statements from TwelveData or SEC filings');
    }
    
    if (issues.staleData.length > 0) {
      issues.recommendations.push('Refresh financial data to ensure analysis is based on latest information');
    }
    
    if (issues.inconsistencies.length > 2) {
      issues.recommendations.push('Reconcile data discrepancies across sources for accurate analysis');
    }
    
    // Quality improvement recommendations
    if (overallScore < 0.7) {
      issues.recommendations.push('Consider fetching data from additional sources to improve coverage');
    }
    
    if (!data.news || data.news.length < 5) {
      issues.recommendations.push('Gather more news articles for comprehensive sentiment analysis');
    }
    
    if (!data.transcripts || data.transcripts.length === 0) {
      issues.recommendations.push('Add earnings call transcripts for deeper insights');
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Singleton instance
let qualityServiceInstance: DataQualityService | null = null;

/**
 * Gets the data quality service instance
 */
export function getDataQualityService(): DataQualityService {
  if (!qualityServiceInstance) {
    qualityServiceInstance = new DataQualityService();
  }
  return qualityServiceInstance;
}