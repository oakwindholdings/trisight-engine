// src/reportGeneration/__tests__/edgarAdapter.test.ts
// Tests for enhanced EDGAR adapter with Firecrawl integration
// Context: Validates SEC filing extraction and intelligent parsing

import { EdgarAdapter } from '../adapters/edgarAdapter';
import { FirecrawlAdapter } from '../adapters/firecrawlAdapter';
import { MemoryCache } from '../utils/cache';
import { 
  setupMockFirecrawlAPI, 
  mockExtractFinancialFilingResponse,
  mockScrapeResponse,
  mockSECFilings 
} from './mockFirecrawlResponses';

// Mock SEC EDGAR API responses
const mockCompanyTickers = {
  "0": {
    "cik_str": 1045810,
    "ticker": "NVDA",
    "title": "NVIDIA CORP"
  },
  "1": {
    "cik_str": 320193,
    "ticker": "AAPL",
    "title": "APPLE INC"
  }
};

const mockCompanySubmissions = {
  cik: "0001045810",
  entityType: "operating",
  sic: "3674",
  sicDescription: "Semiconductors & Related Devices",
  name: "NVIDIA CORP",
  ticker: "NVDA",
  exchanges: ["NASDAQ"],
  ein: "943177549",
  description: "NVIDIA Corporation designs and manufactures computer graphics processors",
  website: "https://www.nvidia.com",
  category: "Large accelerated filer",
  fiscalYearEnd: "0128",
  stateOfIncorporation: "DE",
  phone: "4084862000",
  addresses: {
    mailing: {
      street1: "2788 SAN TOMAS EXPRESSWAY",
      city: "SANTA CLARA",
      stateOrCountry: "CA",
      zipCode: "95051"
    },
    business: {
      street1: "2788 SAN TOMAS EXPRESSWAY",
      city: "SANTA CLARA",
      stateOrCountry: "CA",
      zipCode: "95051"
    }
  },
  filings: {
    recent: {
      accessionNumber: [
        "0001045810-24-000012",
        "0001045810-23-000090",
        "0001045810-23-000027"
      ],
      filingDate: [
        "2024-02-21",
        "2023-11-21",
        "2023-02-24"
      ],
      reportDate: [
        "2024-02-21",
        "2023-10-29",
        "2023-01-29"
      ],
      acceptanceDateTime: [
        "2024-02-21T16:05:00.000Z",
        "2023-11-21T16:05:00.000Z",
        "2023-02-24T16:05:00.000Z"
      ],
      act: ["34", "34", "34"],
      form: ["8-K", "10-Q", "10-K"],
      fileNumber: ["001-34756", "001-34756", "001-34756"],
      filmNumber: ["24123456", "23456789", "23012345"],
      items: ["2.02", "", ""],
      size: [12345, 234567, 345678],
      isXBRL: [0, 1, 1],
      isInlineXBRL: [0, 1, 1],
      primaryDocument: [
        "nvda-8k-20240221.htm",
        "nvda-20231029.htm",
        "nvda-20230129.htm"
      ],
      primaryDocDescription: [
        "Form 8-K",
        "Form 10-Q",
        "Form 10-K"
      ]
    }
  }
};

