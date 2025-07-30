// src/reportGeneration/__tests__/mockFirecrawlResponses.ts
// Mock responses for Firecrawl API testing
// Context: Enables development without hitting real API

export const mockSearchResponse = {
  success: true,
  data: [
    {
      url: 'https://www.reuters.com/technology/nvidia-beats-quarterly-revenue-estimates-2024-01-15/',
      title: 'Nvidia beats quarterly revenue estimates on AI chip demand',
      description: 'Nvidia Corp beat Wall Street estimates for fourth-quarter revenue on strong demand for its chips used in artificial intelligence computing.'
    },
    {
      url: 'https://www.bloomberg.com/news/articles/2024-01-10/nvidia-stock-rises-ai-momentum',
      title: 'Nvidia Stock Rises as AI Momentum Continues to Build',
      description: 'Nvidia shares gained as investors remain optimistic about artificial intelligence growth prospects.'
    },
    {
      url: 'https://www.cnbc.com/2024/01/08/nvidia-ces-announcement.html',
      title: 'Nvidia announces new AI chips at CES 2024',
      description: 'Nvidia unveiled its latest artificial intelligence chips at CES, targeting gaming and data center markets.'
    },
    {
      url: 'https://seekingalpha.com/article/nvidia-guidance-raise-expected',
      title: 'Nvidia Expected to Raise Guidance Amid AI Boom',
      description: 'Analysts expect Nvidia to raise its guidance when it reports earnings, driven by unprecedented AI demand.'
    },
    {
      url: 'https://www.marketwatch.com/story/nvidia-competition-heating-up',
      title: 'Competition Heats Up in AI Chip Market as Rivals Challenge Nvidia',
      description: 'AMD and Intel are ramping up efforts to compete with Nvidia in the lucrative AI chip market.'
    }
  ]
};

export const mockExtractNewsResponse = {
  success: true,
  data: {
    title: 'Nvidia beats quarterly revenue estimates on AI chip demand',
    author: 'Reuters Staff',
    publishedDate: '2024-01-15T14:30:00Z',
    content: `Nvidia Corp beat Wall Street estimates for fourth-quarter revenue on Wednesday and forecast current-quarter revenue above estimates, as demand for its chips used in artificial intelligence computing remained strong.

The company's data center business, which includes AI chips, generated record revenue of $18.4 billion, up 409% from a year earlier. The strong results underscore Nvidia's dominance in AI chips used to develop and deploy generative AI applications like ChatGPT.

"Accelerated computing and generative AI have hit the tipping point. Demand is surging worldwide across companies, industries and nations," CEO Jensen Huang said in a statement.

The company expects first-quarter revenue of $24.0 billion, plus or minus 2%. Analysts on average were expecting revenue of $22.2 billion, according to LSEG data.

Nvidia shares rose 8% in extended trading following the results. The stock has more than tripled in value over the past year, making Nvidia one of the most valuable companies in the world with a market capitalization exceeding $1.3 trillion.

The results come as major tech companies including Microsoft, Amazon, and Google parent Alphabet race to build out their AI infrastructure, driving massive demand for Nvidia's high-end graphics processing units (GPUs).`,
    summary: 'Nvidia Corp beat Wall Street estimates for fourth-quarter revenue and forecast current-quarter revenue above estimates, driven by surging demand for its AI chips.',
    sentiment: 'positive',
    keyTopics: ['earnings beat', 'AI chips', 'data center growth', 'revenue guidance', 'market leadership'],
    quotes: [
      {
        speaker: 'Jensen Huang',
        quote: 'Accelerated computing and generative AI have hit the tipping point. Demand is surging worldwide across companies, industries and nations.'
      }
    ]
  },
  creditsUsed: 5
};

