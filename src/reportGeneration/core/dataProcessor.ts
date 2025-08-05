// src/reportGeneration/core/dataProcessor.ts
// Processes raw data into calculated metrics and insights
// Context: Applies financial calculations, pattern detection, and analysis

import { CompanyData, ReportSection } from '../models/reportTypes';
import { AnalysisResults, GrowthMetrics, ValuationMetrics, RiskMetrics, QualityMetrics, TechnicalSignals, CompositeScore } from '../models/financialMetrics';
import { logDebug } from '../../utils/logger';

export interface ProcessingResult {
  processedSections: any[];
  calculations: Record<string, any>;
  validationErrors: string[];
}

export class DataProcessor {
  /**
   * Main entry point for data processing
   * Transforms raw company data into actionable insights
   */
  async process(data: CompanyData): Promise<AnalysisResults> {
    logDebug('DataProcessor', `Processing data for ${data.ticker}`);
    
    try {
      // Validate input data
      this.validateInputData(data);
      
      // Calculate all metrics from real data with error handling
      const growth = this.safeCalculate('growth', () => this.calculateGrowthMetrics(data));
      const valuation = this.safeCalculate('valuation', () => this.calculateValuationMetrics(data));
      const risk = this.safeCalculate('risk', () => this.calculateRiskMetrics(data));
      const quality = this.safeCalculate('quality', () => this.calculateQualityMetrics(data));
      const technicals = this.safeCalculate('technicals', () => this.calculateTechnicalSignals(data));
      
      // Calculate composite score based on all metrics
      const composite = this.calculateCompositeScore(growth, valuation, risk, quality, technicals);
      
      // Validate results before returning
      const results = {
        growth,
        valuation,
        risk,
        quality,
        technicals,
        composite
      };
      
      if (!this.validateResults(results)) {
        throw new Error('Validation failed for processed analysis results');
      }
      
      return results;
    } catch (error) {
      logDebug('DataProcessor', `Error processing data: ${error.message}`);
      // Return safe default values instead of throwing
      return this.getDefaultAnalysisResults();
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async processData(
    rawData: Record<string, any>,
    sections: ReportSection[]
  ): Promise<ProcessingResult> {
    logDebug('DataProcessor', 'Legacy process method called');
    
    // Convert and process
    const analysis = await this.process(rawData as CompanyData);
    
    return {
      processedSections: [],
      calculations: { global: analysis },
      validationErrors: []
    };
  }

  private calculateGrowthMetrics(data: CompanyData): GrowthMetrics {
    const income = data.financials.incomeStatement || [];
    const balance = data.financials.balanceSheet || [];
    const cashFlow = data.financials.cashFlow || [];
    
    // Calculate revenue growth from actual data
    const revenueGrowth = this.calculateGrowthRates(
      income.map(s => ({ date: s.date, value: s.revenue || 0 }))
    );
    
    // Calculate earnings growth
    const earningsGrowth = this.calculateGrowthRates(
      income.map(s => ({ date: s.date, value: s.netIncome || 0 }))
    );
    
    // Calculate free cash flow growth
    const fcfData = cashFlow.map(cf => ({
      date: cf.date,
      value: (cf.operatingCashFlow || 0) - (cf.capitalExpenditures || 0)
    }));
    const fcfGrowth = this.calculateGrowthRates(fcfData);
    
    // Calculate book value growth
    const bookValueData = balance.map(bs => ({
      date: bs.date,
      value: (bs.totalAssets || 0) - (bs.totalLiabilities || 0)
    }));
    const bookValueGrowth = this.calculateGrowthRates(bookValueData);
    
    // Add overall growth metrics
    const overall = (revenueGrowth.yoy + earningsGrowth.yoy + fcfGrowth.yoy) / 3;
    
    return {
      revenueGrowth,
      earningsGrowth,
      fcfGrowth,
      bookValueGrowth,
      overall: isNaN(overall) ? 0 : overall / 100 // Convert to decimal
    };
  }
  
  private calculateGrowthRates(data: Array<{date: string, value: number}>): {
    yoy: number;
    qoq: number;
    cagr3: number;
    cagr5: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
  } {
    // Sort by date descending
    const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sorted.length < 2) {
      return { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' };
    }
    
    // Year-over-year growth
    const current = sorted[0]?.value || 0;
    const yearAgo = sorted.find(d => {
      const diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
      return diff >= 365 * 24 * 60 * 60 * 1000 && diff < 400 * 24 * 60 * 60 * 1000;
    })?.value || current;
    
    const yoy = yearAgo !== 0 ? ((current - yearAgo) / Math.abs(yearAgo)) * 100 : 0;
    
    // Quarter-over-quarter growth
    const previousQuarter = sorted[1]?.value || 0;
    const qoq = previousQuarter !== 0 ? 
      ((current - previousQuarter) / Math.abs(previousQuarter)) * 100 : 0;
    
    // 3-year CAGR
    const threeYearAgo = sorted.find(d => {
      const diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
      return diff >= 3 * 365 * 24 * 60 * 60 * 1000;
    });
    const cagr3 = threeYearAgo && threeYearAgo.value !== 0 ?
      (Math.pow(current / threeYearAgo.value, 1/3) - 1) * 100 : 0;
    
    // 5-year CAGR
    const fiveYearAgo = sorted.find(d => {
      const diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
      return diff >= 5 * 365 * 24 * 60 * 60 * 1000;
    });
    const cagr5 = fiveYearAgo && fiveYearAgo.value !== 0 ?
      (Math.pow(current / fiveYearAgo.value, 1/5) - 1) * 100 : 0;
    
    // Determine trend
    const recentGrowth = [yoy, qoq].filter(g => g !== 0);
    const historicalGrowth = [cagr3, cagr5].filter(g => g !== 0);
    const avgRecent = recentGrowth.reduce((a, b) => a + b, 0) / (recentGrowth.length || 1);
    const avgHistorical = historicalGrowth.reduce((a, b) => a + b, 0) / (historicalGrowth.length || 1);
    
    let trend: 'accelerating' | 'stable' | 'decelerating' = 'stable';
    if (avgRecent > avgHistorical * 1.2) trend = 'accelerating';
    else if (avgRecent < avgHistorical * 0.8) trend = 'decelerating';
    
    return {
      yoy: isNaN(yoy) ? 0 : parseFloat(yoy.toFixed(2)),
      qoq: isNaN(qoq) ? 0 : parseFloat(qoq.toFixed(2)),
      cagr3: isNaN(cagr3) ? 0 : parseFloat(cagr3.toFixed(2)),
      cagr5: isNaN(cagr5) ? 0 : parseFloat(cagr5.toFixed(2)),
      trend
    };
  }

  private calculateValuationMetrics(data: CompanyData): ValuationMetrics {
    const currentPrice = data.financials.historicalPrices?.[0]?.close || 100; // Default price if missing
    const keyMetrics = data.financials.keyMetrics || {};
    const latestIncome = data.financials.incomeStatement?.[0];
    const latestCashFlow = data.financials.cashFlow?.[0];

    // Calculate intrinsic value using DCF method with fallbacks
    const operatingCF = latestCashFlow?.operatingCashFlow || latestCashFlow?.cashFromOperations || 0;
    const capex = Math.abs(latestCashFlow?.capitalExpenditures || latestCashFlow?.capex || 0);
    const fcf = operatingCF - capex;

    // Estimate growth rate based on historical performance with fallbacks
    let growthRate = 0.05; // Default 5% growth
    if (keyMetrics.roe && keyMetrics.roe > 0) {
      // Convert ROE to decimal if it's in percentage form
      const roeDecimal = keyMetrics.roe > 5 ? keyMetrics.roe / 100 : keyMetrics.roe;
      growthRate = Math.min(0.15, Math.max(0, roeDecimal * 0.7));
    }

    const discountRate = 0.10; // 10% discount rate
    const terminalGrowth = 0.03; // 3% terminal growth

    // Simple DCF calculation with fallbacks
    let intrinsicValue = currentPrice; // Default to current price if DCF fails

    if (fcf > 0) {
      let dcfValue = 0;
      // Project 5 years of cash flows
      for (let i = 1; i <= 5; i++) {
        const projectedFCF = fcf * Math.pow(1 + growthRate, i);
        dcfValue += projectedFCF / Math.pow(1 + discountRate, i);
      }

      // Terminal value
      const terminalFCF = fcf * Math.pow(1 + growthRate, 5) * (1 + terminalGrowth);
      const terminalValue = terminalFCF / (discountRate - terminalGrowth);
      dcfValue += terminalValue / Math.pow(1 + discountRate, 5);

      // Per share calculation with safety checks
      let sharesOutstanding = keyMetrics.sharesOutstanding ||
                             latestIncome?.sharesOutstanding ||
                             (keyMetrics.marketCap && currentPrice > 0 ? keyMetrics.marketCap / currentPrice : 1000000000);

      if (sharesOutstanding > 0) {
        intrinsicValue = dcfValue / sharesOutstanding;
      }
    } else if (latestIncome?.netIncome && latestIncome.netIncome > 0) {
      // Fallback: Use earnings-based valuation if FCF is negative
      const eps = latestIncome.eps || (latestIncome.netIncome / (keyMetrics.sharesOutstanding || 1000000000));
      intrinsicValue = eps * 15; // 15x earnings multiple
    }
    
    // Calculate fair value using multiple approaches with fallbacks
    const peMultiple = 15; // Industry average P/E
    let eps = latestIncome?.eps || 0;

    // Calculate EPS if missing
    if (eps === 0 && latestIncome?.netIncome) {
      const shares = keyMetrics.sharesOutstanding ||
                    (keyMetrics.marketCap && currentPrice > 0 ? keyMetrics.marketCap / currentPrice : 1000000000);
      eps = latestIncome.netIncome / shares;
    }

    const peValue = eps > 0 ? eps * peMultiple : currentPrice; // Fallback to current price

    const pbMultiple = 2.5; // Industry average P/B
    let bookValuePerShare = 0;
    if (keyMetrics.priceToBook && keyMetrics.priceToBook > 0) {
      bookValuePerShare = currentPrice / keyMetrics.priceToBook;
    } else if (latestIncome?.bookValuePerShare) {
      bookValuePerShare = latestIncome.bookValuePerShare;
    } else {
      bookValuePerShare = currentPrice * 0.5; // Conservative estimate
    }

    const pbValue = bookValuePerShare * pbMultiple;

    // Weighted average fair value with minimum value protection
    let fairValue = (intrinsicValue * 0.5 + peValue * 0.3 + pbValue * 0.2);

    // Ensure fair value is reasonable (not 0 or negative)
    if (fairValue <= 0) {
      fairValue = Math.max(intrinsicValue, peValue, pbValue, currentPrice);
    }
    
    // Calculate margin of safety with safety checks
    const marginOfSafety = fairValue > 0 ? ((fairValue - currentPrice) / fairValue) * 100 : 0;

    // Determine valuation status
    let valuation: 'undervalued' | 'fairlyValued' | 'overvalued' = 'fairlyValued';
    if (marginOfSafety > 20) valuation = 'undervalued';
    else if (marginOfSafety < -20) valuation = 'overvalued';

    // Calculate confidence based on data quality
    const hasRecentData = (data.financials.incomeStatement?.length || 0) >= 4;
    const hasPositiveEarnings = eps > 0;
    const hasStableGrowth = Math.abs(growthRate) < 0.5;
    const hasCashFlow = fcf > 0;
    const confidence = (hasRecentData ? 0.3 : 0) + (hasPositiveEarnings ? 0.3 : 0) +
                      (hasStableGrowth ? 0.2 : 0) + (hasCashFlow ? 0.2 : 0);

    // Ensure all values are valid numbers
    const safeIntrinsicValue = isNaN(intrinsicValue) || intrinsicValue <= 0 ? currentPrice : intrinsicValue;
    const safeFairValue = isNaN(fairValue) || fairValue <= 0 ? currentPrice : fairValue;
    const safeMarginOfSafety = isNaN(marginOfSafety) ? 0 : marginOfSafety;
    const safeConfidence = isNaN(confidence) ? 0.5 : Math.max(0.1, Math.min(1.0, confidence));

    return {
      intrinsicValue: parseFloat(safeIntrinsicValue.toFixed(2)),
      fairValue: parseFloat(safeFairValue.toFixed(2)),
      marginOfSafety: parseFloat(safeMarginOfSafety.toFixed(1)),
      valuation,
      confidence: parseFloat(safeConfidence.toFixed(2))
    };
  }

  private calculateRiskMetrics(data: CompanyData): RiskMetrics {
    const prices = data.financials.historicalPrices || [];
    const keyMetrics = data.financials.keyMetrics;
    
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i-1].close - prices[i].close) / prices[i].close;
      returns.push(dailyReturn);
    }
    
