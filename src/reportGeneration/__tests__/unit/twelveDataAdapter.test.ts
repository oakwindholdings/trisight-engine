// src/reportGeneration/__tests__/unit/twelveDataAdapter.test.ts
// Comprehensive unit tests for TwelveDataAdapter
// Context: Tests all API integration methods with mocked responses

import { TwelveDataAdapter } from '../../adapters/twelveDataAdapter';
import axios from 'axios';
import { storageAdapter } from '../../utils/storageAdapter';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock storage adapter
jest.mock('../../utils/storageAdapter', () => ({
  storageAdapter: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
}));

describe('TwelveDataAdapter', () => {
  let adapter: TwelveDataAdapter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new TwelveDataAdapter({
      apiKey: 'test-api-key',
      tier: 'ultra',
      rateLimit: 75,
      timeout: 30000
    });
  });

  describe('constructor', () => {
    it('initializes with correct configuration', () => {
      expect(adapter).toBeDefined();
      expect((adapter as any).apiKey).toBe('test-api-key');
      expect((adapter as any).config.tier).toBe('ultra');
      expect((adapter as any).config.rateLimit).toBe(75);
    });

    it('uses environment variable when no API key provided', () => {
      process.env.REACT_APP_TWELVE_DATA_API_KEY = 'env-api-key';
      const envAdapter = new TwelveDataAdapter();
      expect((envAdapter as any).apiKey).toBe('env-api-key');
    });

    it('throws error when no API key available', () => {
      delete process.env.REACT_APP_TWELVE_DATA_API_KEY;
      expect(() => new TwelveDataAdapter()).toThrow('TwelveData API key is required');
    });
  });

  describe('getQuote', () => {
    it('fetches and transforms quote data successfully', async () => {
      const mockResponse = {
        data: {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          close: '179.90',
          change: '0.63',
          percent_change: '0.35',
          volume: '12749229',
          timestamp: 1627584000
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const quote = await adapter.getQuote('NVDA');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.twelvedata.com/quote',
        expect.objectContaining({
          params: { symbol: 'NVDA', apikey: 'test-api-key' }
        })
      );
      
      expect(quote).toEqual({
        symbol: 'NVDA',
        price: 179.90,
        change: 0.63,
        changePercent: 0.35,
        volume: 12749229,
        timestamp: new Date(1627584000 * 1000)
      });
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(adapter.getQuote('NVDA')).rejects.toThrow('Failed to fetch quote for NVDA');
    });

    it('validates response data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { invalid: 'data' } });
      
      await expect(adapter.getQuote('NVDA')).rejects.toThrow();
    });
  });

  describe('getCompanyOverview', () => {
    it('fetches company profile successfully', async () => {
      const mockResponse = {
        data: {
          name: 'NVIDIA Corporation',
          description: 'NVIDIA Corporation provides graphics processing units...',
          sector: 'Technology',
          industry: 'Semiconductors',
          website: 'https://www.nvidia.com',
          employees: 22473
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const overview = await adapter.getCompanyOverview('NVDA');
      
      expect(overview).toEqual({
        name: 'NVIDIA Corporation',
        description: 'NVIDIA Corporation provides graphics processing units...',
        sector: 'Technology',
        industry: 'Semiconductors',
        website: 'https://www.nvidia.com',
        employees: 22473
      });
    });

    it('uses cached data when available', async () => {
      const cachedData = {
        name: 'NVIDIA Corporation',
        description: 'Cached description',
        sector: 'Technology',
        industry: 'Semiconductors'
      };
      
      (storageAdapter.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify({
        data: cachedData,
        timestamp: Date.now()
      }));
      
      const overview = await adapter.getCompanyOverview('NVDA');
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(overview).toEqual(cachedData);
    });
  });

  describe('getFundamentals', () => {
    it('fetches all fundamental data in parallel', async () => {
      // Mock statistics response
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/statistics')) {
          return Promise.resolve({
            data: {
              statistics: {
                valuations_metrics: {
                  market_capitalization: 4280267571200,
                  pe_ratio: 65.5
                }
              }
            }
          });
        }
        if (url.includes('/income_statement')) {
          return Promise.resolve({
            data: {
              income_statement: [{
                fiscal_date: '2024-01-31',
                total_revenue: 60922000000,
                net_income: 29760000000
              }]
            }
          });
        }
        if (url.includes('/balance_sheet')) {
          return Promise.resolve({
            data: {
              balance_sheet: [{
                fiscal_date: '2024-01-31',
                total_assets: 65728000000,
                total_liabilities: 24755000000
              }]
            }
          });
        }
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
        return Promise.reject(new Error('Unknown endpoint'));
      });
      
      const fundamentals = await adapter.getFundamentals('NVDA');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
      expect(fundamentals.incomeStatement).toBeDefined();
      expect(fundamentals.balanceSheet).toBeDefined();
      expect(fundamentals.cashFlow).toBeDefined();
      expect(fundamentals.keyMetrics).toBeDefined();
      expect(fundamentals.keyMetrics?.marketCap).toBe(4280267571200);
    });

    it('handles partial failures gracefully', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/statistics')) {
          return Promise.reject(new Error('Statistics API failed'));
        }
        return Promise.resolve({ data: {} });
      });
      
      const fundamentals = await adapter.getFundamentals('NVDA');
      
      // Should still return other data even if statistics fails
      expect(fundamentals).toBeDefined();
      expect(fundamentals.keyMetrics).toEqual({});
    });
  });

  describe('getHistoricalPrices', () => {
    it('fetches time series data correctly', async () => {
      const mockResponse = {
        data: {
          meta: {
            symbol: 'NVDA',
            interval: '1day'
          },
          values: [
            {
              datetime: '2024-01-15',
              open: '175.50',
              high: '180.25',
              low: '174.80',
              close: '179.90',
              volume: '15000000'
            },
            {
              datetime: '2024-01-14',
              open: '173.20',
              high: '176.40',
              low: '172.50',
              close: '175.50',
              volume: '12000000'
            }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const startDate = new Date('2024-01-14');
      const endDate = new Date('2024-01-15');
      
      const prices = await adapter.getHistoricalPrices('NVDA', startDate, endDate);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.twelvedata.com/time_series',
        expect.objectContaining({
          params: expect.objectContaining({
            symbol: 'NVDA',
            interval: '1day',
            start_date: '2024-01-14',
            end_date: '2024-01-15'
          })
        })
      );
      
      expect(prices).toHaveLength(2);
      expect(prices[0]).toEqual({
        date: '2024-01-15',
        open: 175.50,
        high: 180.25,
        low: 174.80,
        close: 179.90,
        volume: 15000000
      });
    });

    it('handles empty response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { values: [] }
      });
      
      const prices = await adapter.getHistoricalPrices('NVDA', new Date(), new Date());
      
      expect(prices).toEqual([]);
    });
  });

  describe('getTechnicalIndicators', () => {
    it('fetches all technical indicators', async () => {
      // Mock SMA responses
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/sma') && url.includes('time_period=20')) {
          return Promise.resolve({
            data: {
              values: [{ sma: '175.50' }]
            }
          });
        }
        if (url.includes('/sma') && url.includes('time_period=50')) {
          return Promise.resolve({
            data: {
              values: [{ sma: '170.25' }]
            }
          });
        }
        if (url.includes('/sma') && url.includes('time_period=200')) {
          return Promise.resolve({
            data: {
              values: [{ sma: '165.80' }]
            }
          });
        }
        if (url.includes('/rsi')) {
          return Promise.resolve({
            data: {
              values: [{ rsi: '65.5' }]
            }
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
        if (url.includes('/quote')) {
          return Promise.resolve({
            data: {
              volume: '15000000',
              close: '179.90'
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
      
      const indicators = await adapter.getTechnicalIndicators('NVDA');
      
      expect(indicators.sma20).toBe(175.50);
      expect(indicators.sma50).toBe(170.25);
      expect(indicators.sma200).toBe(165.80);
      expect(indicators.rsi).toBe(65.5);
      expect(indicators.macd).toEqual({
        macd: 2.5,
        signal: 2.1,
        histogram: 0.4
      });
      expect(indicators.volume).toEqual({
        current: 15000000,
        average10Day: 0,
        average30Day: 0,
        trend: 'stable'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('respects rate limits', async () => {
      jest.useFakeTimers();
      
      // Configure adapter with low rate limit for testing
      adapter = new TwelveDataAdapter({
        apiKey: 'test-api-key',
        tier: 'basic',
        rateLimit: 2 // 2 requests per minute
      });
      
      mockedAxios.get.mockResolvedValue({ data: { symbol: 'NVDA' } });
      
      // Make 3 requests quickly
      const promises = [
        adapter.getQuote('NVDA'),
        adapter.getQuote('AAPL'),
        adapter.getQuote('MSFT')
      ];
      
      // First 2 should go through immediately
      jest.advanceTimersByTime(100);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Third should be delayed
      jest.advanceTimersByTime(60000); // 1 minute
      await Promise.all(promises);
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('retries on 429 rate limit errors', async () => {
      let callCount = 0;
      mockedAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            response: { status: 429 }
          });
        }
        return Promise.resolve({
          data: { symbol: 'NVDA', close: '179.90' }
        });
      });
      
      const quote = await adapter.getQuote('NVDA');
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(quote.price).toBe(179.90);
    });

    it('handles network timeouts', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('ECONNABORTED'));
      
      await expect(adapter.getQuote('NVDA')).rejects.toThrow('Failed to fetch quote');
    });

    it('validates API responses', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'error',
          message: 'Invalid API key'
        }
      });
      
      await expect(adapter.getQuote('NVDA')).rejects.toThrow();
    });
  });

  describe('Data Transformation', () => {
    it('transforms financial statement data correctly', async () => {
      const mockResponse = {
        data: {
          income_statement: [{
            fiscal_date: '2024-01-31',
            total_revenue: '60922000000',
            cost_of_revenue: '16621000000',
            gross_profit: '44301000000',
            operating_expenses: '11376000000',
            operating_income: '32925000000',
            net_income: '29760000000',
            basic_earnings_per_share: '1.19'
          }]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const adapter = new TwelveDataAdapter({ apiKey: 'test' });
      const result = await (adapter as any).fetchIncomeStatement('NVDA');
      
      expect(result[0].revenue).toBe(60922000000);
      expect(result[0].netIncome).toBe(29760000000);
      expect(result[0].eps).toBe(1.19);
    });

    it('calculates derived metrics correctly', () => {
      const income = { revenue: 1000000, netIncome: 200000 };
      const balance = { totalAssets: 5000000, totalLiabilities: 2000000 };
      
      const metrics = (adapter as any).calculateKeyMetrics(
        [income],
        [balance],
        { close: 50 },
        { market_capitalization: 10000000 }
      );
      
      expect(metrics.roe).toBeCloseTo(0.0667, 4); // 200k / 3M equity
      expect(metrics.currentRatio).toBe(0); // No current assets/liabilities data
      expect(metrics.debtToEquity).toBeCloseTo(0.6667, 4); // 2M / 3M
    });
  });
});