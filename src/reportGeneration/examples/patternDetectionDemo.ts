// src/reportGeneration/examples/patternDetectionDemo.ts
// Demonstrates pattern detection capabilities for technical analysis
// Context: Shows how to identify and act on chart patterns

import { createDataFetcher } from '../core/dataFetcher';
import { createPatternDetectionEngine, PatternType } from '../processing/patternDetection';
import { createDataProcessor } from '../processing/dataProcessor';

/**
 * Demonstrates pattern detection on real market data
 * Shows how patterns are identified, validated, and interpreted
 */
async function demonstratePatternDetection(ticker: string = 'NVDA') {
  console.log(`\n🔍 Pattern Detection Analysis for ${ticker}\n`);
  
  try {
    // Step 1: Fetch price data
    console.log('Fetching historical price data...');
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    if (!companyData.financials.historicalPrices || 
        companyData.financials.historicalPrices.length < 50) {
      console.log('Insufficient price data for pattern detection');
      return;
    }
    
    // Step 2: Initialize pattern detection engine
    const patternEngine = createPatternDetectionEngine({
      minPatternLength: 5,
      confidenceThreshold: 60,
      lookbackPeriod: 252,
      validateWithVolume: true,
      statisticalValidation: true
    });
    
    // Step 3: Detect patterns
    console.log('\nScanning for patterns...');
    console.log(`Analyzing ${companyData.financials.historicalPrices.length} price bars\n`);
    
    const patterns = await patternEngine.detectPatterns(
      companyData.financials.historicalPrices,
      companyData.technicals
    );
    
    // Step 4: Display results
    console.log(`✅ Found ${patterns.length} significant patterns\n`);
    
    if (patterns.length === 0) {
      console.log('No significant patterns detected in current market conditions');
      return;
    }
    
    // Group patterns by type
    const patternsByType = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.type]) acc[pattern.type] = [];
      acc[pattern.type].push(pattern);
      return acc;
    }, {} as Record<string, typeof patterns>);
    
    // Display pattern summary
    console.log('📊 PATTERN SUMMARY');
    console.log('═'.repeat(50));
    
    Object.entries(patternsByType).forEach(([type, typePatterns]) => {
      console.log(`\n${formatPatternType(type as PatternType)}: ${typePatterns.length} detected`);
      
      typePatterns.slice(0, 2).forEach((pattern, idx) => {
        console.log(`\n  Pattern ${idx + 1}:`);
        console.log(`  ├─ Direction: ${pattern.direction.toUpperCase()}`);
        console.log(`  ├─ Confidence: ${pattern.confidence.toFixed(1)}%`);
        console.log(`  ├─ Strength: ${(pattern.strength * 100).toFixed(1)}%`);
        console.log(`  ├─ Period: ${pattern.startDate.split('T')[0]} to ${pattern.endDate.split('T')[0]}`);
        
        if (pattern.targetPrice) {
          const currentPrice = companyData.financials.historicalPrices[0].close;
          const targetReturn = ((pattern.targetPrice - currentPrice) / currentPrice) * 100;
          console.log(`  ├─ Target: $${pattern.targetPrice.toFixed(2)} (${targetReturn > 0 ? '+' : ''}${targetReturn.toFixed(1)}%)`);
        }
        
        if (pattern.stopLoss) {
          console.log(`  ├─ Stop Loss: $${pattern.stopLoss.toFixed(2)}`);
        }
        
        console.log(`  └─ Win Probability: ${(pattern.probability * 100).toFixed(0)}%`);
      });
    });
    
    // Display key insights
    console.log('\n\n💡 KEY INSIGHTS');
    console.log('═'.repeat(50));
    
    const bullishPatterns = patterns.filter(p => p.direction === 'bullish');
    const bearishPatterns = patterns.filter(p => p.direction === 'bearish');
    
    console.log(`\nMarket Bias: ${bullishPatterns.length > bearishPatterns.length ? 'BULLISH' : 'BEARISH'}`);
    console.log(`├─ Bullish Patterns: ${bullishPatterns.length}`);
    console.log(`├─ Bearish Patterns: ${bearishPatterns.length}`);
    console.log(`└─ Neutral Patterns: ${patterns.filter(p => p.direction === 'neutral').length}`);
    
    // Find highest confidence pattern
    const topPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0];
    if (topPattern) {
      console.log(`\n🎯 Highest Confidence Pattern:`);
      console.log(`Type: ${formatPatternType(topPattern.type)}`);
      console.log(`Direction: ${topPattern.direction.toUpperCase()}`);
      console.log(`Confidence: ${topPattern.confidence.toFixed(1)}%`);
      
      if (topPattern.metadata.formation) {
        console.log('\nFormation Details:');
        displayFormationDetails(topPattern.type, topPattern.metadata.formation);
      }
    }
    
    // Risk/Reward Analysis
    const patternsWithTargets = patterns.filter(p => p.targetPrice && p.stopLoss);
    if (patternsWithTargets.length > 0) {
      console.log('\n\n📈 RISK/REWARD ANALYSIS');
      console.log('═'.repeat(50));
      
      const currentPrice = companyData.financials.historicalPrices[0].close;
      
      patternsWithTargets.slice(0, 3).forEach((pattern, idx) => {
        const reward = Math.abs(pattern.targetPrice! - currentPrice);
        const risk = Math.abs(pattern.stopLoss! - currentPrice);
        const ratio = reward / risk;
        
        console.log(`\n${formatPatternType(pattern.type)} (${pattern.direction})`);
        console.log(`├─ Risk/Reward Ratio: ${ratio.toFixed(2)}:1`);
        console.log(`├─ Potential Gain: ${((reward / currentPrice) * 100).toFixed(1)}%`);
        console.log(`├─ Potential Loss: ${((risk / currentPrice) * 100).toFixed(1)}%`);
        console.log(`└─ Expected Value: ${((pattern.probability * reward - (1 - pattern.probability) * risk) / currentPrice * 100).toFixed(1)}%`);
      });
    }
    
  } catch (error) {
    console.error('❌ Pattern detection failed:', error);
  }
}

