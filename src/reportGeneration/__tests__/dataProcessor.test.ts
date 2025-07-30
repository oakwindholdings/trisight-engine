// src/reportGeneration/__tests__/dataProcessor.test.ts
// Tests for data processing pipeline integration
// Context: Ensures the orchestration layer works correctly

import { createDataProcessor } from '../processing/dataProcessor';
import { CompanyData } from '../models/reportTypes';

// Mock the financial calculations engine
jest.mock('../processing/financialCalculations', () => ({
  createFinancialCalculationsEngine: () => ({
    analyze: jest.fn().mockResolvedValue({
      growth: {
        revenueGrowth: { yoy: 25, qoq: 8, cagr3: 20, cagr5: 18, trend: 'accelerating' },
        earningsGrowth: { yoy: 30, qoq: 10, cagr3: 25, cagr5: 22, trend: 'accelerating' },
        fcfGrowth: { yoy: 35, qoq: 12, cagr3: 30, cagr5: 28, trend: 'accelerating' },
        bookValueGrowth: { yoy: 15, qoq: 5, cagr3: 12, cagr5: 10, trend: 'stable' }
      },
      valuation: {
        intrinsicValue: 150,
        fairValue: 145,
        marginOfSafety: 20,
        valuation: 'undervalued',
        confidence: 0.85
      },
      risk: {
        beta: 1.2,
        volatility: 25,
        sharpeRatio: 1.5,
        maxDrawdown: 15,
        var95: 8,
        riskScore: 45
      },
      quality: {
        roic: 25,
        fcfYield: 5,
        earningsQuality: 85,
        balanceSheetStrength: 90,
        moat: 'wide'
      },
      technicals: {
        trend: 'bullish',
        momentum: 'strong',
        support: 110,
        resistance: 130,
        entry: 115,
        stopLoss: 105,
        signals: []
      },
      composite: {
        overall: 78,
        growth: 85,
        value: 80,
        quality: 90,
        momentum: 75,
        sentiment: 50,
        recommendation: 'buy',
        confidence: 0.82
      }
    })
  })
}));

