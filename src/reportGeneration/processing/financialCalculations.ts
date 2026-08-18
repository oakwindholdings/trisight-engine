// src/reportGeneration/processing/financialCalculations.ts
// Sophisticated financial calculations engine for comprehensive analysis
// Context: Transforms raw financial data into actionable insights through proven methodologies

import { 
  FinancialData, 
  CompanyData, 
  FinancialStatement,
  KeyFinancialMetrics 
} from '../models/reportTypes';
import { 
  GrowthMetrics, 
  ValuationMetrics, 
  RiskMetrics, 
  QualityMetrics,
  AnalysisResults 
} from '../models/financialMetrics';

/**
 * Configuration for financial calculations
 * These parameters allow customization based on industry and analysis preferences
 */
export interface CalculationConfig {
  riskFreeRate: number;      // Current treasury rate for CAPM calculations
  marketReturn: number;      // Expected market return for beta adjustments
  taxRate: number;          // Corporate tax rate for after-tax calculations
  industryMultiples?: {     // Industry-specific valuation multiples
    peRatio?: number;
    pbRatio?: number;
    evSales?: number;
    pegRatio?: number;
    [multiple: string]: number | undefined;
  };
}

/**
 * Default configuration based on current market conditions
 * These should be updated periodically to reflect market reality
 */
const DEFAULT_CONFIG: CalculationConfig = {
  riskFreeRate: 0.045,    // 4.5% 10-year Treasury
  marketReturn: 0.10,     // 10% historical S&P 500 return
  taxRate: 0.21          // Current US corporate tax rate
};

/**
 * Main financial calculations engine
 * This class embodies decades of financial analysis best practices
 */
export class FinancialCalculationsEngine {
  private config: CalculationConfig;
  