    // Calculate volatility (annualized standard deviation)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);
    const volatility = dailyVolatility * Math.sqrt(252); // Annualize
    
    // Estimate beta using correlation with market returns
    // For now, use a simplified approach based on volatility
    const marketVolatility = 0.15; // Historical market volatility
    const beta = volatility / marketVolatility;
    
    // Calculate Sharpe ratio
    const riskFreeRate = 0.04; // 4% risk-free rate
    const annualReturn = avgReturn * 252;
    const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;
    
    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = prices[0]?.close || 0;
    for (const price of prices) {
      if (price.close > peak) peak = price.close;
      const drawdown = (peak - price.close) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    // Calculate Value at Risk (95% confidence)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = Math.abs(sortedReturns[var95Index] || 0);
    
    // Calculate composite risk score (0-100, lower is better)
    const betaScore = Math.min(beta * 20, 30); // Max 30 points for beta
    const volatilityScore = Math.min(volatility * 100, 30); // Max 30 points for volatility
    const drawdownScore = Math.min(maxDrawdown * 100, 20); // Max 20 points for drawdown
    const leverageScore = Math.min(keyMetrics.debtToEquity * 10, 20); // Max 20 points for leverage
    const riskScore = betaScore + volatilityScore + drawdownScore + leverageScore;
    
    return {
      beta: parseFloat(beta.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(3)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(3)),
      var95: parseFloat(var95.toFixed(3)),
      riskScore: Math.round(riskScore)
    };
  }

