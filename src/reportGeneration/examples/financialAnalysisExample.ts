// src/reportGeneration/examples/financialAnalysisExample.ts
// Integration example showing financial analysis pipeline
// Context: Demonstrates how data fetching and calculations work together

import { createDataFetcher } from '../core/dataFetcher';
import { createFinancialCalculationsEngine } from '../processing/financialCalculations';
import { createDataProcessor } from '../processing/dataProcessor';
import { performanceMonitor as globalPerformanceMonitor } from '../utils/performanceMonitor';

/**
 * Complete financial analysis example
 * This shows the full pipeline from data fetching to actionable insights
 */
async function performComprehensiveFinancialAnalysis(ticker: string) {
  console.log(`\n🔍 Starting comprehensive financial analysis for ${ticker}...\n`);
  
  try {
    // Step 1: Fetch comprehensive company data
    console.log('Step 1: Fetching company data...');
    const fetcher = createDataFetcher({
      ticker,
      debugMode: true,
      includeNews: true,
      includeTranscripts: true
    });
    
    const companyData = await globalPerformanceMonitor.measureOperation(
      'data_fetch',
      async () => await fetcher.fetchAll(ticker, (stage, progress) => {
        console.log(`  [${progress}%] ${stage}`);
      })
    );
    
    console.log(`✅ Data fetching complete for ${companyData.companyName}\n`);
    
    // Step 2: Perform financial calculations
    console.log('Step 2: Performing financial analysis...');
    const calculator = createFinancialCalculationsEngine({
      riskFreeRate: 0.045,  // Current 10-year Treasury
      marketReturn: 0.10,   // Historical S&P 500 return
      taxRate: 0.21        // Current US corporate tax rate
    });
    
    const analysis = await globalPerformanceMonitor.measureOperation(
      'financial_analysis',
      async () => await calculator.analyze(companyData)
    );
    
    console.log('✅ Financial analysis complete\n');
    
    // Step 3: Display comprehensive results
    displayAnalysisResults(companyData, analysis);
    
    // Step 4: Generate investment thesis
    const thesis = generateInvestmentThesis(companyData, analysis);
    console.log('\n📊 Investment Thesis:');
    console.log('═'.repeat(50));
    console.log(thesis);
    
    // Step 5: Show performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log('═'.repeat(50));
    const fetchStats = globalPerformanceMonitor.getStats('data_fetch');
    const analysisStats = globalPerformanceMonitor.getStats('financial_analysis');
    
    if (fetchStats) {
      console.log(`Data Fetching: ${(fetchStats.avgDuration / 1000).toFixed(2)}s`);
    }
    if (analysisStats) {
      console.log(`Financial Analysis: ${(analysisStats.avgDuration / 1000).toFixed(2)}s`);
    }
    
    return { companyData, analysis };
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    throw error;
  }
}

/**
 * Displays formatted analysis results
 */
