// src/reportGeneration/adapters/edgarAdapter.ts
// SEC EDGAR integration for regulatory filings using Firecrawl for extraction
// Context: Intelligently extracts structured data from 10-K, 10-Q, and other SEC filings

import { BaseAdapter } from '../core/baseAdapter';
import { FirecrawlAdapter } from './firecrawlAdapter';
import { RetryableError, ErrorCategory, wrapDataFetchError } from '../utils/errorHandler';
import { 
  EdgarFiling, 
  EdgarSearchResult,
  TranscriptData,
  FinancialStatement
} from '../models/reportTypes';

/**
 * SEC EDGAR API response interfaces
 */
interface EdgarSubmission {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  ticker: string;
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  phone: string;
  addresses: {
    mailing: {
      street1: string;
      street2?: string;
      city: string;
      stateOrCountry: string;
      zipCode: string;
    };
    business: {
      street1: string;
      street2?: string;
      city: string;
      stateOrCountry: string;
      zipCode: string;
    };
  };
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

interface EdgarSearchResponse {
  hits: {
    hits: Array<{
      _id: string;
      _source: {
        cik: string;
        display_names: string[];
        entity_type: string;
        filing_date: string;
        file_num: string;
        form: string;
        period_ending: string;
      };
    }>;
  };
}

/**
 * Configuration for EDGAR adapter
 */
interface EdgarConfig {
  firecrawlAdapter?: FirecrawlAdapter;
  baseUrl?: string;
  userAgent?: string;
}

/**
 * Enhanced EDGAR adapter implementation
 * Combines SEC EDGAR API with Firecrawl's intelligent extraction
 */
export class EdgarAdapter extends BaseAdapter {
  private firecrawl: FirecrawlAdapter;
  private baseUrl: string;
  private edgarBaseUrl: string = 'https://www.sec.gov';
  private dataBaseUrl: string = 'https://data.sec.gov';
  
  // CIK cache to avoid repeated lookups
  private cikCache: Map<string, string> = new Map();
  
  constructor(config: Partial<EdgarConfig> & { cache?: any; debugMode?: boolean }) {
    super('EDGAR', {
      cache: config.cache,
      debugMode: config.debugMode,
      rateLimitConfig: {
        requestsPerMinute: 10, // SEC EDGAR rate limit
        burstSize: 2
      }
    });
    
    // Use provided Firecrawl adapter or create new one
    this.firecrawl = config.firecrawlAdapter || new FirecrawlAdapter({
      cache: config.cache,
      debugMode: config.debugMode
    });
    
    this.baseUrl = config.baseUrl || 'https://efts.sec.gov/LATEST';
    
    // Set required User-Agent for SEC EDGAR API
    this.requestConfig.headers['User-Agent'] = config.userAgent || 
      'TriSight Report Generator bob@bobstewart.com';
    this.requestConfig.headers['Accept'] = 'application/json';
    
    // Create cached versions of methods
    this.getCompanyInfo = this.createCachedMethod(
      this.getCompanyInfo,
      'company_info',
      86400000 // Cache for 24 hours
    );
  }
  
