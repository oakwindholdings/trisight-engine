// src/reportGeneration/examples/contentGeneratorDemo.ts
// Demonstrates dynamic content generation capabilities
// Context: Shows how intelligent narratives adapt to different scenarios

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { 
  createContentGenerator,
  ContentStrategy,
  NarrativeTone
} from '../templates/contentGenerator';

/**
 * Demonstrates content generation for different strategies
 */
async function demonstrateContentGeneration(ticker: string = 'NVDA') {
  console.log(`\n📝 Content Generation Demo for ${ticker}\n`);
  
  try {
    // Fetch and process data
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor();
    const { analysis } = await processor.processData(companyData);
    
    // Create content generator
    const generator = createContentGenerator();
    
    // Determine strategy and tone
    const strategy = generator.determineStrategy(analysis);
    const tone = generator.determineTone(analysis);
    
    console.log('📊 Content Analysis');
    console.log('═'.repeat(50));
    console.log(`Strategy: ${strategy.toUpperCase()}`);
    console.log(`Tone: ${tone.toUpperCase()}`);
    console.log(`Score: ${analysis.composite.overall}/100`);
    console.log(`Risk: ${analysis.risk.riskScore}/100`);
    
    // Generate opening paragraph
    console.log('\n📝 Opening Paragraph');
    console.log('═'.repeat(50));
    const opening = generator.generateOpening(companyData, analysis, strategy, tone);
    console.log(opening);
    
    // Generate investment thesis
    console.log('\n🎯 Investment Thesis');
    console.log('═'.repeat(50));
    const thesis = generator.generateInvestmentThesis(companyData, analysis, strategy);
    thesis.forEach((point, idx) => {
      console.log(`${idx + 1}. ${point}`);
    });
    
    // Generate risk summary
    console.log('\n⚠️  Risk Summary');
    console.log('═'.repeat(50));
    const riskSummary = generator.generateRiskSummary(analysis);
    console.log(riskSummary);
    
    // Generate catalysts
    console.log('\n🚀 Key Catalysts');
    console.log('═'.repeat(50));
    const catalysts = generator.generateCatalystDescription(companyData, analysis);
    catalysts.forEach((catalyst, idx) => {
      console.log(`${idx + 1}. ${catalyst}`);
    });
    
    // Generate timeline
    console.log('\n📅 Expected Timeline');
    console.log('═'.repeat(50));
    const timeline = generator.generateTimeline(companyData, analysis);
    console.log('Timeframe'.padEnd(20) + 'Event'.padEnd(30) + 'Impact');
    console.log('-'.repeat(70));
    timeline.forEach(item => {
      console.log(
        item.timeframe.padEnd(20) +
        item.event.padEnd(30) +
        item.impact
      );
    });
    
  } catch (error) {
    console.error('❌ Content generation failed:', error);
  }
}

/**
 * Demonstrates content adaptation for different scenarios
 */
