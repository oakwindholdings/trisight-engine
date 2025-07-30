// src/reportGeneration/examples/dataProcessingDemo.ts
// Demonstrates the financial analysis capabilities
// Context: Shows how to use the calculations engine effectively

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';

async function demonstrateFinancialAnalysis() {
  console.log('=== TriSight Financial Analysis Demo ===\n');
  
  try {
    // Step 1: Fetch comprehensive data
    console.log('Fetching financial data for NVIDIA...');
    const fetcher = createDataFetcher({
      ticker: 'NVDA',
      includeNews: false, // Skip for faster demo
      includeTranscripts: false
    });
    
    const rawData = await fetcher.fetchAll('NVDA');
    console.log('✓ Data fetched successfully\n');
    
    // Step 2: Process through calculations engine
    console.log('Analyzing financial metrics...');
    const processor = createDataProcessor();
    const { analysis } = await processor.processData(rawData);
    
    // Display Growth Analysis
    console.log('\n📈 GROWTH ANALYSIS');
    console.log('─'.repeat(50));
    console.log(`Revenue Growth (YoY): ${analysis.growth.revenueGrowth.yoy.toFixed(1)}%`);
    console.log(`Revenue Growth (3Y CAGR): ${analysis.growth.revenueGrowth.cagr3.toFixed(1)}%`);
    console.log(`Revenue Trend: ${analysis.growth.revenueGrowth.trend.toUpperCase()}`);
    console.log(`\nEarnings Growth (YoY): ${analysis.growth.earningsGrowth.yoy.toFixed(1)}%`);
    console.log(`FCF Growth (YoY): ${analysis.growth.fcfGrowth.yoy.toFixed(1)}%`);
    
    // Display Valuation Analysis
    console.log('\n💰 VALUATION ANALYSIS');
    console.log('─'.repeat(50));
    console.log(`Intrinsic Value: $${analysis.valuation.intrinsicValue.toFixed(2)}`);
    console.log(`Fair Value: $${analysis.valuation.fairValue.toFixed(2)}`);
    console.log(`Current Price: $${rawData.financials.historicalPrices[0].close.toFixed(2)}`);
    console.log(`Margin of Safety: ${analysis.valuation.marginOfSafety.toFixed(1)}%`);
    console.log(`Assessment: ${analysis.valuation.valuation.toUpperCase()}`);
    console.log(`Confidence: ${(analysis.valuation.confidence * 100).toFixed(0)}%`);
    
    // Display Risk Metrics
    console.log('\n⚠️  RISK ANALYSIS');
    console.log('─'.repeat(50));
    console.log(`Beta: ${analysis.risk.beta.toFixed(2)}`);
    console.log(`Volatility: ${analysis.risk.volatility.toFixed(1)}%`);
    console.log(`Max Drawdown: ${analysis.risk.maxDrawdown.toFixed(1)}%`);
    console.log(`Sharpe Ratio: ${analysis.risk.sharpeRatio.toFixed(2)}`);
    console.log(`Risk Score: ${analysis.risk.riskScore}/100`);
    
    // Display Quality Metrics
    console.log('\n🏆 QUALITY ANALYSIS');
    console.log('─'.repeat(50));
    console.log(`ROIC: ${analysis.quality.roic.toFixed(1)}%`);
    console.log(`FCF Yield: ${analysis.quality.fcfYield.toFixed(1)}%`);
    console.log(`Earnings Quality: ${analysis.quality.earningsQuality}/100`);
    console.log(`Balance Sheet Strength: ${analysis.quality.balanceSheetStrength}/100`);
    console.log(`Competitive Moat: ${analysis.quality.moat.toUpperCase()}`);
    
    // Display Technical Analysis
    console.log('\n📊 TECHNICAL ANALYSIS');
    console.log('─'.repeat(50));
    console.log(`Trend: ${analysis.technicals.trend.toUpperCase()}`);
    console.log(`Momentum: ${analysis.technicals.momentum.toUpperCase()}`);
    console.log(`Support: $${analysis.technicals.support.toFixed(2)}`);
    console.log(`Resistance: $${analysis.technicals.resistance.toFixed(2)}`);
    console.log(`Entry Point: $${analysis.technicals.entry.toFixed(2)}`);
    console.log(`Stop Loss: $${analysis.technicals.stopLoss.toFixed(2)}`);
    
    // Display Composite Score
    console.log('\n🎯 INVESTMENT RECOMMENDATION');
    console.log('─'.repeat(50));
    console.log(`Overall Score: ${analysis.composite.overall.toFixed(0)}/100`);
    console.log(`Recommendation: ${analysis.composite.recommendation.toUpperCase()}`);
    console.log(`Confidence: ${(analysis.composite.confidence * 100).toFixed(0)}%`);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

/**
 * Demonstrates processing with progress tracking
 */
async function demonstrateWithProgress() {
  console.log('=== TriSight Data Processing Demo (with Progress) ===\n');
  
  try {
    // Fetch data
    const fetcher = createDataFetcher({ ticker: 'AAPL' });
    const rawData = await fetcher.fetchAll('AAPL');
    
    // Process with progress tracking
    const processor = createDataProcessor();
    console.log('Processing AAPL data...\n');
    
    const { companyData, analysis } = await processor.processData(
      rawData,
      (stage, progress) => {
        const progressBar = '█'.repeat(Math.floor(progress / 5)) + 
                          '░'.repeat(20 - Math.floor(progress / 5));
        console.log(`[${progressBar}] ${progress}% - ${stage}`);
      }
    );
    
    console.log('\n✓ Processing complete!');
    console.log(`\nCompany: ${companyData.companyName} (${companyData.ticker})`);
    console.log(`Analysis Version: ${companyData.metadata.analysisVersion}`);
    console.log(`Recommendation: ${analysis.composite.recommendation.toUpperCase()}`);
    console.log(`Score: ${analysis.composite.overall}/100`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
  }
}

/**
 * Demonstrates batch processing multiple companies
 */
async function demonstrateBatchProcessing() {
  console.log('=== TriSight Batch Processing Demo ===\n');
  
  const tickers = ['MSFT', 'GOOGL', 'AMZN'];
  const results = [];
  
  const processor = createDataProcessor({
    includePatternDetection: false, // Skip for speed
    includeSentimentAnalysis: false
  });
  
  for (const ticker of tickers) {
    try {
      console.log(`\nAnalyzing ${ticker}...`);
      const fetcher = createDataFetcher({ ticker });
      const rawData = await fetcher.fetchAll(ticker);
      const { analysis } = await processor.processData(rawData);
      
      results.push({
        ticker,
        score: analysis.composite.overall,
        recommendation: analysis.composite.recommendation,
        growth: analysis.growth.revenueGrowth.cagr3,
        roic: analysis.quality.roic,
        risk: analysis.risk.riskScore
      });
      
      console.log(`✓ ${ticker} complete`);
    } catch (error) {
      console.error(`✗ ${ticker} failed:`, error.message);
    }
  }
  
  // Display comparison table
  console.log('\n📊 COMPARATIVE ANALYSIS');
  console.log('═'.repeat(70));
  console.log('Ticker | Score | Recommendation | Growth | ROIC  | Risk');
  console.log('─'.repeat(70));
  
  results.forEach(r => {
    console.log(
      `${r.ticker.padEnd(6)} | ${r.score.toFixed(0).padStart(5)} | ` +
      `${r.recommendation.padEnd(14)} | ${r.growth.toFixed(1).padStart(6)}% | ` +
      `${r.roic.toFixed(1).padStart(5)}% | ${r.risk.toFixed(0).padStart(4)}`
    );
  });
  
  console.log('═'.repeat(70));
}

// Run the demos
if (require.main === module) {
  const demo = process.argv[2] || 'basic';
  
  switch (demo) {
    case 'progress':
      demonstrateWithProgress()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'batch':
      demonstrateBatchProcessing()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      demonstrateFinancialAnalysis()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

export { 
  demonstrateFinancialAnalysis,
  demonstrateWithProgress,
  demonstrateBatchProcessing
};