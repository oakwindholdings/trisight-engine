// src/reportGeneration/__mocks__/reportMocks.ts
// Mock data for report generation tests
// Context: Provides consistent test data for report template engine tests

import { CompanyData } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';

export const mockCompanyData = {
  ticker: 'MOCK',
  companyName: 'Mock Corporation',
  description: 'A leading provider of mock services',
  sector: 'Technology',
  industry: 'Software',
  financials: {
    incomeStatement: [
      {
        date: '2024-03-31',
        period: 'quarterly',
        revenue: 1250000000,
        netIncome: 250000000,
        operatingIncome: 300000000,
        eps: 5.00,
        grossProfit: 750000000,
        costOfRevenue: 500000000,
        operatingExpenses: 450000000
      },
      {
        date: '2023-12-31',
        period: 'quarterly',
        revenue: 1200000000,
        netIncome: 240000000,
        operatingIncome: 290000000,
        eps: 4.80,
        grossProfit: 720000000,
        costOfRevenue: 480000000,
        operatingExpenses: 430000000
      },
      {
        date: '2023-09-30',
        period: 'quarterly',
        revenue: 1150000000,
        netIncome: 230000000,
        operatingIncome: 280000000,
        eps: 4.60,
        grossProfit: 690000000,
        costOfRevenue: 460000000,
        operatingExpenses: 410000000
      },
      {
        date: '2023-06-30',
        period: 'quarterly',
        revenue: 1100000000,
        netIncome: 220000000,
        operatingIncome: 270000000,
        eps: 4.40,
        grossProfit: 660000000,
        costOfRevenue: 440000000,
        operatingExpenses: 390000000
      }
    ],
    balanceSheet: [
      {
        date: '2024-03-31',
        period: 'quarterly',
        totalAssets: 10000000000,
        totalLiabilities: 4000000000,
        shareholderEquity: 6000000000,
        currentAssets: 3000000000,
        currentLiabilities: 1500000000,
        longTermDebt: 2000000000,
        cashAndEquivalents: 1500000000,
        inventory: 500000000,
        accountsReceivable: 800000000,
        accountsPayable: 600000000,
        retainedEarnings: 4000000000
      }
    ],
    cashFlow: [
      {
        date: '2024-03-31',
        period: 'quarterly',
        operatingCashFlow: 350000000,
        capitalExpenditures: -100000000,
        freeCashFlow: 250000000,
        dividendsPaid: -50000000,
        stockRepurchased: -75000000,
        debtRepayment: -25000000
      }
    ],
    keyMetrics: {
      marketCap: 50000000000,
      peRatio: 25,
      pegRatio: 1.5,
      priceToBook: 4,
      dividendYield: 0.015,
      roe: 0.18,
      currentRatio: 2.0,
      debtToEquity: 0.33,
      sharesOutstanding: 50000000,
      beta: 1.2,
      eps: 5.00,
      bookValuePerShare: 120
    },
    historicalPrices: [
      {
        date: new Date().toISOString(),
        close: 100,
        high: 102,
        low: 98,
        open: 99,
        volume: 2500000
      },
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        close: 99,
        high: 101,
        low: 97,
        open: 98,
        volume: 2400000
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        close: 98,
        high: 100,
        low: 96,
        open: 97,
        volume: 2600000
      }
    ]
  },
  news: [
    {
      title: 'Mock Corporation Reports Record Q1 Earnings',
      summary: 'Company beats analyst expectations with strong revenue growth',
      source: 'Reuters',
      publishedDate: new Date().toISOString(),
      url: 'https://example.com/news/1',
      relevanceScore: 0.95
    },
    {
      title: 'Mock Corp Announces New Product Launch',
      summary: 'Innovative solution expected to drive future growth',
      source: 'Bloomberg',
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://example.com/news/2',
      relevanceScore: 0.85
    }
  ],
  transcripts: [
    {
      date: '2024-03-31',
      type: 'earnings',
      participants: ['CEO John Smith', 'CFO Jane Doe', 'Various Analysts'],
      keyHighlights: [
        'Revenue growth exceeded expectations',
        'Strong demand across all segments',
        'Raising full-year guidance',
        'Investing in R&D for future growth'
      ],
      sentiment: {
        overall: 'positive',
        score: 0.75,
        topics: {
          growth: 0.8,
          profitability: 0.7,
          outlook: 0.85
        }
      }
    }
  ],
  technicals: {
    sma20: 98,
    sma50: 95,
    sma200: 90,
    rsi: 58,
    macd: {
      macd: 1.5,
      signal: 1.2,
      histogram: 0.3
    },
    volume: {
      current: 2500000,
      average10Day: 2400000,
      average30Day: 2300000,
      trend: 'increasing'
    },
    patterns: []
  },
  analysts: {
    consensus: {
      rating: 'buy',
      score: 4.2,
      count: 15
    },
    priceTargets: [
      {
        analyst: 'Goldman Sachs',
        target: 120,
        rating: 'buy',
        date: new Date().toISOString()
      },
      {
        analyst: 'Morgan Stanley',
        target: 115,
        rating: 'buy',
        date: new Date().toISOString()
      },
      {
        analyst: 'JPMorgan',
        target: 110,
        rating: 'hold',
        date: new Date().toISOString()
      }
    ],
    recommendations: [],
    revisions: []
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    sources: {
      financials: 'TwelveData',
      news: 'Multiple Sources',
      transcripts: 'Company Filings'
    },
    completeness: 95
  }
} as unknown as CompanyData; // historical fixture shape, cast on purpose