function displayAnalysisResults(companyData: any, analysis: any) {
  console.log('📈 Financial Analysis Results:');
  console.log('═'.repeat(50));
  
  // Company Overview
  console.log(`\nCompany: ${companyData.companyName} (${companyData.ticker})`);
  console.log(`Sector: ${companyData.sector}`);
  console.log(`Industry: ${companyData.industry}`);
  
  // Current Valuation
  const currentPrice = companyData.financials.historicalPrices?.[0]?.close || 0;
  console.log(`\nCurrent Price: $${currentPrice.toFixed(2)}`);
  console.log(`Market Cap: $${(companyData.financials.keyMetrics.marketCap / 1e9).toFixed(2)}B`);
  
  // Growth Metrics
  console.log('\n📊 Growth Metrics:');
  console.log(`Revenue Growth (YoY): ${analysis.growth.revenueGrowth.yoy.toFixed(2)}%`);
  console.log(`Revenue Growth (3Y CAGR): ${analysis.growth.revenueGrowth.cagr3.toFixed(2)}%`);
  console.log(`Revenue Trend: ${analysis.growth.revenueGrowth.trend}`);
  console.log(`Earnings Growth (YoY): ${analysis.growth.earningsGrowth.yoy.toFixed(2)}%`);
  console.log(`FCF Growth (YoY): ${analysis.growth.fcfGrowth.yoy.toFixed(2)}%`);
  
  // Valuation Metrics
  console.log('\n💰 Valuation:');
  console.log(`Intrinsic Value (DCF): $${analysis.valuation.intrinsicValue.toFixed(2)}`);
  console.log(`Fair Value (Multiples): $${analysis.valuation.fairValue.toFixed(2)}`);
  console.log(`Margin of Safety: ${analysis.valuation.marginOfSafety.toFixed(2)}%`);
  console.log(`Valuation Assessment: ${analysis.valuation.valuation.toUpperCase()}`);
  console.log(`Confidence: ${(analysis.valuation.confidence * 100).toFixed(0)}%`);
  
  // Quality Metrics
  console.log('\n⭐ Quality Metrics:');
  console.log(`ROIC: ${analysis.quality.roic.toFixed(2)}%`);
  console.log(`FCF Yield: ${analysis.quality.fcfYield.toFixed(2)}%`);
  console.log(`Earnings Quality: ${analysis.quality.earningsQuality}/100`);
  console.log(`Balance Sheet Strength: ${analysis.quality.balanceSheetStrength}/100`);
  console.log(`Competitive Moat: ${analysis.quality.moat.toUpperCase()}`);
  
  // Risk Metrics
  console.log('\n⚠️ Risk Profile:');
  console.log(`Beta: ${analysis.risk.beta.toFixed(2)}`);
  console.log(`Volatility: ${analysis.risk.volatility.toFixed(2)}%`);
  console.log(`Sharpe Ratio: ${analysis.risk.sharpeRatio.toFixed(2)}`);
  console.log(`Max Drawdown: ${analysis.risk.maxDrawdown.toFixed(2)}%`);
  console.log(`Risk Score: ${analysis.risk.riskScore}/100`);
  
  // Technical Analysis
  console.log('\n📉 Technical Analysis:');
  console.log(`Trend: ${analysis.technicals.trend.toUpperCase()}`);
  console.log(`Momentum: ${analysis.technicals.momentum.toUpperCase()}`);
  console.log(`Support: $${analysis.technicals.support.toFixed(2)}`);
  console.log(`Resistance: $${analysis.technicals.resistance.toFixed(2)}`);
  console.log(`Entry Point: $${analysis.technicals.entry.toFixed(2)}`);
  console.log(`Stop Loss: $${analysis.technicals.stopLoss.toFixed(2)}`);
  
  // Technical Signals
  if (analysis.technicals.signals.length > 0) {
    console.log('\nActive Signals:');
    analysis.technicals.signals.forEach((signal: any) => {
      console.log(`  - ${signal.type}: Strength ${(signal.strength * 100).toFixed(0)}%`);
    });
  }
  
  // Composite Score
  console.log('\n🎯 Overall Assessment:');
  console.log(`Composite Score: ${analysis.composite.overall.toFixed(0)}/100`);
  console.log(`  Growth Score: ${analysis.composite.growth.toFixed(0)}/100`);
  console.log(`  Value Score: ${analysis.composite.value.toFixed(0)}/100`);
  console.log(`  Quality Score: ${analysis.composite.quality.toFixed(0)}/100`);
  console.log(`  Momentum Score: ${analysis.composite.momentum.toFixed(0)}/100`);
  console.log(`\nRecommendation: ${analysis.composite.recommendation.toUpperCase()}`);
  console.log(`Confidence: ${(analysis.composite.confidence * 100).toFixed(0)}%`);
}

/**
 * Generates a comprehensive investment thesis
 */