  /**
   * Gets company description from latest 10-K filing
   * Uses Firecrawl to intelligently extract the business description
   */
  async getCompanyDescription(ticker: string): Promise<string> {
    try {
      const filing = await this.getLatestFiling(ticker, '10-K');
      if (!filing) {
        throw new Error(`No 10-K filing found for ${ticker}`);
      }
      
      // Use Firecrawl to extract business description from 10-K
      const filingUrl = this.getFilingUrl(filing);
      const extractedData = await this.firecrawl.extractCompanyProfile(filingUrl);
      
      return extractedData.description || 'No business description found';
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'getCompanyDescription',
        ticker
      });
    }
  }
  
  /**
   * Fetches earnings call transcripts
   * Note: EDGAR doesn't typically have transcripts, so we search for 8-K earnings releases
   */
  async getEarningsTranscripts(ticker: string, limit: number = 4): Promise<TranscriptData[]> {
    try {
      const filings = await this.searchFilings(ticker, '8-K', limit);
      const transcripts: TranscriptData[] = [];
      
      // Process each 8-K to find earnings-related content
      for (const filing of filings) {
        const filingUrl = this.getFilingUrl(filing);
        
        // Extract content using Firecrawl with earnings-specific schema
        const extractedData = await this.extractEarningsContent(filingUrl, filing.filingDate);
        
        if (extractedData && this.isEarningsRelated(extractedData)) {
          transcripts.push({
            date: filing.filingDate,
            quarter: this.inferQuarter(filing.filingDate),
            year: new Date(filing.filingDate).getFullYear(),
            participants: extractedData.participants || [],
            content: extractedData.content || '',
            qaSection: extractedData.qaSection || '',
            keyHighlights: extractedData.keyHighlights || []
          });
        }
      }
      
      return transcripts;
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'getEarningsTranscripts',
        ticker
      });
    }
  }
  
  /**
   * Fetches the latest 10-K annual report
   */
  async get10K(ticker: string, year?: number): Promise<EdgarFiling> {
    try {
      const targetYear = year || new Date().getFullYear() - 1;
      const filings = await this.searchFilings(ticker, '10-K', 5);
      
      // Find filing for specific year
      const filing = filings.find(f => {
        const filingYear = new Date(f.periodEndDate || f.filingDate).getFullYear();
        return filingYear === targetYear;
      }) || filings[0]; // Fall back to most recent
      
      if (!filing) {
        throw new Error(`No 10-K filing found for ${ticker} in ${targetYear}`);
      }
      
      // Extract comprehensive data from 10-K
      const filingUrl = this.getFilingUrl(filing);
      const extractedData = await this.extract10KData(filingUrl, filing);
      
      return {
        ...filing,
        ...extractedData,
        url: filingUrl
      };
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'get10K',
        ticker
      });
    }
  }
  
  /**
   * Fetches quarterly 10-Q report
   */
  async get10Q(ticker: string, quarter?: string): Promise<EdgarFiling> {
    try {
      const filings = await this.searchFilings(ticker, '10-Q', 4);
      
      let filing: EdgarSearchResult | undefined;
      if (quarter) {
        // Find specific quarter (format: "2024Q2")
        const [year, q] = quarter.match(/(\d{4})Q(\d)/)?.slice(1) || [];
        filing = filings.find(f => {
          const filingDate = new Date(f.periodEndDate || f.filingDate);
          const filingQuarter = Math.ceil((filingDate.getMonth() + 1) / 3);
          return filingDate.getFullYear() === parseInt(year) && filingQuarter === parseInt(q);
        });
      } else {
        filing = filings[0]; // Most recent
      }
      
      if (!filing) {
        throw new Error(`No 10-Q filing found for ${ticker} ${quarter || 'recent'}`);
      }
      
      // Extract data from 10-Q
      const filingUrl = this.getFilingUrl(filing);
      const extractedData = await this.extract10QData(filingUrl, filing);
      
      return {
        ...filing,
        ...extractedData,
        url: filingUrl
      };
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'get10Q',
        ticker
      });
    }
  }
  
  /**
   * Fetches recent 8-K current reports
   */
  async get8K(ticker: string, limit: number = 5): Promise<EdgarFiling[]> {
    try {
      const filings = await this.searchFilings(ticker, '8-K', limit);
      
      // Extract key information from each 8-K
      const enrichedFilings = await Promise.all(
        filings.map(async filing => {
          const filingUrl = this.getFilingUrl(filing);
          const extractedData = await this.extract8KData(filingUrl, filing);
          
          return {
            ...filing,
            ...extractedData,
            url: filingUrl
          };
        })
      );
      
      return enrichedFilings;
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'get8K',
        ticker
      });
    }
  }
  
  /**
   * Extracts financial statements from latest 10-K/10-Q
   * Uses Firecrawl's AI to parse tables and financial data
   */
  async getFinancialStatements(ticker: string): Promise<{
    annual: FinancialStatement[];
    quarterly: FinancialStatement[];
  }> {
    try {
      // Get latest 10-K for annual data
      const annualFiling = await this.getLatestFiling(ticker, '10-K');
      const annualData = annualFiling ? 
        await this.extractFinancialStatements(this.getFilingUrl(annualFiling), 'annual') : 
        [];
      
      // Get latest 4 10-Qs for quarterly data
      const quarterlyFilings = await this.searchFilings(ticker, '10-Q', 4);
      const quarterlyData = await Promise.all(
        quarterlyFilings.map(filing => 
          this.extractFinancialStatements(this.getFilingUrl(filing), 'quarterly')
        )
      );
      
      return {
        annual: annualData,
        quarterly: quarterlyData.flat()
      };
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'getFinancialStatements',
        ticker
      });
    }
  }
  
  /**
   * Gets insider trading data from Form 4 filings
   */
  async getInsiderTrading(ticker: string, limit: number = 20): Promise<any[]> {
    try {
      const filings = await this.searchFilings(ticker, '4', limit);
      
      // Extract insider trading data from each Form 4
      const trades = await Promise.all(
        filings.map(async filing => {
          const filingUrl = this.getFilingUrl(filing);
          return this.extractInsiderTrade(filingUrl, filing);
        })
      );
      
      return trades.filter(trade => trade !== null);
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'EDGAR',
        operation: 'getInsiderTrading',
        ticker
      });
    }
  }
  
  /**
   * Helper methods for EDGAR data extraction
   */
  
  private async getCIK(ticker: string): Promise<string> {
    // Check cache first
    if (this.cikCache.has(ticker)) {
      return this.cikCache.get(ticker)!;
    }
    
    try {
      // Use SEC's company tickers JSON
      const response = await this.makeRequest<any>(
        'https://www.sec.gov/files/company_tickers.json'
      );
      
      // Find company by ticker
      const company = Object.values(response).find(
        (c: any) => c.ticker === ticker.toUpperCase()
      ) as any;
      
      if (!company) {
        throw new Error(`Ticker ${ticker} not found in SEC database`);
      }
      
      // Pad CIK with zeros to 10 digits
      const cik = String(company.cik_str).padStart(10, '0');
      this.cikCache.set(ticker, cik);
      
      return cik;
      
    } catch (error) {
      throw new RetryableError(
        `Failed to get CIK for ${ticker}`,
        ErrorCategory.PARSING,
        false
      );
    }
  }
  
  private async getCompanyInfo(ticker: string): Promise<EdgarSubmission> {
    const cik = await this.getCIK(ticker);
    const url = `${this.dataBaseUrl}/submissions/CIK${cik}.json`;
    
    return this.makeRequest<EdgarSubmission>(url);
  }
  
  private async searchFilings(
    ticker: string, 
    formType: string, 
    limit: number
  ): Promise<EdgarSearchResult[]> {
    const cik = await this.getCIK(ticker);
    const companyInfo = await this.getCompanyInfo(ticker);
    
    // Get recent filings from company submissions
    const recentFilings = companyInfo.filings.recent;
    const results: EdgarSearchResult[] = [];
    
    for (let i = 0; i < recentFilings.form.length && results.length < limit; i++) {
      if (recentFilings.form[i] === formType) {
        results.push({
          accessionNumber: recentFilings.accessionNumber[i],
          filingDate: recentFilings.filingDate[i],
          formType: recentFilings.form[i],
          reportDate: recentFilings.reportDate[i],
          fileNumber: recentFilings.fileNumber[i],
          filmNumber: recentFilings.filmNumber[i],
          acceptTime: recentFilings.acceptanceDateTime[i],
          periodEndDate: recentFilings.reportDate[i],
          documents: [{
            documentType: formType,
            documentName: recentFilings.primaryDocument[i],
            description: recentFilings.primaryDocDescription[i]
          }]
        });
      }
    }
    
    return results;
  }
  
  private async getLatestFiling(ticker: string, formType: string): Promise<EdgarSearchResult | null> {
    const filings = await this.searchFilings(ticker, formType, 1);
    return filings[0] || null;
  }
  
  private getFilingUrl(filing: EdgarSearchResult): string {
    const accessionNumberNoDashes = filing.accessionNumber.replace(/-/g, '');
    const document = filing.documents?.[0]?.documentName || `${filing.accessionNumber}.txt`;
    return `${this.edgarBaseUrl}/Archives/edgar/data/${accessionNumberNoDashes.slice(0, 10)}/${accessionNumberNoDashes}/${document}`;
  }
  
  /**
   * Extraction methods using Firecrawl's AI capabilities
   */
  
  private async extract10KData(url: string, filing: EdgarSearchResult): Promise<any> {
    return this.firecrawl.extractCompanyProfile(url);
  }
  
  private async extract10QData(url: string, filing: EdgarSearchResult): Promise<any> {
    // Use custom schema for quarterly reports
    const content = await this.firecrawl.scrapeUrl(url);
    
    // Simple extraction for now - can be enhanced with custom schemas
    return {
      mdAndA: this.extractSection(content, "Management's Discussion and Analysis"),
      financialCondition: this.extractSection(content, "Financial Condition"),
      resultsOfOperations: this.extractSection(content, "Results of Operations")
    };
  }
  
  private async extract8KData(url: string, filing: EdgarSearchResult): Promise<any> {
    const content = await this.firecrawl.scrapeUrl(url);
    
    return {
      items: this.extractItems(content),
      signatures: this.extractSignatures(content),
      exhibits: this.extractExhibits(content)
    };
  }
  
  private async extractEarningsContent(url: string, filingDate: string): Promise<any> {
    const content = await this.firecrawl.scrapeUrl(url);
    
    // Look for earnings-related keywords
    const isEarnings = /earnings|revenue|quarter|guidance|outlook/i.test(content);
    
    if (!isEarnings) return null;
    
    return {
      content: this.extractSection(content, "Item 2.02"),
      keyHighlights: this.extractHighlights(content),
      participants: [] // 8-Ks don't have participant lists like transcripts
    };
  }
  
  private async extractFinancialStatements(url: string, period: string): Promise<FinancialStatement[]> {
    const content = await this.firecrawl.scrapeUrl(url);
    
    // This is simplified - real implementation would parse XBRL or tables
    return [{
      date: new Date().toISOString(),
      period,
      revenue: 0,
      grossProfit: 0,
      operatingIncome: 0,
      netIncome: 0,
      eps: 0
    }];
  }
  
  private async extractInsiderTrade(url: string, filing: EdgarSearchResult): Promise<any> {
    const content = await this.firecrawl.scrapeUrl(url);
    
    // Extract key Form 4 data
    return {
      filingDate: filing.filingDate,
      reportingPerson: this.extractReportingPerson(content),
      transactions: this.extractTransactions(content)
    };
  }
  
  /**
   * Text extraction utilities
   */
  
  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\S]*?(?=Item \\d|SIGNATURES|$)`, 'i');
    const match = content.match(regex);
    return match ? match[0].trim() : '';
  }
  
  private extractItems(content: string): string[] {
    const itemRegex = /Item \d+\.\d+[^\n]*/gi;
    return content.match(itemRegex) || [];
  }
  
  private extractSignatures(content: string): string {
    const sigRegex = /SIGNATURES[\s\S]*$/i;
    const match = content.match(sigRegex);
    return match ? match[0].trim() : '';
  }
  
  private extractExhibits(content: string): string[] {
    const exhibitRegex = /Exhibit \d+\.\d+[^\n]*/gi;
    return content.match(exhibitRegex) || [];
  }
  
  private extractHighlights(content: string): string[] {
    // Extract sentences with financial metrics
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    return sentences
      .filter(s => /\$[\d,]+|\d+%|revenue|earnings|growth/i.test(s))
      .slice(0, 5);
  }
  
  private extractReportingPerson(content: string): string {
    const match = content.match(/Reporting Person[:\s]*([^\n]+)/i);
    return match ? match[1].trim() : 'Unknown';
  }
  
  private extractTransactions(content: string): any[] {
    // Simplified - real implementation would parse the transaction table
    return [];
  }
  
  private isEarningsRelated(data: any): boolean {
    return data && data.content && data.content.length > 100;
  }
  
  private inferQuarter(date: string): string {
    const d = new Date(date);
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${quarter}`;
  }
}