// src/reportGeneration/utils/dataValidation.ts
// Data validation and enrichment utilities for report generation
// Context: Ensures data quality and adds calculated fields

import { FinancialData } from '../models/reportTypes';

/**
 * Validates financial data for consistency and completeness
 * Returns array of validation issues found
 */
export function validateFinancialData(financials: FinancialData): string[] {
  const issues: string[] = [];
  
  // Check for required sections
  if (!financials.incomeStatement || financials.incomeStatement.length === 0) {
    issues.push('Missing income statement data');
  }
  
  if (!financials.balanceSheet || financials.balanceSheet.length === 0) {
    issues.push('Missing balance sheet data');
  }
  
  if (!financials.cashFlow || financials.cashFlow.length === 0) {
    issues.push('Missing cash flow data');
  }
  
  // Validate income statement consistency
  if (financials.incomeStatement && financials.incomeStatement.length > 0) {
    financials.incomeStatement.forEach((statement, index) => {
      // Check for required fields
      if (!statement.revenue || statement.revenue <= 0) {
        issues.push(`Income statement ${index}: Invalid revenue value`);
      }
      
      // Check logical consistency
      if (statement.grossProfit && statement.revenue && statement.costOfRevenue) {
        const calculatedGrossProfit = statement.revenue - statement.costOfRevenue;
        const diff = Math.abs(calculatedGrossProfit - statement.grossProfit);
        if (diff > statement.revenue * 0.01) { // 1% tolerance
          issues.push(`Income statement ${index}: Gross profit calculation mismatch`);
        }
      }
      
      // Check for negative margins that don't make sense
      if (statement.grossProfit && statement.revenue) {
        const grossMargin = statement.grossProfit / statement.revenue;
        if (grossMargin < -0.5 || grossMargin > 1) {
          issues.push(`Income statement ${index}: Unusual gross margin ${(grossMargin * 100).toFixed(1)}%`);
        }
      }
    });
  }
  
  // Validate balance sheet consistency
  if (financials.balanceSheet && financials.balanceSheet.length > 0) {
    financials.balanceSheet.forEach((statement, index) => {
      // Assets = Liabilities + Equity check
      if (statement.totalAssets && statement.totalLiabilities && statement.totalEquity) {
        const calculatedAssets = statement.totalLiabilities + statement.totalEquity;
        const diff = Math.abs(calculatedAssets - statement.totalAssets);
        if (diff > statement.totalAssets * 0.01) { // 1% tolerance
          issues.push(`Balance sheet ${index}: Assets don't equal liabilities + equity`);
        }
      }
      
      // Check for negative values that shouldn't be
      if (statement.totalAssets && statement.totalAssets < 0) {
        issues.push(`Balance sheet ${index}: Negative total assets`);
      }
    });
  }
  
  // Validate historical prices
  if (financials.historicalPrices && financials.historicalPrices.length > 0) {
    let invalidPrices = 0;
    financials.historicalPrices.forEach((price, index) => {
      if (!price.date || !price.close || price.close <= 0) {
        invalidPrices++;
      }
      
      // Check for unrealistic price movements
      if (index > 0) {
        const prevPrice = financials.historicalPrices[index - 1].close;
        const changePercent = Math.abs((price.close - prevPrice) / prevPrice);
        if (changePercent > 0.5) { // 50% daily change is suspicious
          issues.push(`Historical prices: Suspicious ${(changePercent * 100).toFixed(1)}% change on ${price.date}`);
        }
      }
    });
    
    if (invalidPrices > 0) {
      issues.push(`Historical prices: ${invalidPrices} invalid price entries`);
    }
  }
  
  // Validate key metrics
  if (financials.keyMetrics) {
    const metrics = financials.keyMetrics;
    
    // PE ratio sanity check
    if (metrics.peRatio && (metrics.peRatio < 0 || metrics.peRatio > 1000)) {
      issues.push(`Key metrics: Unusual PE ratio ${metrics.peRatio}`);
    }
    
    // Current ratio sanity check
    if (metrics.currentRatio && metrics.currentRatio < 0) {
      issues.push('Key metrics: Negative current ratio');
    }
    
    // Debt to equity sanity check
    if (metrics.debtToEquity && metrics.debtToEquity < 0) {
      issues.push('Key metrics: Negative debt to equity ratio');
    }
  }
  
  return issues;
}

