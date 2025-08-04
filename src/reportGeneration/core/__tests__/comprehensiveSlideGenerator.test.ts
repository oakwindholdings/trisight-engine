// src/reportGeneration/core/__tests__/comprehensiveSlideGenerator.test.ts
// Unit tests for ComprehensiveSlideGenerator
// Context: Tests slide generation functionality

import { ComprehensiveSlideGenerator } from '../comprehensiveSlideGenerator';
import { CompanyData, ReportConfig } from '../../models/reportTypes';
import { AnalysisResults } from '../../models/financialMetrics';
import { AIGeneratedContent } from '../../services/anthropicAIService';

// Mock logger
jest.mock('../../../utils/logger');

describe('ComprehensiveSlideGenerator', () => {
  const mockCompanyData: CompanyData = {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    financials: {
      marketCap: 3000000000000,
      revenue: 394328000000,
      netIncome: 99803000000,
      totalAssets: 352583000000,
      totalLiabilities: 290020000000,
      currentRatio: 0.99,
      debtToEquity: 1.95,
      roe: 1.479,
      eps: 6.16,
      peRatio: 32.5,
      priceToBook: 48.5,
      dividendYield: 0.0044,
      revenueGrowth: 0.05,
      netIncomeGrowth: 0.03,
      historicalPrices: [
        { date: '2024-01-01', close: 185.5, volume: 45000000 },
        { date: '2024-01-02', close: 187.2, volume: 48000000 },
        { date: '2024-01-03', close: 186.8, volume: 42000000 }
      ]
    }
  };

  const mockAnalysis: AnalysisResults = {
    summary: 'Strong financial performance',
    bullishFactors: ['Market leadership', 'Strong brand'],
    bearishFactors: ['Valuation concerns', 'Competition'],
    technicalIndicators: {
      rsi: 65,
      movingAverage50: 180,
      movingAverage200: 175,
      support: 180,
      resistance: 190
    },
    recommendation: 'BUY',
    targetPrice: 210,
    riskScore: 3
  };

  const mockAIContent: AIGeneratedContent = {
    summary: 'AI-generated executive summary',
    investmentThesis: 'Strong buy based on fundamentals',
    risks: ['Market risk', 'Regulatory risk'],
    competitiveAnalysis: 'Market leader with strong moat',
    futureOutlook: 'Positive growth trajectory expected'
  };

  describe('generateAllSlides', () => {
    it('should generate minimum number of slides', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis
      );

      expect(slides.length).toBeGreaterThanOrEqual(16);
      expect(slides[0].slideNumber).toBe(1);
      expect(slides[slides.length - 1].slideNumber).toBe(slides.length);
    });

    it('should generate comprehensive report with all slides', () => {
      const config: ReportConfig = { reportType: 'comprehensive' };
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis,
        mockAIContent,
        config
      );

      expect(slides.length).toBeGreaterThanOrEqual(19);
      
      // Check for specific slide types
      const slideTypes = slides.map(s => s.type);
      expect(slideTypes).toContain('title');
      expect(slideTypes).toContain('executive_summary');
      expect(slideTypes).toContain('investment_thesis');
      expect(slideTypes).toContain('company_overview');
      expect(slideTypes).toContain('financial_performance');
      expect(slideTypes).toContain('valuation');
      expect(slideTypes).toContain('risk_assessment');
      expect(slideTypes).toContain('disclaimer');
    });

    it('should include AI content when provided', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis,
        mockAIContent
      );

      // Find executive summary slide
      const execSummary = slides.find(s => s.type === 'executive_summary');
      expect(execSummary).toBeDefined();
      expect(execSummary?.content.text).toContain(mockAIContent.summary);

      // Find investment thesis slide
      const thesis = slides.find(s => s.type === 'investment_thesis');
      expect(thesis).toBeDefined();
      expect(thesis?.content.thesis).toContain(mockAIContent.investmentThesis);
    });

    it('should handle missing optional data gracefully', () => {
      const minimalData: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test Company',
        financials: {
          marketCap: 1000000000,
          revenue: 100000000,
          netIncome: 10000000
        }
      };

      const minimalAnalysis: AnalysisResults = {
        summary: 'Basic analysis',
        recommendation: 'HOLD'
      };

      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        minimalData,
        minimalAnalysis
      );

      expect(slides.length).toBeGreaterThanOrEqual(16);
      expect(slides).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'title' })
        ])
      );
    });

    it('should generate segment analysis for detailed reports', () => {
      const dataWithSegments: CompanyData = {
        ...mockCompanyData,
        financials: {
          ...mockCompanyData.financials,
          segments: [
            { name: 'iPhone', revenue: 200000000000, growth: 0.03 },
            { name: 'Services', revenue: 80000000000, growth: 0.15 }
          ]
        }
      };

      const config: ReportConfig = { reportType: 'detailed' };
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        dataWithSegments,
        mockAnalysis,
        undefined,
        config
      );

      const segmentSlide = slides.find(s => s.type === 'segment_analysis');
      expect(segmentSlide).toBeDefined();
    });

    it('should maintain sequential slide numbering', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis
      );

      slides.forEach((slide, index) => {
        expect(slide.slideNumber).toBe(index + 1);
      });
    });

    it('should include charts in appropriate slides', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis
      );

      const chartSlides = slides.filter(s => s.charts && s.charts.length > 0);
      expect(chartSlides.length).toBeGreaterThan(0);

      // Financial performance should have charts
      const financialSlide = slides.find(s => s.type === 'financial_performance');
      expect(financialSlide?.charts).toBeDefined();
      expect(financialSlide?.charts?.length).toBeGreaterThan(0);
    });

    it('should include risk assessment with proper scoring', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis,
        mockAIContent
      );

      const riskSlide = slides.find(s => s.type === 'risk_assessment');
      expect(riskSlide).toBeDefined();
      expect(riskSlide?.content.riskScore).toBe(mockAnalysis.riskScore);
      expect(riskSlide?.content.risks).toContain(mockAIContent.risks[0]);
    });

    it('should generate ESG slide for comprehensive reports', () => {
      const config: ReportConfig = { reportType: 'comprehensive' };
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis,
        undefined,
        config
      );

      const esgSlide = slides.find(s => s.type === 'esg_analysis');
      expect(esgSlide).toBeDefined();
    });

    it('should include disclaimer as last slide', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        mockAnalysis
      );

      const lastSlide = slides[slides.length - 1];
      expect(lastSlide.type).toBe('disclaimer');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined analysis results', () => {
      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        mockCompanyData,
        {} as AnalysisResults
      );

      expect(slides.length).toBeGreaterThanOrEqual(16);
    });

    it('should handle empty financial data', () => {
      const emptyFinancials: CompanyData = {
        ticker: 'EMPTY',
        companyName: 'Empty Corp',
        financials: {}
      };

      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        emptyFinancials,
        mockAnalysis
      );

      expect(slides.length).toBeGreaterThanOrEqual(16);
    });

    it('should handle special characters in company name', () => {
      const specialData: CompanyData = {
        ...mockCompanyData,
        companyName: 'AT&T Inc. (NYSE: T)',
        ticker: 'T'
      };

      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        specialData,
        mockAnalysis
      );

      const titleSlide = slides[0];
      expect(titleSlide.content.title).toContain('AT&T Inc.');
    });

    it('should handle extreme financial values', () => {
      const extremeData: CompanyData = {
        ...mockCompanyData,
        financials: {
          ...mockCompanyData.financials,
          marketCap: Number.MAX_SAFE_INTEGER,
          peRatio: -1000,
          roe: 50,
          revenue: 0
        }
      };

      const slides = ComprehensiveSlideGenerator.generateAllSlides(
        extremeData,
        mockAnalysis
      );

      expect(slides.length).toBeGreaterThanOrEqual(16);
      // Should not throw errors
    });
  });
});