function generateInvestmentThesis(companyData: any, analysis: any): string {
  const { companyName, ticker } = companyData;
  const currentPrice = companyData.financials.historicalPrices?.[0]?.close || 0;
  
  let thesis = `${companyName} (${ticker}) Investment Analysis\n\n`;
  
  // Investment Recommendation
  const rec = analysis.composite.recommendation;
  const recEmoji = {
    strongBuy: '🟢🟢',
    buy: '🟢',
    hold: '🟡',
    sell: '🔴',
    strongSell: '🔴🔴'
  }[rec] || '⚪';
  
  thesis += `${recEmoji} ${rec.toUpperCase()} - Score: ${analysis.composite.overall.toFixed(0)}/100\n\n`;
  
  // Bull Case
  thesis += 'BULL CASE:\n';
  const bullPoints = [];
  
  if (analysis.growth.revenueGrowth.trend === 'accelerating') {
    bullPoints.push(`• Revenue growth is accelerating (${analysis.growth.revenueGrowth.yoy.toFixed(1)}% YoY)`);
  }
  if (analysis.valuation.marginOfSafety > 20) {
    bullPoints.push(`• Stock appears undervalued with ${analysis.valuation.marginOfSafety.toFixed(0)}% margin of safety`);
  }
  if (analysis.quality.moat === 'wide') {
    bullPoints.push('• Company has a wide competitive moat protecting returns');
  }
  if (analysis.quality.roic > 20) {
    bullPoints.push(`• Exceptional capital efficiency with ${analysis.quality.roic.toFixed(1)}% ROIC`);
  }
  if (analysis.technicals.trend === 'bullish') {
    bullPoints.push('• Technical indicators show bullish momentum');
  }
  
  thesis += bullPoints.length > 0 ? bullPoints.join('\n') : '• Limited positive catalysts identified';
  
  // Bear Case
  thesis += '\n\nBEAR CASE:\n';
  const bearPoints = [];
  
  if (analysis.growth.revenueGrowth.trend === 'decelerating') {
    bearPoints.push('• Revenue growth is decelerating');
  }
  if (analysis.valuation.marginOfSafety < -20) {
    bearPoints.push(`• Stock appears overvalued by ${Math.abs(analysis.valuation.marginOfSafety).toFixed(0)}%`);
  }
  if (analysis.risk.riskScore > 70) {
    bearPoints.push(`• High risk profile (score: ${analysis.risk.riskScore}/100)`);
  }
  if (analysis.quality.balanceSheetStrength < 40) {
    bearPoints.push('• Weak balance sheet raises financial stability concerns');
  }
  if (analysis.risk.maxDrawdown > 40) {
    bearPoints.push(`• Historical max drawdown of ${analysis.risk.maxDrawdown.toFixed(0)}% indicates high volatility`);
  }
  
  thesis += bearPoints.length > 0 ? bearPoints.join('\n') : '• Limited negative factors identified';
  
  // Price Targets
  thesis += '\n\nPRICE TARGETS:\n';
  const avgTarget = (analysis.valuation.intrinsicValue + analysis.valuation.fairValue) / 2;
  const upside = ((avgTarget - currentPrice) / currentPrice) * 100;
  
  thesis += `• Current Price: $${currentPrice.toFixed(2)}\n`;
  thesis += `• DCF Value: $${analysis.valuation.intrinsicValue.toFixed(2)}\n`;
  thesis += `• Fair Value: $${analysis.valuation.fairValue.toFixed(2)}\n`;
  thesis += `• Average Target: $${avgTarget.toFixed(2)} (${upside > 0 ? '+' : ''}${upside.toFixed(1)}%)\n`;
  
  // Risk/Reward
  thesis += '\nRISK/REWARD:\n';
  const entryPrice = analysis.technicals.entry;
  const stopLoss = analysis.technicals.stopLoss;
  const target = avgTarget;
  const potentialLoss = ((entryPrice - stopLoss) / entryPrice) * 100;
  const potentialGain = ((target - entryPrice) / entryPrice) * 100;
  const riskRewardRatio = potentialGain / potentialLoss;
  
  thesis += `• Entry: $${entryPrice.toFixed(2)}\n`;
  thesis += `• Stop Loss: $${stopLoss.toFixed(2)} (-${potentialLoss.toFixed(1)}%)\n`;
  thesis += `• Target: $${target.toFixed(2)} (+${potentialGain.toFixed(1)}%)\n`;
  thesis += `• Risk/Reward Ratio: ${riskRewardRatio.toFixed(2)}:1\n`;
  
  // Key Metrics Summary
  thesis += '\nKEY METRICS:\n';
  thesis += `• P/E Ratio: ${companyData.financials.keyMetrics.peRatio.toFixed(1)}\n`;
  thesis += `• Revenue Growth: ${analysis.growth.revenueGrowth.cagr3.toFixed(1)}% (3Y CAGR)\n`;
  thesis += `• ROIC: ${analysis.quality.roic.toFixed(1)}%\n`;
  thesis += `• Debt/Equity: ${companyData.financials.keyMetrics.debtToEquity.toFixed(2)}\n`;
  
  return thesis;
}

/**
 * Example: Analyze multiple companies for comparison
 */
async function compareCompanies(tickers: string[]) {
  console.log('\n🔄 Comparative Analysis\n');
  
  const results = [];
  
  for (const ticker of tickers) {
    try {
      const result = await performComprehensiveFinancialAnalysis(ticker);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${ticker}:`, error);
    }
  }
  
  // Compare key metrics
  console.log('\n📊 Comparative Summary:');
  console.log('═'.repeat(80));
  console.log('Ticker | Score | Rec      | P/E   | Growth | ROIC  | MoS    | Risk');
  console.log('─'.repeat(80));
  
  results.forEach(({ companyData, analysis }) => {
    const row = [
      companyData.ticker.padEnd(6),
      analysis.composite.overall.toFixed(0).padStart(5),
      analysis.composite.recommendation.padEnd(9),
      (companyData.financials.keyMetrics.peRatio || 0).toFixed(1).padStart(5),
      analysis.growth.revenueGrowth.cagr3.toFixed(1).padStart(6) + '%',
      analysis.quality.roic.toFixed(1).padStart(5) + '%',
      analysis.valuation.marginOfSafety.toFixed(0).padStart(6) + '%',
      analysis.risk.riskScore.toFixed(0).padStart(4)
    ];
    console.log(row.join(' | '));
  });
  
  return results;
}

// Run examples when executed directly
if (require.main === module) {
  // Example 1: Single company analysis
  console.log('Example 1: Analyzing NVDA...');
  performComprehensiveFinancialAnalysis('NVDA')
    .then(() => {
      // Example 2: Compare multiple tech companies
      console.log('\n\nExample 2: Comparing tech giants...');
      return compareCompanies(['AAPL', 'MSFT', 'GOOGL']);
    })
    .then(() => console.log('\n✅ Examples completed successfully!'))
    .catch(error => console.error('\n❌ Example failed:', error));
}

export { 
  performComprehensiveFinancialAnalysis, 
  compareCompanies,
  generateInvestmentThesis 
};