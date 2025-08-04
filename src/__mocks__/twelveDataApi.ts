// src/__mocks__/twelveDataApi.ts
// Mock for TwelveData API
// Context: Provides mock data for testing without real API calls

export const mockHistoricalData = [
  {
    datetime: '2024-01-01 09:30:00',
    open: 100,
    high: 102,
    low: 99,
    close: 101,
    volume: 1000000
  },
  {
    datetime: '2024-01-01 09:31:00',
    open: 101,
    high: 103,
    low: 100.5,
    close: 102.5,
    volume: 1100000
  },
  {
    datetime: '2024-01-01 09:32:00',
    open: 102.5,
    high: 104,
    low: 102,
    close: 103.5,
    volume: 1200000
  }
];

export const mockQuoteData = {
  symbol: 'AAPL',
  name: 'Apple Inc',
  exchange: 'NASDAQ',
  currency: 'USD',
  datetime: '2024-01-01',
  timestamp: Date.now(),
  open: 185.5,
  high: 187.2,
  low: 184.8,
  close: 186.5,
  volume: 45000000,
  previous_close: 185.0,
  change: 1.5,
  percent_change: 0.81,
  average_volume: 50000000,
  fifty_two_week: {
    low: 164.08,
    high: 199.62,
    low_change: 22.42,
    high_change: -13.12,
    low_change_percent: 13.67,
    high_change_percent: -6.57,
    range: '164.080 - 199.620'
  }
};

export const mockCompanyData = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  currency: 'USD',
  country: 'United States',
  type: 'Common Stock',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
  website: 'https://www.apple.com',
  employees: 164000,
  market_cap: 3000000000000,
  pe_ratio: 32.5,
  dividend_yield: 0.44
};

export const fetchHistoricalData = jest.fn().mockResolvedValue({
  values: mockHistoricalData,
  meta: {
    symbol: 'AAPL',
    interval: '1min',
    currency: 'USD',
    exchange_timezone: 'America/New_York',
    exchange: 'NASDAQ',
    type: 'Common Stock'
  },
  status: 'ok'
});

export const fetchQuote = jest.fn().mockResolvedValue(mockQuoteData);

export const fetchCompanyProfile = jest.fn().mockResolvedValue(mockCompanyData);

export const fetchFinancials = jest.fn().mockResolvedValue({
  income_statement: {
    fiscal_date: '2023-09-30',
    revenue: 394328000000,
    gross_profit: 169966000000,
    operating_income: 114672000000,
    net_income: 99803000000,
    eps: 6.16,
    diluted_eps: 6.13
  },
  balance_sheet: {
    fiscal_date: '2023-09-30',
    assets: 352583000000,
    liabilities: 290020000000,
    equity: 62563000000,
    current_assets: 143655000000,
    current_liabilities: 145274000000,
    debt: 123930000000
  },
  cash_flow: {
    fiscal_date: '2023-09-30',
    operating_cash_flow: 110976000000,
    investing_cash_flow: -9765000000,
    financing_cash_flow: -105669000000,
    free_cash_flow: 101211000000
  }
});

export const searchSymbols = jest.fn().mockResolvedValue([
  {
    symbol: 'AAPL',
    instrument_name: 'Apple Inc',
    exchange: 'NASDAQ',
    currency: 'USD',
    instrument_type: 'Common Stock',
    country: 'United States'
  },
  {
    symbol: 'AAPL.BA',
    instrument_name: 'Apple Inc',
    exchange: 'Buenos Aires',
    currency: 'ARS',
    instrument_type: 'Common Stock',
    country: 'Argentina'
  }
]);

export const fetchBatchQuotes = jest.fn().mockImplementation((symbols) => {
  const quotes = symbols.map((symbol: string) => ({
    ...mockQuoteData,
    symbol,
    name: `${symbol} Company`
  }));
  return Promise.resolve(quotes);
});

export const fetchTechnicalIndicators = jest.fn().mockResolvedValue({
  rsi: {
    values: [{ datetime: '2024-01-01', rsi: 65.5 }]
  },
  macd: {
    values: [{ 
      datetime: '2024-01-01', 
      macd: 1.25,
      macd_signal: 1.10,
      macd_histogram: 0.15
    }]
  },
  sma: {
    values: [{ datetime: '2024-01-01', sma: 185.2 }]
  },
  ema: {
    values: [{ datetime: '2024-01-01', ema: 186.1 }]
  }
});

// Mock the entire module
const twelveDataApi = {
  fetchHistoricalData,
  fetchQuote,
  fetchCompanyProfile,
  fetchFinancials,
  searchSymbols,
  fetchBatchQuotes,
  fetchTechnicalIndicators,
  mockHistoricalData,
  mockQuoteData,
  mockCompanyData
};

export default twelveDataApi;