export const mockAnalysisResults = {
  growth: {
    revenueGrowth: {
      yoy: 0.15,
      qoq: 0.04,
      trend: 'accelerating',
      cagr3: 0.12,
      cagr5: 0.10
    },
    earningsGrowth: {
      yoy: 0.18,
      qoq: 0.05,
      trend: 'stable',
      cagr3: 0.15,
      cagr5: 0.12
    },
    fcfGrowth: {
      yoy: 0.20,
      qoq: 0.06,
      trend: 'accelerating',
      cagr3: 0.18,
      cagr5: 0.15
    },
    compositeScore: 78
  },
  profitability: {
    grossMargin: 0.60,
    operatingMargin: 0.24,
    netMargin: 0.20,
    fcfMargin: 0.20,
    marginTrend: 'expanding',
    roe: 0.18,
    roa: 0.12,
    roic: 0.15
  },
  valuation: {
    intrinsicValue: 115,
    marginOfSafety: 15,
    valuation: 'undervalued'
  },
  risk: {
    volatility: 22,
    beta: 1.2,
    maxDrawdown: 18,
    sharpeRatio: 1.8,
    riskScore: 45,
    financialRisk: 4,
    operationalRisk: 5,
    marketRisk: 5
  },
  quality: {
    roe: 0.18,
    roa: 0.12,
    roic: 0.15,
    earningsQuality: 8,
    balanceSheetStrength: 8,
    moat: 'wide',
    qualityScore: 82
  },
  technicals: {
    trend: 'bullish',
    support: 95,
    resistance: 105,
    rsi: 58,
    signals: [
      {
        type: 'golden_cross',
        strength: 0.7,
        date: new Date().toISOString()
      }
    ],
    patternAnalysis: {
      patternCount: 3,
      dominantPattern: 'ascending_channel',
      bullishPatterns: 2,
      bearishPatterns: 0,
      neutralPatterns: 1,
      averageConfidence: 75,
      patternMomentum: 0.7,
      keyPatterns: [
        {
          type: 'ascending_channel',
          direction: 'bullish',
          confidence: 80,
          targetPrice: 120,
          stopLoss: 94,
          probability: 0.75,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      ],
      patternGroups: []
    }
  },
  composite: {
    overall: 75,
    growth: 78,
    value: 82,
    quality: 82,
    momentum: 68,
    sentiment: 75,
    confidence: 85,
    recommendation: 'buy'
  },
  sentiment: {
    source: 'combined',
    overall: 'positive',
    score: 0.65,
    confidence: 0.82,
    dimensions: {
      financial: 0.7,
      operational: 0.6,
      strategic: 0.8,
      competitive: 0.5,
      regulatory: 0.3
    },
    emotions: {
      optimism: 0.7,
      concern: 0.2,
      uncertainty: 0.1,
      confidence: 0.75
    },
    themes: [
      {
        name: 'growth',
        mentions: 12,
        relevance: 0.9,
        sentiment: 0.8,
        examples: ['strong revenue growth', 'expanding market share']
      },
      {
        name: 'innovation',
        mentions: 8,
        relevance: 0.7,
        sentiment: 0.85,
        examples: ['new product launch', 'R&D investments']
      },
      {
        name: 'profitability',
        mentions: 10,
        relevance: 0.8,
        sentiment: 0.7,
        examples: ['margin expansion', 'cost efficiency']
      }
    ],
    entities: [
      {
        name: 'Mock Corporation',
        type: 'company',
        mentions: 25,
        sentiment: 0.7
      },
      {
        name: 'John Smith',
        type: 'person',
        mentions: 5,
        sentiment: 0.8,
        role: 'CEO'
      }
    ],
    keyPhrases: [
      {
        phrase: 'record revenue',
        frequency: 4,
        importance: 0.9,
        sentiment: 0.85
      },
      {
        phrase: 'market leadership',
        frequency: 3,
        importance: 0.8,
        sentiment: 0.75
      }
    ],
    temporalAnalysis: {
      trend: 'improving',
      momentum: 0.6,
      volatility: 0.2,
      changes: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fromScore: 0.4,
          toScore: 0.65,
          magnitude: 0.25
        }
      ]
    },
    summary: 'Sentiment analysis shows strong positive momentum with improving market perception and management confidence.'
  }
} as unknown as AnalysisResults; // historical fixture shape, cast on purpose

