// src/reportGeneration/core/reportGenerator.ts
// Main orchestrator for automated report generation
// Context: Coordinates all phases of report creation from data fetch to final output

import { 
  ReportConfig, 
  CompanyData, 
  GeneratedReport, 
  ProcessingStatus,
  ReportGenerationResult,
  ReportGenerationOptions,
  ReportTemplate,
  ReportError,
  ReportGenerationMetadata
} from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { DataFetcher } from './dataFetcher';
import { DataProcessor } from './dataProcessor';
import { ReportAssembler } from './reportAssembler';
import { AISummarizer } from '../utils/aiSummarizer';
import { logDebug, logError } from '../../utils/logger';

export class ReportGenerator {
  private config: ReportConfig;
  private status: ProcessingStatus;
  private abortController: AbortController;
  private dataFetcher: DataFetcher;
  private dataProcessor: DataProcessor;
  private reportAssembler: ReportAssembler;
  private aiSummarizer: AISummarizer;
  private templates: Map<string, ReportTemplate>;

  constructor(config: ReportConfig) {
    this.config = config;
    this.status = {
      stage: 'fetching',
      progress: 0,
      currentTask: 'Initializing report generation',
      errors: [],
      startTime: Date.now()
    };
    this.abortController = new AbortController();
    this.dataFetcher = new DataFetcher();
    this.dataProcessor = new DataProcessor();
    this.reportAssembler = new ReportAssembler();
    this.aiSummarizer = new AISummarizer();
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Main entry point for report generation
   * Orchestrates the entire pipeline from data fetching to final assembly
   */
  async generateReport(): Promise<GeneratedReport> {
    try {
      // Phase 1: Data Fetching
      this.updateStatus('fetching', 'Gathering company data', 10);
      const companyData = await this.fetchCompanyData();

      // Phase 2: Processing & Calculations
      this.updateStatus('processing', 'Analyzing financial metrics', 40);
      const analysis = await this.processData(companyData);

      // Phase 3: AI Content Generation
      this.updateStatus('generating', 'Creating insights and summaries', 60);
      const enrichedData = await this.generateAIContent(companyData, analysis);

      // Phase 4: Report Assembly
      this.updateStatus('assembling', 'Building report presentation', 80);
      const report = await this.assembleReport(enrichedData, analysis);

      this.updateStatus('complete', 'Report generation complete', 100);
      return report;

    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateReportLegacy(
    config: ReportConfig,
    options: ReportGenerationOptions = {}
  ): Promise<ReportGenerationResult> {
    const startTime = new Date();
    const errors: ReportError[] = [];
    const warnings: string[] = [];
    
    try {
      logDebug('ReportGenerator', `Starting report generation for ${config.symbol || config.ticker}`);
      
      // Convert to new format and generate
      const report = await this.generateReport();
      
      // Convert GeneratedReport to ReportGenerationResult
      return {
        success: true,
        reportPath: report.outputPath,
        errors: this.status.errors.length > 0 ? this.status.errors.map(e => ({
          code: e.severity.toUpperCase(),
          message: e.message,
          source: e.source,
          section: e.stage,
          timestamp: new Date(e.timestamp)
        })) : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          startTime,
          endTime: new Date(),
          dataSources: [],
          cacheHits: 0,
          cacheMisses: 0
        }
      };

    } catch (error) {
      logError('ReportGenerator', 'Unexpected error during report generation', error);
      errors.push({
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      return this.createErrorResult(errors, startTime);
    }
  }

  /**
   * Fetches all required data from various sources
   * Implements parallel fetching where possible for performance
   */
  private async fetchCompanyData(): Promise<CompanyData> {
    // Check for abort signal
    if (this.abortController.signal.aborted) {
      throw new Error('Report generation cancelled');
    }

    const symbol = this.config.ticker || this.config.symbol || '';
    
    logDebug('ReportGenerator', `Fetching data for ${symbol}`);
    
    // This will delegate to DataFetcher in the actual implementation
    const sections = this.config.sections || this.getDefaultSections();
    const priorities = this.config.dataSourcePriorities || this.getDefaultPriorities();
    
    const fetchResult = await this.dataFetcher.fetchAllData(
      symbol,
      sections,
      priorities
    );

    if (!fetchResult.success) {
      throw new Error('Failed to fetch required data');
    }

    // Transform to CompanyData format
    return this.transformToCompanyData(fetchResult.data);
  }

  /**
   * Processes raw data into actionable insights
   * Applies all financial calculations and pattern detection
   */
  private async processData(data: CompanyData): Promise<AnalysisResults> {
    // Check for abort signal
    if (this.abortController.signal.aborted) {
      throw new Error('Report generation cancelled');
    }

    logDebug('ReportGenerator', 'Processing financial data');
    
    const sections = this.config.sections || this.getDefaultSections();
    const result = await this.dataProcessor.processData(data as any, sections);
    
    // Transform to AnalysisResults format
    return this.transformToAnalysisResults(result);
  }

  /**
   * Generates AI-powered content for the report
   * Creates summaries, insights, and recommendations
   */
  private async generateAIContent(
    data: CompanyData,
    analysis: AnalysisResults
  ): Promise<CompanyData> {
    // Check for abort signal
    if (this.abortController.signal.aborted) {
      throw new Error('Report generation cancelled');
    }

    logDebug('ReportGenerator', 'Generating AI insights');
    
    const context = {
      symbol: data.ticker,
      companyName: data.companyName,
      sector: data.sector,
      metrics: analysis
    };

    // Generate executive summary
    const executiveSummary = await this.aiSummarizer.generateExecutiveSummary(context);
    
    // Generate section-specific insights
    const enrichedData = { ...data };
    
    // Add AI-generated content to relevant sections
    if (enrichedData.financials) {
      const financialSummary = await this.aiSummarizer.summarizeFinancials(
        enrichedData.financials,
        context
      );
      enrichedData.financials = {
        ...enrichedData.financials,
        aiSummary: financialSummary
      } as any;
    }

    return enrichedData;
  }

  /**
   * Assembles the final report in the requested format
   * Creates slides, embeds charts, and formats content
   */
  private async assembleReport(
    data: CompanyData,
    analysis: AnalysisResults
  ): Promise<GeneratedReport> {
    // Check for abort signal
    if (this.abortController.signal.aborted) {
      throw new Error('Report generation cancelled');
    }

    logDebug('ReportGenerator', 'Assembling final report');
    
    const options: ReportGenerationOptions = {
      outputFormat: this.config.outputFormat || 'pptx',
      includeWatermark: true,
      aiModelPreference: 'balanced'
    };

    const assemblyResult = await this.reportAssembler.assembleReport(
      this.config,
      { processedSections: [], calculations: analysis } as any,
      options
    );

    if (!assemblyResult.success) {
      throw new Error('Failed to assemble report');
    }

    return {
      config: this.config,
      companyData: data,
      slides: [], // Will be populated by assembler
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: Date.now() - this.status.startTime,
        dataFreshness: {},
        aiModel: 'gpt-4',
        version: '2.0'
      },
      outputPath: assemblyResult.reportPath
    };
  }

  /**
   * Updates the processing status for progress tracking
   */
  private updateStatus(stage: ProcessingStatus['stage'], task: string, progress: number): void {
    this.status = {
      ...this.status,
      stage,
      currentTask: task,
      progress,
      estimatedCompletion: this.estimateCompletion(progress)
    };
    
    // Emit status update event (can be connected to UI later)
    this.emitStatusUpdate();
  }

  /**
   * Estimates completion time based on current progress
   */
  private estimateCompletion(progress: number): number {
    if (progress === 0) return 0;
    
    const elapsed = Date.now() - this.status.startTime;
    const estimatedTotal = elapsed / (progress / 100);
    return this.status.startTime + estimatedTotal;
  }

  /**
   * Handles errors during report generation
   */
  private handleError(error: Error): void {
    this.status.errors.push({
      stage: this.status.stage,
      source: 'ReportGenerator',
      message: error.message,
      timestamp: Date.now(),
      severity: 'error',
      retryable: this.isRetryableError(error)
    });
    
    this.updateStatus('error', `Error: ${error.message}`, this.status.progress);
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'];
    return retryableErrors.some(type => error.message.includes(type));
  }

  /**
   * Emits status update for UI consumption
   */
  private emitStatusUpdate(): void {
    // This will be connected to a React context or event system
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('reportGenerationStatus', {
        detail: this.status
      }));
    }
  }

  /**
   * Cancels the report generation process
   */
  cancel(): void {
    this.abortController.abort();
    this.updateStatus('error', 'Report generation cancelled', this.status.progress);
  }

  /**
   * Gets the current processing status
   */
  getStatus(): ProcessingStatus {
    return { ...this.status };
  }

  // Helper methods for data transformation
  private transformToCompanyData(rawData: any): CompanyData {
    return {
      ticker: this.config.ticker || this.config.symbol || '',
      companyName: rawData.companyName || this.config.companyName || '',
      description: rawData.description || '',
      sector: rawData.sector || '',
      industry: rawData.industry || '',
      financials: rawData.financials || {},
      news: rawData.news || [],
      transcripts: rawData.transcripts || [],
      technicals: rawData.technicals || {},
      analysts: rawData.analysts || {},
      metadata: rawData.metadata || {}
    };
  }

  private transformToAnalysisResults(processedData: any): AnalysisResults {
    return processedData.calculations?.global || {
      growth: {} as any,
      valuation: {} as any,
      risk: {} as any,
      quality: {} as any,
      technicals: {} as any,
      composite: {} as any
    };
  }

  private getDefaultSections(): any[] {
    return [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'text',
        order: 1,
        required: true,
        dataRequirements: []
      }
    ];
  }