/**
 * Demonstrates real-time pattern scanning
 * Shows how to monitor for emerging patterns
 */
async function demonstratePatternScanning(tickers: string[]) {
  console.log('\n🔄 Multi-Stock Pattern Scanner\n');
  
  const results: Array<{
    ticker: string;
    patterns: any[];
    score: number;
  }> = [];
  
  for (const ticker of tickers) {
    try {
      console.log(`\nScanning ${ticker}...`);
      
      const fetcher = createDataFetcher({ ticker });
      const data = await fetcher.fetchAll(ticker);
      
      const engine = createPatternDetectionEngine({
        confidenceThreshold: 70 // Higher threshold for scanner
      });
      
      const patterns = await engine.detectPatterns(
        data.financials.historicalPrices,
        data.technicals
      );
      
      // Calculate pattern score
      const score = calculatePatternScore(patterns);
      
      results.push({ ticker, patterns, score });
      
      console.log(`✓ Found ${patterns.length} high-confidence patterns`);
      console.log(`  Pattern Score: ${score.toFixed(0)}/100`);
      
    } catch (error) {
      console.log(`✗ Failed to scan ${ticker}`);
    }
  }
  
  // Display ranking
  console.log('\n\n🏆 PATTERN STRENGTH RANKING');
  console.log('═'.repeat(60));
  console.log('Ticker | Score | Patterns | Top Pattern');
  console.log('─'.repeat(60));
  
  results
    .sort((a, b) => b.score - a.score)
    .forEach(result => {
      const topPattern = result.patterns
        .sort((a, b) => b.confidence - a.confidence)[0];
      
      console.log(
        `${result.ticker.padEnd(6)} | ${result.score.toFixed(0).padStart(5)} | ` +
        `${result.patterns.length.toString().padStart(8)} | ` +
        `${topPattern ? formatPatternType(topPattern.type) : 'None'}`
      );
    });
}

/**
 * Demonstrates pattern combination analysis
 * Shows how multiple patterns can confirm each other
 */
