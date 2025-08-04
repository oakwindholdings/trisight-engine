// src/reportGeneration/__tests__/unit/reportAssembler.test.ts
// Unit tests for ReportAssembler
// Context: Tests report assembly, slide generation, and chart preparation

import { ReportAssembler } from '../../core/reportAssembler';
import { ReportConfig, CompanyData, AnalysisResults } from '../../models/reportTypes';
import { NodeCanvasChartGenerator } from '../../utils/nodeCanvasChartGenerator';

// Mock chart generator
jest.mock('../../utils/nodeCanvasChartGenerator');
const MockedChartGenerator = NodeCanvasChartGenerator as jest.MockedClass<typeof NodeCanvasChartGenerator>;

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn()
}));

describe('ReportAssembler', () => {
  let assembler: ReportAssembler;
  let mockConfig: ReportConfig;
  let mockCompanyData: CompanyData;
  let mockAnalysis: AnalysisResults;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      ticker: 'NVDA',
      reportDate: '2024-01-15',
      currentDate: '2024-01-15',
      reportType: 'technical_analysis',
      outputFormat: 'pdf',
      includeCharts: true
    };

    mockCompanyData = {
      ticker: 'NVDA',
      companyName: 'NVIDIA Corporation',
      description: 'NVIDIA Corporation provides graphics processing units...',
      sector: 'Technology',
      industry: 'Semiconductors',
      financials: {
        incomeStatement: [{
          date: '2024-01-31',
          revenue: 60922000000,
          netIncome: 29760000000,
          eps: 1.19
        }],
        balanceSheet: [{
          date: '2024-01-31',
          totalAssets: 65728000000,
          totalLiabilities: 24755000000,
          shareholderEquity: 40973000000
        }],
        cashFlow: [{
          date: '2024-01-31',
          operatingCashFlow: 37034000000,
          freeCashFlow: 35703000000
        }],
        keyMetrics: {
          marketCap: 4280267571200,
          peRatio: 65.5,
          pegRatio: 2.1,
          priceToBook: 25.3,
          dividendYield: 0.02,
          roe: 0.73,
          currentRatio: 4.17,
          debtToEquity: 0.60
        },
        historicalPrices: [
          { date: '2024-01-15', open: 175.5, high: 180.25, low: 174.8, close: 179.9, volume: 15000000 },
          { date: '2024-01-14', open: 173.2, high: 176.4, low: 172.5, close: 175.5, volume: 12000000 }
        ]
      },
      news: [],
      transcripts: [],
      technicals: {
        sma20: 175.5,
        sma50: 170.25,
        sma200: 165.8,
        rsi: 65.5,
        macd: { macd: 2.5, signal: 2.1, histogram: 0.4 },
        volume: { current: 15000000, average10Day: 13000000, average30Day: 14000000, trend: 'increasing' },
        patterns: []
      },
      analysts: {
        consensus: { rating: 'buy', score: 4.2, count: 45 },
        priceTargets: [],
        recommendations: [],
        revisions: []
      },
      earnings: {
        nextDate: '2024-02-21',
        estimates: { eps: 1.25, revenue: 65000000000 },
        historicalEPS: [],
        surprises: []
      },
      metadata: {
        lastUpdated: new Date(),
        sources: ['twelvedata'],
        dataQuality: { score: 0.95, issues: [] }
      }
    };

    mockAnalysis = {
      recommendation: 'BUY',
      targetPrice: 225.0,
      riskLevel: 'MEDIUM',
      strengths: ['Strong AI market position', 'Growing datacenter revenue'],
      risks: ['High valuation', 'Competitive pressure'],
      catalysts: ['AI adoption', 'New product launches'],
      technicalSignals: ['Bullish MACD crossover', 'Above 200-day SMA'],
      summary: 'NVIDIA shows strong momentum in AI market',
      confidenceScore: 0.85,
      timeHorizon: '12 months',
      keyMetrics: {},
      sectorComparison: {},
      peerAnalysis: []
    };

    assembler = new ReportAssembler(mockConfig);
  });

  describe('assembleReport', () => {
    it('generates complete report with all sections', async () => {
      const mockChartInstance = {
        generateCandlestickChart: jest.fn().mockResolvedValue({
          type: 'candlestick',
          format: 'png',
          data: 'base64-chart-data',
          dimensions: { width: 800, height: 600 }
        }),
        generateLineChart: jest.fn().mockResolvedValue({
          type: 'line',
          format: 'png',
          data: 'base64-line-data',
          dimensions: { width: 800, height: 400 }
        }),
        generateBarChart: jest.fn().mockResolvedValue({
          type: 'bar',
          format: 'png',
          data: 'base64-bar-data',
          dimensions: { width: 800, height: 400 }
        })
      };
      
      MockedChartGenerator.mockImplementation(() => mockChartInstance as any);
      
      const report = await assembler.assembleReport(mockCompanyData, mockAnalysis);
      
      expect(report).toMatchObject({
        config: mockConfig,
        companyData: mockCompanyData,
        metadata: {
          version: '1.0',
          author: 'TriSight Analytics',
          confidentialityLevel: 'internal'
        }
      });
      
      expect(report.slides).toBeDefined();
      expect(report.slides.length).toBeGreaterThan(0);
      
      // Check for title slide
      const titleSlide = report.slides.find(s => s.layout === 'title');
      expect(titleSlide).toBeDefined();
      expect(titleSlide?.title).toContain('NVIDIA Corporation');
      
      // Check for content slides
      const hasOverview = report.slides.some(s => s.title.toLowerCase().includes('overview'));
      const hasFinancials = report.slides.some(s => s.title.toLowerCase().includes('financial'));
      const hasTechnical = report.slides.some(s => s.title.toLowerCase().includes('technical'));
      
      expect(hasOverview).toBe(true);
      expect(hasFinancials).toBe(true);
      expect(hasTechnical).toBe(true);
    });

    it('handles missing financial data gracefully', async () => {
      const incompleteData = {
        ...mockCompanyData,
        financials: {
          ...mockCompanyData.financials,
          incomeStatement: [],
          balanceSheet: [],
          keyMetrics: {} as any
        }
      };
      
      const report = await assembler.assembleReport(incompleteData, mockAnalysis);
      
      expect(report.slides).toBeDefined();
      expect(report.slides.length).toBeGreaterThan(0);
      
      // Should still generate report but with limited financial slides
      const financialSlide = report.slides.find(s => s.title.includes('Financial'));
      expect(financialSlide?.content.some(c => c.type === 'text' && c.data.text?.includes('No financial data available'))).toBe(true);
    });

    it('skips charts when includeCharts is false', async () => {
      assembler = new ReportAssembler({
        ...mockConfig,
        includeCharts: false
      });
      
      const report = await assembler.assembleReport(mockCompanyData, mockAnalysis);
      
      const hasCharts = report.slides.some(slide => 
        slide.content.some(content => content.type === 'chart')
      );
      
      expect(hasCharts).toBe(false);
      expect(MockedChartGenerator).not.toHaveBeenCalled();
    });
  });

  describe('generateTitleSlide', () => {
    it('creates proper title slide', () => {
      const slide = (assembler as any).generateTitleSlide(mockCompanyData, mockAnalysis);
      
      expect(slide.layout).toBe('title');
      expect(slide.slideNumber).toBe(1);
      expect(slide.title).toBe('NVIDIA Corporation - Technical Analysis Report');
      
      const textContent = slide.content.find(c => c.type === 'text');
      expect(textContent?.data.text).toContain('NVDA');
      expect(textContent?.data.text).toContain('Technology');
      expect(textContent?.data.text).toContain('BUY');
    });
  });

  describe('generateOverviewSlide', () => {
    it('includes company description and key metrics', () => {
      const slide = (assembler as any).generateOverviewSlide(mockCompanyData, 2);
      
      expect(slide.title).toBe('Company Overview');
      expect(slide.slideNumber).toBe(2);
      
      // Check for description
      const descContent = slide.content.find(c => 
        c.type === 'text' && c.data.text?.includes('NVIDIA Corporation provides')
      );
      expect(descContent).toBeDefined();
      
      // Check for metrics table
      const tableContent = slide.content.find(c => c.type === 'table');
      expect(tableContent).toBeDefined();
      expect(tableContent?.data.headers).toEqual(['Metric', 'Value']);
      expect(tableContent?.data.rows).toContainEqual(['Market Cap', '$4.28T']);
      expect(tableContent?.data.rows).toContainEqual(['P/E Ratio', '65.50']);
    });
  });

  describe('generateFinancialSlides', () => {
    it('creates income statement slide', () => {
      const slides = (assembler as any).generateFinancialSlides(mockCompanyData, 3);
      
      const incomeSlide = slides.find(s => s.title.includes('Income Statement'));
      expect(incomeSlide).toBeDefined();
      
      const table = incomeSlide?.content.find(c => c.type === 'table');
      expect(table?.data.headers).toContain('Revenue');
      expect(table?.data.headers).toContain('Net Income');
      
      // Check data formatting
      expect(table?.data.rows[0]).toContain('$60.92B');
      expect(table?.data.rows[0]).toContain('$29.76B');
    });

    it('creates balance sheet slide', () => {
      const slides = (assembler as any).generateFinancialSlides(mockCompanyData, 3);
      
      const balanceSlide = slides.find(s => s.title.includes('Balance Sheet'));
      expect(balanceSlide).toBeDefined();
      
      const table = balanceSlide?.content.find(c => c.type === 'table');
      expect(table?.data.rows[0]).toContain('$65.73B'); // Total Assets
      expect(table?.data.rows[0]).toContain('$40.97B'); // Shareholder Equity
    });

    it('handles missing financial statements', () => {
      const dataWithoutFinancials = {
        ...mockCompanyData,
        financials: {
          ...mockCompanyData.financials,
          incomeStatement: [],
          balanceSheet: []
        }
      };
      
      const slides = (assembler as any).generateFinancialSlides(dataWithoutFinancials, 3);
      
      expect(slides.length).toBeGreaterThan(0);
      
      // Should have placeholder content
      const hasNoDataMessage = slides.some(slide =>
        slide.content.some(c => 
          c.type === 'text' && c.data.text?.includes('No income statement data available')
        )
      );
      expect(hasNoDataMessage).toBe(true);
    });
  });

  describe('generateTechnicalSlides', () => {
    it('creates technical indicators slide', async () => {
      const slides = await (assembler as any).generateTechnicalSlides(mockCompanyData, 5);
      
      const indicatorSlide = slides.find(s => s.title.includes('Technical Indicators'));
      expect(indicatorSlide).toBeDefined();
      
      const table = indicatorSlide?.content.find(c => c.type === 'table');
      expect(table?.data.rows).toContainEqual(['SMA (20)', '175.50']);
      expect(table?.data.rows).toContainEqual(['RSI', '65.50']);
      expect(table?.data.rows).toContainEqual(['MACD', '2.50']);
    });

    it('includes price chart when charts enabled', async () => {
      const mockChartInstance = {
        generateCandlestickChart: jest.fn().mockResolvedValue({
          type: 'candlestick',
          format: 'png',
          data: 'base64-data'
        })
      };
      
      MockedChartGenerator.mockImplementation(() => mockChartInstance as any);
      
      const slides = await (assembler as any).generateTechnicalSlides(mockCompanyData, 5);
      
      const chartSlide = slides.find(s => s.title.includes('Price Chart'));
      expect(chartSlide).toBeDefined();
      
      const chartContent = chartSlide?.content.find(c => c.type === 'chart');
      expect(chartContent).toBeDefined();
      expect(mockChartInstance.generateCandlestickChart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            open: 175.5,
            high: 180.25,
            low: 174.8,
            close: 179.9,
            volume: 15000000
          })
        ]),
        expect.any(Object)
      );
    });
  });

  describe('generateAnalysisSlide', () => {
    it('includes all analysis components', () => {
      const slide = (assembler as any).generateAnalysisSlide(mockAnalysis, 7);
      
      expect(slide.title).toBe('Investment Analysis');
      
      // Check recommendation
      const hasRecommendation = slide.content.some(c => 
        c.type === 'text' && c.data.text?.includes('Recommendation: BUY')
      );
      expect(hasRecommendation).toBe(true);
      
      // Check strengths
      const strengthsTable = slide.content.find(c => 
        c.type === 'table' && c.data.headers?.includes('Strengths')
      );
      expect(strengthsTable?.data.rows).toContainEqual(['Strengths', expect.stringContaining('Strong AI market position')]);
      
      // Check risks
      expect(strengthsTable?.data.rows).toContainEqual(['Risks', expect.stringContaining('High valuation')]);
    });

    it('handles missing analysis data', () => {
      const minimalAnalysis = {
        recommendation: 'HOLD',
        targetPrice: 0,
        riskLevel: 'MEDIUM'
      } as AnalysisResults;
      
      const slide = (assembler as any).generateAnalysisSlide(minimalAnalysis, 7);
      
      expect(slide).toBeDefined();
      expect(slide.content.length).toBeGreaterThan(0);
      
      // Should still show recommendation
      const hasRecommendation = slide.content.some(c => 
        c.type === 'text' && c.data.text?.includes('HOLD')
      );
      expect(hasRecommendation).toBe(true);
    });
  });

  describe('Chart Generation', () => {
    it('prepares candlestick data correctly', () => {
      const priceData = mockCompanyData.financials.historicalPrices;
      const candlestickData = (assembler as any).prepareCandlestickData(priceData);
      
      expect(candlestickData).toHaveLength(2);
      expect(candlestickData[0]).toEqual({
        timestamp: new Date('2024-01-15').getTime(),
        datetime: '2024-01-15',
        open: 175.5,
        high: 180.25,
        low: 174.8,
        close: 179.9,
        volume: 15000000
      });
    });

    it('prepares bar chart data for financials', () => {
      const barData = (assembler as any).prepareBarChartData(
        'Revenue vs Net Income',
        ['Revenue', 'Net Income'],
        [60922000000, 29760000000]
      );
      
      expect(barData.labels).toEqual(['Revenue', 'Net Income']);
      expect(barData.datasets[0].data).toEqual([60922000000, 29760000000]);
      expect(barData.datasets[0].label).toBe('Amount ($)');
    });

    it('handles chart generation errors', async () => {
      const mockChartInstance = {
        generateCandlestickChart: jest.fn().mockRejectedValue(new Error('Chart error'))
      };
      
      MockedChartGenerator.mockImplementation(() => mockChartInstance as any);
      
      const chart = await (assembler as any).generateCandlestickChart(
        mockCompanyData.financials.historicalPrices
      );
      
      expect(chart).toBeNull();
    });
  });

  describe('Data Formatting', () => {
    it('formats currency values correctly', () => {
      expect((assembler as any).formatCurrency(1234567890)).toBe('$1.23B');
      expect((assembler as any).formatCurrency(1234567)).toBe('$1.23M');
      expect((assembler as any).formatCurrency(1234)).toBe('$1,234');
      expect((assembler as any).formatCurrency(0)).toBe('$0');
    });

    it('formats percentages correctly', () => {
      expect((assembler as any).formatPercentage(0.1234)).toBe('12.34%');
      expect((assembler as any).formatPercentage(1.5)).toBe('150.00%');
      expect((assembler as any).formatPercentage(0)).toBe('0.00%');
      expect((assembler as any).formatPercentage(null)).toBe('N/A');
    });

    it('formats numbers correctly', () => {
      expect((assembler as any).formatNumber(1234567.89)).toBe('1,234,567.89');
      expect((assembler as any).formatNumber(0.123456)).toBe('0.12');
      expect((assembler as any).formatNumber(null)).toBe('N/A');
    });
  });

  describe('Error Handling', () => {
    it('handles null company data gracefully', async () => {
      await expect(assembler.assembleReport(null as any, mockAnalysis))
        .rejects.toThrow('Company data is required');
    });

    it('continues report generation on non-critical errors', async () => {
      // Mock a chart generation error
      const mockChartInstance = {
        generateCandlestickChart: jest.fn().mockRejectedValue(new Error('Chart error')),
        generateLineChart: jest.fn().mockResolvedValue({ type: 'line', data: 'test' })
      };
      
      MockedChartGenerator.mockImplementation(() => mockChartInstance as any);
      
      const report = await assembler.assembleReport(mockCompanyData, mockAnalysis);
      
      // Report should still be generated
      expect(report).toBeDefined();
      expect(report.slides.length).toBeGreaterThan(0);
    });
  });
});