/**
 * Enriches financial data with calculated metrics and ratios
 * Adds derived fields that provide additional insights
 */
export function enrichFinancialData(financials: FinancialData): FinancialData {
  const enriched = { ...financials };
  
  // Calculate additional income statement metrics
  if (enriched.incomeStatement && enriched.incomeStatement.length > 0) {
    enriched.incomeStatement = enriched.incomeStatement.map(statement => {
      const enhanced = { ...statement };
      
      // Calculate margins if not present
      if (statement.revenue && statement.revenue > 0) {
        if (statement.grossProfit && !enhanced.grossMargin) {
          enhanced.grossMargin = statement.grossProfit / statement.revenue;
        }
        
        if (statement.operatingIncome && !enhanced.operatingMargin) {
          enhanced.operatingMargin = statement.operatingIncome / statement.revenue;
        }
        
        if (statement.netIncome && !enhanced.netMargin) {
          enhanced.netMargin = statement.netIncome / statement.revenue;
        }
      }
      
      // Calculate year-over-year growth if we have previous period
      const prevIndex = enriched.incomeStatement.findIndex(s => 
        s.date && statement.date && 
        new Date(s.date).getFullYear() === new Date(statement.date).getFullYear() - 1
      );
      
      if (prevIndex >= 0) {
        const prevStatement = enriched.incomeStatement[prevIndex];
        if (prevStatement.revenue && statement.revenue) {
          enhanced.revenueGrowth = (statement.revenue - prevStatement.revenue) / prevStatement.revenue;
        }
        
        if (prevStatement.netIncome && statement.netIncome) {
          enhanced.earningsGrowth = (statement.netIncome - prevStatement.netIncome) / Math.abs(prevStatement.netIncome);
        }
      }
      
      return enhanced;
    });
  }
  
  // Calculate additional balance sheet metrics
  if (enriched.balanceSheet && enriched.balanceSheet.length > 0) {
    enriched.balanceSheet = enriched.balanceSheet.map(statement => {
      const enhanced = { ...statement };
      
      // Calculate working capital
      if (statement.currentAssets && statement.currentLiabilities) {
        enhanced.workingCapital = statement.currentAssets - statement.currentLiabilities;
      }
      
      // Calculate book value per share if we have share count
      if (statement.totalEquity && statement.sharesOutstanding && statement.sharesOutstanding > 0) {
        enhanced.bookValuePerShare = statement.totalEquity / statement.sharesOutstanding;
      }
      
      // Calculate debt ratios
      if (statement.totalDebt && statement.totalAssets && statement.totalAssets > 0) {
        enhanced.debtToAssets = statement.totalDebt / statement.totalAssets;
      }
      
      return enhanced;
    });
  }
  
  // Calculate additional cash flow metrics
  if (enriched.cashFlow && enriched.cashFlow.length > 0) {
    enriched.cashFlow = enriched.cashFlow.map(statement => {
      const enhanced = { ...statement };
      
      // Calculate free cash flow
      if (statement.operatingCashFlow && statement.capitalExpenditures) {
        enhanced.freeCashFlow = statement.operatingCashFlow - Math.abs(statement.capitalExpenditures);
      }
      
      // Calculate cash flow margins if we have revenue
      const incomeStatement = enriched.incomeStatement?.find(is => 
        is.date && statement.date && 
        new Date(is.date).getTime() === new Date(statement.date).getTime()
      );
      
      if (incomeStatement?.revenue && statement.operatingCashFlow) {
        enhanced.operatingCashFlowMargin = statement.operatingCashFlow / incomeStatement.revenue;
        
        if (enhanced.freeCashFlow) {
          enhanced.freeCashFlowMargin = enhanced.freeCashFlow / incomeStatement.revenue;
        }
      }
      
      return enhanced;
    });
  }
  
  // Enhance key metrics with additional calculations
  if (enriched.keyMetrics) {
    const latestIncome = enriched.incomeStatement?.[0];
    const latestBalance = enriched.balanceSheet?.[0];
    const latestCashFlow = enriched.cashFlow?.[0];
    
    // Calculate ROE if not present
    if (!enriched.keyMetrics.roe && latestIncome?.netIncome && latestBalance?.totalEquity) {
      enriched.keyMetrics.roe = latestIncome.netIncome / latestBalance.totalEquity;
    }
    
    // Calculate ROA
    if (latestIncome?.netIncome && latestBalance?.totalAssets) {
      enriched.keyMetrics.roa = latestIncome.netIncome / latestBalance.totalAssets;
    }
    
    // Calculate FCF yield if we have market cap
    if (latestCashFlow?.freeCashFlow && enriched.keyMetrics.marketCap && enriched.keyMetrics.marketCap > 0) {
      enriched.keyMetrics.fcfYield = latestCashFlow.freeCashFlow / enriched.keyMetrics.marketCap;
    }
    
    // Calculate earnings yield (inverse of PE)
    if (enriched.keyMetrics.peRatio && enriched.keyMetrics.peRatio > 0) {
      enriched.keyMetrics.earningsYield = 1 / enriched.keyMetrics.peRatio;
    }
  }
  
  // Add data quality metrics
  enriched.dataQuality = assessFinancialDataQuality(enriched);
  
  return enriched;
}