export const mockExtractCompanyProfileResponse = {
  success: true,
  data: {
    companyName: 'NVIDIA Corporation',
    description: 'NVIDIA Corporation is a technology company that designs and manufactures graphics processing units (GPUs) and system-on-chip units (SoCs) for gaming, professional visualization, data center, and automotive markets.',
    industry: 'Semiconductors',
    founded: '1993',
    headquarters: 'Santa Clara, California, USA',
    employees: 26196,
    website: 'https://www.nvidia.com',
    executives: [
      {
        name: 'Jensen Huang',
        title: 'President and Chief Executive Officer'
      },
      {
        name: 'Colette Kress',
        title: 'Executive Vice President and Chief Financial Officer'
      },
      {
        name: 'Jay Puri',
        title: 'Executive Vice President, Worldwide Field Operations'
      }
    ]
  }
};

export const mockExtractFinancialFilingResponse = {
  success: true,
  data: {
    formType: '10-K',
    filingDate: '2023-02-24T00:00:00Z',
    periodEndDate: '2023-01-29T00:00:00Z',
    businessDescription: `NVIDIA Corporation is a technology company focused on accelerated computing. We engage in the design and manufacture of computer graphics processors, chipsets, and related multimedia software. 

Our GPU product brands are aimed at specialized markets including GeForce for gamers; Quadro for designers; Tesla and DGX for AI researchers and data scientists; and GRID for cloud-based visual computing.

Our two reportable segments are Graphics and Compute & Networking. Our Graphics segment includes GeForce GPUs for gaming and PCs, the GeForce NOW game streaming service, Quadro GPUs for workstations, and automotive platforms. Our Compute & Networking segment includes Data Center platforms, networking products, and automotive AI Cockpit and autonomous driving development platforms.`,
    riskFactors: [
      'Competition from other technology companies developing AI chips',
      'Dependence on third-party manufacturers and suppliers',
      'Regulatory challenges in key markets including China',
      'Rapid technological change requiring continuous innovation',
      'Concentration of revenue from a limited number of customers'
    ],
    mdAndA: `Fiscal year 2023 was a record year with revenue of $26.97 billion, up 0% from fiscal year 2022. Data Center revenue was a record $15.01 billion, up 41%, driven by strong demand for AI computing. Gaming revenue was $9.07 billion, down 27% from the prior year due to challenging market conditions.

We expect continued growth in AI-related revenue as enterprises accelerate their AI initiatives. Our next-generation products position us well to capture this opportunity. We are investing heavily in research and development to maintain our technology leadership.`,
    financialHighlights: {
      revenue: 26974000000,
      netIncome: 4368000000,
      eps: 1.74,
      totalAssets: 41182000000,
      totalLiabilities: 19578000000
    }
  }
};

export const mockScrapeResponse = {
  success: true,
  data: {
    url: 'https://investor.nvidia.com/news/news-details/2024/NVIDIA-Announces-Financial-Results',
    content: 'Full text content of the page...',
    markdown: `# NVIDIA Announces Financial Results for Fourth Quarter and Fiscal 2024

**Record quarterly revenue of $22.1 billion, up 22% from Q3, up 265% from year ago**

**Record quarterly Data Center revenue of $18.4 billion, up 27% from Q3, up 409% from year ago**

SANTA CLARA, Calif., Feb. 21, 2024 - NVIDIA Corporation (NASDAQ: NVDA) today reported revenue for the fourth quarter ended January 28, 2024, of $22.1 billion, up 22% from the previous quarter and up 265% year on year.

## GAAP Results

- Revenue: $22.1 billion
- Gross Margin: 73.0%
- Operating Income: $13.6 billion
- Net Income: $12.3 billion
- Diluted EPS: $4.93`,
    metadata: {
      title: 'NVIDIA Announces Financial Results for Fourth Quarter and Fiscal 2024',
      description: 'NVIDIA reports record quarterly revenue driven by AI demand',
      publishedTime: '2024-02-21T21:05:00Z',
      author: 'NVIDIA Investor Relations'
    }
  }
};

// Error response mocks
export const mockRateLimitErrorResponse = {
  success: false,
  error: 'Rate limit exceeded. Please try again later.',
  creditsUsed: 0
};