  private getDefaultPriorities(): any[] {
    return [
      { dataType: 'priceData', sources: ['twelvedata'] },
      { dataType: 'fundamentals', sources: ['twelvedata', 'edgar'] }
    ];
  }

  private createErrorResult(errors: ReportError[], startTime: Date): ReportGenerationResult {
    return {
      success: false,
      errors,
      metadata: {
        startTime,
        endTime: new Date(),
        dataSources: [],
        cacheHits: 0,
        cacheMisses: 0
      }
    };
  }

  private initializeTemplates(): void {
    // Initialize default templates
    // These will be expanded based on specific requirements
    this.templates.set('equity_research_standard', {
      id: 'equity_research_standard',
      name: 'Standard Equity Research Report',
      description: 'Comprehensive equity analysis with financials and technicals',
      sections: [],
      defaultConfig: {
        reportType: 'equity_research'
      } as Partial<ReportConfig>
    });
  }

  async previewReport(config: ReportConfig): Promise<any> {
    // Generate a preview of the report structure without creating the full report
    return {
      sections: config.sections?.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        required: s.required
      })) || [],
      estimatedPages: Math.ceil((config.sections?.length || 1) * 1.5),
      requiredDataSources: config.sections ? 
        [...new Set(config.sections.flatMap(s => 
          s.dataRequirements.map(r => r.source)
        ))] : []
    };
  }
}

// Factory function for creating report generators
export function createReportGenerator(config: ReportConfig): ReportGenerator {
  // Validate config
  if (!config.ticker && !config.symbol) {
    throw new Error('Invalid report configuration: missing ticker or symbol');
  }
  
  if (!config.reportDate && !config.sections) {
    throw new Error('Invalid report configuration: missing reportDate or sections');
  }

  // Set defaults
  const finalConfig: ReportConfig = {
    outputFormat: 'pptx',
    includeCharts: true,
    debugMode: false,
    currentDate: new Date().toISOString().split('T')[0],
    ...config
  };

  return new ReportGenerator(finalConfig);
}