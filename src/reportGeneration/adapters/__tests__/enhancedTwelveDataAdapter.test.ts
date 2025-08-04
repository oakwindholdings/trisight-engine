// src/reportGeneration/adapters/__tests__/enhancedTwelveDataAdapter.test.ts
// Unit tests for EnhancedTwelveDataAdapter
// Context: Ensures data validation and error handling work correctly

import { EnhancedTwelveDataAdapter } from '../enhancedTwelveDataAdapter';
import { CompanyData } from '../../models/reportTypes';

// Mock the parent class methods
jest.mock('../twelveDataAdapter', () => {
  return {
    TwelveDataAdapter: class {
      async getQuote(symbol: string) {
        if (symbol === 'INVALID') {
          throw new Error('Invalid symbol');
        }
        return {
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
          close: '225.00',
          market_cap: '3450000000000'
        };
      }
      
      async getFundamentals(symbol: string) {
        if (symbol === 'ERROR') {
          throw new Error('API error');
        }
        return {
          keyMetrics: {
            marketCap: 3.45e12,
            peRatio: 32.5,
            roe: 1.719
          }
        };
      }
      
      async getTimeSeries(symbol: string, interval: string, outputsize: number) {
        if (symbol === 'ERROR') {
          throw new Error('API error');
        }
        return [{
          date: '2025-08-03',
          open: 225,
          high: 227,
          low: 224,
          close: 226,
          volume: 75000000,
          adjustedClose: 226
        }];
      }
      
      async getTechnicalIndicators(symbol: string) {
        if (symbol === 'ERROR') {
          throw new Error('API error');
        }
        return {
          sma20: 220,
          sma50: 215,
          sma200: 200,
          rsi: 58
        };
      }
      
      async getAnalystRatings(symbol: string) {
        if (symbol === 'ERROR') {
          throw new Error('API error');
        }
        return {
          consensus: {
            rating: 'buy',
            score: 4.2,
            count: 10
          }
        };
      }
    }
  };
});