/**
 * Assesses the quality and completeness of financial data
 */
function assessFinancialDataQuality(financials: FinancialData): {
  score: number;
  completeness: number;
  consistency: number;
  timeliness: number;
} {
  let completeness = 0;
  let consistency = 0;
  let timeliness = 0;
  
  // Completeness checks
  const completeChecks = [
    financials.incomeStatement?.length > 0,
    financials.balanceSheet?.length > 0,
    financials.cashFlow?.length > 0,
    financials.historicalPrices?.length > 200,
    financials.keyMetrics?.peRatio !== undefined,
    financials.keyMetrics?.marketCap !== undefined
  ];
  
  completeness = completeChecks.filter(Boolean).length / completeChecks.length;
  
  // Consistency checks (no validation errors)
  const validationIssues = validateFinancialData(financials);
  consistency = Math.max(0, 1 - (validationIssues.length / 10));
  
  // Timeliness checks
  if (financials.incomeStatement && financials.incomeStatement.length > 0) {
    const latestDate = new Date(financials.incomeStatement[0].date);
    const daysSinceLatest = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
    timeliness = Math.max(0, 1 - (daysSinceLatest / 180)); // 6 months as baseline
  }
  
  const score = (completeness * 0.4 + consistency * 0.4 + timeliness * 0.2);
  
  return {
    score,
    completeness,
    consistency,
    timeliness
  };
}

/**
 * Validates that dates are in the expected format and range
 */
export function validateDateFormat(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  // Check if date is reasonable (not in future, not too far in past)
  const now = Date.now();
  const dateTime = date.getTime();
  const yearInMs = 365 * 24 * 60 * 60 * 1000;
  
  return dateTime <= now && dateTime > now - (50 * yearInMs); // Within last 50 years
}

/**
 * Cleans and normalizes financial values
 */
export function normalizeFinancialValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove common formatting
    const cleaned = value.replace(/[$,]/g, '').trim();
    
    // Handle millions/billions notation
    const multipliers = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000,
      'T': 1000000000000
    };
    
    for (const [suffix, multiplier] of Object.entries(multipliers)) {
      if (cleaned.toUpperCase().endsWith(suffix)) {
        const num = parseFloat(cleaned.slice(0, -1));
        return isNaN(num) ? 0 : num * multiplier;
      }
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
}