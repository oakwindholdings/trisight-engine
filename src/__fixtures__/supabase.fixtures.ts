// src/__fixtures__/supabase.fixtures.ts
// Test fixtures for Supabase data
// Context: Mock data for testing database operations

export const mockReports = [
  {
    id: 'report-001',
    title: 'Apple Inc. Q4 2024 Equity Analysis',
    ticker: 'AAPL',
    template: 'equity-research',
    format: 'pdf',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    file_size: 245760, // 240 KB
    storage_path: 'reports/report-001.pdf',
    metadata: {
      author: 'Test Analyst',
      totalSlides: 6,
      generatedAt: new Date().toISOString(),
      dataSources: ['market-data', 'financial-statements', 'news', 'ai-analysis']
    },
    data: {
      slides: [
        {
          slideNumber: 1,
          title: 'Title Slide',
          layout: 'title',
          content: [
            { type: 'title', text: 'Apple Inc. Q4 2024 Equity Analysis' },
            { type: 'subtitle', text: 'Investment Research Report' }
          ]
        },
        {
          slideNumber: 2,
          title: 'Executive Summary',
          layout: 'content',
          content: [
            {
              type: 'bullets',
              items: [
                'Strong revenue growth driven by iPhone 15 sales',
                'Services segment showing consistent expansion',
                'Emerging markets providing growth opportunities',
                'AI integration enhancing product ecosystem'
              ]
            }
          ]
        }
      ],
      companyData: {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics'
      }
    }
  },
  {
    id: 'report-002',
    title: 'NVIDIA Technical Analysis Report',
    ticker: 'NVDA',
    template: 'technical-analysis',
    format: 'pptx',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    file_size: 512000, // 500 KB
    storage_path: 'reports/report-002.pptx',
    metadata: {
      author: 'Technical Analyst',
      totalSlides: 8,
      generatedAt: new Date(Date.now() - 86400000).toISOString(),
      dataSources: ['market-data', 'pattern-detection']
    }
  },
  {
    id: 'report-003',
    title: 'Tesla Risk Assessment',
    ticker: 'TSLA',
    template: 'risk-assessment',
    format: 'pdf',
    status: 'completed',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    file_size: 184320, // 180 KB
    storage_path: null, // No file stored, will generate client-side
    metadata: {
      author: 'Risk Analyst',
      totalSlides: 5,
      generatedAt: new Date(Date.now() - 172800000).toISOString(),
      dataSources: ['market-data', 'news', 'risk-factors']
    }
  }
];

export const mockTemplates = [
  {
    id: 'equity-research',
    name: 'Equity Research',
    description: 'Comprehensive investment analysis with financial metrics and recommendations',
    icon: 'LineChart',
    slides: 6,
    dataSources: ['market-data', 'financial-statements', 'news', 'ai-analysis']
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Chart patterns, indicators, and trading signals analysis',
    icon: 'CandlestickChart',
    slides: 8,
    dataSources: ['market-data', 'pattern-detection']
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Risk factors, mitigation strategies, and scenario analysis',
    icon: 'Shield',
    slides: 5,
    dataSources: ['market-data', 'news', 'risk-factors']
  },
  {
    id: 'quick-take',
    name: 'Quick Take',
    description: '2-page summary with key insights and recommendations',
    icon: 'Zap',
    slides: 2,
    dataSources: ['market-data', 'ai-analysis']
  }
];

export const mockDataSources = [
  {
    id: 'market-data',
    name: 'Market Data',
    description: 'Real-time and historical price data',
    enabled: true
  },
  {
    id: 'financial-statements',
    name: 'Financial Statements',
    description: 'Income statements, balance sheets, cash flow',
    enabled: true
  },
  {
    id: 'news',
    name: 'News & Sentiment',
    description: 'Latest news and market sentiment analysis',
    enabled: true
  },
  {
    id: 'pattern-detection',
    name: 'Pattern Detection',
    description: 'Technical patterns and trading signals',
    enabled: true
  },
  {
    id: 'ai-analysis',
    name: 'AI Analysis',
    description: 'AI-powered insights and predictions',
    enabled: true
  },
  {
    id: 'risk-factors',
    name: 'Risk Factors',
    description: 'Market and company-specific risks',
    enabled: true
  }
];

export const mockSchedules = [
  {
    id: 'schedule-001',
    title: 'Daily FAANG Reports',
    tickers: ['AAPL', 'AMZN', 'NFLX', 'GOOGL', 'META'],
    template: 'quick-take',
    frequency: 'daily',
    time: '09:00',
    timezone: 'America/New_York',
    enabled: true,
    lastRun: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    nextRun: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
    created_at: new Date(Date.now() - 604800000).toISOString() // 1 week ago
  },
  {
    id: 'schedule-002',
    title: 'Weekly Tech Sector Analysis',
    tickers: ['NVDA', 'AMD', 'INTC', 'QCOM'],
    template: 'technical-analysis',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    time: '16:00',
    timezone: 'America/New_York',
    enabled: false,
    lastRun: null,
    nextRun: null,
    created_at: new Date(Date.now() - 1209600000).toISOString() // 2 weeks ago
  }
];

export const mockApiResponses = {
  generateReport: {
    success: true,
    reportId: 'report-new-001',
    data: {
      slides: Array(6).fill(null).map((_, i) => ({
        slideNumber: i + 1,
        title: `Slide ${i + 1}`,
        layout: i === 0 ? 'title' : 'content',
        content: []
      })),
      companyData: {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics'
      },
      metadata: {
        format: 'pdf',
        totalSlides: 6,
        generatedAt: new Date().toISOString()
      }
    }
  },
  
  generateReportError: {
    success: false,
    error: {
      message: 'TwelveData API rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  
  downloadReport: {
    success: true,
    data: {
      url: 'https://storage.example.com/reports/report-001.pdf',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }
  }
};

// Helper function to create mock report
export function createMockReport(overrides?: Partial<typeof mockReports[0]>) {
  const baseReport = { ...mockReports[0] };
  return {
    ...baseReport,
    ...overrides,
    id: overrides?.id || `report-${Date.now()}`,
    created_at: overrides?.created_at || new Date().toISOString(),
    updated_at: overrides?.updated_at || new Date().toISOString()
  };
}

// Helper function to create mock schedule
export function createMockSchedule(overrides?: Partial<typeof mockSchedules[0]>) {
  const baseSchedule = { ...mockSchedules[0] };
  return {
    ...baseSchedule,
    ...overrides,
    id: overrides?.id || `schedule-${Date.now()}`,
    created_at: overrides?.created_at || new Date().toISOString()
  };
}