// e2e/fixtures/test-data.ts
// Test data fixtures for E2E tests
// Context: Provides consistent test data across tests

export const TEST_TICKERS = {
  VALID: {
    NVDA: {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      sector: 'Technology',
      industry: 'Semiconductors'
    },
    AAPL: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    MSFT: {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software'
    }
  },
  INVALID: ['INVALID123', 'XXX', '12345', 'TEST_FAIL']
};

export const REPORT_CONFIGS = {
  QUICK_TECHNICAL: {
    reportType: 'technical_analysis',
    timeframe: '1M',
    includeCharts: true,
    chartTypes: ['candlestick', 'volume'],
    outputFormat: 'pdf',
    confidentiality: 'internal'
  },
  DETAILED_EQUITY: {
    reportType: 'equity_research',
    timeframe: '1Y',
    includeCharts: true,
    chartTypes: ['candlestick', 'line', 'bar'],
    outputFormat: 'pdf',
    includeSections: [
      'overview',
      'financials',
      'technicals',
      'valuation',
      'risks',
      'catalysts'
    ],
    confidentiality: 'confidential'
  },
  EARNINGS_PREVIEW: {
    reportType: 'earnings_preview',
    timeframe: '3M',
    includeCharts: true,
    chartTypes: ['line', 'bar'],
    outputFormat: 'pptx',
    includeSections: [
      'earnings-history',
      'estimates',
      'guidance',
      'key-metrics'
    ],
    confidentiality: 'public'
  }
};

export const TEST_USERS = {
  DEFAULT: {
    name: 'QA Tester',
    email: 'qa@trisight.test',
    role: 'analyst'
  },
  ADMIN: {
    name: 'Admin User',
    email: 'admin@trisight.test',
    role: 'admin'
  }
};

export const EXPECTED_CONTENT = {
  NVDA_TECHNICAL: {
    slides: {
      min: 8,
      max: 15
    },
    charts: ['candlestick', 'volume', 'technical-indicators'],
    sections: [
      'Company Overview',
      'Price Analysis',
      'Technical Indicators',
      'Volume Analysis',
      'Pattern Recognition',
      'Support & Resistance',
      'Investment Thesis'
    ],
    metrics: {
      sma20: { min: 150, max: 200 },
      sma50: { min: 140, max: 190 },
      sma200: { min: 130, max: 180 },
      rsi: { min: 30, max: 70 }
    }
  },
  FINANCIAL_METRICS: {
    required: [
      'marketCap',
      'peRatio',
      'revenue',
      'netIncome',
      'eps'
    ],
    optional: [
      'dividendYield',
      'roe',
      'roa',
      'debtToEquity'
    ]
  }
};

export const ERROR_MESSAGES = {
  INVALID_TICKER: 'Invalid ticker symbol',
  API_RATE_LIMIT: 'API rate limit exceeded',
  GENERATION_FAILED: 'Failed to generate report',
  STORAGE_FULL: 'Storage quota exceeded',
  NETWORK_ERROR: 'Network connection failed'
};

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  GENERATION: 60000
};

export const FILE_SIZES = {
  PDF: {
    MIN: 10 * 1024,  // 10 KB minimum
    MAX: 10 * 1024 * 1024  // 10 MB maximum
  },
  PPTX: {
    MIN: 50 * 1024,  // 50 KB minimum
    MAX: 20 * 1024 * 1024  // 20 MB maximum
  }
};

// Helper function to generate test report title
export function generateTestTitle(ticker: string, type: string): string {
  const date = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const typeNames: Record<string, string> = {
    technical_analysis: 'Technical Analysis',
    earnings_preview: 'Earnings Preview',
    equity_research: 'Equity Research'
  };
  
  return `${ticker} ${typeNames[type] || type} - ${date}`;
}

// Helper function to validate report metadata
export function validateReportMetadata(metadata: any): boolean {
  const required = ['generatedAt', 'version', 'author', 'confidentialityLevel'];
  return required.every(field => field in metadata);
}

// Helper function to create mock API responses
export function createMockQuoteResponse(ticker: string) {
  const mockData = TEST_TICKERS.VALID[ticker as keyof typeof TEST_TICKERS.VALID];
  
  return {
    symbol: ticker,
    name: mockData?.name || 'Test Company',
    close: (150 + Math.random() * 50).toFixed(2),
    change: (Math.random() * 10 - 5).toFixed(2),
    percent_change: (Math.random() * 5 - 2.5).toFixed(2),
    volume: Math.floor(10000000 + Math.random() * 5000000),
    timestamp: Date.now() / 1000
  };
}

// Test data for filtering and searching
export const BULK_TEST_REPORTS = Array.from({ length: 50 }, (_, i) => ({
  id: `test_report_${i}`,
  ticker: Object.keys(TEST_TICKERS.VALID)[i % 3],
  title: generateTestTitle(
    Object.keys(TEST_TICKERS.VALID)[i % 3],
    Object.keys(REPORT_CONFIGS)[i % 3]
  ),
  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  status: ['completed', 'draft', 'archived'][i % 3],
  size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
  author: Object.values(TEST_USERS)[i % 2].name
}));