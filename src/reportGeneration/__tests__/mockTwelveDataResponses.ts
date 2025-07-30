// src/reportGeneration/__tests__/mockTwelveDataResponses.ts
// Mock responses for TwelveData API testing
// Context: Enables development without hitting real API

export const mockQuoteResponse = {
  symbol: "NVDA",
  name: "NVIDIA Corporation",
  exchange: "NASDAQ",
  currency: "USD",
  datetime: "2024-01-15",
  timestamp: 1705344000,
  open: "550.00",
  high: "555.00",
  low: "545.00",
  close: "552.50",
  volume: "45000000",
  previous_close: "548.00",
  change: "4.50",
  percent_change: "0.82",
  average_volume: "42000000",
  market_cap: "1364875000000",
  pe: "65.50",
  pb: "35.20",
  dividend_yield: "0.04",
  fifty_two_week: {
    low: "380.00",
    high: "590.00",
    low_change: "172.50",
    high_change: "-37.50",
    low_change_percent: "45.39",
    high_change_percent: "-6.36",
    range: "380.00 - 590.00"
  }
};

export const mockTimeSeriesResponse = {
  meta: {
    symbol: "NVDA",
    interval: "1day",
    currency: "USD",
    exchange_timezone: "America/New_York",
    exchange: "NASDAQ",
    type: "Common Stock"
  },
  values: [
    {
      datetime: "2024-01-15",
      open: "550.00",
      high: "555.00",
      low: "545.00",
      close: "552.50",
      volume: "45000000"
    },
    {
      datetime: "2024-01-12",
      open: "548.00",
      high: "551.00",
      low: "543.00",
      close: "548.00",
      volume: "42000000"
    },
    {
      datetime: "2024-01-11",
      open: "545.00",
      high: "549.00",
      low: "542.00",
      close: "548.00",
      volume: "41000000"
    },
    {
      datetime: "2024-01-10",
      open: "540.00",
      high: "546.00",
      low: "538.00",
      close: "545.00",
      volume: "43000000"
    },
    {
      datetime: "2024-01-09",
      open: "535.00",
      high: "542.00",
      low: "534.00",
      close: "540.00",
      volume: "44000000"
    }
  ],
  status: "ok"
};

export const mockFundamentalsResponse = {
  meta: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    currency: "USD",
    exchange: "NASDAQ"
  },
  income_statement: {
    annual: [
      {
        fiscal_date: "2023-01-31",
        period: "annual",
        revenue: "26914000000",
        gross_profit: "17752000000",
        operating_income: "14523000000",
        net_income: "11936000000",
        eps_basic: "4.82"
      }
    ],
    quarterly: [
      {
        fiscal_date: "2023-10-31",
        period: "quarterly",
        revenue: "18120000000",
        gross_profit: "13408000000",
        operating_income: "10417000000",
        net_income: "9243000000",
        eps_basic: "3.71"
      }
    ]
  },
  balance_sheet: {
    annual: [
      {
        fiscal_date: "2023-01-31",
        period: "annual",
        total_assets: "41182000000",
        total_liabilities: "19081000000",
        shareholders_equity: "22101000000"
      }
    ]
  },
  cash_flow: {
    annual: [
      {
        fiscal_date: "2023-01-31",
        period: "annual",
        operating_cash_flow: "5641000000",
        investing_cash_flow: "-7374000000",
        financing_cash_flow: "1605000000"
      }
    ]
  },
  statistics: {
    valuations_metrics: {
      market_capitalization: 1364875000000,
      enterprise_value: 1356234000000,
      trailing_pe: 65.50,
      forward_pe: 42.30,
      peg_ratio: 1.85,
      price_to_book: 35.20,
      price_to_sales: 28.90,
      enterprise_to_revenue: 28.65,
      enterprise_to_ebitda: 45.20
    },
    financials: {
      current_ratio: 5.34,
      debt_to_equity: 0.32,
      return_on_equity: 0.68,
      return_on_assets: 0.35,
      profit_margin: 0.44,
      operating_margin: 0.54,
      revenue_growth_yoy: 1.22,
      earnings_growth_yoy: 1.65
    }
  }
};

