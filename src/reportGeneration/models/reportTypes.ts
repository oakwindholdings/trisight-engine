// src/reportGeneration/models/reportTypes.ts
// Core data structures for automated report generation
// Context: Defines all TypeScript interfaces used throughout the report pipeline

// Main configuration for report generation
export interface ReportConfig {
  ticker: string;
  reportDate: string;
  currentDate: string;
  apiKey?: string; // Optional, will default to env variable
  outputFormat?: 'pptx' | 'pdf' | 'html';
  includeCharts?: boolean;
  debugMode?: boolean;
  // Legacy fields for compatibility
  symbol?: string;
  companyName?: string;
  reportType?: 'equity_research' | 'earnings_preview' | 'technical_analysis';
  sections?: ReportSection[];
  metadata?: ReportMetadata;
  dataSourcePriorities?: DataSourcePriority[];
}

export interface ReportMetadata {
  generatedAt: Date;
  version: string;
  author: string;
  confidentialityLevel: 'public' | 'internal' | 'confidential';
  expiresAt?: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'mixed';
  order: number;
  required: boolean;
  content?: SectionContent;
  dataRequirements: DataRequirement[];
}

export interface SectionContent {
  text?: string;
  charts?: ChartData[];
  tables?: TableData[];
  insights?: AIInsight[];
}

export interface ChartData {
  type: 'candlestick' | 'line' | 'bar' | 'pie';
  title: string;
  data: any; // Will be refined based on chart type
  config: ChartConfig;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  formatting?: TableFormatting;
}

export interface AIInsight {
  type: 'summary' | 'analysis' | 'recommendation';
  content: string;
  confidence: number;
  sources: string[];
}

export interface DataRequirement {
  source: 'twelvedata' | 'edgar' | 'firecrawl' | 'calculated';
  dataType: string;
  required: boolean;
  fallbackStrategy?: 'skip' | 'use_cached' | 'use_default';
}

export interface DataSourcePriority {
  dataType: string;
  sources: string[];
  cacheDuration?: number; // minutes
}

export interface ReportGenerationResult {
  success: boolean;
  reportPath?: string;
  errors?: ReportError[];
  warnings?: string[];
  metadata: ReportGenerationMetadata;
}

export interface ReportError {
  code: string;
  message: string;
  section?: string;
  source?: string;
  timestamp: Date;
}

export interface ReportGenerationMetadata {
  startTime: Date;
  endTime: Date;
  dataSources: DataSourceUsage[];
  aiTokensUsed?: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface DataSourceUsage {
  source: string;
  requests: number;
  successRate: number;
  avgResponseTime: number;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  showLegend?: boolean;
  interactive?: boolean;
}

export interface TableFormatting {
  highlightRows?: number[];
  highlightColumns?: number[];
  cellFormatters?: Record<string, (value: any) => string>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  defaultConfig: Partial<ReportConfig>;
}

export interface FetchContext {
  symbol: string;
  startDate?: Date;
  endDate?: Date;
  useCache?: boolean;
  timeout?: number;
}

export interface ProcessingContext {
  rawData: Record<string, any>;
  calculations: Record<string, any>;
  validationErrors: string[];
}

// Company data aggregated from all sources
export interface CompanyData {
  ticker: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  financials: FinancialData;
  news: NewsItem[];
  transcripts: TranscriptData[];
  technicals: TechnicalIndicators;
  analysts: AnalystData;
  earnings: EarningsData;
  metadata: DataSourceMetadata;
}

// Technical indicators for charting
export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: MACDData;
  volume: VolumeData;
  patterns: DetectedPattern[];
  volatility?: number;
  resistance?: number;
  support?: number;
}

// Pattern detection integration
export interface DetectedPattern {
  type: string;
  startDate: string;
  endDate: string;
  confidence: number;
  priceTarget?: number;
}

// Financial data structure
export interface FinancialData {
  incomeStatement: FinancialStatement[];
  balanceSheet: FinancialStatement[];
  cashFlow: FinancialStatement[];
  keyMetrics: KeyFinancialMetrics;
  historicalPrices: PriceData[];
  dataQuality?: {
    score: number;
    completeness: number;
    consistency: number;
    timeliness: number;
  };
}

// Individual financial statement entry
export interface FinancialStatement {
  date: string;
  period: 'annual' | 'quarterly';
  // Income statement fields
  revenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  eps?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  // Balance sheet fields
  totalAssets?: number;
  currentAssets?: number;
  totalLiabilities?: number;
  currentLiabilities?: number;
  totalEquity?: number;
  totalDebt?: number;
  sharesOutstanding?: number;
  workingCapital?: number;
  bookValuePerShare?: number;
  debtToAssets?: number;
  // Cash flow fields
  operatingCashFlow?: number;
  capitalExpenditures?: number;
  freeCashFlow?: number;
  operatingCashFlowMargin?: number;
  freeCashFlowMargin?: number;
  // Add more fields as needed
  [key: string]: string | number | undefined;
}

