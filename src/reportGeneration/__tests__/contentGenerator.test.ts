// src/reportGeneration/__tests__/contentGenerator.test.ts
// Unit tests for dynamic content generation
// Context: Ensures intelligent narrative creation based on data patterns

import {
  ContentGenerator,
  createContentGenerator,
  ContentStrategy,
  NarrativeTone,
  generateConditionalContent
} from '../templates/contentGenerator';
import { CompanyData } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';

describe('ContentGenerator', () => {
  let generator: ContentGenerator;
  let mockCompanyData: CompanyData;
  let mockAnalysisResults: AnalysisResults;
  
  beforeEach(() => {
    generator = createContentGenerator();
    mockCompanyData = createMockCompanyData();
    mockAnalysisResults = createMockAnalysisResults();
  });
  
  describe('Strategy Determination', () => {
    it('should identify growth story strategy', () => {
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.25;
      mockAnalysisResults.valuation.marginOfSafety = 10;
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.GROWTH_STORY);
    });
    
    it('should identify turnaround strategy', () => {
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.05;
      mockAnalysisResults.profitability.marginTrend = 'expanding';
      mockAnalysisResults.sentiment = {
        overall: 'positive',
        score: 0.3,
        confidence: 0.7,
        temporalAnalysis: { trend: 'improving', momentum: 0.5, volatility: 0.2, changes: [] },
        dimensions: {},
        emotions: {},
        themes: [],
        entities: [],
        keyPhrases: []
      };
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.TURNAROUND);
    });
    
    it('should identify value play strategy', () => {
      mockAnalysisResults.valuation.valuation = 'undervalued';
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.02;
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.VALUE_PLAY);
    });
    
    it('should identify momentum strategy', () => {
      mockAnalysisResults.technicals.trend = 'bullish';
      mockAnalysisResults.sentiment = {
        overall: 'positive',
        score: 0.6,
        confidence: 0.8,
        dimensions: {},
        emotions: {},
        themes: [],
        entities: [],
        keyPhrases: []
      };
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.MOMENTUM);
    });
    
    it('should identify defensive strategy', () => {
      mockAnalysisResults.risk.beta = 0.7;
      mockAnalysisResults.profitability.netMargin = 0.15;
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.DEFENSIVE);
    });
    
    it('should identify speculative strategy', () => {
      mockAnalysisResults.risk.riskScore = 80;
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.50;
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.SPECULATIVE);
    });
    
    it('should identify distressed strategy', () => {
      mockAnalysisResults.risk.financialRisk = 9;
      
      const strategy = generator.determineStrategy(mockAnalysisResults);
      expect(strategy).toBe(ContentStrategy.DISTRESSED);
    });
  });
  
  describe('Tone Determination', () => {
    it('should determine bullish tone for high score low risk', () => {
      mockAnalysisResults.composite.overall = 80;
      mockAnalysisResults.risk.financialRisk = 3;
      mockAnalysisResults.risk.operationalRisk = 4;
      mockAnalysisResults.risk.marketRisk = 3;
      
      const tone = generator.determineTone(mockAnalysisResults);
      expect(tone).toBe(NarrativeTone.BULLISH);
    });
    
    it('should determine neutral tone for moderate score', () => {
      mockAnalysisResults.composite.overall = 60;
      mockAnalysisResults.risk.financialRisk = 5;
      mockAnalysisResults.risk.operationalRisk = 5;
      mockAnalysisResults.risk.marketRisk = 5;
      
      const tone = generator.determineTone(mockAnalysisResults);
      expect(tone).toBe(NarrativeTone.NEUTRAL);
    });
    
    it('should determine cautious tone for low score or high risks', () => {
      mockAnalysisResults.composite.overall = 40;
      mockAnalysisResults.risk.financialRisk = 8;
      mockAnalysisResults.risk.operationalRisk = 7;
      mockAnalysisResults.risk.marketRisk = 6;
      
      const tone = generator.determineTone(mockAnalysisResults);
      expect(tone).toBe(NarrativeTone.CAUTIOUS);
    });
    
    it('should determine bearish tone for very low score', () => {
      mockAnalysisResults.composite.overall = 20;
      mockAnalysisResults.risk.financialRisk = 9;
      mockAnalysisResults.risk.operationalRisk = 8;
      mockAnalysisResults.risk.marketRisk = 9;
      
      const tone = generator.determineTone(mockAnalysisResults);
      expect(tone).toBe(NarrativeTone.BEARISH);
    });
  });
  
  describe('Opening Generation', () => {
    it('should generate growth story opening', () => {
      const strategy = ContentStrategy.GROWTH_STORY;
      const tone = NarrativeTone.BULLISH;
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.30;
      
      const opening = generator.generateOpening(
        mockCompanyData,
        mockAnalysisResults,
        strategy,
        tone
      );
      
      expect(opening).toContain('Test Company');
      expect(opening).toContain('exceptional growth');
      expect(opening).toContain('30% annually');
      expect(opening).toContain('compelling growth story');
    });
    
    it('should adapt opening based on tone', () => {
      const strategy = ContentStrategy.VALUE_PLAY;
      mockAnalysisResults.valuation.marginOfSafety = 25;
      
      const bullishOpening = generator.generateOpening(
        mockCompanyData,
        mockAnalysisResults,
        strategy,
        NarrativeTone.BULLISH
      );
      
      const bearishOpening = generator.generateOpening(
        mockCompanyData,
        mockAnalysisResults,
        strategy,
        NarrativeTone.BEARISH
      );
      
      expect(bullishOpening).toContain('compelling value opportunity');
      expect(bearishOpening).toContain('value trap risk');
    });
    
    it('should handle turnaround narrative', () => {
      const strategy = ContentStrategy.TURNAROUND;
      const tone = NarrativeTone.NEUTRAL;
      mockAnalysisResults.profitability.marginTrend = 'expanding';
      
      const opening = generator.generateOpening(
        mockCompanyData,
        mockAnalysisResults,
        strategy,
        tone
      );
      
      expect(opening).toContain('turnaround efforts show promise');
      expect(opening).toContain('expanding margins');
    });
    
    it('should generate momentum opening', () => {
      const strategy = ContentStrategy.MOMENTUM;
      const tone = NarrativeTone.BULLISH;
      mockAnalysisResults.technicals.trend = 'bullish';
      mockAnalysisResults.composite.momentum = 80;
      
      const opening = generator.generateOpening(
        mockCompanyData,
        mockAnalysisResults,
        strategy,
        tone
      );
      
      expect(opening).toContain('strong momentum');
      expect(opening).toContain('80/100 momentum score');
      expect(opening).toContain('continued outperformance');
    });
  });
  
  describe('Investment Thesis Generation', () => {
    it('should generate growth story thesis points', () => {
      const strategy = ContentStrategy.GROWTH_STORY;
      mockAnalysisResults.growth.revenueGrowth.yoy = 0.25;
      
      const thesis = generator.generateInvestmentThesis(
        mockCompanyData,
        mockAnalysisResults,
        strategy
      );
      
      expect(thesis).toHaveLength(3);
      expect(thesis[0]).toContain('25% significantly exceeds');
      expect(thesis[1]).toContain('Expanding addressable market');
      expect(thesis[2]).toContain('Operating leverage');
    });
    
    it('should add quality-based thesis points', () => {
      const strategy = ContentStrategy.VALUE_PLAY;
      mockAnalysisResults.quality.roic = 0.20;
      
      const thesis = generator.generateInvestmentThesis(
        mockCompanyData,
        mockAnalysisResults,
        strategy
      );
      
      expect(thesis.some(point => point.includes('20% ROIC'))).toBeTruthy();
    });
    
    it('should add sentiment-based thesis points', () => {
      const strategy = ContentStrategy.MOMENTUM;
      mockAnalysisResults.sentiment = {
        overall: 'positive',
        score: 0.7,
        confidence: 0.8,
        dimensions: {},
        emotions: {},
        themes: [],
        entities: [],
        keyPhrases: []
      };
      
      const thesis = generator.generateInvestmentThesis(
        mockCompanyData,
        mockAnalysisResults,
        strategy
      );
      
      expect(thesis.some(point => point.includes('Positive sentiment momentum'))).toBeTruthy();
    });
    
    it('should add pattern-based thesis points', () => {
      const strategy = ContentStrategy.MOMENTUM;
      mockAnalysisResults.technicals.patternAnalysis = {
        patternCount: 5,
        dominantPattern: 'ascending_triangle',
        bullishPatterns: 4,
        bearishPatterns: 1,
        neutralPatterns: 0,
        averageConfidence: 75,
        patternMomentum: 0.8,
        keyPatterns: [],
        patternGroups: []
      };
      
      const thesis = generator.generateInvestmentThesis(
        mockCompanyData,
        mockAnalysisResults,
        strategy
      );
      
      expect(thesis.some(point => point.includes('bullish pattern formations'))).toBeTruthy();
    });
  });
  
  describe('Risk Summary Generation', () => {
    it('should generate comprehensive risk summary', () => {
      mockAnalysisResults.risk.financialRisk = 8;
      mockAnalysisResults.risk.operationalRisk = 7;
      mockAnalysisResults.risk.marketRisk = 9;
      mockAnalysisResults.risk.volatility = 45;
      mockAnalysisResults.risk.riskScore = 85;
      
      const summary = generator.generateRiskSummary(mockAnalysisResults);
      
      expect(summary).toContain('elevated financial leverage');
      expect(summary).toContain('operational execution challenges');
      expect(summary).toContain('high market sensitivity');
      expect(summary).toContain('high volatility of 45%');
      expect(summary).toContain('85/100 suggests high risk');
    });
    
    it('should handle low risk scenarios', () => {
      mockAnalysisResults.risk.financialRisk = 3;
      mockAnalysisResults.risk.operationalRisk = 4;
      mockAnalysisResults.risk.marketRisk = 3;
      mockAnalysisResults.risk.volatility = 15;
      mockAnalysisResults.risk.riskScore = 25;
      
      const summary = generator.generateRiskSummary(mockAnalysisResults);
      
      expect(summary).toContain('25/100 suggests lower risk');
      expect(summary).toContain('suitable for conservative investors');
    });
    
    it('should identify earnings quality risks', () => {
      mockAnalysisResults.quality.earningsQuality = 3;
      mockAnalysisResults.risk.riskScore = 50;
      
      const summary = generator.generateRiskSummary(mockAnalysisResults);
      
      expect(summary).toContain('questionable earnings quality');
    });
  });
  
  describe('Catalyst Generation', () => {
    it('should identify earnings catalysts', () => {
      mockAnalysisResults.growth.earningsGrowth.yoy = 0.20;
      
      const catalysts = generator.generateCatalystDescription(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(catalysts.some(c => c.includes('earnings momentum'))).toBeTruthy();
    });
    
    it('should identify innovation catalysts', () => {
      mockAnalysisResults.sentiment = {
        overall: 'positive',
        score: 0.5,
        confidence: 0.7,
        themes: [
          { name: 'innovation', mentions: 5, relevance: 0.8, sentiment: 0.7 }
        ],
        dimensions: {},
        emotions: {},
        entities: [],
        keyPhrases: []
      };
      
      const catalysts = generator.generateCatalystDescription(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(catalysts.some(c => c.includes('New product launches'))).toBeTruthy();
    });
    
    it('should identify technical catalysts', () => {
      mockAnalysisResults.technicals.patternAnalysis = {
        patternCount: 3,
        dominantPattern: 'breakout',
        bullishPatterns: 3,
        bearishPatterns: 0,
        neutralPatterns: 0,
        averageConfidence: 80,
        patternMomentum: 0.9,
        keyPatterns: [],
        patternGroups: []
      };
      
      const catalysts = generator.generateCatalystDescription(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(catalysts.some(c => c.includes('Technical breakout'))).toBeTruthy();
    });
    
    it('should provide default catalysts when none specific found', () => {
      // Reset all potential catalyst indicators
      mockAnalysisResults.growth.earningsGrowth.yoy = 0.05;
      mockAnalysisResults.sentiment = undefined;
      mockAnalysisResults.technicals.patternAnalysis = undefined;
      
      const catalysts = generator.generateCatalystDescription(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(catalysts).toHaveLength(2);
      expect(catalysts[0]).toBe('Earnings growth continuation');
      expect(catalysts[1]).toBe('Market share expansion');
    });
  });
  
  describe('Timeline Generation', () => {
    it('should generate comprehensive timeline', () => {
      mockAnalysisResults.technicals.patternAnalysis = {
        patternCount: 1,
        dominantPattern: 'ascending_triangle',
        bullishPatterns: 1,
        bearishPatterns: 0,
        neutralPatterns: 0,
        averageConfidence: 85,
        patternMomentum: 0.8,
        keyPatterns: [{
          type: 'ascending_triangle',
          direction: 'bullish',
          confidence: 85,
          targetPrice: 150,
          stopLoss: 120,
          probability: 0.7
        }],
        patternGroups: []
      };
      
      const timeline = generator.generateTimeline(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(timeline.length).toBeGreaterThan(3);
      
      // Check for earnings event
      const earningsEvent = timeline.find(t => t.event.includes('Earnings'));
      expect(earningsEvent).toBeDefined();
      expect(earningsEvent!.timeframe).toBe('Next Quarter');
      
      // Check for pattern event
      const patternEvent = timeline.find(t => t.event.includes('pattern'));
      expect(patternEvent).toBeDefined();
      expect(patternEvent!.impact).toContain('$150');
    });
    
    it('should include margin improvement timeline', () => {
      mockAnalysisResults.profitability.marginTrend = 'expanding';
      
      const timeline = generator.generateTimeline(
        mockCompanyData,
        mockAnalysisResults
      );
      
      const marginEvent = timeline.find(t => t.event.includes('Margin'));
      expect(marginEvent).toBeDefined();
      expect(marginEvent!.impact).toBe('Earnings acceleration');
    });
    
    it('should include valuation normalization timeline', () => {
      mockAnalysisResults.valuation.valuation = 'undervalued';
      mockAnalysisResults.valuation.marginOfSafety = 30;
      
      const timeline = generator.generateTimeline(
        mockCompanyData,
        mockAnalysisResults
      );
      
      const valuationEvent = timeline.find(t => t.event.includes('Valuation'));
      expect(valuationEvent).toBeDefined();
      expect(valuationEvent!.impact).toContain('30% upside');
    });
  });
  
  describe('Conditional Content Generation', () => {
    it('should generate content when condition is true', () => {
      const data = { score: 80 };
      const result = generateConditionalContent(
        'score > 70',
        data,
        'High score content',
        'Low score content'
      );
      
      expect(result).toBe('High score content');
    });
    
    it('should generate alternative content when condition is false', () => {
      const data = { score: 60 };
      const result = generateConditionalContent(
        'score > 70',
        data,
        'High score content',
        'Low score content'
      );
      
      expect(result).toBe('Low score content');
    });
    
    it('should return empty string when condition is false and no alternative', () => {
      const data = { score: 60 };
      const result = generateConditionalContent(
        'score > 70',
        data,
        'High score content'
      );
      
      expect(result).toBe('');
    });
    
    it('should handle nested properties', () => {
      const data = { 
        analysis: { 
          growth: { 
            revenue: 0.15 
          } 
        } 
      };
      
      const result = generateConditionalContent(
        'analysis.growth.revenue > 0.10',
        data,
        'Strong growth'
      );
      
      expect(result).toBe('Strong growth');
    });
    
    it('should handle different operators', () => {
      const data = { value: 50 };
      
      expect(generateConditionalContent('value >= 50', data, 'Pass')).toBe('Pass');
      expect(generateConditionalContent('value <= 50', data, 'Pass')).toBe('Pass');
      expect(generateConditionalContent('value == 50', data, 'Pass')).toBe('Pass');
      expect(generateConditionalContent('value != 60', data, 'Pass')).toBe('Pass');
    });
  });
});

// Helper function to create mock company data
function createMockCompanyData(): CompanyData {
  return {
    ticker: 'TEST',
    companyName: 'Test Company',
    description: 'A test company for unit tests',
    sector: 'Technology',
    industry: 'Software',
    financials: {
      incomeStatement: [],
      balanceSheet: [],
      cashFlow: [],
      keyMetrics: {
        marketCap: 10000000000,
        peRatio: 20,
        pegRatio: 1.5,
        priceToBook: 3,
        dividendYield: 0.02,
        roe: 15,
        currentRatio: 2,
        debtToEquity: 0.5
      },
      historicalPrices: []
    },
    news: [],
    transcripts: [],
    technicals: {
      sma20: 50,
      sma50: 50,
      sma200: 50,
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      volume: { current: 1000000, average10Day: 1000000, average30Day: 1000000, trend: 'stable' },
      patterns: []
    },
    analysts: {
      consensus: { rating: 'buy', score: 4, count: 10 },
      priceTargets: [],
      recommendations: [],
      revisions: []
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      sources: {},
      completeness: 90
    }
  };
}

// Helper function to create mock analysis results
function createMockAnalysisResults(): AnalysisResults {
  return {
    growth: {
      revenueGrowth: { yoy: 0.15, qoq: 0.05, trend: 'accelerating', cagr3: 0.12, cagr5: 0.10 },
      earningsGrowth: { yoy: 0.20, qoq: 0.08, trend: 'accelerating', cagr3: 0.15, cagr5: 0.12 },
      fcfGrowth: { yoy: 0.10, qoq: 0.03, trend: 'stable', cagr3: 0.08, cagr5: 0.07 },
      compositeScore: 75
    },
    profitability: {
      grossMargin: 0.35,
      operatingMargin: 0.20,
      netMargin: 0.12,
      fcfMargin: 0.10,
      marginTrend: 'stable',
      roe: 0.15,
      roa: 0.08,
      roic: 0.12
    },
    valuation: {
      intrinsicValue: 60,
      marginOfSafety: 20,
      valuation: 'undervalued'
    },
    risk: {
      volatility: 25,
      beta: 1.2,
      maxDrawdown: 15,
      sharpeRatio: 1.5,
      riskScore: 40,
      financialRisk: 4,
      operationalRisk: 5,
      marketRisk: 5
    },
    quality: {
      roe: 0.15,
      roa: 0.08,
      roic: 0.12,
      earningsQuality: 8,
      balanceSheetStrength: 7,
      moat: 'wide',
      qualityScore: 85
    },
    technicals: {
      trend: 'bullish',
      support: 45,
      resistance: 55,
      rsi: 55,
      signals: [],
      patternAnalysis: undefined
    },
    composite: {
      overall: 75,
      growth: 75,
      value: 80,
      quality: 85,
      momentum: 60,
      sentiment: 70,
      confidence: 80,
      recommendation: 'buy'
    }
  };
}