describe('EnhancedTwelveDataAdapter', () => {
  let adapter: EnhancedTwelveDataAdapter;
  
  beforeEach(() => {
    adapter = new EnhancedTwelveDataAdapter();
  });
  
  describe('getComprehensiveData', () => {
    it('should fetch comprehensive data for valid symbol', async () => {
      const data = await adapter.getComprehensiveData('AAPL');
      
      expect(data).toBeDefined();
      expect(data.ticker).toBe('AAPL');
      expect(data.companyName).toBe('Apple Inc.');
      expect(data.financials).toBeDefined();
      expect(data.financials.keyMetrics).toBeDefined();
      expect(data.financials.keyMetrics.peRatio).toBe(32.5);
      expect(data.financials.keyMetrics.roe).toBe(1.719);
      expect(data.technicals).toBeDefined();
      expect(data.analysts).toBeDefined();
    });
    
    it('should throw error for invalid symbol', async () => {
      await expect(adapter.getComprehensiveData('')).rejects.toThrow('Invalid symbol provided');
      await expect(adapter.getComprehensiveData(null as any)).rejects.toThrow('Invalid symbol provided');
      await expect(adapter.getComprehensiveData('   ')).rejects.toThrow('Invalid symbol provided');
    });
    
    it('should use fallback data when API calls fail', async () => {
      const data = await adapter.getComprehensiveData('ERROR');
      
      expect(data).toBeDefined();
      expect(data.ticker).toBe('ERROR');
      expect(data.financials).toBeDefined();
      expect(data.financials.keyMetrics).toBeDefined();
      // Should have default values
      expect(data.financials.keyMetrics.peRatio).toBe(25);
      expect(data.financials.keyMetrics.roe).toBe(0.20);
    });
    
    it('should validate company data before returning', async () => {
      // This test ensures validation is called
      const spy = jest.spyOn(adapter as any, 'validateCompanyData');
      
      await adapter.getComprehensiveData('AAPL');
      
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('data validation', () => {
    it('should validate P/E ratio is within acceptable range', async () => {
      const validateMethod = (adapter as any).validateCompanyData.bind(adapter);
      
      const invalidData: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test Inc.',
        financials: {
          keyMetrics: {
            peRatio: -5, // Invalid negative P/E
            roe: 0.15,
            debtToEquity: 0.8,
            currentRatio: 1.5,
            marketCap: 1e9,
            pegRatio: 1.5,
            priceToBook: 3,
            dividendYield: 2
          },
          incomeStatement: [],
          balanceSheet: [],
          cashFlow: [],
          historicalPrices: [{ date: '2025-08-03', open: 100, high: 101, low: 99, close: 100, volume: 1000000 }]
        }
      } as any;
      
      expect(() => validateMethod(invalidData)).toThrow('Invalid P/E ratio: -5');
    });
    
    it('should validate ROE is within acceptable range', async () => {
      const validateMethod = (adapter as any).validateCompanyData.bind(adapter);
      
      const invalidData: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test Inc.',
        financials: {
          keyMetrics: {
            peRatio: 25,
            roe: 15, // Invalid ROE (should be decimal, not percentage)
            debtToEquity: 0.8,
            currentRatio: 1.5,
            marketCap: 1e9,
            pegRatio: 1.5,
            priceToBook: 3,
            dividendYield: 2
          },
          incomeStatement: [],
          balanceSheet: [],
          cashFlow: [],
          historicalPrices: [{ date: '2025-08-03', open: 100, high: 101, low: 99, close: 100, volume: 1000000 }]
        }
      } as any;
      
      expect(() => validateMethod(invalidData)).toThrow('Invalid ROE: 15 (1500.0%)');
    });
    
    it('should validate historical price data exists', async () => {
      const validateMethod = (adapter as any).validateCompanyData.bind(adapter);
      
      const invalidData: CompanyData = {
        ticker: 'TEST',
        companyName: 'Test Inc.',
        financials: {
          keyMetrics: {
            peRatio: 25,
            roe: 0.15,
            debtToEquity: 0.8,
            currentRatio: 1.5,
            marketCap: 1e9,
            pegRatio: 1.5,
            priceToBook: 3,
            dividendYield: 2
          },
          incomeStatement: [],
          balanceSheet: [],
          cashFlow: [],
          historicalPrices: [] // Empty price history
        }
      } as any;
      
      expect(() => validateMethod(invalidData)).toThrow('Missing historical price data');
    });
  });
  
  describe('realistic data generation', () => {
    it('should generate realistic key metrics for AAPL', () => {
      const getMetricsMethod = (adapter as any).getRealisticKeyMetrics.bind(adapter);
      const metrics = getMetricsMethod('AAPL');
      
      expect(metrics.peRatio).toBe(32.5);
      expect(metrics.roe).toBe(1.719); // 171.9% as decimal
      expect(metrics.debtToEquity).toBe(1.959); // 195.9% as decimal
      expect(metrics.currentRatio).toBe(0.94);
      expect(metrics.marketCap).toBe(3.45e12);
    });
    
    it('should generate default metrics for unknown symbols', () => {
      const getMetricsMethod = (adapter as any).getRealisticKeyMetrics.bind(adapter);
      const metrics = getMetricsMethod('UNKNOWN');
      
      expect(metrics.peRatio).toBe(25);
      expect(metrics.roe).toBe(0.20); // 20% as decimal
      expect(metrics.debtToEquity).toBe(0.8);
      expect(metrics.currentRatio).toBe(1.5);
    });
    
    it('should generate realistic financial statements', () => {
      const generateMethod = (adapter as any).generateRealisticFinancials.bind(adapter);
      const financials = generateMethod('AAPL', 2025);
      
      expect(financials.income).toHaveLength(4); // 4 quarters
      expect(financials.balance).toHaveLength(4);
      expect(financials.cashFlow).toHaveLength(4);
      
      // Check income statement values are realistic
      const income = financials.income[0];
      expect(income.revenue).toBeGreaterThan(90e9);
      expect(income.revenue).toBeLessThan(105e9);
      expect(income.eps).toBeGreaterThan(1.4);
      expect(income.eps).toBeLessThan(1.7);
    });
    
    it('should generate realistic price history', async () => {
      const getPriceMethod = (adapter as any).getEnhancedPriceHistory.bind(adapter);
      const prices = await getPriceMethod('TEST');
      
      expect(prices.length).toBeGreaterThan(0); // Should have price data
      
      // Check price values are realistic
      const firstPrice = prices[0];
      expect(firstPrice.open).toBeGreaterThan(0);
      expect(firstPrice.high).toBeGreaterThanOrEqual(firstPrice.open);
      expect(firstPrice.low).toBeLessThanOrEqual(firstPrice.open);
      expect(firstPrice.volume).toBeGreaterThan(50000000);
    });
  });
  
  describe('error handling', () => {
    it('should handle quote fetch errors gracefully', async () => {
      const data = await adapter.getComprehensiveData('INVALID');
      
      // Should still return data with defaults
      expect(data).toBeDefined();
      expect(data.ticker).toBe('INVALID');
      expect(data.companyName).toBe('INVALID'); // Falls back to symbol
    });
    
    it('should provide default data for all failed API calls', async () => {
      const data = await adapter.getComprehensiveData('ERROR');
      
      expect(data).toBeDefined();
      expect(data.financials.historicalPrices.length).toBeGreaterThan(0);
      expect(data.technicals.sma20).toBeGreaterThan(0);
      // Default metrics for ERROR symbol should be populated
      expect(data.financials.keyMetrics.peRatio).toBe(25);
    });
  });
});