describe('EdgarAdapter', () => {
  let adapter: EdgarAdapter;
  let firecrawl: FirecrawlAdapter;
  let cache: MemoryCache;
  let cleanupFirecrawl: () => void;

  beforeEach(() => {
    cache = new MemoryCache();
    cleanupFirecrawl = setupMockFirecrawlAPI();
    
    // Create Firecrawl adapter
    firecrawl = new FirecrawlAdapter({
      apiKey: 'test-api-key',
      cache,
      debugMode: false
    });
    
    // Create EDGAR adapter with Firecrawl
    adapter = new EdgarAdapter({
      firecrawlAdapter: firecrawl,
      cache,
      debugMode: false
    });
    
    // Mock SEC API responses
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      const urlStr = url.toString();
      
      // Company tickers endpoint
      if (urlStr.includes('company_tickers.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompanyTickers),
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response);
      }
      
      // Company submissions endpoint
      if (urlStr.includes('/submissions/CIK')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompanySubmissions),
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response);
      }
      
      // Let Firecrawl mock handle its endpoints
      return cleanupFirecrawl();
    }) as jest.Mock;
  });

  afterEach(() => {
    cleanupFirecrawl();
    cache.clear();
  });

  describe('getCompanyDescription', () => {
    it('should fetch company description from 10-K filing', async () => {
      const description = await adapter.getCompanyDescription('NVDA');
      
      expect(description).toBeDefined();
      expect(description).toContain('technology company');
    });

    it('should handle missing 10-K filings', async () => {
      // Mock no 10-K in filings
      const noTenK = { ...mockCompanySubmissions };
      noTenK.filings.recent.form = ['8-K', '8-K', '10-Q'];
      
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(noTenK)
        } as Response)
      );
      
      await expect(adapter.getCompanyDescription('NVDA'))
        .rejects.toThrow(/No 10-K filing found/);
    });
  });

  describe('get10K', () => {
    it('should fetch and extract 10-K data', async () => {
      const tenK = await adapter.get10K('NVDA');
      
      expect(tenK).toMatchObject({
        formType: '10-K',
        filingDate: '2023-02-24',
        periodEndDate: '2023-01-29',
        url: expect.stringContaining('sec.gov'),
        // Extracted data from Firecrawl
        businessDescription: expect.any(String),
        riskFactors: expect.any(Array),
        mdAndA: expect.any(String),
        financialHighlights: expect.objectContaining({
          revenue: expect.any(Number),
          netIncome: expect.any(Number),
          eps: expect.any(Number)
        })
      });
    });

    it('should fetch 10-K for specific year', async () => {
      const tenK = await adapter.get10K('NVDA', 2023);
      
      expect(tenK.periodEndDate).toContain('2023');
    });
  });

  describe('get10Q', () => {
    it('should fetch latest 10-Q report', async () => {
      const tenQ = await adapter.get10Q('NVDA');
      
      expect(tenQ).toMatchObject({
        formType: '10-Q',
        filingDate: '2023-11-21',
        periodEndDate: '2023-10-29',
        url: expect.stringContaining('sec.gov')
      });
    });

    it('should fetch 10-Q for specific quarter', async () => {
      const tenQ = await adapter.get10Q('NVDA', '2023Q4');
      
      expect(tenQ.periodEndDate).toContain('2023-10');
    });
  });

  describe('get8K', () => {
    it('should fetch recent 8-K filings', async () => {
      const eightKs = await adapter.get8K('NVDA', 5);
      
      expect(eightKs).toHaveLength(1); // Only one 8-K in mock data
      expect(eightKs[0]).toMatchObject({
        formType: '8-K',
        filingDate: '2024-02-21',
        items: expect.any(Array),
        url: expect.stringContaining('sec.gov')
      });
    });
  });

  describe('getEarningsTranscripts', () => {
    it('should extract earnings-related content from 8-Ks', async () => {
      // Mock scrape response with earnings content
      global.fetch = jest.fn((url: string) => {
        if (url.includes('scrape')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                markdown: `Item 2.02 Results of Operations and Financial Condition
                
                On February 21, 2024, NVIDIA Corporation announced its financial results 
                for the fourth quarter ended January 28, 2024. Revenue was $22.1 billion, 
                up 265% year over year. The company exceeded guidance and raised outlook 
                for the next quarter.`
              }
            })
          } as Response);
        }
        
        // Default mock responses
        if (url.includes('company_tickers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCompanyTickers)
          } as Response);
        }
        
        if (url.includes('submissions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCompanySubmissions)
          } as Response);
        }
        
        return Promise.resolve({
          ok: false,
          status: 404
        } as Response);
      }) as jest.Mock;
      
      const transcripts = await adapter.getEarningsTranscripts('NVDA', 4);
      
      expect(transcripts).toHaveLength(1);
      expect(transcripts[0]).toMatchObject({
        date: '2024-02-21',
        quarter: 'Q1',
        year: 2024,
        content: expect.stringContaining('Results of Operations'),
        keyHighlights: expect.any(Array)
      });
    });
  });

  describe('getFinancialStatements', () => {
    it('should extract financial statements from filings', async () => {
      const statements = await adapter.getFinancialStatements('NVDA');
      
      expect(statements).toMatchObject({
        annual: expect.any(Array),
        quarterly: expect.any(Array)
      });
    });
  });

  describe('getInsiderTrading', () => {
    it('should fetch Form 4 insider trading data', async () => {
      // Mock Form 4 in submissions
      const withForm4 = { ...mockCompanySubmissions };
      withForm4.filings.recent.form.push('4');
      withForm4.filings.recent.filingDate.push('2024-01-15');
      
      global.fetch = jest.fn((url: string) => {
        if (url.includes('submissions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(withForm4)
          } as Response);
        }
        
        if (url.includes('scrape')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                markdown: 'Reporting Person: Jensen Huang\nTransaction: Purchase of 10,000 shares'
              }
            })
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompanyTickers)
        } as Response);
      }) as jest.Mock;
      
      const trades = await adapter.getInsiderTrading('NVDA', 5);
      
      expect(trades).toHaveLength(1);
      expect(trades[0]).toMatchObject({
        filingDate: '2024-01-15',
        reportingPerson: 'Jensen Huang'
      });
    });
  });

  describe('CIK lookup and caching', () => {
    it('should lookup and cache CIK numbers', async () => {
      // First call should hit API
      const spy = jest.spyOn(global, 'fetch');
      await adapter.getCompanyDescription('NVDA');
      
      // Should have called company_tickers.json
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('company_tickers.json'),
        expect.any(Object)
      );
      
      // Second call should use cache
      spy.mockClear();
      await adapter.get10K('NVDA');
      
      // Should not call company_tickers.json again
      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining('company_tickers.json'),
        expect.any(Object)
      );
    });

    it('should handle unknown tickers', async () => {
      await expect(adapter.getCompanyDescription('UNKNOWN'))
        .rejects.toThrow(/not found in SEC database/);
    });
  });

  describe('Filing URL construction', () => {
    it('should construct correct filing URLs', async () => {
      const tenK = await adapter.get10K('NVDA');
      
      expect(tenK.url).toMatch(
        /https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/\d+\/\d+\/[\w-]+\.htm/
      );
    });
  });

  describe('Error handling', () => {
    it('should handle SEC API errors', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response)
      );
      
      await expect(adapter.getCompanyDescription('NVDA'))
        .rejects.toThrow();
    });

    it('should handle Firecrawl extraction errors gracefully', async () => {
      // Mock Firecrawl failure
      firecrawl.extractCompanyProfile = jest.fn()
        .mockRejectedValue(new Error('Extraction failed'));
      
      await expect(adapter.getCompanyDescription('NVDA'))
        .rejects.toThrow(/Extraction failed/);
    });
  });
});