export const mockAnalystRatingsResponse = {
  ratings: [
    {
      date: "2024-01-10",
      firm: "Morgan Stanley",
      analyst_name: "Joseph Moore",
      rating: "Buy",
      rating_change: "Hold",
      price_target: "650",
      price_target_change: "550"
    },
    {
      date: "2024-01-08",
      firm: "Goldman Sachs",
      analyst_name: "Toshiya Hari",
      rating: "Strong Buy",
      price_target: "675"
    },
    {
      date: "2024-01-05",
      firm: "Bank of America",
      analyst_name: "Vivek Arya",
      rating: "Buy",
      price_target: "625"
    },
    {
      date: "2024-01-03",
      firm: "Barclays",
      analyst_name: "Blayne Curtis",
      rating: "Hold",
      price_target: "575"
    },
    {
      date: "2023-12-28",
      firm: "J.P. Morgan",
      analyst_name: "Harlan Sur",
      rating: "Buy",
      price_target: "650"
    }
  ]
};

export const mockTechnicalIndicatorResponse = {
  meta: {
    symbol: "NVDA",
    interval: "1day",
    indicator: "sma",
    time_period: 20
  },
  values: [
    {
      datetime: "2024-01-15",
      sma: "547.25"
    },
    {
      datetime: "2024-01-12",
      sma: "546.80"
    }
  ]
};

export const mockRSIResponse = {
  meta: {
    symbol: "NVDA",
    interval: "1day",
    indicator: "rsi",
    time_period: 14
  },
  values: [
    {
      datetime: "2024-01-15",
      rsi: "68.45"
    },
    {
      datetime: "2024-01-12",
      rsi: "67.20"
    }
  ]
};

export const mockMACDResponse = {
  meta: {
    symbol: "NVDA",
    interval: "1day",
    indicator: "macd"
  },
  values: [
    {
      datetime: "2024-01-15",
      macd: "12.45",
      macd_signal: "10.20",
      macd_hist: "2.25"
    },
    {
      datetime: "2024-01-12",
      macd: "11.80",
      macd_signal: "10.00",
      macd_hist: "1.80"
    }
  ]
};

// Error responses for testing error handling
export const mockRateLimitErrorResponse = {
  status: "error",
  message: "You have exceeded the rate limit of 10946 requests per minute.",
  code: 429
};

export const mockAuthErrorResponse = {
  status: "error",
  message: "Invalid API key. Please check your API key.",
  code: 401
};

export const mockInvalidSymbolResponse = {
  status: "error",
  message: "Symbol not found: INVALID",
  code: 404
};

// Function to mock API calls during testing
export function setupMockTwelveDataAPI() {
  const originalFetch = global.fetch;
  
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    const urlStr = url.toString();
    
    // Check for API key in headers or URL
    const hasApiKey = urlStr.includes('apikey=') || 
                      (options?.headers && 'Authorization' in options.headers);
    
    if (!hasApiKey) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockAuthErrorResponse)
      } as Response);
    }
    
    // Mock quote endpoint
    if (urlStr.includes('/quote')) {
      if (urlStr.includes('symbol=INVALID')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(mockInvalidSymbolResponse)
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuoteResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock time series endpoint
    if (urlStr.includes('/time_series')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTimeSeriesResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock fundamentals endpoint
    if (urlStr.includes('/fundamentals')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFundamentalsResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock analyst ratings endpoint
    if (urlStr.includes('/analyst_ratings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalystRatingsResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Mock technical indicators
    if (urlStr.includes('/sma')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTechnicalIndicatorResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    if (urlStr.includes('/rsi')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRSIResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    if (urlStr.includes('/macd')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMACDResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);
    }
    
    // Default response for unhandled endpoints
    return originalFetch(url, options);
  }) as jest.Mock;
  
  return () => {
    global.fetch = originalFetch;
  };
}

// Helper to simulate rate limit scenarios
export function setupRateLimitedMock() {
  let requestCount = 0;
  const resetTime = Date.now() + 60000; // 1 minute from now
  
  global.fetch = jest.fn(() => {
    requestCount++;
    
    if (requestCount > 5) { // Simulate rate limit after 5 requests
      return Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          ...mockRateLimitErrorResponse,
          reset_at: resetTime
        }),
        headers: new Headers({ 
          'content-type': 'application/json',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(resetTime)
        })
      } as Response);
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockQuoteResponse),
      headers: new Headers({ 
        'content-type': 'application/json',
        'x-ratelimit-remaining': String(5 - requestCount)
      })
    } as Response);
  }) as jest.Mock;
  
  return () => {
    requestCount = 0;
  };
}