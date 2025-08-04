// src/types/reportTypes.ts
// Shared report types for client-side usage
// Context: Browser-safe types without Node.js dependencies

/**
 * Report configuration passed from UI to API
 */
export interface ReportConfig {
  ticker: string;
  reportDate?: string;
  currentDate?: string;
  reportType?: 'technical_analysis' | 'earnings_preview' | 'equity_research';
  outputFormat?: 'pdf' | 'pptx' | 'html';
  includeSections?: string[];
  includeCharts?: boolean;
  chartTypes?: string[];
  timeframe?: string;
  title?: string;
  author?: string;
  confidentiality?: 'public' | 'internal' | 'confidential';
  template?: any;
  sections?: any[];
  dataSources?: any[];
  format?: string;
}

/**
 * Processing status for report generation
 */
export interface ProcessingStatus {
  stage: 'initializing' | 'fetching-data' | 'processing' | 'generating-charts' | 'assembling' | 'completed' | 'failed';
  progress: number;
  currentTask: string;
  subTasks?: Array<{
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  errors: any[];
  startTime: number;
  estimatedCompletion?: number;
}

/**
 * Generated report metadata
 */
export interface GeneratedReport {
  id: string;
  ticker: string;
  title: string;
  generatedAt: string;
  outputPath?: string;
  downloadUrl?: string;
  metadata: {
    generationId?: string;
    generationTime?: number;
    author?: string;
    version?: string;
    confidentialityLevel?: string;
    dataTimestamp?: string;
    serverTimestamp?: string;
    apiVersion?: string;
  };
  status: 'completed' | 'failed';
  errors?: any[];
}

/**
 * Report storage metadata
 */
export interface StoredReport {
  id: string;
  ticker: string;
  title: string;
  generatedAt: string;
  size: number;
  format: 'pdf' | 'pptx' | 'html';
  metadata: Record<string, any>;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceReport {
  totalDuration: number;
  stageDurations: Record<string, number>;
  apiCalls: Array<{
    endpoint: string;
    duration: number;
    status: number;
  }>;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}