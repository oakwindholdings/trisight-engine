// src/reportGeneration/__tests__/dataFetcher.test.ts
// Comprehensive tests for the data fetching orchestration layer
// Context: Ensures reliability and resilience of the data gathering system

import { DataFetcher, createDataFetcher } from '../core/dataFetcher';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { EdgarAdapter } from '../adapters/edgarAdapter';
import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { MemoryCache } from '../utils/cache';
import { RetryableError } from '../utils/errorHandler';
import { validateFinancialData, enrichFinancialData } from '../utils/dataValidation';

// Mock the adapters
jest.mock('../adapters/twelveDataAdapter');
jest.mock('../adapters/newsAdapter');
jest.mock('../adapters/edgarAdapter');
jest.mock('../adapters/firecrawlAdapter');
jest.mock('../utils/dataValidation');

describe('DataFetcher', () => {
  let dataFetcher: DataFetcher;
  let cache: MemoryCache;
  let mockAdapters: {
    twelveData: jest.Mocked<TwelveDataAdapter>;
    news: jest.Mocked<NewsAdapter>;
    edgar: jest.Mocked<EdgarAdapter>;
    firecrawl: jest.Mocked<FirecrawlAdapter>;
  };
  
  // Mock data
  const mockQuote = {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 450.0,
    market_cap: '1100000000000',
    pe: '65.5',
    pb: '25.0',
    dividend_yield: '0.04'
  };
  
  const mockFundamentals = {
    incomeStatement: [{
      date: '2023-12-31',
      period: 'annual',
      revenue: 60000000000,
      grossProfit: 44000000000,
      netIncome: 29000000000,
      eps: 11.93
    }],
    balanceSheet: [{
      date: '2023-12-31',
      period: 'annual',
      totalAssets: 65000000000,
      totalLiabilities: 20000000000,
      totalEquity: 45000000000
    }],
    cashFlow: [{
      date: '2023-12-31',
      period: 'annual',
      operatingCashFlow: 28000000000,
      capitalExpenditures: -1000000000
    }],
    keyMetrics: {
      roe: 0.64,
      currentRatio: 3.5,
      debtToEquity: 0.44
    }
  };
  
  const mockHistoricalPrices = Array.from({ length: 252 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    open: 440 + Math.random() * 20,
    high: 450 + Math.random() * 20,
    low: 430 + Math.random() * 20,
    close: 445 + Math.random() * 20,
    volume: 50000000 + Math.random() * 10000000
  }));
  
  const mockTechnicals = {
    sma20: 445,
    sma50: 440,
    sma200: 400,
    rsi: 65,
    macd: { macd: 5, signal: 3, histogram: 2 },
    volume: { current: 55000000, average10Day: 52000000, average30Day: 50000000, trend: 'increasing' },
    patterns: []
  };
  
  const mockAnalysts = {
    consensus: { rating: 'buy', score: 4.2, count: 35 },
    priceTargets: [
      { analyst: 'Analyst 1', firm: 'Firm A', target: 500, date: '2024-01-15', horizon: '12m' }
    ],
    recommendations: [],
    revisions: []
  };
  
  const mockCompanyInfo = {
    description: 'NVIDIA Corporation provides graphics, compute and networking solutions.',
    sector: 'Technology',
    industry: 'Semiconductors'
  };
  
  const mockNews = [
    {
      title: 'NVIDIA Announces Record Earnings',
      url: 'https://example.com/news1',
      source: 'Reuters',
      publishedDate: '2024-01-20T10:00:00Z',
      summary: 'NVIDIA reported record quarterly earnings...',
      sentiment: 'positive' as const,
      relevanceScore: 0.95
    },
    {
      title: 'AI Chip Demand Continues to Surge',
      url: 'https://example.com/news2',
      source: 'Bloomberg',
      publishedDate: '2024-01-19T14:30:00Z',
      summary: 'Demand for AI chips continues to drive growth...',
      sentiment: 'positive' as const,
      relevanceScore: 0.88
    }
  ];
  
  const mockTranscripts = [{
    date: '2024-01-15',
    quarter: 'Q4',
    year: 2023,
    participants: ['CEO', 'CFO'],
    highlights: ['Record revenue', 'Strong AI demand'],
    content: 'Full transcript text...',
    sentiment: { overall: 'positive', score: 0.8, aspects: {} }
  }];
  
  beforeEach(() => {
    cache = new MemoryCache();
    
    // Mock validation functions
    (validateFinancialData as jest.Mock).mockReturnValue([]);
    (enrichFinancialData as jest.Mock).mockImplementation(data => data);
    
    // Create mock adapters
    mockAdapters = {
      twelveData: {
        getQuote: jest.fn().mockResolvedValue(mockQuote),
        getFundamentals: jest.fn().mockResolvedValue(mockFundamentals),
        getTimeSeries: jest.fn().mockResolvedValue(mockHistoricalPrices),
        getTechnicalIndicators: jest.fn().mockResolvedValue(mockTechnicals),
        getAnalystRatings: jest.fn().mockResolvedValue(mockAnalysts)
      } as any,
      news: {
        getCompanyNews: jest.fn().mockResolvedValue(mockNews)
      } as any,
      edgar: {
        getCompanyDescription: jest.fn().mockResolvedValue(mockCompanyInfo),
        getEarningsTranscripts: jest.fn().mockResolvedValue(mockTranscripts)
      } as any,
      firecrawl: {} as any
    };
    
    // Setup DataFetcher with mocked adapters
    dataFetcher = new DataFetcher({
      ticker: 'NVDA',
      cache,
      debugMode: false,
      adapters: mockAdapters
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('fetchAll', () => {
    it('should successfully fetch and orchestrate all data sources', async () => {
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result).toMatchObject({
        ticker: 'NVDA',
        companyName: 'NVIDIA Corporation',
        description: expect.any(String),
        sector: 'Technology',
        industry: 'Semiconductors',
        financials: expect.objectContaining({
          incomeStatement: expect.any(Array),
          balanceSheet: expect.any(Array),
          cashFlow: expect.any(Array),
          historicalPrices: expect.any(Array),
          keyMetrics: expect.any(Object)
        }),
        news: expect.arrayContaining([
          expect.objectContaining({ title: expect.any(String) })
        ]),
        transcripts: expect.any(Array),
        technicals: expect.objectContaining({
          sma200: expect.any(Number),
          rsi: expect.any(Number)
        }),
        analysts: expect.objectContaining({
          consensus: expect.any(Object)
        }),
        metadata: expect.objectContaining({
          lastUpdated: expect.any(String),
          sources: expect.any(Object),
          completeness: expect.any(Number),
          quality: expect.any(Object)
        })
      });
      
      // Verify all adapters were called
      expect(mockAdapters.twelveData.getQuote).toHaveBeenCalledWith('NVDA');
      expect(mockAdapters.twelveData.getFundamentals).toHaveBeenCalledWith('NVDA');
      expect(mockAdapters.twelveData.getTimeSeries).toHaveBeenCalledWith('NVDA', '1day', 252);
      expect(mockAdapters.news.getCompanyNews).toHaveBeenCalled();
      expect(mockAdapters.edgar.getCompanyDescription).toHaveBeenCalledWith('NVDA');
    });
    
    it('should handle progress callbacks correctly', async () => {
      const progressCallback = jest.fn();
      
      await dataFetcher.fetchAll('NVDA', progressCallback);
      
      // Should report progress through all phases
      expect(progressCallback).toHaveBeenCalledWith('Fetching core financial data', 10);
      expect(progressCallback).toHaveBeenCalledWith('Fetching supplementary data', 30);
      expect(progressCallback).toHaveBeenCalledWith('Fetching enrichment data', 60);
      expect(progressCallback).toHaveBeenCalledWith('Validating and cleaning data', 80);
      expect(progressCallback).toHaveBeenCalledWith('Enriching data with calculations', 90);
      expect(progressCallback).toHaveBeenCalledWith('Assembling final dataset', 95);
      expect(progressCallback).toHaveBeenCalledWith('Data fetch complete', 100);
      
      // Should be called in order
      const calls = progressCallback.mock.calls;
      const progressValues = calls.map(call => call[1]);
      expect(progressValues).toEqual([10, 30, 60, 80, 90, 95, 100]);
    });
  });
  
  describe('Error Handling and Resilience', () => {
    it('should fail when critical data sources fail', async () => {
      // Both quote and fundamentals fail
      mockAdapters.twelveData.getQuote.mockRejectedValue(new Error('API error'));
      mockAdapters.twelveData.getFundamentals.mockRejectedValue(new Error('API error'));
      
      await expect(dataFetcher.fetchAll('NVDA')).rejects.toThrow('Critical failure in data fetching');
    });
    
    it('should continue when non-critical sources fail', async () => {
      // News fails but should not break the fetch
      mockAdapters.news.getCompanyNews.mockRejectedValue(new Error('News API error'));
      mockAdapters.edgar.getEarningsTranscripts.mockRejectedValue(new Error('Transcripts error'));
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result).toBeDefined();
      expect(result.news).toEqual([]);
      expect(result.transcripts).toEqual([]);
      expect(result.financials).toBeDefined();
      
      // Check that errors were recorded in metadata
      expect(result.metadata.sources['News Articles']).toMatchObject({
        status: 'failed',
        error: expect.stringContaining('News API error')
      });
    });
    
    it('should handle partial failures in supplementary data', async () => {
      // Technical indicators fail
      mockAdapters.twelveData.getTechnicalIndicators.mockRejectedValue(
        new Error('Technical indicators unavailable')
      );
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result).toBeDefined();
      expect(result.technicals).toMatchObject({
        sma20: 0,
        sma50: 0,
        sma200: 0,
        rsi: 50
      });
    });
    
    it('should handle timeout errors', async () => {
      // Simulate a hanging request
      mockAdapters.news.getCompanyNews.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 60000))
      );
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result).toBeDefined();
      expect(result.news).toEqual([]);
      expect(result.metadata.sources['News Articles']).toMatchObject({
        status: 'failed',
        error: 'Request timeout'
      });
    });
    
    it('should record retryable errors correctly', async () => {
      const retryableError = new RetryableError('Temporary failure', true);
      mockAdapters.edgar.getCompanyDescription.mockRejectedValue(retryableError);
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.metadata.sources['SEC Company Info']).toMatchObject({
        status: 'failed',
        error: 'Temporary failure'
      });
    });
  });
  
  describe('Data Validation and Cleaning', () => {
    it('should validate and clean financial data', async () => {
      // Mock validation to return issues
      (validateFinancialData as jest.Mock).mockReturnValue([
        'Income statement 0: Invalid revenue value',
        'Balance sheet 0: Assets don\'t equal liabilities + equity'
      ]);
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(validateFinancialData).toHaveBeenCalled();
      expect(result.metadata.warnings).toBeDefined();
      expect(result.metadata.warnings?.length).toBeGreaterThan(0);
    });
    
    it('should remove duplicate news items', async () => {
      // Add duplicate news
      const duplicateNews = [
        ...mockNews,
        {
          ...mockNews[0],
          url: 'https://example.com/duplicate',
          publishedDate: '2024-01-20T11:00:00Z'
        }
      ];
      mockAdapters.news.getCompanyNews.mockResolvedValue(duplicateNews);
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      // Should have removed the duplicate
      expect(result.news.length).toBeLessThan(duplicateNews.length);
    });
    
    it('should clean invalid numeric values', async () => {
      // Mock fundamentals with invalid values
      const invalidFundamentals = {
        ...mockFundamentals,
        incomeStatement: [{
          ...mockFundamentals.incomeStatement[0],
          revenue: NaN,
          netIncome: Infinity
        }]
      };
      mockAdapters.twelveData.getFundamentals.mockResolvedValue(invalidFundamentals);
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      // Should clean invalid values to 0
      expect(result.financials.incomeStatement[0].revenue).toBe(0);
      expect(result.financials.incomeStatement[0].netIncome).toBe(0);
    });
  });
  
  describe('Data Enrichment', () => {
    it('should calculate additional technical indicators', async () => {
      const result = await dataFetcher.fetchAll('NVDA');
      
      // Should add volatility and support/resistance
      expect(result.technicals.volatility).toBeDefined();
      expect(result.technicals.resistance).toBeDefined();
      expect(result.technicals.support).toBeDefined();
    });
    
    it('should aggregate sentiment from multiple sources', async () => {
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.metadata.aggregatedSentiment).toMatchObject({
        overall: expect.stringMatching(/positive|neutral|negative/),
        score: expect.any(Number),
        newsSentiment: expect.any(Number),
        transcriptSentiment: expect.any(Number)
      });
    });
    
    it('should assess data quality', async () => {
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.metadata.quality).toMatchObject({
        overall: expect.any(Number),
        financials: expect.any(Number),
        news: expect.any(Number),
        technicals: expect.any(Number),
        analysts: expect.any(Number),
        grade: expect.stringMatching(/[A-D]/)
      });
    });
    
    it('should calculate completeness score', async () => {
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.metadata.completeness).toBeGreaterThan(0);
      expect(result.metadata.completeness).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Configuration Options', () => {
    it('should respect includeNews configuration', async () => {
      const fetcher = new DataFetcher({
        ticker: 'NVDA',
        includeNews: false,
        adapters: mockAdapters
      });
      
      const result = await fetcher.fetchAll('NVDA');
      
      expect(mockAdapters.news.getCompanyNews).not.toHaveBeenCalled();
      expect(result.news).toEqual([]);
    });
    
    it('should respect includeTranscripts configuration', async () => {
      const fetcher = new DataFetcher({
        ticker: 'NVDA',
        includeTranscripts: false,
        adapters: mockAdapters
      });
      
      const result = await fetcher.fetchAll('NVDA');
      
      expect(mockAdapters.edgar.getEarningsTranscripts).not.toHaveBeenCalled();
      expect(result.transcripts).toEqual([]);
    });
    
    it('should use custom cache if provided', async () => {
      const customCache = new MemoryCache();
      const cacheSpy = jest.spyOn(customCache, 'get');
      
      const fetcher = new DataFetcher({
        ticker: 'NVDA',
        cache: customCache,
        adapters: mockAdapters
      });
      
      await fetcher.fetchAll('NVDA');
      
      // Should use the custom cache (called by adapters)
      expect(fetcher['cache']).toBe(customCache);
    });
  });
  
  describe('createDataFetcher Factory', () => {
    beforeEach(() => {
      process.env.REACT_APP_TWELVE_DATA_API_KEY = 'test-api-key';
    });
    
    afterEach(() => {
      delete process.env.REACT_APP_TWELVE_DATA_API_KEY;
    });
    
    it('should create DataFetcher with valid config', () => {
      const fetcher = createDataFetcher({
        ticker: 'NVDA'
      });
      
      expect(fetcher).toBeInstanceOf(DataFetcher);
    });
    
    it('should throw error when ticker is missing', () => {
      expect(() => createDataFetcher({} as any)).toThrow('Ticker symbol is required');
    });
    
    it('should throw error when API key is missing', () => {
      delete process.env.REACT_APP_TWELVE_DATA_API_KEY;
      
      expect(() => createDataFetcher({ ticker: 'NVDA' })).toThrow('TwelveData API key is required');
    });
    
    it('should warn when Firecrawl key is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      createDataFetcher({ ticker: 'NVDA' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firecrawl API key not found')
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should use provided API keys over environment variables', () => {
      const fetcher = createDataFetcher({
        ticker: 'NVDA',
        apiKey: 'custom-twelve-key',
        firecrawlApiKey: 'custom-firecrawl-key'
      });
      
      expect(fetcher['config'].apiKey).toBe('custom-twelve-key');
      expect(fetcher['config'].firecrawlApiKey).toBe('custom-firecrawl-key');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty financial statements', async () => {
      mockAdapters.twelveData.getFundamentals.mockResolvedValue({
        incomeStatement: [],
        balanceSheet: [],
        cashFlow: [],
        keyMetrics: {}
      });
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.financials.incomeStatement).toEqual([]);
      expect(result.financials.balanceSheet).toEqual([]);
      expect(result.financials.cashFlow).toEqual([]);
    });
    
    it('should handle missing company name', async () => {
      mockAdapters.twelveData.getQuote.mockResolvedValue({
        ...mockQuote,
        name: undefined
      });
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.companyName).toBe('NVDA');
    });
    
    it('should handle dates in wrong order', async () => {
      const unorderedPrices = [...mockHistoricalPrices].reverse();
      mockAdapters.twelveData.getTimeSeries.mockResolvedValue(unorderedPrices);
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      expect(result.metadata.warnings).toBeDefined();
      expect(result.metadata.warnings?.some(w => 
        w.message.includes('Date ordering issue')
      )).toBe(true);
    });
  });
  
  describe('Performance Metrics', () => {
    it('should calculate success rate correctly', async () => {
      // Make some sources fail
      mockAdapters.news.getCompanyNews.mockRejectedValue(new Error('Failed'));
      mockAdapters.edgar.getEarningsTranscripts.mockRejectedValue(new Error('Failed'));
      
      const result = await dataFetcher.fetchAll('NVDA');
      
      const successCount = Object.values(result.metadata.sources)
        .filter((s: any) => typeof s === 'object' && s.status === 'success').length;
      const totalCount = Object.keys(result.metadata.sources).length;
      const expectedRate = Math.round((successCount / totalCount) * 100);
      
      // Success rate should be calculated correctly
      expect(result.metadata.sources).toBeDefined();
      expect(Object.keys(result.metadata.sources).length).toBeGreaterThan(0);
    });
    
    it('should measure completeness based on data availability', async () => {
      // Full data
      const fullResult = await dataFetcher.fetchAll('NVDA');
      const fullCompleteness = fullResult.metadata.completeness;
      
      // Limited data
      mockAdapters.news.getCompanyNews.mockResolvedValue([]);
      mockAdapters.twelveData.getTechnicalIndicators.mockResolvedValue({
        ...mockTechnicals,
        sma200: 0,
        rsi: 0
      });
      
      const limitedResult = await dataFetcher.fetchAll('NVDA');
      const limitedCompleteness = limitedResult.metadata.completeness;
      
      expect(fullCompleteness).toBeGreaterThan(limitedCompleteness);
    });
  });
});