export const mockInvalidUrlErrorResponse = {
  success: false,
  error: 'Invalid URL provided',
  creditsUsed: 0
};

export const mockTimeoutErrorResponse = {
  success: false,
  error: 'Request timed out while loading page',
  creditsUsed: 1
};

// Helper function to setup mock Firecrawl API
export function setupMockFirecrawlAPI() {
  const originalFetch = global.fetch;
  
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    const urlStr = url.toString();
    
    // Check for API key
    const hasApiKey = options?.headers && 
      (options.headers as any)['Authorization']?.includes('Bearer');
    
    if (!hasApiKey) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'Unauthorized. Please provide a valid API key.' 
        })
      } as Response);
    }
    
    // Parse request body
    const body = options?.body ? JSON.parse(options.body as string) : {};
    
    // Mock search endpoint
    if (urlStr.includes('/search')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock extract endpoint
    if (urlStr.includes('/extract')) {
      // Return different responses based on URL or schema
      if (body.url?.includes('nvidia-beats-quarterly')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExtractNewsResponse),
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response);
      }
      
      if (body.schema?.properties?.companyName) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExtractCompanyProfileResponse),
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response);
      }
      
      if (body.schema?.properties?.formType) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExtractFinancialFilingResponse),
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response);
      }
      
      // Default extract response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExtractNewsResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock scrape endpoint
    if (urlStr.includes('/scrape')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockScrapeResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Default response
    return originalFetch(url, options);
  }) as jest.Mock;
  
  return () => {
    global.fetch = originalFetch;
  };
}

// Mock news articles for testing
export const mockNewsArticles = [
  {
    title: 'Nvidia beats quarterly revenue estimates on AI chip demand',
    url: 'https://www.reuters.com/nvidia-earnings',
    source: 'Reuters',
    publishedDate: '2024-01-15T14:30:00Z',
    summary: 'Nvidia Corp beat Wall Street estimates for fourth-quarter revenue.',
    sentiment: 'positive' as const,
    relevanceScore: 0.95
  },
  {
    title: 'Competition Heats Up in AI Chip Market',
    url: 'https://www.marketwatch.com/nvidia-competition',
    source: 'MarketWatch',
    publishedDate: '2024-01-12T10:00:00Z',
    summary: 'AMD and Intel are ramping up efforts to compete with Nvidia.',
    sentiment: 'negative' as const,
    relevanceScore: 0.7
  },
  {
    title: 'Nvidia Announces New AI Products at CES',
    url: 'https://www.cnbc.com/nvidia-ces',
    source: 'CNBC',
    publishedDate: '2024-01-08T18:00:00Z',
    summary: 'Nvidia unveiled its latest AI chips at CES 2024.',
    sentiment: 'neutral' as const,
    relevanceScore: 0.8
  }
];

// Mock SEC filing data
export const mockSECFilings = {
  '10-K': {
    accessionNumber: '0001045810-23-000027',
    filingDate: '2023-02-24',
    formType: '10-K',
    periodEndDate: '2023-01-29',
    documents: [
      {
        documentType: '10-K',
        documentName: 'nvda-20230129.htm',
        description: 'Form 10-K'
      }
    ]
  },
  '10-Q': {
    accessionNumber: '0001045810-23-000090',
    filingDate: '2023-11-21',
    formType: '10-Q',
    periodEndDate: '2023-10-29',
    documents: [
      {
        documentType: '10-Q',
        documentName: 'nvda-20231029.htm',
        description: 'Form 10-Q'
      }
    ]
  },
  '8-K': {
    accessionNumber: '0001045810-24-000012',
    filingDate: '2024-02-21',
    formType: '8-K',
    reportDate: '2024-02-21',
    documents: [
      {
        documentType: '8-K',
        documentName: 'nvda-8k-20240221.htm',
        description: 'Form 8-K - Earnings Release'
      }
    ]
  }
};