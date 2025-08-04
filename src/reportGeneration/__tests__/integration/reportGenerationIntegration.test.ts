// src/reportGeneration/__tests__/integration/reportGenerationIntegration.test.ts
// Integration tests for complete report generation flow
// Context: Ensures all components work together to produce valid reports

import { ReportGenerator, createReportGenerator } from '../../core/reportGenerator';
import { ReportConfig, GeneratedReport } from '../../models/reportTypes';
import { DataProcessor } from '../../core/dataProcessor';
import { ReportAssembler } from '../../core/reportAssembler';
import { EnhancedTwelveDataAdapter } from '../../adapters/enhancedTwelveDataAdapter';
import { EnhancedAIService } from '../../services/enhancedAIService';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

// Mock file system operations for PDF generation
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock pdf content'))
}));

// Mock PDF generation
jest.mock('../../engines/pdfEngine', () => ({
  PDFEngine: class {
    async generatePDF() {
      return {
        outputPath: 'generated-reports/TEST_report_2025-08-03.pdf',
        fileSize: 50000
      };
    }
  }
}));

// Mock PPTX generation
jest.mock('../../engines/pptxEngine', () => ({
  PPTXEngine: class {
    async generatePPTX() {
      return {
        outputPath: 'generated-reports/TEST_report_2025-08-03.pptx',
        fileSize: 100000
      };
    }
  }
}));