// Additional mock data variations for different test scenarios

export const mockBearishAnalysisResults = {
  ...mockAnalysisResults,
  growth: {
    revenueGrowth: {
      yoy: -0.15,
      qoq: -0.05,
      trend: 'decelerating',
      cagr3: -0.10,
      cagr5: -0.08
    },
    earningsGrowth: {
      yoy: -0.25,
      qoq: -0.08,
      trend: 'declining',
      cagr3: -0.20,
      cagr5: -0.15
    },
    fcfGrowth: {
      yoy: -0.30,
      qoq: -0.10,
      trend: 'declining',
      cagr3: -0.25,
      cagr5: -0.20
    },
    compositeScore: 25
  },
  composite: {
    overall: 25,
    growth: 20,
    value: 40,
    quality: 30,
    momentum: 15,
    sentiment: 20,
    confidence: 60,
    recommendation: 'sell'
  },
  sentiment: {
    ...(mockAnalysisResults as any).sentiment,
    overall: 'negative',
    score: -0.45,
    confidence: 0.75
  }
} as unknown as AnalysisResults; // historical fixture shape, cast on purpose

export const mockMinimalCompanyData = {
  ticker: 'MIN',
  companyName: 'Minimal Corp',
  description: 'A company with minimal data',
  sector: 'Unknown',
  industry: 'Unknown',
  financials: {
    incomeStatement: [],
    balanceSheet: [],
    cashFlow: [],
    keyMetrics: {},
    historicalPrices: []
  },
  news: [],
  transcripts: [],
  technicals: {
    sma20: 0,
    sma50: 0,
    sma200: 0,
    rsi: 50,
    macd: { macd: 0, signal: 0, histogram: 0 },
    volume: { current: 0, average10Day: 0, average30Day: 0, trend: 'stable' },
    patterns: []
  },
  analysts: {
    consensus: { rating: 'hold', score: 3, count: 0 },
    priceTargets: [],
    recommendations: [],
    revisions: []
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    sources: {},
    completeness: 20
  }
} as unknown as CompanyData; // historical fixture shape, cast on purpose