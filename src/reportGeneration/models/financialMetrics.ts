// src/reportGeneration/models/financialMetrics.ts
// Financial calculation types and formulas
// Context: Ensures consistency in all financial computations


export interface GrowthMetrics {
  // Two shape generations coexist: current calculators emit GrowthRate objects,
  // comprehensiveSlideGenerator treats these fields as flat numbers. `any` bridges
  // both until the flat-number call sites are migrated to GrowthRate.
  revenueGrowth: GrowthRate | any;
  earningsGrowth: GrowthRate | any;
  fcfGrowth: GrowthRate | any;
  bookValueGrowth?: GrowthRate | any;
  [derived: string]: any;
}

export interface GrowthRate {
  yoy: number; // Year over year
  qoq: number; // Quarter over quarter
  cagr3: number; // 3-year CAGR
  cagr5: number; // 5-year CAGR
  trend: 'accelerating' | 'stable' | 'decelerating';
}

export interface ValuationMetrics {
  intrinsicValue: number;
  fairValue?: number; // optional to match the merged second declaration's modifier
  marginOfSafety: number;
  valuation: 'undervalued' | 'fairlyValued' | 'overvalued';
  confidence: number;
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface RiskMetrics {
  beta: number;
  volatility?: number; // optional to match the merged second declaration's modifiers
  sharpeRatio: number;
  maxDrawdown: number;
  var95?: number; // Value at Risk 95%
  riskScore?: number; // 0-100
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface QualityMetrics {
  roic?: number; // Return on Invested Capital
  fcfYield?: number;
  earningsQuality?: number; // 0-100
  balanceSheetStrength?: number; // 0-100
  moat?: 'none' | 'narrow' | 'wide';
  roe?: number; // Return on Equity
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

// Calculation configuration
export interface CalculationConfig {
  riskFreeRate: number;
  marketReturn: number;
  taxRate: number;
  perpetualGrowthRate: number;
  discountRate: number;
}

// Results of comprehensive analysis
export interface AnalysisResults {
  growth: GrowthMetrics;
  valuation: ValuationMetrics;
  risk: RiskMetrics;
  quality: QualityMetrics;
  technicals: TechnicalSignals;
  composite: CompositeScore;
  // Additional commonly accessed fields
  sentiment?: any; // polymorphic across generations: scalar label, score number, or {overall, score, themes, …}
  profitability?: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roe?: number;
    roa?: number;
    [extraMargin: string]: any; // fcfMargin and other derived margins
  };
  patternAnalysis?: {
    trend: string;
    patterns: string[];
    signals: string[];
    confidence: number;
  };
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface TechnicalSignals {
  trend: 'bullish' | 'neutral' | 'bearish';
  momentum?: 'strong' | 'moderate' | 'weak';
  support?: number;
  resistance?: number;
  entry?: number;
  stopLoss?: number;
  signals?: Signal[];
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface Signal {
  type: string;
  strength: number;
  date?: string;
  price?: number;
  indicator?: string; // legacy field naming the source indicator
  [extra: string]: any;
}

export interface CompositeScore {
  overall: number; // 0-100
  growth?: number;
  value?: number;
  quality?: number;
  momentum?: number;
  sentiment?: number;
  recommendation: 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell' | (string & {});
  confidence?: number;
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

// Formula definitions for transparency
export interface FormulaDefinition {
  name: string;
  formula: string;
  inputs: string[];
  description: string;
  category: 'growth' | 'valuation' | 'risk' | 'quality';
}

export const FORMULAS: FormulaDefinition[] = [
  {
    name: 'revenueGrowthRate',
    formula: '((currentRevenue - previousRevenue) / previousRevenue) * 100',
    inputs: ['currentRevenue', 'previousRevenue'],
    description: 'Calculates year-over-year revenue growth percentage',
    category: 'growth'
  },
  {
    name: 'peRatio',
    formula: 'marketPrice / earningsPerShare',
    inputs: ['marketPrice', 'earningsPerShare'],
    description: 'Price to Earnings ratio for valuation comparison',
    category: 'valuation'
  },
  {
    name: 'dcfValue',
    formula: 'Σ(FCF_t / (1 + r)^t) + TerminalValue / (1 + r)^n',
    inputs: ['freeCashFlows', 'discountRate', 'terminalValue', 'periods'],
    description: 'Discounted Cash Flow intrinsic value calculation',
    category: 'valuation'
  },
  {
    name: 'roic',
    formula: '(NOPAT / InvestedCapital) * 100',
    inputs: ['netOperatingProfitAfterTax', 'investedCapital'],
    description: 'Return on Invested Capital measures efficiency',
    category: 'quality'
  },
  {
    name: 'sharpeRatio',
    formula: '(portfolioReturn - riskFreeRate) / portfolioStdDev',
    inputs: ['portfolioReturn', 'riskFreeRate', 'portfolioStandardDeviation'],
    description: 'Risk-adjusted return metric',
    category: 'risk'
  }
];

// Type guards for runtime validation
export function isValidGrowthRate(value: any): value is GrowthRate {
  return (
    typeof value === 'object' &&
    typeof value.yoy === 'number' &&
    typeof value.qoq === 'number' &&
    typeof value.cagr3 === 'number' &&
    typeof value.cagr5 === 'number' &&
    ['accelerating', 'stable', 'decelerating'].includes(value.trend)
  );
}

export function isValidFinancialMetric(value: number): boolean {
  return !isNaN(value) && isFinite(value);
}

// Calculation precision constants
export const PRECISION = {
  PRICE: 2,
  PERCENTAGE: 2,
  RATIO: 3,
  LARGE_NUMBER: 0,
  FINANCIAL_STATEMENT: 0
};

// Benchmarks for comparison
export interface IndustryBenchmarks {
  industry: string;
  avgPE: number;
  avgPB: number;
  avgROE: number;
  avgGrowth: number;
  avgMargin: number;
  updated: string;
}

// Legacy interfaces for backward compatibility
export interface FinancialData {
  symbol: string;
  period: FinancialPeriod;
  priceData: PriceData;
  fundamentals: FundamentalData;
  technicals: TechnicalIndicators;
  marketData: MarketData;
}

export interface FinancialPeriod {
  start: Date;
  end: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface PriceData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamps: Date[];
  adjustedClose?: number[];
}

export interface FundamentalData {
  revenue: TimeSeriesMetric;
  earnings: TimeSeriesMetric;
  eps: TimeSeriesMetric;
  peRatio: number;
  pegRatio?: number;
  dividendYield?: number;
  marketCap: number;
  enterpriseValue?: number;
  priceToBook?: number;
  priceToSales?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  roe?: number; // Return on Equity
  roa?: number; // Return on Assets
  roic?: number; // Return on Invested Capital
}

export interface TimeSeriesMetric {
  values: number[];
  dates: Date[];
  growthRate?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface TechnicalIndicators {
  sma: { [period: string]: number[] };
  ema: { [period: string]: number[] };
  rsi: number[];
  macd: MACDData;
  bollingerBands: BollingerBands;
  volume: VolumeIndicators;
  supportResistance: SupportResistance;
}

export interface MACDData {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface VolumeIndicators {
  obv: number[]; // On-Balance Volume
  vwap: number[]; // Volume Weighted Average Price
  volumeMA: number[];
}

export interface SupportResistance {
  supports: PriceLevel[];
  resistances: PriceLevel[];
  pivotPoints: PivotPoints;
}

export interface PriceLevel {
  price: number;
  strength: number; // 0-1
  touches: number;
  lastTested: Date;
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface MarketData {
  sector: string;
  industry: string;
  beta: number;
  correlation: { [symbol: string]: number };
  relativeStrength: number;
  marketShare?: number;
}

export interface CalculatedMetrics {
  performance: PerformanceMetrics;
  valuation: ValuationMetrics;
  risk: RiskMetrics;
  momentum: MomentumMetrics;
  quality: QualityMetrics;
}

export interface PerformanceMetrics {
  returns: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    ytd: number;
  };
  sharpeRatio: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  maxDrawdown: number;
  winRate: number;
}

export interface ValuationMetrics {
  // NOTE: this file declares ValuationMetrics twice; TS merges them, so these
  // legacy-shape fields must stay optional to keep the primary shape constructible.
  fairValue?: number;
  currentPrice?: number;
  upside?: number;
  valuationScore?: number; // 0-100
  peerComparison?: PeerComparison;
  // (index signature lives on the first merged declaration)
}

export interface RiskMetrics {
  // NOTE: second declaration of RiskMetrics (merged by TS) — fields optional on purpose.
  volatility?: number;
  var95?: number; // Value at Risk 95%
  cvar95?: number; // Conditional VaR
  downsideDeviation?: number;
  riskScore?: number; // 0-100
  // (index signature lives on the first merged declaration)
}

export interface MomentumMetrics {
  priceStrength: number;
  volumeStrength: number;
  trendStrength: number;
  momentumScore: number; // 0-100
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface QualityMetricsV2 {
  earningsQuality: number;
  profitability: number;
  financialHealth: number;
  qualityScore: number; // 0-100
  // Bridging index: comprehensiveSlideGenerator probes fields beyond the declared set
  [probed: string]: any;
}

export interface PeerComparison {
  peers: string[];
  metrics: {
    peRatio: PeerMetric;
    revenue: PeerMetric;
    margins: PeerMetric;
    growth: PeerMetric;
  };
}

export interface PeerMetric {
  company: number;
  peerAverage: number;
  percentile: number;
  ranking: number;
}

export interface FinancialCalculation {
  name: string;
  formula: string;
  inputs: string[];
  calculate: (data: Record<string, any>) => number | null;
  validate: (result: number) => boolean;
}

export interface MetricThresholds {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface AnalysisResult {
  metrics: CalculatedMetrics;
  insights: string[];
  warnings: string[];
  recommendations: string[];
  confidence: number;
}