describe('Report Generation Integration Tests', () => {
  let reportGenerator: ReportGenerator;
  
  const validConfig: ReportConfig = {
    ticker: 'AAPL',
    reportType: 'comprehensive',
    outputFormat: 'pdf',
    includeCharts: true,
    reportDate: '2025-08-03',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        type: 'text',
        order: 1,
        required: true,
        dataRequirements: []
      }
    ]
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createReportGenerator factory', () => {
    it('should create report generator with valid config', () => {
      const generator = createReportGenerator(validConfig);
      expect(generator).toBeInstanceOf(ReportGenerator);
    });
    
    it('should throw error for invalid config', () => {
      expect(() => createReportGenerator({} as any)).toThrow('Invalid report configuration');
      expect(() => createReportGenerator({ ticker: 'AAPL' } as any)).toThrow('Invalid report configuration');
    });
  });
  
  describe('Report Generation Flow', () => {
    beforeEach(() => {
      reportGenerator = new ReportGenerator(validConfig);
    });
    
    it('should generate complete report successfully', async () => {
      const report = await reportGenerator.generateReport();
      
      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.companyData).toBeDefined();
      expect(report.companyData.ticker).toBe('AAPL');
      expect(report.slides).toBeDefined();
      expect(report.slides.length).toBeGreaterThanOrEqual(15); // Comprehensive report
      expect(report.outputPath).toContain('.pdf');
    });
    
    it('should handle data fetching errors gracefully', async () => {
      // Mock data fetcher to throw error
      const mockError = new Error('API rate limit exceeded');
      jest.spyOn(reportGenerator['dataFetcher'], 'fetchAll').mockRejectedValueOnce(mockError);
      
      const report = await reportGenerator.generateReport();
      
      // Should return error report instead of throwing
      expect(report).toBeDefined();
      expect(report.slides.length).toBe(1); // Error slide
      expect(report.slides[0].title).toContain('Error');
    });
    
    it('should validate data before processing', async () => {
      // Mock invalid data
      jest.spyOn(reportGenerator['dataFetcher'], 'fetchAll').mockResolvedValueOnce({
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        financials: {
          keyMetrics: {
            peRatio: -5, // Invalid negative P/E
            roe: 15 // Invalid percentage instead of decimal
          }
        }
      } as any);
      
      const report = await reportGenerator.generateReport();
      
      // Should handle validation error
      expect(report).toBeDefined();
      expect(report.metadata?.errors).toBeDefined();
      expect(report.metadata.errors.length).toBeGreaterThan(0);
    });
    
    it('should use fallback content when AI service fails', async () => {
      // Mock AI service failure
      jest.spyOn(reportGenerator['aiSummarizer'], 'generateExecutiveSummary')
        .mockRejectedValueOnce(new Error('AI service unavailable'));
      
      const report = await reportGenerator.generateReport();
      
      // Should still generate report with fallback content
      expect(report).toBeDefined();
      expect(report.companyData.metadata?.aiContent).toBeDefined();
      expect(report.companyData.metadata.aiContent.aiProvider).toBe('fallback');
      expect(report.slides.length).toBeGreaterThan(10);
    });
  });
  
  describe('Data Processing Integration', () => {
    let dataProcessor: DataProcessor;
    
    beforeEach(() => {
      dataProcessor = new DataProcessor();
    });
    
    it('should process company data without NaN values', async () => {
      const mockData = {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        financials: {
          keyMetrics: {
            peRatio: 32.5,
            roe: 1.719,
            debtToEquity: 1.959,
            currentRatio: 0.94,
            marketCap: 3.45e12
          },
          incomeStatement: [
            { date: '2025-06-30', revenue: 94.8e9, netIncome: 24.1e9 },
            { date: '2025-03-31', revenue: 90.1e9, netIncome: 23.6e9 }
          ],
          balanceSheet: [
            { date: '2025-06-30', totalAssets: 352.8e9, totalLiabilities: 290.4e9 }
          ],
          cashFlow: [
            { date: '2025-06-30', operatingCashFlow: 28.6e9, capitalExpenditures: 3.7e9 }
          ],
          historicalPrices: Array(252).fill(null).map((_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            close: 225 + Math.random() * 10,
            high: 230,
            low: 220,
            open: 225,
            volume: 75000000
          }))
        },
        technicals: {
          sma20: 220,
          sma50: 215,
          sma200: 200,
          rsi: 58,
          macd: { macd: 2.15, signal: 1.89, histogram: 0.26 }
        }
      } as any;
      
      const analysis = await dataProcessor.process(mockData);
      
      // Check no NaN values in growth metrics
      expect(analysis.growth.revenueGrowth.yoy).not.toBeNaN();
      expect(analysis.growth.earningsGrowth.yoy).not.toBeNaN();
      expect(analysis.growth.overall).not.toBeNaN();
      
      // Check composite scores are normalized (0-1)
      expect(analysis.composite.overall).toBeGreaterThanOrEqual(0);
      expect(analysis.composite.overall).toBeLessThanOrEqual(1);
      expect(analysis.composite.growth).toBeGreaterThanOrEqual(0);
      expect(analysis.composite.growth).toBeLessThanOrEqual(1);
    });
    
    it('should calculate correct recommendation based on score', async () => {
      const mockData = {
        ticker: 'AAPL',
        financials: {
          keyMetrics: { peRatio: 32.5, roe: 1.719, debtToEquity: 1.959, currentRatio: 0.94, marketCap: 3.45e12 },
          incomeStatement: [{ date: '2025-06-30', revenue: 94.8e9, netIncome: 24.1e9 }],
          balanceSheet: [{ date: '2025-06-30', totalAssets: 352.8e9, totalLiabilities: 290.4e9 }],
          cashFlow: [{ date: '2025-06-30', operatingCashFlow: 28.6e9, capitalExpenditures: 3.7e9 }],
          historicalPrices: [{ date: '2025-08-03', close: 226, high: 227, low: 224, open: 225, volume: 75000000 }]
        },
        technicals: { sma20: 220, sma50: 215, sma200: 200, rsi: 58 }
      } as any;
      
      const analysis = await dataProcessor.process(mockData);
      
      // Score around 0.78 should be BUY, not SELL
      expect(analysis.composite.recommendation).not.toBe('sell');
      expect(analysis.composite.recommendation).toMatch(/buy|hold/i);
    });
  });
  
  describe('Report Assembly Integration', () => {
    let reportAssembler: ReportAssembler;
    
    beforeEach(() => {
      reportAssembler = new ReportAssembler();
    });
    
    it('should generate comprehensive slides (15-20)', async () => {
      const mockData = {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        financials: {
          keyMetrics: { peRatio: 32.5, roe: 1.719 },
          incomeStatement: [{ date: '2025-06-30', revenue: 94.8e9 }],
          historicalPrices: [{ date: '2025-08-03', close: 226 }]
        },
        metadata: {
          aiContent: {
            executiveSummary: 'Apple shows strong performance...',
            investmentThesis: 'Leading position in premium devices...',
            keyInsights: ['Strong brand', 'High margins'],
            riskAnalysis: 'Moderate risk due to market concentration...'
          }
        }
      } as any;
      
      const mockAnalysis = {
        composite: { overall: 0.78, recommendation: 'buy' },
        growth: { revenueGrowth: { yoy: 5.2 } },
        valuation: { fairValue: 238.75 },
        quality: { roe: 1.719, moat: 'wide' },
        risk: { riskScore: 42 }
      } as any;
      
      const report = await reportAssembler.assemble(
        validConfig,
        mockData,
        mockAnalysis,
        mockData.metadata.aiContent
      );
      
      expect(report.slides).toBeDefined();
      expect(report.slides.length).toBeGreaterThanOrEqual(15);
      expect(report.slides.length).toBeLessThanOrEqual(25);
      
      // Check slide variety
      const slideLayouts = report.slides.map(s => s.layout);
      expect(slideLayouts).toContain('title');
      expect(slideLayouts).toContain('content');
      expect(slideLayouts).toContain('chart');
      expect(slideLayouts).toContain('comparison');
    });
    
    it('should handle PDF generation', async () => {
      const pdfConfig = { ...validConfig, outputFormat: 'pdf' as const };
      const mockData = { ticker: 'AAPL', companyName: 'Apple Inc.' } as any;
      const mockAnalysis = { composite: { overall: 0.78 } } as any;
      
      const report = await reportAssembler.assemble(pdfConfig, mockData, mockAnalysis);
      
      expect(report.outputPath).toContain('.pdf');
      expect(report.fileSize).toBeGreaterThan(0);
    });
    
    it('should handle PPTX generation', async () => {
      const pptxConfig = { ...validConfig, outputFormat: 'pptx' as const };
      const mockData = { ticker: 'AAPL', companyName: 'Apple Inc.' } as any;
      const mockAnalysis = { composite: { overall: 0.78 } } as any;
      
      const report = await reportAssembler.assemble(pptxConfig, mockData, mockAnalysis);
      
      expect(report.outputPath).toContain('.pptx');
      expect(report.fileSize).toBeGreaterThan(0);
    });
  });
  
  describe('End-to-End Scenarios', () => {
    it('should generate complete AAPL report with all sections', async () => {
      const config: ReportConfig = {
        ticker: 'AAPL',
        reportType: 'comprehensive',
        outputFormat: 'pdf',
        includeCharts: true,
        includeProjections: true,
        reportDate: '2025-08-03',
        companyName: 'Apple Inc.'
      };
      
      const generator = createReportGenerator(config);
      const report = await generator.generateReport();
      
      // Verify report completeness
      expect(report.companyData.ticker).toBe('AAPL');
      expect(report.companyData.companyName).toBe('Apple Inc.');
      expect(report.slides.length).toBeGreaterThanOrEqual(15);
      
      // Check for key sections
      const slideTitles = report.slides.map(s => s.title);
      expect(slideTitles).toContain(expect.stringContaining('Executive Summary'));
      expect(slideTitles).toContain(expect.stringContaining('Financial'));
      expect(slideTitles).toContain(expect.stringContaining('Valuation'));
      expect(slideTitles).toContain(expect.stringContaining('Risk'));
      expect(slideTitles).toContain(expect.stringContaining('Recommendation'));
      
      // Check metadata
      expect(report.metadata?.dataFreshness).toBeDefined();
      expect(report.metadata?.analysisResults).toBeDefined();
    });
    
    it('should handle cancellation gracefully', async () => {
      const generator = createReportGenerator(validConfig);
      
      // Start generation
      const reportPromise = generator.generateReport();
      
      // Cancel immediately
      generator.cancel();
      
      // Should complete with cancelled status
      const report = await reportPromise;
      expect(report).toBeDefined();
      
      const status = generator.getStatus();
      expect(status.stage).toBe('error');
      expect(status.currentTask).toContain('cancelled');
    });
    
    it('should track progress throughout generation', async () => {
      const generator = createReportGenerator(validConfig);
      const progressUpdates: any[] = [];
      
      // Listen for progress updates
      if (typeof window !== 'undefined') {
        window.addEventListener('reportGenerationStatus', (event: any) => {
          progressUpdates.push(event.detail);
        });
      }
      
      await generator.generateReport();
      
      // Should have progress updates for each phase
      const status = generator.getStatus();
      expect(status.progress).toBeGreaterThan(0);
    });
  });
});