async function demonstratePatternCombinations(ticker: string = 'AAPL') {
  console.log(`\n🔗 Pattern Combination Analysis for ${ticker}\n`);
  
  try {
    // Fetch data and detect patterns
    const processor = createDataProcessor();
    const fetcher = createDataFetcher({ ticker });
    const rawData = await fetcher.fetchAll(ticker);
    
    const { analysis } = await processor.processData(rawData);
    
    if (!analysis.technicals?.patternAnalysis) {
      console.log('No pattern analysis available');
      return;
    }
    
    const patternAnalysis = analysis.technicals.patternAnalysis;
    
    // Display integrated analysis
    console.log('📊 INTEGRATED PATTERN ANALYSIS');
    console.log('═'.repeat(50));
    console.log(`\nTotal Patterns Detected: ${patternAnalysis.patternCount}`);
    console.log(`Average Confidence: ${patternAnalysis.averageConfidence.toFixed(1)}%`);
    console.log(`Pattern Momentum: ${(patternAnalysis.patternMomentum * 100).toFixed(0)}%`);
    
    if (patternAnalysis.dominantPattern) {
      console.log(`\nDominant Pattern: ${formatPatternType(patternAnalysis.dominantPattern)}`);
    }
    
    // Pattern distribution
    console.log('\nPattern Distribution:');
    console.log(`├─ Bullish: ${patternAnalysis.bullishPatterns} (${((patternAnalysis.bullishPatterns / patternAnalysis.patternCount) * 100).toFixed(0)}%)`);
    console.log(`├─ Bearish: ${patternAnalysis.bearishPatterns} (${((patternAnalysis.bearishPatterns / patternAnalysis.patternCount) * 100).toFixed(0)}%)`);
    console.log(`└─ Neutral: ${patternAnalysis.neutralPatterns} (${((patternAnalysis.neutralPatterns / patternAnalysis.patternCount) * 100).toFixed(0)}%)`);
    
    // Key patterns with context
    if (patternAnalysis.keyPatterns.length > 0) {
      console.log('\n\n🎯 KEY PATTERNS WITH MARKET CONTEXT');
      console.log('═'.repeat(50));
      
      patternAnalysis.keyPatterns.forEach((pattern: any, idx: number) => {
        console.log(`\n${idx + 1}. ${formatPatternType(pattern.type)}`);
        console.log(`   Direction: ${pattern.direction.toUpperCase()}`);
        console.log(`   Confidence: ${pattern.confidence.toFixed(1)}%`);
        
        // Add fundamental context
        console.log(`\n   Fundamental Context:`);
        console.log(`   ├─ Valuation: ${analysis.valuation.valuation.toUpperCase()}`);
        console.log(`   ├─ Financial Health: ${analysis.quality.balanceSheetStrength}/100`);
        console.log(`   └─ Growth Trend: ${analysis.growth.revenueGrowth.trend.toUpperCase()}`);
        
        // Pattern alignment
        const aligned = isPatternAligned(pattern, analysis);
        console.log(`\n   Pattern-Fundamental Alignment: ${aligned ? '✅ ALIGNED' : '⚠️  DIVERGENT'}`);
        
        if (pattern.targetPrice) {
          // Compare with fundamental targets
          const fundTarget = (analysis.valuation.intrinsicValue + analysis.valuation.fairValue) / 2;
          console.log(`\n   Price Targets:`);
          console.log(`   ├─ Pattern Target: $${pattern.targetPrice.toFixed(2)}`);
          console.log(`   └─ Fundamental Target: $${fundTarget.toFixed(2)}`);
        }
      });
    }
    
    // Overall recommendation combining patterns and fundamentals
    console.log('\n\n🎯 COMBINED RECOMMENDATION');
    console.log('═'.repeat(50));
    
    const patternSignal = patternAnalysis.bullishPatterns > patternAnalysis.bearishPatterns ? 'bullish' : 'bearish';
    const fundamentalSignal = analysis.composite.recommendation;
    
    console.log(`\nPattern Signal: ${patternSignal.toUpperCase()}`);
    console.log(`Fundamental Signal: ${fundamentalSignal.toUpperCase()}`);
    console.log(`\nCombined Analysis: ${getCombinedRecommendation(patternSignal, fundamentalSignal)}`);
    
  } catch (error) {
    console.error('❌ Pattern combination analysis failed:', error);
  }
}

// Helper functions

