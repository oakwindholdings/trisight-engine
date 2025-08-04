// src/reportGeneration/services/__tests__/enhancedAIService.test.ts
// Unit tests for EnhancedAIService
// Context: Ensures AI content generation produces meaningful analysis

import { EnhancedAIService } from '../enhancedAIService';
import { CompanyData } from '../../models/reportTypes';
import { AnalysisResults } from '../../models/financialMetrics';

describe('EnhancedAIService', () => {
  
  const mockCompanyData: CompanyData = {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple designs and manufactures consumer electronics.',
    financials: {
      keyMetrics: {
        marketCap: 3.45e12,
        peRatio: 32.5,
        pegRatio: 2.8,
        priceToBook: 49.2,
        dividendYield: 0.44,
        roe: 1.719,
        currentRatio: 0.94,
        debtToEquity: 1.959
      },
      incomeStatement: [{
        date: '2025-06-30',
        period: 'quarterly',
        revenue: 94.8e9,
        netIncome: 24.1e9,
        eps: 1.53
      }],
      balanceSheet: [{
        date: '2025-06-30',
        period: 'quarterly',
        totalAssets: 352.8e9,
        totalLiabilities: 290.4e9,
        totalEquity: 62.4e9
      }],
      cashFlow: [{
        date: '2025-06-30',
        period: 'quarterly',
        operatingCashFlow: 28.6e9,
        freeCashFlow: 24.9e9,
        capitalExpenditures: 3.7e9
      }],
      historicalPrices: [{
        date: '2025-08-03',
        open: 225,
        high: 227,
        low: 224,
        close: 226,
        volume: 75000000
      }]
    },
    technicals: {
      sma20: 220,
      sma50: 215,
      sma200: 200,
      rsi: 58,
      macd: { macd: 2.15, signal: 1.89, histogram: 0.26 }
    },
    analysts: {
      consensus: { rating: 'buy', score: 4.2, count: 10 }
    }
  } as any;
  
  const mockAnalysis: AnalysisResults = {
    growth: {
      revenueGrowth: { yoy: 5.2, qoq: 1.3, cagr3: 6.8, cagr5: 7.2, trend: 'stable' },
      earningsGrowth: { yoy: 8.5, qoq: 2.1, cagr3: 9.2, cagr5: 10.1, trend: 'accelerating' },
      fcfGrowth: { yoy: 12.3, qoq: 3.2, cagr3: 11.5, cagr5: 12.8, trend: 'accelerating' },
      bookValueGrowth: { yoy: 3.2, qoq: 0.8, cagr3: 4.1, cagr5: 4.5, trend: 'stable' },
      overall: 0.087
    },
    valuation: {
      intrinsicValue: 245.50,
      fairValue: 238.75,
      marginOfSafety: 0.055,
      valuation: 'fairlyValued',
      confidence: 0.85
    },
    risk: {
      beta: 1.25,
      volatility: 0.285,
      sharpeRatio: 1.42,
      maxDrawdown: 0.183,
      var95: 0.032,
      riskScore: 42
    },
    quality: {
      roic: 28.5,
      fcfYield: 0.072,
      earningsQuality: 85,
      balanceSheetStrength: 72,
      moat: 'wide',
      roe: 1.719
    },
    technicals: {
      trend: 'bullish',
      momentum: 'strong',
      support: 215,
      resistance: 235,
      entry: 228,
      stopLoss: 218,
      signals: []
    },
    composite: {
      overall: 0.78,
      growth: 0.72,
      value: 0.65,
      quality: 0.88,
      momentum: 0.75,
      sentiment: 0.82,
      recommendation: 'buy',
      confidence: 0.85
    }
  };
  
  // Note: EnhancedAIService uses static methods
  
  describe('generateContent', () => {
    it('should generate comprehensive AI content', async () => {
      const result = await EnhancedAIService.generateContent(
        mockCompanyData,
        mockAnalysis
      );
      
      expect(result).toBeDefined();
      expect(result.executiveSummary).toBeDefined();
      expect(result.executiveSummary).toContain('Apple Inc.');
      expect(result.investmentThesis).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.recommendation).toContain('BUY');
      expect(result.keyInsights).toBeDefined();
      expect(result.keyInsights).toBeInstanceOf(Array);
    });
    
    it('should handle missing data gracefully', async () => {
      const incompleteData = { ticker: 'TEST', companyName: 'Test Inc.' } as any;
      const incompleteAnalysis = { composite: { overall: 0.5, recommendation: 'hold' } } as any;
      
      const result = await EnhancedAIService.generateContent(incompleteData, incompleteAnalysis);
      
      expect(result).toBeDefined();
      expect(result.executiveSummary).toBeDefined();
      expect(result.executiveSummary).toContain('Test Inc.');
      expect(result.recommendation).toContain('HOLD');
    });
  });
  
  describe('content generation details', () => {
    it('should generate meaningful executive summary', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      const executiveSummary = result.executiveSummary;
      expect(executiveSummary).toBeDefined();
      expect(executiveSummary).toContain('Apple Inc.');
      expect(executiveSummary).toContain('78/100'); // Composite score
      expect(executiveSummary.toLowerCase()).toContain('buy'); // Recommendation
    });
    
    it('should generate investment thesis with bull/bear cases', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.investmentThesis).toContain('Bull Case');
      expect(result.investmentThesis).toContain('Bear Case');
      expect(result.investmentThesis).toContain('Base Case');
    });
  });
  
  describe('recommendation generation', () => {
    it('should generate clear recommendation with price target', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      const recommendation = result.recommendation;
      expect(recommendation).toBeDefined();
      expect(recommendation).toContain('BUY');
      expect(recommendation).toMatch(/\*\*Price Target:\*\* \$\d+\.\d+/);
      expect(recommendation).toContain('Overall Score: 78/100');
      expect(recommendation).toContain('Confidence: 85%');
    });
    
    it('should include key insights array', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.keyInsights).toBeDefined();
      expect(result.keyInsights).toBeInstanceOf(Array);
      expect(result.keyInsights.length).toBeGreaterThan(0);
      expect(result.keyInsights[0]).toMatch(/revenue|ROE|growth|margin/i);
    });
  });
  
  describe('risk assessment', () => {
    it('should generate comprehensive risk assessment', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      const riskAssessment = result.riskAssessment;
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment).toContain('Key Risk Factors');
      expect(riskAssessment).toContain('Risk Mitigation');
      
      // Should identify financial risk given high debt-to-equity
      expect(riskAssessment).toMatch(/financial risk|debt|leverage/i);
    });
    
    it('should include competitive analysis', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.competitiveAnalysis).toBeDefined();
      expect(result.competitiveAnalysis).toContain('competitive');
      // For AAPL should mention ecosystem
      expect(result.competitiveAnalysis).toMatch(/ecosystem|brand|innovation/i);
    });
  });
  
  describe('specific content validations', () => {
    it('should calculate reasonable price targets', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      const recommendation = result.recommendation;
      const priceTargetMatch = recommendation.match(/\*\*Price Target:\*\* \$(\d+\.\d+)/);
      expect(priceTargetMatch).toBeTruthy();
      
      const priceTarget = parseFloat(priceTargetMatch![1]);
      const currentPrice = 226;
      const upside = ((priceTarget - currentPrice) / currentPrice) * 100;
      
      // BUY recommendation should have positive upside
      expect(upside).toBeGreaterThan(5);
      expect(upside).toBeLessThan(30); // But not unrealistic
    });
    
    it('should generate future outlook with catalysts', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.futureOutlook).toBeDefined();
      expect(result.futureOutlook).toContain('Growth Trajectory');
      expect(result.futureOutlook).toContain('Key Catalysts');
      
      expect(result.catalysts).toBeDefined();
      expect(result.catalysts).toBeInstanceOf(Array);
      expect(result.catalysts.length).toBeGreaterThan(0);
    });
    
    it('should handle SELL recommendations appropriately', async () => {
      const sellAnalysis = {
        ...mockAnalysis,
        composite: {
          ...mockAnalysis.composite,
          overall: 0.25,
          recommendation: 'sell'
        }
      };
      
      const result = await EnhancedAIService.generateContent(mockCompanyData, sellAnalysis);
      
      expect(result.recommendation).toContain('SELL');
      expect(result.recommendation).toContain('Overall Score: 25/100');
      // Price target should show downside
      expect(result.recommendation).toMatch(/downside/);
    });
  });
  
  describe('score calculations', () => {
    it('should not double-multiply scores by 100', async () => {
      const result = await EnhancedAIService.generateContent(
        mockCompanyData,
        mockAnalysis
      );
      
      // Score should be 78, not 7800
      expect(result.executiveSummary).toContain('78/100');
      expect(result.recommendation).toContain('78/100');
      expect(result.executiveSummary).not.toContain('7800');
    });
    
    it('should handle edge case scores correctly', async () => {
      const edgeCaseAnalysis = {
        ...mockAnalysis,
        composite: {
          ...mockAnalysis.composite,
          overall: 1.0, // Maximum score
          recommendation: 'strongBuy'
        }
      };
      
      const result = await EnhancedAIService.generateContent(
        mockCompanyData,
        edgeCaseAnalysis
      );
      
      expect(result.executiveSummary).toContain('100/100');
      expect(result.recommendation).toContain('STRONGBUY');
    });
  });
  
  describe('technical analysis content', () => {
    it('should generate technical commentary', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.technicalCommentary).toBeDefined();
      expect(result.technicalCommentary).toMatch(/RSI|moving average|support|resistance/i);
    });
    
    it('should generate sector analysis', async () => {
      const result = await EnhancedAIService.generateContent(mockCompanyData, mockAnalysis);
      
      expect(result.sectorAnalysis).toBeDefined();
      expect(result.sectorAnalysis).toContain('Technology');
      expect(result.sectorAnalysis).toMatch(/secular growth|innovation|digital transformation/i);
    });
  });
});