async function demonstrateContentAdaptation() {
  console.log('\n🔄 Content Adaptation Demo\n');
  
  // Create mock scenarios
  const scenarios = [
    {
      name: 'High Growth Tech',
      company: {
        ticker: 'GROWTH',
        companyName: 'GrowthTech Inc',
        industry: 'Software',
        sector: 'Technology'
      },
      analysis: {
        growth: { revenueGrowth: { yoy: 0.45 } },
        valuation: { marginOfSafety: 10 },
        risk: { riskScore: 60 },
        composite: { overall: 85 }
      },
      expectedStrategy: ContentStrategy.GROWTH_STORY,
      expectedTone: NarrativeTone.BULLISH
    },
    {
      name: 'Value Opportunity',
      company: {
        ticker: 'VALUE',
        companyName: 'ValueCorp',
        industry: 'Banking',
        sector: 'Financial'
      },
      analysis: {
        growth: { revenueGrowth: { yoy: 0.02 } },
        valuation: { valuation: 'undervalued', marginOfSafety: 35 },
        risk: { riskScore: 40 },
        composite: { overall: 70 }
      },
      expectedStrategy: ContentStrategy.VALUE_PLAY,
      expectedTone: NarrativeTone.BULLISH
    },
    {
      name: 'Turnaround Story',
      company: {
        ticker: 'TURN',
        companyName: 'TurnaroundCo',
        industry: 'Retail',
        sector: 'Consumer'
      },
      analysis: {
        growth: { revenueGrowth: { yoy: 0.05 } },
        profitability: { marginTrend: 'expanding' },
        sentiment: { temporalAnalysis: { trend: 'improving' } },
        risk: { riskScore: 65 },
        composite: { overall: 55 }
      },
      expectedStrategy: ContentStrategy.TURNAROUND,
      expectedTone: NarrativeTone.NEUTRAL
    },
    {
      name: 'Distressed Situation',
      company: {
        ticker: 'DIST',
        companyName: 'DistressedCo',
        industry: 'Energy',
        sector: 'Energy'
      },
      analysis: {
        growth: { revenueGrowth: { yoy: -0.25 } },
        risk: { financialRisk: 9, riskScore: 90 },
        composite: { overall: 20 }
      },
      expectedStrategy: ContentStrategy.DISTRESSED,
      expectedTone: NarrativeTone.BEARISH
    }
  ];
  
  const generator = createContentGenerator();
  
  scenarios.forEach(scenario => {
    console.log(`\n📊 Scenario: ${scenario.name}`);
    console.log('─'.repeat(50));
    
    // Create full mock data
    const mockCompany = createMockCompanyForScenario(scenario.company);
    const mockAnalysis = createMockAnalysisForScenario(scenario.analysis);
    
    // Determine strategy and tone
    const strategy = generator.determineStrategy(mockAnalysis);
    const tone = generator.determineTone(mockAnalysis);
    
    console.log(`Expected Strategy: ${scenario.expectedStrategy}`);
    console.log(`Actual Strategy: ${strategy}`);
    console.log(`Match: ${strategy === scenario.expectedStrategy ? '✅' : '❌'}`);
    
    console.log(`\nExpected Tone: ${scenario.expectedTone}`);
    console.log(`Actual Tone: ${tone}`);
    console.log(`Match: ${tone === scenario.expectedTone ? '✅' : '❌'}`);
    
    // Generate opening
    const opening = generator.generateOpening(mockCompany, mockAnalysis, strategy, tone);
    console.log(`\nGenerated Opening:`);
    console.log(`"${opening.substring(0, 150)}..."`);
  });
}

/**
 * Demonstrates different narrative tones
 */
function demonstrateNarrativeTones() {
  console.log('\n🎭 Narrative Tone Variations\n');
  
  const generator = createContentGenerator();
  const mockCompany = {
    ticker: 'TEST',
    companyName: 'TestCorp',
    industry: 'Technology',
    sector: 'Technology'
  };
  
  const baseAnalysis = {
    growth: { revenueGrowth: { yoy: 0.20 } },
    valuation: { marginOfSafety: 15 },
    profitability: { netMargin: 0.15 },
    risk: { riskScore: 50 },
    composite: { overall: 65 }
  };
  
  const tones = [
    NarrativeTone.BULLISH,
    NarrativeTone.NEUTRAL,
    NarrativeTone.CAUTIOUS,
    NarrativeTone.BEARISH
  ];
  
  const strategy = ContentStrategy.GROWTH_STORY;
  
  tones.forEach(tone => {
    console.log(`\n${tone.toUpperCase()} Tone:`);
    console.log('─'.repeat(50));
    
    const mockCompanyData = createMockCompanyForScenario(mockCompany);
    const mockAnalysisData = createMockAnalysisForScenario(baseAnalysis);
    
    const opening = generator.generateOpening(
      mockCompanyData,
      mockAnalysisData,
      strategy,
      tone
    );
    
    console.log(opening);
  });
}

/**
 * Demonstrates thesis generation for different strategies
 */
function demonstrateThesisGeneration() {
  console.log('\n📋 Investment Thesis Generation\n');
  
  const generator = createContentGenerator();
  const strategies = [
    ContentStrategy.GROWTH_STORY,
    ContentStrategy.VALUE_PLAY,
    ContentStrategy.TURNAROUND,
    ContentStrategy.MOMENTUM,
    ContentStrategy.DEFENSIVE,
    ContentStrategy.SPECULATIVE
  ];
  
  strategies.forEach(strategy => {
    console.log(`\n${strategy.toUpperCase().replace('_', ' ')} Thesis:`);
    console.log('─'.repeat(50));
    
    const mockCompany = createMockCompanyForScenario({
      ticker: 'TEST',
      companyName: 'TestCorp',
      industry: 'Technology',
      sector: 'Technology'
    });
    
    const mockAnalysis = createMockAnalysisForStrategy(strategy);
    
    const thesis = generator.generateInvestmentThesis(
      mockCompany,
      mockAnalysis,
      strategy
    );
    
    thesis.forEach((point, idx) => {
      console.log(`${idx + 1}. ${point}`);
    });
  });
}