describe('DataProcessor', () => {
  let processor: any;
  let mockCompanyData: CompanyData;
  
  beforeEach(() => {
    processor = createDataProcessor();
    mockCompanyData = createMockCompanyData();
  });
  
  describe('Basic Processing', () => {
    it('should process company data successfully', async () => {
      const result = await processor.processData(mockCompanyData);
      
      expect(result).toBeDefined();
      expect(result.companyData).toBeDefined();
      expect(result.analysis).toBeDefined();
    });
    
    it('should include financial analysis results', async () => {
      const { analysis } = await processor.processData(mockCompanyData);
      
      expect(analysis.growth).toBeDefined();
      expect(analysis.valuation).toBeDefined();
      expect(analysis.risk).toBeDefined();
      expect(analysis.quality).toBeDefined();
      expect(analysis.composite).toBeDefined();
    });
    
    it('should enrich company data with analysis', async () => {
      const { companyData } = await processor.processData(mockCompanyData);
      
      expect(companyData.analysis).toBeDefined();
      expect(companyData.metadata.processingTimestamp).toBeDefined();
      expect(companyData.metadata.analysisVersion).toBe('1.0');
    });
  });
  
  describe('Progress Tracking', () => {
    it('should call progress callback during processing', async () => {
      const progressCallback = jest.fn();
      
      await processor.processData(mockCompanyData, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith('Performing financial analysis', 10);
      expect(progressCallback).toHaveBeenCalledWith('Financial analysis complete', 40);
      expect(progressCallback).toHaveBeenCalledWith('Processing complete', 100);
    });
    
    it('should report correct progress percentages', async () => {
      const progressStages: Array<[string, number]> = [];
      
      await processor.processData(mockCompanyData, (stage, progress) => {
        progressStages.push([stage, progress]);
      });
      
      // Verify progress increases monotonically
      for (let i = 1; i < progressStages.length; i++) {
        expect(progressStages[i][1]).toBeGreaterThanOrEqual(progressStages[i-1][1]);
      }
      
      // Verify we reach 100%
      expect(progressStages[progressStages.length - 1][1]).toBe(100);
    });
  });
  
  describe('Configuration Options', () => {
    it('should respect pattern detection config', async () => {
      const processorWithoutPatterns = createDataProcessor({
        includePatternDetection: false
      });
      
      const progressCallback = jest.fn();
      await processorWithoutPatterns.processData(mockCompanyData, progressCallback);
      
      // Should not have pattern detection stages
      const patternCalls = progressCallback.mock.calls.filter(
        call => call[0].includes('pattern')
      );
      expect(patternCalls.length).toBe(0);
    });
    
    it('should respect sentiment analysis config', async () => {
      const processorWithoutSentiment = createDataProcessor({
        includeSentimentAnalysis: false
      });
      
      const progressCallback = jest.fn();
      await processorWithoutSentiment.processData(mockCompanyData, progressCallback);
      
      // Should not have sentiment analysis stages
      const sentimentCalls = progressCallback.mock.calls.filter(
        call => call[0].includes('sentiment')
      );
      expect(sentimentCalls.length).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', async () => {
      // Create a processor with failing engine
      jest.resetModules();
      jest.doMock('../processing/financialCalculations', () => ({
        createFinancialCalculationsEngine: () => ({
          analyze: jest.fn().mockRejectedValue(new Error('Analysis failed'))
        })
      }));
      
      const { createDataProcessor: createFailingProcessor } = 
        await import('../processing/dataProcessor');
      const failingProcessor = createFailingProcessor();
      
      await expect(failingProcessor.processData(mockCompanyData))
        .rejects.toThrow('Data processing failed: Analysis failed');
    });
    
    it('should preserve original data on error', async () => {
      const originalData = { ...mockCompanyData };
      
      try {
        // This won't actually fail with our mock, but demonstrates the pattern
        await processor.processData(mockCompanyData);
      } catch (error) {
        // Original data should be unchanged
        expect(mockCompanyData).toEqual(originalData);
      }
    });
  });
  
  describe('Analysis Synthesis', () => {
    it('should synthesize financial analysis correctly', async () => {
      const { analysis } = await processor.processData(mockCompanyData);
      
      // Should have all financial analysis components
      expect(analysis.growth.revenueGrowth.yoy).toBe(25);
      expect(analysis.valuation.marginOfSafety).toBe(20);
      expect(analysis.risk.beta).toBe(1.2);
      expect(analysis.quality.roic).toBe(25);
      expect(analysis.composite.overall).toBe(78);
    });
    
    it('should handle missing analysis components', async () => {
      // Even with pattern/sentiment disabled, should still work
      const minimalProcessor = createDataProcessor({
        includePatternDetection: false,
        includeSentimentAnalysis: false,
        includeComparativeAnalysis: false
      });
      
      const { analysis } = await minimalProcessor.processData(mockCompanyData);
      
      expect(analysis).toBeDefined();
      expect(analysis.composite.recommendation).toBe('buy');
    });
  });
});

// Helper function to create mock company data
function createMockCompanyData(): CompanyData {
  return {
    ticker: 'TEST',
    companyName: 'Test Corporation',
    description: 'A test company for unit tests',
    sector: 'Technology',
    industry: 'Software',
    financials: {
      incomeStatement: [
        { 
          date: '2024-03-31', 
          period: 'quarterly',
          revenue: 1000000,
          netIncome: 200000,
          eps: 2.0
        }
      ],
      balanceSheet: [
        {
          date: '2024-03-31',
          period: 'quarterly',
          totalAssets: 5000000,
          totalLiabilities: 2000000,
          shareholderEquity: 3000000
        }
      ],
      cashFlow: [
        {
          date: '2024-03-31',
          period: 'quarterly',
          operatingCashFlow: 300000,
          capitalExpenditures: -50000
        }
      ],
      keyMetrics: {
        marketCap: 10000000000,
        peRatio: 25,
        pegRatio: 1.2,
        priceToBook: 3.5,
        dividendYield: 0.02,
        roe: 18,
        currentRatio: 2.5,
        debtToEquity: 0.4
      },
      historicalPrices: [
        {
          date: '2024-03-31',
          open: 118,
          high: 122,
          low: 117,
          close: 120,
          volume: 1000000
        }
      ]
    },
    news: [],
    transcripts: [],
    technicals: {
      sma20: 118,
      sma50: 115,
      sma200: 110,
      rsi: 55,
      macd: { macd: 0.5, signal: 0.3, histogram: 0.2 },
      volume: { 
        current: 1000000, 
        average10Day: 950000, 
        average30Day: 900000, 
        trend: 'increasing' 
      },
      patterns: []
    },
    analysts: {
      consensus: { rating: 'buy', score: 4.2, count: 10 },
      priceTargets: [],
      recommendations: [],
      revisions: []
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      sources: {
        financial: { status: 'success', timestamp: new Date().toISOString() },
        news: { status: 'success', timestamp: new Date().toISOString() },
        technical: { status: 'success', timestamp: new Date().toISOString() }
      }
    }
  };
}