function formatPatternType(type: PatternType | string): string {
  const formatted = type.replace(/_/g, ' ').toLowerCase();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function displayFormationDetails(type: PatternType | string, formation: any) {
  switch (type) {
    case PatternType.GOLDMINE_CHANNEL:
      console.log(`├─ Channel Width: ${(formation.channelWidth || 0).toFixed(2)}`);
      console.log(`├─ Touch Points: ${formation.touchPoints || 0}`);
      console.log(`└─ Slope: ${formation.upperSlope > 0 ? 'Ascending' : 'Descending'}`);
      break;
      
    case PatternType.GOLDMINE_SHAFT:
      console.log(`├─ Velocity: ${(formation.velocity || 0).toFixed(3)}`);
      console.log(`├─ Consecutive Bars: ${formation.consecutiveBars || 0}`);
      console.log(`└─ Type: ${formation.isContinuation ? 'Continuation' : 'Exhaustion'}`);
      break;
      
    case PatternType.ROCKETMAN:
      console.log(`├─ Consolidation Length: ${formation.consolidationLength || 0} bars`);
      console.log(`├─ Breakout Magnitude: ${((formation.breakoutMagnitude || 0) * 100).toFixed(1)}%`);
      console.log(`└─ Volume Increase: ${formation.volumeIncrease?.toFixed(1)}x`);
      break;
      
    case PatternType.ESCALATOR:
      console.log(`├─ Step Count: ${formation.stepCount || 0}`);
      console.log(`├─ Average Step: ${((formation.avgStepSize || 0) * 100).toFixed(1)}%`);
      console.log(`└─ Consistency: ${((formation.consistency || 0) * 100).toFixed(0)}%`);
      break;
      
    case PatternType.BLACKJACK:
      console.log(`├─ Extreme Type: ${formation.extremeType || 'Unknown'}`);
      if (formation.indicators?.rsi) {
        console.log(`├─ RSI: ${formation.indicators.rsi.toFixed(1)}`);
      }
      console.log(`└─ Confirmations: ${formation.confirmations?.join(', ') || 'None'}`);
      break;
      
    default:
      Object.entries(formation).slice(0, 3).forEach(([key, value]) => {
        console.log(`├─ ${key}: ${value}`);
      });
  }
}

function calculatePatternScore(patterns: any[]): number {
  if (patterns.length === 0) return 0;
  
  let score = 50; // Base score
  
  // Adjust for pattern count
  score += Math.min(patterns.length * 5, 20);
  
  // Adjust for average confidence
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  score += (avgConfidence - 60) / 2;
  
  // Bonus for high-probability patterns
  const highProbPatterns = patterns.filter(p => p.probability > 0.65);
  score += highProbPatterns.length * 3;
  
  // Penalty for conflicting signals
  const bullish = patterns.filter(p => p.direction === 'bullish').length;
  const bearish = patterns.filter(p => p.direction === 'bearish').length;
  const conflict = Math.min(bullish, bearish) / patterns.length;
  score -= conflict * 20;
  
  return Math.max(0, Math.min(100, score));
}

function isPatternAligned(pattern: any, analysis: any): boolean {
  const patternBullish = pattern.direction === 'bullish';
  const fundamentalBullish = ['strongBuy', 'buy'].includes(analysis.composite.recommendation);
  
  return patternBullish === fundamentalBullish;
}

function getCombinedRecommendation(patternSignal: string, fundamentalSignal: string): string {
  if (patternSignal === 'bullish' && ['strongBuy', 'buy'].includes(fundamentalSignal)) {
    return '🟢 STRONG BUY - Patterns and fundamentals aligned bullish';
  } else if (patternSignal === 'bearish' && ['sell', 'strongSell'].includes(fundamentalSignal)) {
    return '🔴 STRONG SELL - Patterns and fundamentals aligned bearish';
  } else if (patternSignal === 'bullish' && fundamentalSignal === 'hold') {
    return '🟡 CAUTIOUS BUY - Patterns bullish but fundamentals neutral';
  } else if (patternSignal === 'bearish' && fundamentalSignal === 'hold') {
    return '🟡 CAUTIOUS SELL - Patterns bearish but fundamentals neutral';
  } else {
    return '⚠️  HOLD - Conflicting signals, wait for clarity';
  }
}

// Run demonstrations
if (require.main === module) {
  const mode = process.argv[2] || 'single';
  
  switch (mode) {
    case 'scanner':
      // Multi-stock pattern scanner
      demonstratePatternScanning(['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'])
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'combined':
      // Pattern + fundamental analysis
      demonstratePatternCombinations('AAPL')
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      // Single stock pattern detection
      demonstratePatternDetection('NVDA')
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

export {
  demonstratePatternDetection,
  demonstratePatternScanning,
  demonstratePatternCombinations
};