  constructor(config: Partial<CalculationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Performs comprehensive financial analysis on company data
   * This is the main entry point that orchestrates all calculations
   */
  async analyze(companyData: CompanyData): Promise<AnalysisResults> {
    // Extract financial data for easier access
    const { financials, technicals, analysts } = companyData;
    
    // Calculate growth metrics across multiple timeframes
    const growth = this.calculateGrowthMetrics(financials);
    
    // Perform valuation analysis using multiple methodologies
    const valuation = this.calculateValuationMetrics(
      financials, 
      companyData.ticker,
      analysts
    );
    
    // Assess risk profile through various indicators
    const risk = this.calculateRiskMetrics(financials, technicals);
    
    // Evaluate business quality and competitive position
    const quality = this.calculateQualityMetrics(financials);
    
    // Generate technical signals for timing
    const technicalSignals = this.analyzeTechnicals(financials, technicals);
    
    // Synthesize all analyses into composite score
    const composite = this.calculateCompositeScore({
      growth,
      valuation,
      risk,
      quality,
      technicals: technicalSignals
    });
    
    return {
      growth,
      valuation,
      risk,
      quality,
      technicals: technicalSignals,
      composite
    };
  }
  
  /**
   * Calculates comprehensive growth metrics
   * Growth is the lifeblood of equity returns - we analyze it from multiple angles
   */
  private calculateGrowthMetrics(financials: FinancialData): GrowthMetrics {
    // Ensure we have sufficient data for growth calculations
    const incomeStatements = financials.incomeStatement || [];
    if (incomeStatements.length < 2) {
      return this.getDefaultGrowthMetrics();
    }
    
    // Calculate revenue growth using multiple methodologies
    const revenueGrowth = this.calculateGrowthRate(
      incomeStatements,
      'revenue',
      'Revenue growth drives long-term value creation'
    );
    
    // Calculate earnings growth - the ultimate measure of business success
    const earningsGrowth = this.calculateGrowthRate(
      incomeStatements,
      'netIncome',
      'Earnings growth reflects operational efficiency improvements'
    );
    
    // Calculate free cash flow growth - what really matters to investors
    const fcfGrowth = this.calculateFreeCashFlowGrowth(
      incomeStatements,
      financials.cashFlow || []
    );
    
    // Calculate book value growth - indicates balance sheet strength
    const bookValueGrowth = this.calculateBookValueGrowth(
      financials.balanceSheet || []
    );
    
    return {
      revenueGrowth,
      earningsGrowth,
      fcfGrowth,
      bookValueGrowth
    };
  }
  
  /**
   * Calculates growth rate for a specific metric with multiple timeframes
   * This method handles real-world complexities like negative values and missing data
   */
  private calculateGrowthRate(
    statements: FinancialStatement[],
    metric: string,
    rationale: string
  ): any {
    // Sort statements by date to ensure proper chronological order
    const sorted = [...statements].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Extract values and handle missing data
    const values = sorted.map(s => s[metric]).filter(v => v != null);
    if (values.length < 2) {
      return { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' };
    }
    
    // Calculate year-over-year growth
    const yoy = this.calculateYoYGrowth(sorted, metric);
    
    // Calculate quarter-over-quarter growth for recent momentum
    const qoq = this.calculateQoQGrowth(sorted, metric);
    
    // Calculate compound annual growth rates for long-term trends
    const cagr3 = this.calculateCAGR(sorted, metric, 3);
    const cagr5 = this.calculateCAGR(sorted, metric, 5);
    
    // Determine trend by comparing recent growth to historical average
    const trend = this.determineTrend(yoy, qoq, cagr3);
    
    return { yoy, qoq, cagr3, cagr5, trend };
  }
  
  /**
   * Calculates year-over-year growth handling edge cases
   * Negative base values require special handling to avoid misleading percentages
   */
  private calculateYoYGrowth(statements: FinancialStatement[], metric: string): number {
    // Find statements exactly one year apart
    const current = statements.find(s => s[metric] != null);
    if (!current) return 0;
    
    const currentDate = new Date(current.date);
    const targetDate = new Date(currentDate);
    targetDate.setFullYear(targetDate.getFullYear() - 1);
    
    // Find the closest statement to target date within 45 days
    const yearAgo = statements.find(s => {
      const sDate = new Date(s.date);
      const daysDiff = Math.abs(sDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 45 && s[metric] != null;
    });
    
    if (!yearAgo) return 0;
    
    // Handle negative base values appropriately
    const currentValue = current[metric] as number;
    const previousValue = yearAgo[metric] as number;
    
    if (previousValue === 0) return currentValue > 0 ? 100 : -100;
    if (previousValue < 0 && currentValue >= 0) return 100; // Turned profitable
    if (previousValue < 0 && currentValue < 0) {
      // Both negative: use absolute values for meaningful comparison
      return ((Math.abs(currentValue) - Math.abs(previousValue)) / Math.abs(previousValue)) * 100;
    }
    
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  }
  
  /**
   * Calculates quarter-over-quarter growth for momentum analysis
   * Recent acceleration or deceleration can signal inflection points
   */
  private calculateQoQGrowth(statements: FinancialStatement[], metric: string): number {
    // Filter for quarterly statements only
    const quarterly = statements.filter(s => s.period === 'quarterly' && s[metric] != null);
    if (quarterly.length < 2) return 0;
    
    const current = quarterly[0][metric] as number;
    const previous = quarterly[1][metric] as number;
    
    if (previous === 0) return current > 0 ? 100 : -100;
    return ((current - previous) / Math.abs(previous)) * 100;
  }
  
  /**
   * Calculates compound annual growth rate over specified years
   * CAGR smooths out volatility to show sustainable growth trends
   */
  private calculateCAGR(
    statements: FinancialStatement[], 
    metric: string, 
    years: number
  ): number {
    const current = statements.find(s => s[metric] != null);
    if (!current) return 0;
    
    const currentDate = new Date(current.date);
    const targetDate = new Date(currentDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);
    
    // Find the closest statement to target date
    const historical = statements.find(s => {
      const sDate = new Date(s.date);
      const daysDiff = Math.abs(sDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 60 && s[metric] != null; // Allow 60 days tolerance
    });
    
    if (!historical) return 0;
    
    const currentValue = current[metric] as number;
    const historicalValue = historical[metric] as number;
    
    // Handle edge cases
    if (historicalValue <= 0 || currentValue <= 0) return 0;
    
    // Calculate actual years between statements
    const actualYears = (currentDate.getTime() - new Date(historical.date).getTime()) / 
                       (365.25 * 24 * 60 * 60 * 1000);
    
    // CAGR formula: (Ending Value / Beginning Value)^(1 / Years) - 1
    return (Math.pow(currentValue / historicalValue, 1 / actualYears) - 1) * 100;
  }
  
  /**
   * Determines growth trend by analyzing multiple indicators
   * This helps identify whether growth is accelerating, stable, or decelerating
   */
  private determineTrend(yoy: number, qoq: number, cagr3: number): 'accelerating' | 'stable' | 'decelerating' {
    // Annualize QoQ for comparison
    const annualizedQoQ = (Math.pow(1 + qoq / 100, 4) - 1) * 100;
    
    // Compare recent growth to historical average
    if (yoy > cagr3 * 1.2 && qoq > 0) {
      return 'accelerating';
    } else if (yoy < cagr3 * 0.8 || qoq < 0) {
      return 'decelerating';
    }
    
    return 'stable';
  }
  
  /**
   * Calculates free cash flow growth - the gold standard of financial health
   * FCF represents actual cash available to shareholders after all obligations
   */
  private calculateFreeCashFlowGrowth(
    incomeStatements: FinancialStatement[],
    cashFlowStatements: FinancialStatement[]
  ): any {
    // Calculate FCF for each period
    const fcfData = cashFlowStatements.map(cf => {
      const operatingCashFlow = Number(cf.operatingCashFlow || cf.cashFromOperations || 0);
      const capex = Math.abs(Number(cf.capitalExpenditures || cf.capex || 0));
      
      return {
        date: cf.date,
        period: cf.period || 'quarterly',
        fcf: operatingCashFlow - capex
      };
    }).filter(item => item.fcf !== 0);
    
    if (fcfData.length < 2) {
      return { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' };
    }
    
    // Use our standard growth calculation method
    return this.calculateGrowthRate(fcfData as any[], 'fcf', 'Free cash flow growth indicates sustainable value creation');
  }
  
  /**
   * Calculates book value growth indicating balance sheet expansion
   * Growing book value suggests the company is retaining and reinvesting earnings effectively
   */
  private calculateBookValueGrowth(balanceSheets: FinancialStatement[]): any {
    // Calculate book value (shareholders' equity) for each period
    const bookValueData = balanceSheets.map(bs => ({
      date: bs.date,
      period: bs.period,
      bookValue: bs.shareholderEquity || bs.totalEquity || 
                 (bs.totalAssets || 0) - (bs.totalLiabilities || 0)
    })).filter(item => item.bookValue > 0);
    
    if (bookValueData.length < 2) {
      return { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' };
    }
    
    return this.calculateGrowthRate(
      bookValueData as any[], 
      'bookValue', 
      'Book value growth reflects accumulated retained earnings'
    );
  }
  
  /**
   * Calculates comprehensive valuation metrics using multiple methodologies
   * Valuation is both art and science - we use multiple approaches for robustness
   */
  private calculateValuationMetrics(
    financials: FinancialData,
    ticker: string,
    analysts: any
  ): ValuationMetrics {
    // Start with market-based metrics from current data
    const marketMetrics = financials.keyMetrics || {};
    
    // Calculate intrinsic value using DCF methodology
    const intrinsicValue = this.calculateDCFValue(financials);
    
    // Calculate fair value using multiple-based approach
    const fairValue = this.calculateMultipleBasedValue(financials, marketMetrics);
    
    // Determine margin of safety
    const currentPrice = financials.historicalPrices?.[0]?.close || 0;
    const marginOfSafety = this.calculateMarginOfSafety(currentPrice, intrinsicValue, fairValue);
    
    // Determine overall valuation assessment
    const valuation = this.assessValuation(currentPrice, intrinsicValue, fairValue);
    
    // Calculate confidence based on data quality and consistency
    const confidence = this.calculateValuationConfidence(financials, analysts);
    
    return {
      intrinsicValue,
      fairValue,
      marginOfSafety,
      valuation,
      confidence
    };
  }
  
  /**
   * Calculates intrinsic value using Discounted Cash Flow methodology
   * DCF is the most theoretically sound valuation method, though it requires assumptions
   */
  private calculateDCFValue(financials: FinancialData): number {
    // Ensure we have sufficient cash flow data
    const cashFlows = financials.cashFlow || [];
    if (cashFlows.length < 3) return 0;
    
    // Calculate average FCF over recent periods for stability
    const recentFCFs = cashFlows.slice(0, 4).map(cf => {
      const operating = Number(cf.operatingCashFlow || cf.cashFromOperations || 0);
      const capex = Math.abs(Number(cf.capitalExpenditures || cf.capex || 0));
      return operating - capex;
    });
    
    const avgFCF = recentFCFs.reduce((sum, fcf) => sum + fcf, 0) / recentFCFs.length;
    if (avgFCF <= 0) return 0; // Can't value negative FCF companies with DCF
    
    // Estimate growth rate based on historical performance
    const fcfGrowth = this.calculateFreeCashFlowGrowth(financials.incomeStatement || [], cashFlows);
    const growthRate = Math.min(fcfGrowth.cagr3 / 100, 0.15); // Cap at 15% for conservatism
    
    // Calculate WACC (simplified - in practice would need debt/equity weights)
    const wacc = this.calculateWACC(financials);
    
    // Project FCF for 10 years
    let dcfValue = 0;
    let projectedFCF = avgFCF;
    
    for (let year = 1; year <= 10; year++) {
      projectedFCF *= (1 + growthRate);
      dcfValue += projectedFCF / Math.pow(1 + wacc, year);
    }
    
    // Calculate terminal value using perpetual growth model
    const terminalGrowth = 0.03; // Conservative 3% perpetual growth
    const terminalValue = (projectedFCF * (1 + terminalGrowth)) / (wacc - terminalGrowth);
    dcfValue += terminalValue / Math.pow(1 + wacc, 10);
    
    // Get share count for per-share calculation
    const shares = financials.keyMetrics?.sharesOutstanding || 
                  financials.incomeStatement?.[0]?.sharesOutstanding || 
                  1000000000; // Default 1B shares if not found
    
    return dcfValue / shares;
  }
  
  /**
   * Calculates Weighted Average Cost of Capital
   * WACC represents the minimum return required by all stakeholders
   */
  private calculateWACC(financials: FinancialData): number {
    // Extract necessary components from financial statements
    const balanceSheet: any = financials.balanceSheet?.[0] || {};
    const incomeStatement: any = financials.incomeStatement?.[0] || {};
    
    // Calculate cost of equity using CAPM
    const beta = financials.keyMetrics?.beta || 1.0; // Default to market beta
    const costOfEquity = this.config.riskFreeRate + beta * (this.config.marketReturn - this.config.riskFreeRate);
    
    // Calculate cost of debt
    const interestExpense = Math.abs(incomeStatement.interestExpense || 0);
    const totalDebt = (balanceSheet.shortTermDebt || 0) + (balanceSheet.longTermDebt || 0);
    const costOfDebt = totalDebt > 0 ? (interestExpense / totalDebt) * (1 - this.config.taxRate) : 0;
    
    // Calculate weights
    const marketCap = financials.keyMetrics?.marketCap || 0;
    const enterpriseValue = marketCap + totalDebt - (balanceSheet.cashAndEquivalents || 0);
    
    if (enterpriseValue <= 0) return 0.10; // Default 10% if calculation fails
    
    const equityWeight = marketCap / enterpriseValue;
    const debtWeight = totalDebt / enterpriseValue;
    
    // WACC = (E/V * Re) + (D/V * Rd * (1 - Tc))
    return (equityWeight * costOfEquity) + (debtWeight * costOfDebt);
  }
  
  /**
   * Calculates fair value using industry multiples
   * Multiple-based valuation provides market-relative perspective
   */
  private calculateMultipleBasedValue(
    financials: FinancialData,
    marketMetrics: KeyFinancialMetrics
  ): number {
    const currentPrice = financials.historicalPrices?.[0]?.close || 0;
    if (currentPrice === 0) return 0;
    
    // Get relevant financial metrics
    const earnings = financials.incomeStatement?.[0]?.eps || 0;
    const revenue = financials.incomeStatement?.[0]?.revenue || 0;
    const bookValue = financials.balanceSheet?.[0]?.bookValuePerShare || 0;
    
    // Use industry multiples if provided, otherwise use current multiples
    const industryPE = this.config.industryMultiples?.peRatio || marketMetrics.peRatio || 20;
    const industryPB = this.config.industryMultiples?.pbRatio || marketMetrics.priceToBook || 3;
    
    // Calculate values using different multiples
    const peValue = earnings > 0 ? earnings * industryPE : 0;
    const pbValue = bookValue > 0 ? bookValue * industryPB : 0;
    
    // Weight the different valuations
    let totalWeight = 0;
    let weightedValue = 0;
    
    if (peValue > 0) {
      weightedValue += peValue * 0.6; // PE gets highest weight for profitable companies
      totalWeight += 0.6;
    }
    
    if (pbValue > 0) {
      weightedValue += pbValue * 0.4; // Book value provides floor valuation
      totalWeight += 0.4;
    }
    
    // If we have no valuation from multiples, estimate based on current price
    if (totalWeight === 0) {
      return currentPrice * 1.2; // Assume 20% upside as default
    }
    
    return weightedValue / totalWeight;
  }
  
  /**
   * Calculates margin of safety - the cushion between price and value
   * Benjamin Graham's concept: the larger the discount, the lower the risk
   */
  private calculateMarginOfSafety(
    currentPrice: number,
    intrinsicValue: number,
    fairValue: number
  ): number {
    if (currentPrice <= 0) return 0;
    
    // Use the average of intrinsic and fair value for robustness
    const avgValue = (intrinsicValue + fairValue) / 2;
    if (avgValue <= 0) return 0;
    
    // Margin of safety = 1 - (Price / Value)
    // Positive means undervalued, negative means overvalued
    return (1 - (currentPrice / avgValue)) * 100;
  }
  
  /**
   * Provides qualitative assessment of valuation
   * Translates quantitative metrics into actionable insights
   */
  private assessValuation(
    currentPrice: number,
    intrinsicValue: number,
    fairValue: number
  ): 'undervalued' | 'fairlyValued' | 'overvalued' {
    const avgValue = (intrinsicValue + fairValue) / 2;
    const ratio = currentPrice / avgValue;
    
    if (ratio < 0.8) return 'undervalued';      // 20%+ discount
    if (ratio > 1.2) return 'overvalued';       // 20%+ premium
    return 'fairlyValued';
  }
  
  /**
   * Calculates confidence in valuation estimates
   * Higher confidence when multiple methods agree and data is high quality
   */
  private calculateValuationConfidence(financials: FinancialData, analysts: any): number {
    let confidence = 0;
    
    // Data completeness check
    if (financials.incomeStatement && financials.incomeStatement.length >= 12) confidence += 0.2;
    if (financials.balanceSheet && financials.balanceSheet.length >= 12) confidence += 0.2;
    if (financials.cashFlow && financials.cashFlow.length >= 12) confidence += 0.2;
    
    // Analyst coverage check
    if (analysts?.consensus?.count >= 5) confidence += 0.2;
    
    // Earnings stability check
    const epsValues = financials.incomeStatement?.slice(0, 8).map(s => s.eps).filter(e => e != null) || [];
    if (epsValues.length >= 4) {
      const epsStdDev = this.calculateStandardDeviation(epsValues);
      const avgEps = epsValues.reduce((sum, eps) => sum + eps, 0) / epsValues.length;
      const coefficientOfVariation = avgEps !== 0 ? epsStdDev / Math.abs(avgEps) : 1;
      
      if (coefficientOfVariation < 0.3) confidence += 0.2; // Low earnings volatility
    }
    
    return Math.min(confidence, 1);
  }
  
  /**
   * Calculates comprehensive risk metrics
   * Risk assessment helps investors understand potential downside
   */
  private calculateRiskMetrics(financials: FinancialData, technicals: any): RiskMetrics {
    // Market risk (beta)
    const beta = financials.keyMetrics?.beta || this.estimateBeta(financials.historicalPrices || []);
    
    // Price volatility
    const volatility = this.calculateVolatility(financials.historicalPrices || []);
    
    // Sharpe ratio (risk-adjusted returns)
    const sharpeRatio = this.calculateSharpeRatio(financials.historicalPrices || [], volatility);
    
    // Maximum drawdown (worst peak-to-trough decline)
    const maxDrawdown = this.calculateMaxDrawdown(financials.historicalPrices || []);
    
    // Value at Risk (potential loss in worst 5% of scenarios)
    const var95 = this.calculateValueAtRisk(financials.historicalPrices || [], 0.95);
    
    // Composite risk score
    const riskScore = this.calculateCompositeRiskScore({
      beta,
      volatility,
      sharpeRatio,
      maxDrawdown,
      var95
    });
    
    return {
      beta,
      volatility,
      sharpeRatio,
      maxDrawdown,
      var95,
      riskScore
    };
  }
  
  /**
   * Estimates beta by comparing stock returns to market returns
   * Beta measures systematic risk relative to the overall market
   */
  private estimateBeta(prices: any[]): number {
    if (prices.length < 60) return 1.0; // Default to market beta
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < Math.min(prices.length, 252); i++) {
      const dailyReturn = (prices[i - 1].close - prices[i].close) / prices[i].close;
      returns.push(dailyReturn);
    }
    
    // In practice, we'd compare to market returns
    // For now, estimate based on volatility relative to typical market volatility
    const volatility = this.calculateStandardDeviation(returns) * Math.sqrt(252);
    const marketVolatility = 0.15; // Typical annual market volatility
    
    return Math.min(Math.max(volatility / marketVolatility, 0.5), 2.5); // Cap between 0.5 and 2.5
  }
  
  /**
   * Calculates annualized volatility from price data
   * Volatility measures the dispersion of returns
   */
  private calculateVolatility(prices: any[]): number {
    if (prices.length < 20) return 0;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i - 1].close - prices[i].close) / prices[i].close;
      returns.push(dailyReturn);
    }
    
    // Standard deviation of returns
    const stdDev = this.calculateStandardDeviation(returns);
    
    // Annualize (252 trading days)
    return stdDev * Math.sqrt(252) * 100;
  }
  
  /**
   * Calculates Sharpe ratio measuring risk-adjusted returns
   * Higher Sharpe ratios indicate better risk-adjusted performance
   */
  private calculateSharpeRatio(prices: any[], volatility: number): number {
    if (prices.length < 252 || volatility === 0) return 0;
    
    // Calculate annual return (prices are ordered newest to oldest)
    const endPrice = prices[0].close;
    const startPrice = prices[Math.min(prices.length - 1, 251)].close;
    const annualReturn = ((endPrice / startPrice) - 1) * 100;
    
    // Sharpe = (Return - Risk Free Rate) / Volatility
    const excessReturn = annualReturn - (this.config.riskFreeRate * 100);
    return excessReturn / volatility;
  }
  
  /**
   * Calculates maximum drawdown from peak to trough
   * This shows the worst-case historical loss an investor would have experienced
   */
  private calculateMaxDrawdown(prices: any[]): number {
    if (prices.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = prices[prices.length - 1].close;
    
    // Iterate through prices from oldest to newest
    for (let i = prices.length - 1; i >= 0; i--) {
      const price = prices[i].close;
      
      // Update peak if we have a new high
      if (price > peak) {
        peak = price;
      }
      
      // Calculate drawdown from peak
      const drawdown = (peak - price) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown * 100;
  }
  
  /**
   * Calculates Value at Risk at specified confidence level
   * VaR estimates potential loss in worst-case scenarios
   */
  private calculateValueAtRisk(prices: any[], confidenceLevel: number): number {
    if (prices.length < 30) return 0;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i - 1].close - prices[i].close) / prices[i].close;
      returns.push(dailyReturn);
    }
    
    // Sort returns from worst to best
    returns.sort((a, b) => a - b);
    
    // Find the return at the specified percentile
    const index = Math.floor(returns.length * (1 - confidenceLevel));
    const var1Day = Math.abs(returns[index]);
    
    // Scale to monthly VaR (21 trading days)
    return var1Day * Math.sqrt(21) * 100;
  }
  
  /**
   * Calculates composite risk score from multiple factors
   * Provides single number assessment of overall risk level
   */
  private calculateCompositeRiskScore(metrics: any): number {
    let score = 50; // Start neutral
    
    // Beta contribution (higher beta = higher risk)
    if (metrics.beta > 1.5) score += 10;
    else if (metrics.beta < 0.8) score -= 10;
    
    // Volatility contribution
    if (metrics.volatility > 40) score += 15;
    else if (metrics.volatility < 20) score -= 15;
    
    // Sharpe ratio contribution (higher is better, so inverse relationship)
    if (metrics.sharpeRatio > 1.5) score -= 10;
    else if (metrics.sharpeRatio < 0.5) score += 10;
    
    // Drawdown contribution
    if (metrics.maxDrawdown > 30) score += 15;
    else if (metrics.maxDrawdown < 15) score -= 10;
    
    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Evaluates business quality through fundamental metrics
   * Quality companies tend to outperform over long periods
   */
  private calculateQualityMetrics(financials: FinancialData): QualityMetrics {
    const latestIncome = financials.incomeStatement?.[0] || {};
    const latestBalance = financials.balanceSheet?.[0] || {};
    const latestCashFlow = financials.cashFlow?.[0] || {};
    
    // Calculate Return on Invested Capital (ROIC)
    const roic = this.calculateROIC(latestIncome, latestBalance);
    
    // Calculate Free Cash Flow Yield
    const fcfYield = this.calculateFCFYield(latestCashFlow, financials.keyMetrics);
    
    // Assess earnings quality
    const earningsQuality = this.assessEarningsQuality(latestIncome, latestCashFlow);
    
    // Evaluate balance sheet strength
    const balanceSheetStrength = this.assessBalanceSheetStrength(latestBalance);
    
    // Determine competitive moat
    const moat = this.assessCompetitiveMoat(financials);
    
    return {
      roic,
      fcfYield,
      earningsQuality,
      balanceSheetStrength,
      moat
    };
  }
  
  /**
   * Calculates Return on Invested Capital
   * ROIC shows how efficiently a company uses investor capital
   */
  private calculateROIC(income: any, balance: any): number {
    // NOPAT (Net Operating Profit After Tax)
    const operatingIncome = income.operatingIncome || income.ebit || 0;
    const nopat = operatingIncome * (1 - this.config.taxRate);
    
    // Invested Capital = Equity + Debt - Cash
    const equity = balance.shareholderEquity || balance.totalEquity || 0;
    const debt = (balance.shortTermDebt || 0) + (balance.longTermDebt || 0);
    const cash = balance.cashAndEquivalents || 0;
    const investedCapital = equity + debt - cash;
    
    if (investedCapital <= 0) return 0;
    
    return (nopat / investedCapital) * 100;
  }
  
  /**
   * Calculates Free Cash Flow Yield
   * FCF Yield shows cash generation relative to market value
   */
  private calculateFCFYield(cashFlow: any, keyMetrics: any): number {
    const fcf = (cashFlow.operatingCashFlow || 0) - Math.abs(cashFlow.capitalExpenditures || 0);
    const marketCap = keyMetrics?.marketCap || 0;
    
    if (marketCap <= 0) return 0;
    
    return (fcf / marketCap) * 100;
  }
  
  /**
   * Assesses earnings quality by comparing accounting profits to cash flow
   * High-quality earnings are backed by actual cash generation
   */
  private assessEarningsQuality(income: any, cashFlow: any): number {
    let score = 50; // Start neutral
    
    // Compare net income to operating cash flow
    const netIncome = income.netIncome || 0;
    const operatingCashFlow = cashFlow.operatingCashFlow || cashFlow.cashFromOperations || 0;
    
    if (netIncome > 0 && operatingCashFlow > 0) {
      const cashToEarningsRatio = operatingCashFlow / netIncome;
      
      if (cashToEarningsRatio > 1.2) score += 30;      // Strong cash generation
      else if (cashToEarningsRatio > 0.8) score += 15; // Decent cash backing
      else score -= 20;                                 // Weak cash conversion
    }
    
    // Check for one-time items
    const extraordinaryItems = income.extraordinaryItems || 0;
    if (Math.abs(extraordinaryItems) > netIncome * 0.1) {
      score -= 10; // Significant one-time items reduce quality
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Evaluates balance sheet strength through key ratios
   * Strong balance sheets provide resilience during downturns
   */
  private assessBalanceSheetStrength(balance: any): number {
    let score = 50; // Start neutral
    
    // Current ratio (liquidity)
    const currentRatio = (balance.currentAssets || 0) / (balance.currentLiabilities || 1);
    if (currentRatio > 2) score += 10;
    else if (currentRatio < 1) score -= 20;
    
    // Debt to equity ratio (leverage)
    const totalDebt = (balance.shortTermDebt || 0) + (balance.longTermDebt || 0);
    const equity = balance.shareholderEquity || 1;
    const debtToEquity = totalDebt / equity;
    
    if (debtToEquity < 0.3) score += 20;      // Low leverage
    else if (debtToEquity > 1) score -= 20;   // High leverage
    
    // Cash position
    const cash = balance.cashAndEquivalents || 0;
    const totalAssets = balance.totalAssets || 1;
    const cashRatio = cash / totalAssets;
    
    if (cashRatio > 0.2) score += 10;  // Strong cash position
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Assesses competitive moat based on financial characteristics
   * Companies with moats can sustain high returns over time
   */
  private assessCompetitiveMoat(financials: FinancialData): 'none' | 'narrow' | 'wide' {
    // Calculate average ROIC over multiple years
    const roicValues = [];
    for (let i = 0; i < Math.min(5, financials.incomeStatement?.length || 0); i++) {
      const income = financials.incomeStatement![i];
      const balance = financials.balanceSheet?.[i];
      if (income && balance) {
        roicValues.push(this.calculateROIC(income, balance));
      }
    }
    
    if (roicValues.length < 3) return 'none';
    
    const avgROIC = roicValues.reduce((sum, roic) => sum + roic, 0) / roicValues.length;
    const roicStdDev = this.calculateStandardDeviation(roicValues);
    
    // High and consistent ROIC indicates moat
    if (avgROIC > 18 && roicStdDev < 8) return 'wide';
    if (avgROIC > 12 && roicStdDev < 15) return 'narrow';
    
    return 'none';
  }
  
  /**
   * Analyzes technical indicators for trading signals
   * Technical analysis complements fundamental analysis for timing
   */
  private analyzeTechnicals(financials: FinancialData, technicals: any): any {
    const prices = financials.historicalPrices || [];
    if (prices.length === 0) {
      return this.getDefaultTechnicalSignals();
    }
    
    const currentPrice = prices[0].close;
    
    // Determine overall trend
    const trend = this.determinePriceTrend(prices, technicals);
    
    // Assess momentum
    const momentum = this.assessMomentum(prices, technicals);
    
    // Identify support and resistance levels
    const support = this.calculateSupport(prices);
    const resistance = this.calculateResistance(prices);
    
    // Calculate entry and stop loss levels
    const entry = this.calculateEntryPoint(currentPrice, trend, support);
    const stopLoss = this.calculateStopLoss(entry, support, prices);
    
    // Generate specific signals
    const signals = this.generateTechnicalSignals(prices, technicals, trend, momentum);
    
    return {
      trend,
      momentum,
      support,
      resistance,
      entry,
      stopLoss,
      signals
    };
  }
  
  /**
   * Determines the primary price trend
   * Trend identification is crucial for timing decisions
   */
  private determinePriceTrend(prices: any[], technicals: any): 'bullish' | 'neutral' | 'bearish' {
    const currentPrice = prices[0].close;
    
    // Check position relative to moving averages
    const aboveSMA50 = currentPrice > technicals.sma50;
    const aboveSMA200 = currentPrice > technicals.sma200;
    const sma50AboveSMA200 = technicals.sma50 > technicals.sma200;
    
    // Count bullish signals
    let bullishSignals = 0;
    if (aboveSMA50) bullishSignals++;
    if (aboveSMA200) bullishSignals++;
    if (sma50AboveSMA200) bullishSignals++;
    
    // Determine trend based on signal count
    if (bullishSignals >= 2) return 'bullish';
    if (bullishSignals <= 1) return 'bearish';
    
    return 'neutral';
  }
  
  /**
   * Assesses price momentum strength
   * Strong momentum often continues in the near term
   */
  private assessMomentum(prices: any[], technicals: any): 'strong' | 'moderate' | 'weak' {
    // RSI-based momentum
    const rsi = technicals.rsi || 50;
    
    // Price change momentum
    const recentPerformance = this.calculateReturn(prices, 20); // 20-day return
    
    if (rsi > 70 || recentPerformance > 15) return 'strong';
    if (rsi < 30 || recentPerformance < -15) return 'weak';
    
    return 'moderate';
  }
  
  /**
   * Calculates support level from recent price action
   * Support represents price levels where buying interest emerges
   */
  private calculateSupport(prices: any[]): number {
    if (prices.length === 0) return 0;
    
    // Find recent lows that held multiple times
    const numPrices = Math.min(prices.length, 50);
    const recentLows = prices.slice(0, numPrices).map(p => p.low || p.close);
    recentLows.sort((a, b) => a - b);
    
    // Use 20th percentile as support
    const supportIndex = Math.floor(recentLows.length * 0.2);
    return recentLows[supportIndex] || recentLows[0] || 0;
  }
  
  /**
   * Calculates resistance level from recent price action
   * Resistance represents price levels where selling pressure increases
   */
  private calculateResistance(prices: any[]): number {
    if (prices.length === 0) return 0;
    
    // Find recent highs
    const numPrices = Math.min(prices.length, 50);
    const recentHighs = prices.slice(0, numPrices).map(p => p.high || p.close);
    recentHighs.sort((a, b) => b - a);
    
    // Use 80th percentile as resistance
    const resistanceIndex = Math.floor(recentHighs.length * 0.2);
    return recentHighs[resistanceIndex] || recentHighs[0] || 0;
  }
  
  /**
   * Calculates optimal entry point based on technical factors
   * Good entries improve risk/reward ratios
   */
  private calculateEntryPoint(
    currentPrice: number,
    trend: string,
    support: number
  ): number {
    if (trend === 'bullish') {
      // Enter on pullbacks to support in uptrends
      return Math.max(support * 1.02, currentPrice * 0.98);
    } else if (trend === 'bearish') {
      // More conservative entry in downtrends
      return support * 0.95;
    }
    
    // Neutral trend: enter close to current price
    return currentPrice * 0.99;
  }
  
  /**
   * Calculates stop loss level for risk management
   * Proper stops limit downside while allowing upside
   */
  private calculateStopLoss(entry: number, support: number, prices: any[]): number {
    // Calculate Average True Range for volatility-based stop
    const atr = this.calculateATR(prices.slice(0, 14));
    
    // Stop should be below support and account for volatility
    const volatilityStop = entry - (2 * atr);
    const supportStop = support * 0.97;
    
    // Use the higher of the two for better protection
    return Math.max(volatilityStop, supportStop);
  }
  
  /**
   * Calculates Average True Range for volatility measurement
   * ATR helps size positions and set stops based on volatility
   */
  private calculateATR(prices: any[]): number {
    if (prices.length < 2) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i].high;
      const low = prices[i].low;
      const prevClose = prices[i - 1].close;
      
      // True Range = max of (high-low), (high-prevClose), (prevClose-low)
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    // Simple average for ATR
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }
  
  /**
   * Generates specific technical trading signals
   * Signals help identify actionable opportunities
   */
  private generateTechnicalSignals(
    prices: any[],
    technicals: any,
    trend: string,
    momentum: string
  ): any[] {
    const signals = [];
    const currentPrice = prices[0].close;
    
    // Moving average crossover signals
    if (technicals.sma50 > technicals.sma200 * 1.01) {
      signals.push({
        type: 'golden_cross',
        strength: 0.8,
        date: prices[0].date,
        price: currentPrice
      });
    }
    
    // RSI signals
    if (technicals.rsi < 30) {
      signals.push({
        type: 'oversold',
        strength: 0.7,
        date: prices[0].date,
        price: currentPrice
      });
    } else if (technicals.rsi > 70) {
      signals.push({
        type: 'overbought',
        strength: 0.7,
        date: prices[0].date,
        price: currentPrice
      });
    }
    
    // MACD signals
    if (technicals.macd && technicals.macd.histogram > 0 && trend === 'bullish') {
      signals.push({
        type: 'macd_bullish',
        strength: 0.6,
        date: prices[0].date,
        price: currentPrice
      });
    }
    
    return signals;
  }
  
  /**
   * Calculates composite score synthesizing all analyses
   * This provides a single metric for overall attractiveness
   */
  private calculateCompositeScore(analyses: any): any {
    // Weight different factors based on importance
    const weights = {
      growth: 0.25,
      value: 0.25,
      quality: 0.20,
      momentum: 0.15,
      sentiment: 0.15
    };
    
    // Convert each analysis to 0-100 score
    const growthScore = this.scoreGrowth(analyses.growth);
    const valueScore = this.scoreValuation(analyses.valuation);
    const qualityScore = this.scoreQuality(analyses.quality);
    const momentumScore = this.scoreTechnicals(analyses.technicals);
    const sentimentScore = 50; // Neutral until we implement sentiment analysis
    
    // Calculate weighted average
    const overall = 
      growthScore * weights.growth +
      valueScore * weights.value +
      qualityScore * weights.quality +
      momentumScore * weights.momentum +
      sentimentScore * weights.sentiment;
    
    // Determine recommendation based on score
    const recommendation = this.getRecommendation(overall);
    
    // Calculate confidence based on data quality and consistency
    const confidence = this.calculateOverallConfidence(analyses);
    
    return {
      overall,
      growth: growthScore,
      value: valueScore,
      quality: qualityScore,
      momentum: momentumScore,
      sentiment: sentimentScore,
      recommendation,
      confidence
    };
  }
  
  /**
   * Utility methods for calculations
   */
  
  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  private calculateReturn(prices: any[], days: number): number {
    if (prices.length <= days) return 0;
    
    const currentPrice = prices[0].close;
    const pastPrice = prices[days].close;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }
  
  /**
   * Scoring methods to convert analyses to 0-100 scale
   */
  
  private scoreGrowth(growth: GrowthMetrics): number {
    let score = 50; // Start neutral
    
    // Revenue growth contribution
    if (growth.revenueGrowth.yoy > 20) score += 15;
    else if (growth.revenueGrowth.yoy > 10) score += 10;
    else if (growth.revenueGrowth.yoy < 0) score -= 15;
    
    // Earnings growth contribution
    if (growth.earningsGrowth.yoy > 25) score += 15;
    else if (growth.earningsGrowth.yoy > 15) score += 10;
    else if (growth.earningsGrowth.yoy < 0) score -= 15;
    
    // Trend contribution
    if (growth.revenueGrowth.trend === 'accelerating') score += 10;
    else if (growth.revenueGrowth.trend === 'decelerating') score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private scoreValuation(valuation: ValuationMetrics): number {
    // Higher margin of safety = higher score
    const mos = valuation.marginOfSafety;
    
    if (mos > 30) return 90;       // Deep value
    if (mos > 20) return 80;       // Good value
    if (mos > 10) return 70;       // Reasonable value
    if (mos > 0) return 60;        // Slight discount
    if (mos > -10) return 50;      // Fair value
    if (mos > -20) return 40;      // Slight premium
    if (mos > -30) return 30;      // Expensive
    return 20;                     // Very expensive
  }
  
  private scoreQuality(quality: QualityMetrics): number {
    let score = 50;
    
    // ROIC contribution
    if (quality.roic > 20) score += 20;
    else if (quality.roic > 15) score += 10;
    else if (quality.roic < 10) score -= 10;
    
    // Balance sheet contribution
    score += (quality.balanceSheetStrength - 50) * 0.3;
    
    // Moat contribution
    if (quality.moat === 'wide') score += 15;
    else if (quality.moat === 'narrow') score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private scoreTechnicals(technicals: any): number {
    let score = 50;
    
    // Trend contribution
    if (technicals.trend === 'bullish') score += 20;
    else if (technicals.trend === 'bearish') score -= 20;
    
    // Momentum contribution
    if (technicals.momentum === 'strong') score += 15;
    else if (technicals.momentum === 'weak') score -= 15;
    
    // Signal strength
    const bullishSignals = technicals.signals.filter(s => 
      ['golden_cross', 'oversold', 'macd_bullish'].includes(s.type)
    ).length;
    
    score += bullishSignals * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private getRecommendation(score: number): 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell' {
    if (score >= 80) return 'strongBuy';
    if (score >= 65) return 'buy';
    if (score >= 45) return 'hold';
    if (score >= 30) return 'sell';
    return 'strongSell';
  }
  
  private calculateOverallConfidence(analyses: any): number {
    // Average confidence from different components
    const confidences = [
      analyses.valuation?.confidence || 0.5,
      analyses.quality?.roic > 0 ? 0.8 : 0.3,
      analyses.technicals?.signals?.length > 0 ? 0.7 : 0.5
    ];
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
  
  /**
   * Default values for when calculations fail
   */
  
  private getDefaultGrowthMetrics(): GrowthMetrics {
    return {
      revenueGrowth: { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' },
      earningsGrowth: { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' },
      fcfGrowth: { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' },
      bookValueGrowth: { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' }
    };
  }
  
  private getDefaultTechnicalSignals(): any {
    return {
      trend: 'neutral',
      momentum: 'moderate',
      support: 0,
      resistance: 0,
      entry: 0,
      stopLoss: 0,
      signals: []
    };
  }
}

/**
 * Factory function for creating calculation engines
 * Allows easy instantiation with custom configuration
 */
export function createFinancialCalculationsEngine(
  config?: Partial<CalculationConfig>
): FinancialCalculationsEngine {
  return new FinancialCalculationsEngine(config);
}