// src/reportGeneration/__tests__/integration/reportGeneration.integration.test.ts
// Integration tests for complete report generation pipeline
// Context: Tests the entire flow from API data to saved report

import { ReportGenerator } from '../../core/reportGenerator';
import { getStorageService } from '../../services/storageService';
import { ReportConfig } from '../../models/reportTypes';
import { TwelveDataAdapter } from '../../adapters/twelveDataAdapter';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
jest.mock('axios');
jest.mock('fs');
jest.mock('../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn()
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock IndexedDB for storage
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn().mockReturnValue({ onsuccess: jest.fn() }),
          get: jest.fn().mockReturnValue({ onsuccess: jest.fn(), result: null }),
          getAll: jest.fn().mockReturnValue({ onsuccess: jest.fn(), result: [] })
        })
      }),
      objectStoreNames: { contains: jest.fn(() => false) },
      createObjectStore: jest.fn()
    }
  })
};

(global as any).indexedDB = mockIndexedDB;

describe('Report Generation Integration Tests', () => {
  let reportConfig: ReportConfig;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default config
    reportConfig = {
      ticker: 'NVDA',
      reportDate: '2024-01-15',
      currentDate: '2024-01-15',
      reportType: 'technical_analysis',
      outputFormat: 'pdf',
      includeCharts: true,
      apiKey: 'test-api-key'
    };

    // Mock file system
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.writeFileSync.mockImplementation(() => {});
    mockedFs.mkdirSync.mockImplementation(() => {});
    
    // Setup comprehensive API mocks
    setupAPIMocks();
  });

  describe('Complete Report Generation Flow', () => {
    it('generates NVDA technical analysis report with real-like data', async () => {
      const generator = new ReportGenerator(reportConfig);
      const report = await generator.generateReport();
      
      // Verify report structure
      expect(report).toMatchObject({
        config: reportConfig,
        companyData: {
          ticker: 'NVDA',
          companyName: 'NVIDIA Corporation',
          sector: 'Technology',
          industry: 'Semiconductors'
        },
        metadata: {
          version: expect.any(String),
          author: expect.any(String),
          confidentialityLevel: expect.any(String)
        }
      });
      
      // Verify slides generated
      expect(report.slides.length).toBeGreaterThan(5);
      
      // Check for required slides
      const slideTypes = report.slides.map(s => s.layout);
      expect(slideTypes).toContain('title');
      expect(slideTypes).toContain('content');
      
      const slideTitles = report.slides.map(s => s.title);
      expect(slideTitles).toContain(expect.stringContaining('Overview'));
      expect(slideTitles).toContain(expect.stringContaining('Financial'));
      expect(slideTitles).toContain(expect.stringContaining('Technical'));
      
      // Verify financial data populated
      expect(report.companyData.financials.keyMetrics.marketCap).toBe(4280267571200);
      expect(report.companyData.financials.incomeStatement[0].revenue).toBe(60922000000);
      
      // Verify technical indicators
      expect(report.companyData.technicals.sma20).toBe(175.50);
      expect(report.companyData.technicals.rsi).toBe(65.5);
    });

    it('handles API failures gracefully', async () => {
      // Make quote API fail
      mockedAxios.get.mockImplementationOnce(() => 
        Promise.reject(new Error('API rate limit exceeded'))
      );
      
      const generator = new ReportGenerator(reportConfig);
      
      await expect(generator.generateReport()).rejects.toThrow();
      
      // Verify error was logged
      const { logError } = require('../../../utils/logger');
      expect(logError).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Failed to fetch data'),
        expect.any(Error)
      );
    });

    it('generates report with charts when enabled', async () => {
      const generator = new ReportGenerator({
        ...reportConfig,
        includeCharts: true
      });
      
      const report = await generator.generateReport();
      
      // Find chart slides
      const chartSlides = report.slides.filter(slide =>
        slide.content.some(content => content.type === 'chart')
      );
      
      expect(chartSlides.length).toBeGreaterThan(0);
      
      // Verify chart data
      const chartContent = chartSlides[0].content.find(c => c.type === 'chart');
      expect(chartContent?.data).toMatchObject({
        type: expect.stringMatching(/candlestick|line|bar/),
        data: expect.any(String), // Base64 data
        dimensions: {
          width: expect.any(Number),
          height: expect.any(Number)
        }
      });
    });

    it('generates report without charts when disabled', async () => {
      const generator = new ReportGenerator({
        ...reportConfig,
        includeCharts: false
      });
      
      const report = await generator.generateReport();
      
      const hasCharts = report.slides.some(slide =>
        slide.content.some(content => content.type === 'chart')
      );
      
      expect(hasCharts).toBe(false);
    });
  });

  describe('Storage Integration', () => {
    it('saves generated report to storage', async () => {
      const generator = new ReportGenerator(reportConfig);
      const report = await generator.generateReport();
      
      const storage = getStorageService();
      const storedReport = await storage.saveReport(report);
      
      expect(storedReport).toMatchObject({
        id: expect.stringMatching(/^report_/),
        ticker: 'NVDA',
        title: expect.stringContaining('NVIDIA'),
        status: 'completed',
        isCompressed: true
      });
      
      // Verify can retrieve
      const mockGet = mockIndexedDB.open().result.transaction().objectStore().get;
      mockGet.mockReturnValueOnce({
        onsuccess: jest.fn(),
        result: storedReport
      });
      
      const retrieved = await storage.getReport(storedReport.id);
      expect(retrieved?.id).toBe(storedReport.id);
    });

    it('lists reports by ticker', async () => {
      // Generate multiple reports
      const generator = new ReportGenerator(reportConfig);
      const report1 = await generator.generateReport();
      
      const generator2 = new ReportGenerator({
        ...reportConfig,
        ticker: 'AAPL'
      });
      
      // Mock different API responses for AAPL
      setupAPIMocks('AAPL');
      const report2 = await generator2.generateReport();
      
      const storage = getStorageService();
      await storage.saveReport(report1);
      await storage.saveReport(report2);
      
      // Mock getAll to return both reports
      const mockGetAll = mockIndexedDB.open().result.transaction().objectStore().getAll;
      mockGetAll.mockReturnValueOnce({
        onsuccess: jest.fn(),
        result: [
          { ticker: 'NVDA', id: 'report_1' },
          { ticker: 'AAPL', id: 'report_2' }
        ]
      });
      
      const nvdaReports = await storage.listReports({ ticker: 'NVDA' });
      expect(nvdaReports).toHaveLength(1);
      expect(nvdaReports[0].ticker).toBe('NVDA');
    });
  });

  describe('Different Report Types', () => {
    it('generates earnings preview report', async () => {
      const generator = new ReportGenerator({
        ...reportConfig,
        reportType: 'earnings_preview'
      });
      
      const report = await generator.generateReport();
      
      // Check for earnings-specific content
      const hasEarningsSlide = report.slides.some(s => 
        s.title.toLowerCase().includes('earnings')
      );
      expect(hasEarningsSlide).toBe(true);
      
      // Verify earnings data is included
      expect(report.companyData.earnings).toBeDefined();
      expect(report.companyData.earnings.nextDate).toBe('2024-02-21');
      expect(report.companyData.earnings.estimates.eps).toBe(1.25);
    });

    it('generates equity research report', async () => {
      const generator = new ReportGenerator({
        ...reportConfig,
        reportType: 'equity_research'
      });
      
      const report = await generator.generateReport();
      
      // Should have more comprehensive analysis
      const analysisSlides = report.slides.filter(s =>
        s.title.toLowerCase().includes('analysis') ||
        s.title.toLowerCase().includes('valuation')
      );
      
      expect(analysisSlides.length).toBeGreaterThan(1);
    });
  });

  describe('Error Recovery', () => {
    it('continues generation when non-critical API fails', async () => {
      // Make news API fail
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/news')) {
          return Promise.reject(new Error('News API down'));
        }
        return setupAPIMocks()[url] || Promise.reject(new Error('Unknown endpoint'));
      });
      
      const generator = new ReportGenerator(reportConfig);
      const report = await generator.generateReport();
      
      // Report should still generate
      expect(report).toBeDefined();
      expect(report.companyData.news).toEqual([]); // Empty news
      expect(report.slides.length).toBeGreaterThan(0);
    });

    it('handles partial financial data', async () => {
      // Make balance sheet API fail
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/balance_sheet')) {
          return Promise.reject(new Error('Balance sheet unavailable'));
        }
        return setupAPIMocks()[url] || Promise.reject(new Error('Unknown endpoint'));
      });
      
      const generator = new ReportGenerator(reportConfig);
      const report = await generator.generateReport();
      
      // Should still have income statement
      expect(report.companyData.financials.incomeStatement).toHaveLength(3);
      expect(report.companyData.financials.balanceSheet).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('completes report generation within reasonable time', async () => {
      const startTime = Date.now();
      
      const generator = new ReportGenerator(reportConfig);
      await generator.generateReport();
      
      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds (generous for tests)
      expect(duration).toBeLessThan(5000);
    });

    it('caches API responses appropriately', async () => {
      const generator1 = new ReportGenerator(reportConfig);
      await generator1.generateReport();
      
      const apiCallCount = mockedAxios.get.mock.calls.length;
      
      // Generate second report for same ticker
      const generator2 = new ReportGenerator(reportConfig);
      await generator2.generateReport();
      
      // Should use some cached data
      const secondCallCount = mockedAxios.get.mock.calls.length;
      expect(secondCallCount).toBeLessThan(apiCallCount * 2);
    });
  });
});