  private calculateQualityMetrics(data: CompanyData): QualityMetrics {
    const keyMetrics = data.financials.keyMetrics;
    const latestIncome = data.financials.incomeStatement[0];
    const latestBalance = data.financials.balanceSheet[0];
    const latestCashFlow = data.financials.cashFlow[0];
    const currentPrice = data.financials.historicalPrices[0]?.close || 0;
    
    // Calculate Return on Invested Capital (ROIC)
    const nopat = latestIncome ? (latestIncome.operatingIncome || 0) * (1 - 0.25) : 0; // Assume 25% tax rate
    const investedCapital = latestBalance ? 
      (latestBalance.totalAssets || 0) - (latestBalance.currentLiabilities || 0) : 0;
    const roic = investedCapital > 0 ? (nopat / investedCapital) * 100 : 0;
    
    // Calculate Free Cash Flow Yield
    const fcf = latestCashFlow ? 
      (latestCashFlow.operatingCashFlow || 0) - (latestCashFlow.capitalExpenditures || 0) : 0;
    const marketCap = keyMetrics.marketCap || 0;
    const fcfYield = marketCap > 0 ? fcf / marketCap : 0;
    
    // Calculate Earnings Quality Score (0-100)
    // Higher score means higher quality earnings
    let earningsQuality = 50; // Base score
    
    // Check if operating cash flow > net income (good sign)
    if (latestCashFlow && latestIncome) {
      const ocf = latestCashFlow.operatingCashFlow || 0;
      const netIncome = latestIncome.netIncome || 0;
      if (ocf > netIncome * 1.1) earningsQuality += 20;
      else if (ocf > netIncome * 0.9) earningsQuality += 10;
    }
    
    // Check for consistent earnings
    const incomeStatements = data.financials.incomeStatement.slice(0, 4);
    const hasConsistentEarnings = incomeStatements.every(stmt => (stmt.netIncome || 0) > 0);
    if (hasConsistentEarnings) earningsQuality += 15;
    
    // Check for low accruals
    if (latestBalance && latestIncome) {
      const totalAssets = latestBalance.totalAssets || 1;
      const accruals = (latestIncome.netIncome || 0) - (latestCashFlow?.operatingCashFlow || 0);
      const accrualRatio = Math.abs(accruals) / totalAssets;
      if (accrualRatio < 0.05) earningsQuality += 15;
    }
    
    // Calculate Balance Sheet Strength (0-100)
    let balanceSheetStrength = 50; // Base score
    
    // Current ratio
    if (keyMetrics.currentRatio > 2) balanceSheetStrength += 15;
    else if (keyMetrics.currentRatio > 1.5) balanceSheetStrength += 10;
    else if (keyMetrics.currentRatio > 1) balanceSheetStrength += 5;
    
    // Debt to equity
    if (keyMetrics.debtToEquity < 0.3) balanceSheetStrength += 20;
    else if (keyMetrics.debtToEquity < 0.6) balanceSheetStrength += 10;
    else if (keyMetrics.debtToEquity < 1) balanceSheetStrength += 5;
    
    // ROE consistency
    if (keyMetrics.roe > 0.15) balanceSheetStrength += 15;
    else if (keyMetrics.roe > 0.10) balanceSheetStrength += 10;
    
    // Determine moat based on multiple factors
    let moat: 'none' | 'narrow' | 'wide' = 'none';
    const moatScore = (roic > 15 ? 1 : 0) + 
                     (keyMetrics.roe > 0.15 ? 1 : 0) + 
                     (earningsQuality > 75 ? 1 : 0) + 
                     (fcfYield > 0.05 ? 1 : 0);
    
    if (moatScore >= 3) moat = 'wide';
    else if (moatScore >= 2) moat = 'narrow';
    
    return {
      roic: parseFloat(roic.toFixed(2)),
      fcfYield: parseFloat(fcfYield.toFixed(4)),
      earningsQuality: Math.round(earningsQuality),
      balanceSheetStrength: Math.round(balanceSheetStrength),
      moat,
      roe: keyMetrics.roe || 0 // Return on Equity from key metrics
    };
  }