// Helper functions

function createMockCompanyForScenario(scenario: any): any {
  return {
    ticker: scenario.ticker,
    companyName: scenario.companyName,
    description: `${scenario.companyName} operates in the ${scenario.industry} industry`,
    sector: scenario.sector,
    industry: scenario.industry,
    financials: {
      incomeStatement: [],
      balanceSheet: [],
      cashFlow: [],
      keyMetrics: {},
      historicalPrices: []
    },
    news: [],
    transcripts: [],
    technicals: {},
    analysts: {},
    metadata: {}
  };
}

function createMockAnalysisForScenario(scenario: any): any {
  return {
    growth: {
      revenueGrowth: scenario.growth?.revenueGrowth || { yoy: 0.10 },
      earningsGrowth: { yoy: 0.15 },
      fcfGrowth: { yoy: 0.12 },
      compositeScore: 70
    },
    profitability: {
      grossMargin: 0.35,
      operatingMargin: 0.20,
      netMargin: 0.12,
      marginTrend: scenario.profitability?.marginTrend || 'stable',
      roe: 0.15,
      roa: 0.08,
      roic: 0.12
    },
    valuation: {
      intrinsicValue: 100,
      marginOfSafety: scenario.valuation?.marginOfSafety || 10,
      valuation: scenario.valuation?.valuation || 'fairlyValued'
    },
    risk: {
      volatility: 25,
      beta: 1.2,
      maxDrawdown: 15,
      sharpeRatio: 1.5,
      riskScore: scenario.risk?.riskScore || 50,
      financialRisk: scenario.risk?.financialRisk || 5,
      operationalRisk: 5,
      marketRisk: 5
    },
    quality: {
      roe: 0.15,
      roa: 0.08,
      roic: 0.12,
      earningsQuality: 7,
      balanceSheetStrength: 7,
      moat: 'narrow',
      qualityScore: 75
    },
    technicals: {
      trend: 'bullish',
      support: 90,
      resistance: 110
    },
    composite: {
      overall: scenario.composite?.overall || 65,
      growth: 70,
      value: 60,
      quality: 75,
      momentum: 65,
      sentiment: 70,
      confidence: 75,
      recommendation: 'buy'
    },
    sentiment: scenario.sentiment
  };
}

function createMockAnalysisForStrategy(strategy: ContentStrategy): any {
  const baseAnalysis = createMockAnalysisForScenario({});
  
  switch (strategy) {
    case ContentStrategy.GROWTH_STORY:
      baseAnalysis.growth.revenueGrowth.yoy = 0.35;
      baseAnalysis.composite.overall = 85;
      break;
      
    case ContentStrategy.VALUE_PLAY:
      baseAnalysis.valuation.marginOfSafety = 40;
      baseAnalysis.valuation.valuation = 'undervalued';
      break;
      
    case ContentStrategy.TURNAROUND:
      baseAnalysis.profitability.marginTrend = 'expanding';
      baseAnalysis.sentiment = { temporalAnalysis: { trend: 'improving' } };
      break;
      
    case ContentStrategy.MOMENTUM:
      baseAnalysis.technicals.trend = 'bullish';
      baseAnalysis.technicals.patternAnalysis = {
        patternMomentum: 0.8,
        bullishPatterns: 5,
        bearishPatterns: 1
      };
      break;
      
    case ContentStrategy.DEFENSIVE:
      baseAnalysis.risk.beta = 0.6;
      baseAnalysis.profitability.netMargin = 0.18;
      break;
      
    case ContentStrategy.SPECULATIVE:
      baseAnalysis.risk.riskScore = 85;
      baseAnalysis.growth.revenueGrowth.yoy = 0.60;
      break;
  }
  
  return baseAnalysis;
}

// Run demonstrations
if (require.main === module) {
  const demo = process.argv[2] || 'content';
  const ticker = process.argv[3] || 'NVDA';
  
  switch (demo) {
    case 'adaptation':
      demonstrateContentAdaptation()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'tones':
      demonstrateNarrativeTones();
      process.exit(0);
      break;
      
    case 'thesis':
      demonstrateThesisGeneration();
      process.exit(0);
      break;
      
    default:
      demonstrateContentGeneration(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

export {
  demonstrateContentGeneration,
  demonstrateContentAdaptation,
  demonstrateNarrativeTones,
  demonstrateThesisGeneration
};