// Helper function to setup comprehensive API mocks
function setupAPIMocks(ticker = 'NVDA') {
  const companyName = ticker === 'NVDA' ? 'NVIDIA Corporation' : 'Apple Inc.';
  const sector = ticker === 'NVDA' ? 'Technology' : 'Technology';
  const industry = ticker === 'NVDA' ? 'Semiconductors' : 'Consumer Electronics';
  
  mockedAxios.get.mockImplementation((url: string) => {
    // Quote endpoint
    if (url.includes('/quote')) {
      return Promise.resolve({
        data: {
          symbol: ticker,
          name: companyName,
          close: ticker === 'NVDA' ? '179.90' : '185.50',
          change: '0.63',
          percent_change: '0.35',
          volume: '12749229',
          timestamp: 1627584000
        }
      });
    }
    
    // Profile endpoint
    if (url.includes('/profile')) {
      return Promise.resolve({
        data: {
          name: companyName,
          description: `${companyName} is a leading technology company...`,
          sector,
          industry,
          website: `https://www.${ticker.toLowerCase()}.com`,
          employees: ticker === 'NVDA' ? 22473 : 161000
        }
      });
    }
    
    // Statistics endpoint
    if (url.includes('/statistics')) {
      return Promise.resolve({
        data: {
          statistics: {
            valuations_metrics: {
              market_capitalization: ticker === 'NVDA' ? 4280267571200 : 3000000000000,
              pe_ratio: ticker === 'NVDA' ? 65.5 : 30.2,
              peg_ratio: 2.1,
              price_to_book_ratio: 25.3,
              dividend_yield: 0.02
            }
          }
        }
      });
    }
    
    // Income statement
    if (url.includes('/income_statement')) {
      return Promise.resolve({
        data: {
          income_statement: [
            {
              fiscal_date: '2024-01-31',
              total_revenue: ticker === 'NVDA' ? 60922000000 : 385603000000,
              gross_profit: 44301000000,
              operating_income: 32925000000,
              net_income: ticker === 'NVDA' ? 29760000000 : 97000000000,
              basic_earnings_per_share: ticker === 'NVDA' ? 1.19 : 6.13
            },
            {
              fiscal_date: '2023-01-31',
              total_revenue: 26974000000,
              net_income: 4368000000
            },
            {
              fiscal_date: '2022-01-31',
              total_revenue: 26914000000,
              net_income: 9752000000
            }
          ]
        }
      });
    }
    
    // Balance sheet
    if (url.includes('/balance_sheet')) {
      return Promise.resolve({
        data: {
          balance_sheet: [{
            fiscal_date: '2024-01-31',
            total_assets: 65728000000,
            total_liabilities: 24755000000,
            total_equity: 40973000000
          }]
        }
      });
    }
    
    // Cash flow
    if (url.includes('/cash_flow')) {
      return Promise.resolve({
        data: {
          cash_flow: [{
            fiscal_date: '2024-01-31',
            operating_cash_flow: 37034000000,
            free_cash_flow: 35703000000
          }]
        }
      });
    }
    
    // Time series for charts
    if (url.includes('/time_series')) {
      const prices = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        prices.push({
          datetime: date.toISOString().split('T')[0],
          open: (175 + Math.random() * 10).toFixed(2),
          high: (180 + Math.random() * 5).toFixed(2),
          low: (170 + Math.random() * 5).toFixed(2),
          close: (175 + Math.random() * 10).toFixed(2),
          volume: Math.floor(10000000 + Math.random() * 5000000).toString()
        });
      }
      
      return Promise.resolve({
        data: {
          meta: { symbol: ticker, interval: '1day' },
          values: prices
        }
      });
    }
    
    // Technical indicators
    if (url.includes('/sma')) {
      const period = url.includes('time_period=20') ? 175.50 :
                     url.includes('time_period=50') ? 170.25 : 165.80;
      return Promise.resolve({
        data: { values: [{ sma: period.toString() }] }
      });
    }
    
    if (url.includes('/rsi')) {
      return Promise.resolve({
        data: { values: [{ rsi: '65.5' }] }
      });
    }
    
    if (url.includes('/macd')) {
      return Promise.resolve({
        data: {
          values: [{
            macd: '2.5',
            macd_signal: '2.1',
            macd_histogram: '0.4'
          }]
        }
      });
    }
    
    // Earnings
    if (url.includes('/earnings')) {
      return Promise.resolve({
        data: {
          earnings: {
            next_report_date: '2024-02-21',
            eps_estimate: 1.25,
            revenue_estimate: 65000000000
          }
        }
      });
    }
    
    // Default error
    return Promise.reject(new Error(`Unknown endpoint: ${url}`));
  });
}