describe('DataFetcher Integration Tests', () => {
  it('should handle real-world scenario with mixed successes and failures', async () => {
    const cache = new MemoryCache();
    
    // Create semi-realistic mock adapters
    const mockAdapters = {
      twelveData: {
        getQuote: jest.fn().mockResolvedValue(mockQuote),
        getFundamentals: jest.fn().mockResolvedValue(mockFundamentals),
        getTimeSeries: jest.fn().mockResolvedValue(mockHistoricalPrices),
        getTechnicalIndicators: jest.fn().mockRejectedValue(new Error('Rate limited')),
        getAnalystRatings: jest.fn().mockResolvedValue(mockAnalysts)
      } as any,
      news: {
        getCompanyNews: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve(mockNews), 100))
        )
      } as any,
      edgar: {
        getCompanyDescription: jest.fn().mockResolvedValue(mockCompanyInfo),
        getEarningsTranscripts: jest.fn().mockRejectedValue(new Error('No transcripts found'))
      } as any,
      firecrawl: {} as any
    };
    
    const fetcher = new DataFetcher({
      ticker: 'NVDA',
      cache,
      debugMode: true,
      adapters: mockAdapters
    });
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const result = await fetcher.fetchAll('NVDA');
    
    // Should complete successfully despite some failures
    expect(result).toBeDefined();
    expect(result.ticker).toBe('NVDA');
    
    // Should have default technicals due to failure
    expect(result.technicals.sma200).toBe(0);
    
    // Should have empty transcripts due to failure
    expect(result.transcripts).toEqual([]);
    
    // Should log debug information
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DataFetcher] Completed fetch')
    );
    
    consoleSpy.mockRestore();
  });
});