// News item structure
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  relevanceScore?: number;
  metadata?: {
    keyTopics?: string[];
    sourceCredibility?: number;
    temporalRelevance?: number;
    impactScore?: number;
    compositeScore?: number;
    [key: string]: any;
  };
}

// Earnings call transcript data
export interface TranscriptData {
  date: string;
  quarter: string;
  year: number;
  participants: string[];
  highlights: string[];
  fullText?: string;
  content?: string;
  sentiment?: SentimentAnalysis;
}

// News event structure
export interface NewsEvent {
  date: string;
  type: string;
  headline: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  source: string;
  url: string;
  metadata?: any;
}

// News sentiment analysis result
export interface NewsSentiment {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  articles: NewsItem[];
  trend?: 'improving' | 'stable' | 'declining';
  keyTopics?: Array<{
    topic: string;
    mentions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  lastUpdated?: string;
}

// Analyst data structure
export interface AnalystData {
  consensus: AnalystConsensus;
  priceTargets: PriceTarget[];
  recommendations: AnalystRecommendation[];
  revisions: AnalystRevision[];
}

// Processing status tracking
export interface ProcessingStatus {
  stage: 'fetching' | 'processing' | 'generating' | 'assembling' | 'complete' | 'error';
  progress: number; // 0-100
  currentTask: string;
  errors: ProcessingError[];
  startTime: number;
  estimatedCompletion?: number;
}

// Error handling structure
export interface ProcessingError {
  stage: string;
  source: string;
  message: string;
  timestamp: number;
  severity: 'warning' | 'error' | 'critical';
  retryable: boolean;
}

// Helper types
export interface KeyFinancialMetrics {
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  priceToBook: number;
  dividendYield: number;
  roe: number;
  roa?: number;
  currentRatio: number;
  debtToEquity: number;
  fcfYield?: number;
  earningsYield?: number;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface EarningsData {
  historical: Array<{
    date: string;
    fiscalQuarter: string;
    fiscalYear: number;
    epsEstimate: number;
    epsActual: number;
    epsSurprise: number;
    revenueEstimate: number;
    revenueActual: number;
    revenueSurprise: number;
  }>;
  upcoming: Array<{
    date: string;
    fiscalQuarter: string;
    fiscalYear: number;
    epsEstimate: number;
    revenueEstimate: number;
  }>;
  nextEarningsDate: string | null;
  averageSurprise: number;
}

export interface DataSourceMetadata {
  lastUpdated: string;
  sources: {
    [key: string]: {
      status: 'success' | 'partial' | 'failed';
      timestamp: string;
      recordCount?: number;
      error?: string;
    };
  };
  errors?: ProcessingError[];
  warnings?: ProcessingError[];
  completeness?: number;
  quality?: any;
  aggregatedSentiment?: any;
  [key: string]: any;
}

// Report output structure
export interface GeneratedReport {
  config: ReportConfig;
  companyData: CompanyData;
  slides: ReportSlide[];
  metadata: ReportMetadata;
  outputPath?: string;
}

export interface ReportSlide {
  slideNumber: number;
  title: string;
  content: SlideContent[];
  layout: 'title' | 'content' | 'comparison' | 'chart';
}

export interface SlideContent {
  type: 'text' | 'table' | 'chart' | 'image';
  data: any; // Will be refined based on type
  position?: { x: number; y: number; width: number; height: number };
}

// AI summarization types
export interface SummarizationRequest {
  text: string;
  maxLength: number;
  style: 'executive' | 'technical' | 'investor';
  includeSentiment?: boolean;
}

export interface SummarizationResponse {
  summary: string;
  keyPoints: string[];
  sentiment?: SentimentAnalysis;
  confidence: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  aspects: { [aspect: string]: number };
}

// Additional helper types
export interface AnalystConsensus {
  rating: 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell';
  score: number; // 1-5
  count: number;
}

export interface PriceTarget {
  analyst: string;
  firm: string;
  target: number;
  date: string;
  horizon: '3m' | '6m' | '12m';
}

export interface AnalystRecommendation {
  analyst: string;
  firm: string;
  rating: string;
  previousRating?: string;
  date: string;
}

export interface AnalystRevision {
  metric: string;
  previousValue: number;
  newValue: number;
  changePercent: number;
  date: string;
  analyst: string;
}

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
}

export interface VolumeData {
  current: number;
  average10Day: number;
  average30Day: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ReportGenerationOptions {
  templateId?: string;
  outputFormat?: 'pptx' | 'pdf' | 'html';
  includeWatermark?: boolean;
  compressionLevel?: 'none' | 'low' | 'high';
  aiModelPreference?: 'fast' | 'balanced' | 'quality';
}