  private calculateTechnicalSignals(data: CompanyData): TechnicalSignals {
    const prices = data.financials.historicalPrices || [];
    const technicals = data.technicals;
    const currentPrice = prices[0]?.close || 0;
    
    // Determine trend based on moving averages
    let trend: 'bullish' | 'neutral' | 'bearish' = 'neutral';
    if (technicals.sma20 > 0 && technicals.sma50 > 0 && technicals.sma200 > 0) {
      if (currentPrice > technicals.sma20 && technicals.sma20 > technicals.sma50 && technicals.sma50 > technicals.sma200) {
        trend = 'bullish';
      } else if (currentPrice < technicals.sma20 && technicals.sma20 < technicals.sma50 && technicals.sma50 < technicals.sma200) {
        trend = 'bearish';
      }
    }
    
    // Determine momentum based on RSI and MACD
    let momentum: 'strong' | 'moderate' | 'weak' = 'moderate';
    if (technicals.rsi > 70 || (technicals.rsi > 50 && technicals.macd.histogram > 0)) {
      momentum = 'strong';
    } else if (technicals.rsi < 30 || (technicals.rsi < 50 && technicals.macd.histogram < 0)) {
      momentum = 'weak';
    }
    
    // Calculate support and resistance levels
    const recentPrices = prices.slice(0, 20).map(p => p.close);
    const recentHighs = prices.slice(0, 20).map(p => p.high);
    const recentLows = prices.slice(0, 20).map(p => p.low);
    
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    // Calculate entry and stop loss based on ATR
    const atr = this.calculateATR(prices.slice(0, 14));
    const entry = trend === 'bullish' ? currentPrice + (atr * 0.5) : currentPrice - (atr * 0.5);
    const stopLoss = trend === 'bullish' ? currentPrice - (atr * 2) : currentPrice + (atr * 2);
    
    // Generate trading signals
    const signals: Array<{type: string; strength: number; date: string; price: number}> = [];
    
    // Golden/Death cross signals
    if (prices.length > 1) {
      const prevPrice = prices[1].close;
      const prevSMA50 = this.calculateSMA(prices.slice(1, 51), 50);
      const prevSMA200 = this.calculateSMA(prices.slice(1, 201), 200);
      
      if (technicals.sma50 > technicals.sma200 && prevSMA50 <= prevSMA200) {
        signals.push({
          type: 'golden_cross',
          strength: 0.8,
          date: prices[0].date,
          price: currentPrice
        });
      } else if (technicals.sma50 < technicals.sma200 && prevSMA50 >= prevSMA200) {
        signals.push({
          type: 'death_cross',
          strength: 0.8,
          date: prices[0].date,
          price: currentPrice
        });
      }
    }
    
    // RSI signals
    if (technicals.rsi < 30) {
      signals.push({
        type: 'oversold',
        strength: 0.7,
        date: prices[0]?.date || new Date().toISOString(),
        price: currentPrice
      });
    } else if (technicals.rsi > 70) {
      signals.push({
        type: 'overbought',
        strength: 0.7,
        date: prices[0]?.date || new Date().toISOString(),
        price: currentPrice
      });
    }
    
    return {
      trend,
      momentum,
      support: parseFloat(support.toFixed(2)),
      resistance: parseFloat(resistance.toFixed(2)),
      entry: parseFloat(entry.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      signals
    };
  }
  
  private calculateATR(prices: any[]): number {
    if (prices.length < 2) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i].high;
      const low = prices[i].low;
      const prevClose = prices[i-1].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trueRanges.push(tr);
    }
    
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }
  
  private calculateSMA(prices: any[], period: number): number {
    const validPrices = prices.slice(0, period).map(p => p.close).filter(p => !isNaN(p));
    if (validPrices.length === 0) return 0;
    return validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
  }

  private calculateCompositeScore(
    growth: GrowthMetrics,
    valuation: ValuationMetrics,
    risk: RiskMetrics,
    quality: QualityMetrics,
    technicals: TechnicalSignals
  ): CompositeScore {
    // Calculate sub-scores (0-100)
    
    // Growth score
    const growthScore = Math.min(100, Math.max(0,
      (growth.revenueGrowth.yoy > 0 ? 20 : 0) +
      (growth.earningsGrowth.yoy > 0 ? 20 : 0) +
      (growth.fcfGrowth.yoy > 0 ? 20 : 0) +
      (growth.revenueGrowth.cagr3 > 10 ? 20 : growth.revenueGrowth.cagr3 * 2) +
      (growth.earningsGrowth.trend === 'accelerating' ? 20 : 10)
    ));
    
    // Value score
    const valueScore = Math.min(100, Math.max(0,
      (valuation.marginOfSafety > 0.2 ? 40 : valuation.marginOfSafety * 200) +
      (valuation.valuation === 'undervalued' ? 30 : valuation.valuation === 'fairlyValued' ? 15 : 0) +
      (valuation.confidence * 30)
    ));
    
    // Quality score
    const qualityScore = Math.min(100, Math.max(0,
      (quality.roic > 15 ? 25 : quality.roic * 1.67) +
      (quality.earningsQuality * 0.25) +
      (quality.balanceSheetStrength * 0.25) +
      (quality.moat === 'wide' ? 25 : quality.moat === 'narrow' ? 15 : 5)
    ));
    
    // Momentum score
    const momentumScore = Math.min(100, Math.max(0,
      (technicals.trend === 'bullish' ? 40 : technicals.trend === 'neutral' ? 20 : 0) +
      (technicals.momentum === 'strong' ? 30 : technicals.momentum === 'moderate' ? 15 : 0) +
      (technicals.signals.filter(s => s.type === 'golden_cross' || s.type === 'oversold').length * 15)
    ));
    
    // Sentiment score (based on analyst ratings)
    // This would be enhanced with real sentiment analysis
    const sentimentScore = 70; // Default neutral-positive
    
    // Risk adjustment
    const riskAdjustment = Math.max(0.5, 1 - (risk.riskScore / 200));
    
    // Calculate overall score with risk adjustment
    const weights = {
      growth: 0.25,
      value: 0.25,
      quality: 0.30,
      momentum: 0.15,
      sentiment: 0.05
    };
    
    const rawScore = 
      growthScore * weights.growth +
      valueScore * weights.value +
      qualityScore * weights.quality +
      momentumScore * weights.momentum +
      sentimentScore * weights.sentiment;
    
    const overall = Math.round(rawScore * riskAdjustment);
    
    // Determine recommendation
    let recommendation: 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell' = 'hold';
    if (overall >= 80 && valuation.marginOfSafety > 0.1) recommendation = 'strongBuy';
    else if (overall >= 70 && valuation.marginOfSafety > 0) recommendation = 'buy';
    else if (overall >= 40) recommendation = 'hold';
    else if (overall >= 20) recommendation = 'sell';
    else recommendation = 'strongSell';
    
    // Calculate confidence based on data quality and consistency
    const confidence = valuation.confidence * 0.5 + 
                      (quality.earningsQuality / 100) * 0.3 +
                      (risk.riskScore < 50 ? 0.2 : 0.1);
    
    return {
      overall: overall / 100, // Normalize to 0-1 range for consistency
      growth: growthScore / 100, // Normalize to 0-1 range
      value: valueScore / 100, // Normalize to 0-1 range
      quality: qualityScore / 100, // Normalize to 0-1 range
      momentum: momentumScore / 100, // Normalize to 0-1 range
      sentiment: sentimentScore / 100, // Normalize to 0-1 range
      recommendation,
      confidence: parseFloat(confidence.toFixed(2))
    };
  }

  /**
   * Validates processed data for completeness and accuracy
   */
  validateResults(results: AnalysisResults): boolean {
    // Check all required fields are present and valid
    const hasGrowthData = results.growth && 
      !isNaN(results.growth.revenueGrowth.yoy) &&
      !isNaN(results.growth.earningsGrowth.yoy);
    
    const hasValuationData = results.valuation &&
      results.valuation.intrinsicValue > 0 &&
      results.valuation.fairValue > 0;
    
    const hasRiskData = results.risk &&
      results.risk.beta > 0 &&
      results.risk.volatility >= 0;
    
    const hasQualityData = results.quality &&
      results.quality.roic >= 0 &&
      results.quality.earningsQuality >= 0;
    
    const hasTechnicalData = results.technicals &&
      results.technicals.support > 0 &&
      results.technicals.resistance > results.technicals.support;
    
    const hasCompositeData = results.composite &&
      results.composite.overall >= 0 &&
      results.composite.overall <= 100;
    
    return hasGrowthData && hasValuationData && hasRiskData && 
           hasQualityData && hasTechnicalData && hasCompositeData;
  }

  /**
   * Validates input company data
   */
  private validateInputData(data: CompanyData): void {
    if (!data) {
      throw new Error('No data provided for processing');
    }
    
    if (!data.ticker) {
      throw new Error('Missing ticker symbol in company data');
    }
    
    if (!data.financials) {
      throw new Error('Missing financial data');
    }
    
    // Check for minimum required financial data
    const hasIncomeData = data.financials.incomeStatement && data.financials.incomeStatement.length > 0;
    const hasBalanceData = data.financials.balanceSheet && data.financials.balanceSheet.length > 0;
    const hasPriceData = data.financials.historicalPrices && data.financials.historicalPrices.length > 0;
    
    if (!hasIncomeData || !hasBalanceData || !hasPriceData) {
      throw new Error('Insufficient financial data for analysis');
    }
  }

  /**
   * Safely executes a calculation with error handling
   */
  private safeCalculate<T>(metricName: string, calculator: () => T): T {
    try {
      return calculator();
    } catch (error) {
      logDebug('DataProcessor', `Error calculating ${metricName}: ${error.message}`);
      // Return appropriate default based on metric type
      switch (metricName) {
        case 'growth':
          return this.getDefaultGrowthMetrics() as T;
        case 'valuation':
          return this.getDefaultValuationMetrics() as T;
        case 'risk':
          return this.getDefaultRiskMetrics() as T;
        case 'quality':
          return this.getDefaultQualityMetrics() as T;
        case 'technicals':
          return this.getDefaultTechnicalSignals() as T;
        default:
          throw error;
      }
    }
  }

  /**
   * Returns default analysis results for error cases
   */
  private getDefaultAnalysisResults(): AnalysisResults {
    return {
      growth: this.getDefaultGrowthMetrics(),
      valuation: this.getDefaultValuationMetrics(),
      risk: this.getDefaultRiskMetrics(),
      quality: this.getDefaultQualityMetrics(),
      technicals: this.getDefaultTechnicalSignals(),
      composite: {
        overall: 0.5,
        growth: 0.5,
        value: 0.5,
        quality: 0.5,
        momentum: 0.5,
        sentiment: 0.5,
        recommendation: 'hold',
        confidence: 0.3
      }
    };
  }

  private getDefaultGrowthMetrics(): GrowthMetrics {
    const defaultGrowthRate = { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' as const };
    return {
      revenueGrowth: defaultGrowthRate,
      earningsGrowth: defaultGrowthRate,
      fcfGrowth: defaultGrowthRate,
      bookValueGrowth: defaultGrowthRate,
      overall: 0
    };
  }

  private getDefaultValuationMetrics(): ValuationMetrics {
    return {
      intrinsicValue: 0,
      fairValue: 0,
      marginOfSafety: 0,
      valuation: 'fairlyValued',
      confidence: 0.3
    };
  }

  private getDefaultRiskMetrics(): RiskMetrics {
    return {
      beta: 1.0,
      volatility: 0.2,
      sharpeRatio: 0,
      maxDrawdown: 0,
      var95: 0,
      riskScore: 50
    };
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      roic: 0,
      fcfYield: 0,
      earningsQuality: 50,
      balanceSheetStrength: 50,
      moat: 'none',
      roe: 0
    };
  }

  private getDefaultTechnicalSignals(): TechnicalSignals {
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