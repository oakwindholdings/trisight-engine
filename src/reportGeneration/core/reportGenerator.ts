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
import { ProgressTracker, ProgressUpdate } from '../utils/progressTracker';
import { logDebug, logError } from '../../utils/logger';
import { 
  REPORT_TEMPLATES, 
  mapWizardToReportConfig, 
  generateSlidesFromTemplate 
} from '../templates/reportTemplates';

export class ReportGenerator {
  private config: ReportConfig;
  private status: ProcessingStatus;
  private abortController: AbortController;
  private dataFetcher: DataFetcher;
  private dataProcessor: DataProcessor;
  private reportAssembler: ReportAssembler;
  private aiSummarizer: AISummarizer;
  private templates: Map<string, ReportTemplate>;
  private progressTracker: ProgressTracker;

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
    this.dataFetcher = new DataFetcher({ ticker: config.ticker || config.symbol || '' });
    this.dataProcessor = new DataProcessor();
    this.reportAssembler = new ReportAssembler();
    this.aiSummarizer = new AISummarizer();
    this.templates = new Map();
    this.progressTracker = new ProgressTracker();
    
    // Wire up progress tracking
    this.progressTracker.onProgress((update: ProgressUpdate) => {
      this.updateStatus(update.stage, update.currentTask, update.progress);
    });
    
    this.initializeTemplates();
  }

  /**
   * Main entry point for report generation
   * Orchestrates the entire pipeline from data fetching to final assembly
   */
  async generateReport(): Promise<GeneratedReport> {
    try {
      // Validate initial configuration
      this.validateReportConfig();
      
      // Map wizard config to report config if needed
      if (this.config.reportType && !this.config.template) {
        const template = REPORT_TEMPLATES[this.config.reportType];
        if (template) {
          this.config.template = template;
          this.config.sections = this.config.sections || template.requiredSections.map(id => ({
            id,
            title: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            type: 'mixed',
            order: 1,
            required: true,
            dataRequirements: []
          }));
        }
      }

      // Phase 1: Data Fetching with validation
      this.progressTracker.startStep('fetch-data');
      const companyData = await this.fetchCompanyData();
      this.validateCompanyData(companyData);
      this.progressTracker.completeStep('fetch-data');

      // Phase 2: Processing & Calculations with validation
      this.progressTracker.startStep('process-data');
      const analysis = await this.processData(companyData);
      this.validateAnalysisResults(analysis);
      this.progressTracker.completeStep('process-data');

      // Phase 3: AI Content Generation with fallback handling
      this.progressTracker.startStep('generate-content');
      let enrichedData: CompanyData;
      try {
        enrichedData = await this.generateAIContent(companyData, analysis);
      } catch (aiError) {
        logError('ReportGenerator', 'AI content generation failed, using fallback', aiError);
        enrichedData = this.generateFallbackContent(companyData, analysis);
        this.status.errors.push({
          stage: 'processing',
          source: 'AIService',
          message: 'AI content generation failed, using fallback content',
          timestamp: Date.now(),
          severity: 'warning',
          retryable: true
        });
      }
      this.progressTracker.completeStep('generate-content');

      // Phase 4: Report Assembly with validation
      this.progressTracker.startStep('assemble-report');
      const report = await this.assembleReport(enrichedData, analysis);
      this.validateGeneratedReport(report);
      this.progressTracker.completeStep('assemble-report');
      
      return report;

    } catch (error) {
      this.handleError(error as Error);
      // Generate minimal error report instead of throwing
      return this.generateErrorReport(error as Error);
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
    
    const companyData = await this.dataFetcher.fetchAll(symbol, (stage: string, progress: number) => {
      // Map data fetcher stages to our sub-steps
      const subStepMap: { [key: string]: string } = {
        'Fetching core financial data': 'fetch-fundamentals',
        'Fetching supplementary data': 'fetch-technicals',
        'Fetching enrichment data': 'fetch-news',
        'Validating and cleaning data': 'validate-data'
      };
      
      const subStepId = subStepMap[stage];
      if (subStepId) {
        this.progressTracker.startSubStep('fetch-data', subStepId);
        if (progress >= 100) {
          this.progressTracker.completeSubStep('fetch-data', subStepId);
        }
      }
    });
    
    // The fetchAll method returns CompanyData directly
    return companyData;
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
   * THIS IS WHERE THE WOW FACTOR HAPPENS!
   */
  private async generateAIContent(
    data: CompanyData,
    analysis: AnalysisResults
  ): Promise<CompanyData> {
    // Check for abort signal
    if (this.abortController.signal.aborted) {
      throw new Error('Report generation cancelled');
    }

    logDebug('ReportGenerator', 'Generating ENHANCED AI insights with Claude!');
    
    // Enhanced context with full data for AI
    const context = {
      symbol: data.ticker,
      companyName: data.companyName,
      sector: data.sector,
      metrics: analysis,
      companyData: data,
      analysisResults: analysis
    };

    // Determine AI options based on report type
    const aiOptions = {
      tone: this.config.reportType === 'executive' ? 'executive' : 'professional',
      depth: this.config.reportType === 'detailed' ? 'comprehensive' : 'standard',
      focusAreas: this.getFocusAreas(),
      includeCharts: true,
      riskTolerance: this.config.riskTolerance || 'moderate'
    };

    // Generate comprehensive AI content
    const [
      executiveSummary,
      investmentThesis,
      keyInsights,
      riskAnalysis,
      futureOutlook,
      actionItems,
      recommendationRationale
    ] = await Promise.all([
      this.aiSummarizer.generateExecutiveSummary(context, aiOptions),
      this.aiSummarizer.generateAnalysis('investment', data, context, aiOptions),
      this.aiSummarizer.generateKeyInsights(context, aiOptions),
      this.aiSummarizer.generateAnalysis('risk', data, context, aiOptions),
      this.aiSummarizer.generateAnalysis('future', data, context, aiOptions),
      this.aiSummarizer.generateActionItems(context, aiOptions),
      this.aiSummarizer.generateRecommendationRationale(
        context, 
        analysis.composite.recommendation,
        analysis.composite.confidence
      )
    ]);
    
    // Generate section-specific AI content
    const enrichedData = { ...data };
    
    // Enrich financial data with AI insights
    if (enrichedData.financials) {
      const financialSummary = await this.aiSummarizer.summarizeFinancials(
        enrichedData.financials,
        context,
        aiOptions
      );
      enrichedData.financials = {
        ...enrichedData.financials,
        aiSummary: financialSummary,
        aiInsights: await this.aiSummarizer.generateBulletPoints(financialSummary, 5)
      } as any;
    }

    // Add technical commentary if available
    if (enrichedData.technicals && this.config.reportType !== 'executive') {
      const technicalAnalysis = await this.aiSummarizer.generateAnalysis(
        'technical',
        enrichedData.technicals,
        context,
        aiOptions
      );
      enrichedData.technicals = {
        ...enrichedData.technicals,
        aiAnalysis: technicalAnalysis.content
      } as any;
    }

    // Add competitive analysis for detailed reports
    if (this.config.reportType === 'detailed' || this.config.reportType === 'comprehensive') {
      const competitiveAnalysis = await this.aiSummarizer.generateAnalysis(
        'competitive',
        data,
        context,
        aiOptions
      );
      enrichedData.metadata = {
        ...enrichedData.metadata,
        competitiveAnalysis: competitiveAnalysis.content
      };
    }

    // Store all AI-generated content in metadata for easy access
    enrichedData.metadata = {
      ...enrichedData.metadata,
      aiContent: {
        executiveSummary: executiveSummary.content,
        investmentThesis: investmentThesis.content,
        keyInsights,
        riskAnalysis: riskAnalysis.content,
        futureOutlook: futureOutlook.content,
        actionItems,
        recommendationRationale,
        generatedAt: new Date().toISOString(),
        aiProvider: 'anthropic_claude',
        confidence: executiveSummary.confidence
      }
    };

    // Clear AI cache for next report
    this.aiSummarizer.clearCache();

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
    
    // Always use comprehensive slide generation for professional reports
    // This ensures we get 15-20 slides with full content
    let slides = [];
    
    // The reportAssembler will use generateComprehensiveSlides internally
    // We just need to make sure we pass the right data
    
    // Note: The actual slide generation happens in reportAssembler.assemble()
    // which calls createSlides() -> generateComprehensiveSlides()
    // So we don't need to generate slides here
    
    // Update config with generated slides
    const finalConfig = {
      ...this.config,
      companyData: data,
      analysis: analysis
    };
    
    const options: ReportGenerationOptions = {
      outputFormat: this.config.outputFormat || 'pptx',
      includeWatermark: true,
      aiModelPreference: 'balanced'
    };

    // Pass AI content to assembler
    const aiContent = data.metadata?.aiContent;
    
    // Use the main assemble method which properly generates comprehensive slides
    const fullReport = await this.reportAssembler.assemble(
      finalConfig,
      data,
      analysis,
      aiContent
    );

    return fullReport;
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
    this.progressTracker.abort();
    this.updateStatus('error', 'Report generation cancelled', this.status.progress);
  }

  /**
   * Gets the current processing status
   */
  getStatus(): ProcessingStatus {
    return { ...this.status };
  }

  /**
   * Determines focus areas based on report configuration
   */
  private getFocusAreas(): string[] {
    const areas = [];
    
    if (this.config.reportType === 'technical') {
      areas.push('technical');
    } else if (this.config.reportType === 'risk') {
      areas.push('risk');
    } else {
      areas.push('equity');
    }

    // Check if sections exist and is an array before using some()
    if (this.config.sections && Array.isArray(this.config.sections)) {
      if (this.config.sections.some(s => s.id && s.id.includes('competitive'))) {
        areas.push('competitive');
      }
    }

    if (this.config.includeProjections) {
      areas.push('future');
    }

    return areas;
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
    // Load templates from template registry
    Object.entries(REPORT_TEMPLATES).forEach(([id, template]) => {
      this.templates.set(id, template as any);
    });
  }

  /**
   * Generates basic slides when no template is available
   */
  private generateBasicSlides(data: CompanyData, analysis: AnalysisResults): any[] {
    return [
      {
        slideNumber: 1,
        title: `${data.companyName} Investment Analysis`,
        layout: 'title',
        content: [
          {
            type: 'text',
            data: {
              title: data.companyName,
              subtitle: `Ticker: ${data.ticker}`,
              date: new Date().toLocaleDateString()
            }
          }
        ]
      },
      {
        slideNumber: 2,
        title: 'Executive Summary',
        layout: 'content',
        content: [
          {
            type: 'text',
            data: {
              text: `Investment recommendation: ${analysis.composite.recommendation}`,
              bullets: [
                `Overall Score: ${analysis.composite.overall}/100`,
                `Primary Strength: ${this.getPrimaryStrength(analysis)}`,
                `Risk Level: ${this.getRiskLevel(analysis.risk.riskScore)}`
              ]
            }
          }
        ]
      }
    ];
  }

  /**
   * Gets data freshness information
   */
  private getDataFreshness(data: CompanyData): any {
    const freshness: any = {};
    
    if (data.financials?.incomeStatement?.[0]) {
      freshness.financial = data.financials.incomeStatement[0].date;
    }
    
    if (data.financials?.historicalPrices?.[0]) {
      freshness.market = data.financials.historicalPrices[0].date;
    }
    
    if (data.news?.[0]) {
      freshness.news = data.news[0].publishedDate;
    }
    
    return freshness;
  }

  private getPrimaryStrength(analysis: AnalysisResults): string {
    const scores = {
      growth: analysis.composite.growth,
      value: analysis.composite.value,
      quality: analysis.composite.quality,
      momentum: analysis.composite.momentum
    };

    const highest = Object.entries(scores).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    return `${highest[0].charAt(0).toUpperCase() + highest[0].slice(1)} (${highest[1]}/100)`;
  }

  private getRiskLevel(score: number): string {
    if (score < 30) return 'Low';
    if (score < 60) return 'Moderate';
    return 'High';
  }

  /**
   * Validates report configuration before processing
   */
  private validateReportConfig(): void {
    const errors: string[] = [];
    
    if (!this.config.ticker && !this.config.symbol) {
      errors.push('Missing required ticker or symbol');
    }
    
    if (!this.config.reportType && !this.config.template) {
      errors.push('Missing required reportType or template');
    }
    
    if (this.config.outputFormat && !['pdf', 'pptx', 'html'].includes(this.config.outputFormat)) {
      errors.push(`Invalid output format: ${this.config.outputFormat}`);
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid report configuration: ${errors.join(', ')}`);
    }
  }

  /**
   * Validates company data completeness and quality
   */
  private validateCompanyData(data: CompanyData): void {
    const errors: string[] = [];
    
    // Check required fields
    if (!data.ticker) errors.push('Missing ticker symbol');
    if (!data.companyName) errors.push('Missing company name');
    
    // Check financial data
    if (!data.financials) {
      errors.push('Missing financial data');
    } else {
      if (!data.financials.incomeStatement || data.financials.incomeStatement.length === 0) {
        errors.push('Missing income statement data');
      }
      if (!data.financials.balanceSheet || data.financials.balanceSheet.length === 0) {
        errors.push('Missing balance sheet data');
      }
      if (!data.financials.historicalPrices || data.financials.historicalPrices.length === 0) {
        errors.push('Missing price history data');
      }
      
      // Check for invalid metrics
      if (data.financials.keyMetrics) {
        const metrics = data.financials.keyMetrics;
        if (metrics.peRatio && (metrics.peRatio < 0 || metrics.peRatio > 1000)) {
          errors.push(`Invalid P/E ratio: ${metrics.peRatio}`);
        }
        if (metrics.roe && (metrics.roe < -10 || metrics.roe > 10)) {
          errors.push(`Invalid ROE: ${(metrics.roe * 100).toFixed(1)}%`);
        }
        if (metrics.debtToEquity && metrics.debtToEquity < 0) {
          errors.push(`Invalid debt-to-equity ratio: ${metrics.debtToEquity}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid company data: ${errors.join(', ')}`);
    }
  }

  /**
   * Validates analysis results for sanity and completeness
   */
  private validateAnalysisResults(analysis: AnalysisResults): void {
    const errors: string[] = [];
    
    // Check for NaN values in growth metrics
    if (analysis.growth) {
      const checkGrowthMetric = (name: string, metric: any) => {
        if (metric && (isNaN(metric.yoy) || isNaN(metric.qoq) || isNaN(metric.cagr3) || isNaN(metric.cagr5))) {
          errors.push(`Invalid ${name} growth metrics contain NaN values`);
        }
      };
      checkGrowthMetric('revenue', analysis.growth.revenueGrowth);
      checkGrowthMetric('earnings', analysis.growth.earningsGrowth);
      checkGrowthMetric('FCF', analysis.growth.fcfGrowth);
    }
    
    // Check composite score validity
    if (analysis.composite) {
      const score = analysis.composite.overall;
      if (isNaN(score) || score < 0 || score > 1) {
        errors.push(`Invalid overall score: ${score}`);
      }
      
      // Check sub-scores
      ['growth', 'value', 'quality', 'momentum', 'sentiment'].forEach(metric => {
        const value = analysis.composite[metric];
        if (value !== undefined && (isNaN(value) || value < 0 || value > 1)) {
          errors.push(`Invalid ${metric} score: ${value}`);
        }
      });
    }
    
    // Check valuation metrics
    if (analysis.valuation) {
      if (analysis.valuation.intrinsicValue <= 0) {
        errors.push('Invalid intrinsic value calculation');
      }
      if (analysis.valuation.fairValue <= 0) {
        errors.push('Invalid fair value calculation');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid analysis results: ${errors.join(', ')}`);
    }
  }

  /**
   * Validates the generated report
   */
  private validateGeneratedReport(report: GeneratedReport): void {
    const errors: string[] = [];
    
    if (!report.slides || report.slides.length === 0) {
      errors.push('No slides generated');
    }
    
    if (!report.outputPath) {
      errors.push('No output path specified');
    }
    
    if (!report.companyData) {
      errors.push('Missing company data in report');
    }
    
    // Check slide count expectations
    const slideCount = report.slides?.length || 0;
    if (slideCount < 10) {
      errors.push(`Insufficient slides generated: ${slideCount} (expected at least 10)`);
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid generated report: ${errors.join(', ')}`);
    }
  }

  /**
   * Generates fallback content when AI service fails
   */
  private generateFallbackContent(data: CompanyData, analysis: AnalysisResults): CompanyData {
    const enrichedData = { ...data };
    
    // Generate basic content based on data and analysis
    const executiveSummary = `${data.companyName} (${data.ticker}) Investment Analysis Report. ` +
      `Overall Score: ${Math.round((analysis.composite.overall || 0) * 100)}/100. ` +
      `Recommendation: ${analysis.composite.recommendation || 'HOLD'}. ` +
      `The company operates in the ${data.sector || 'N/A'} sector.`;
    
    const keyInsights = [
      `Revenue growth (YoY): ${analysis.growth?.revenueGrowth?.yoy || 0}%`,
      `ROE: ${((analysis.quality?.roe || 0) * 100).toFixed(1)}%`,
      `P/E Ratio: ${data.financials?.keyMetrics?.peRatio || 'N/A'}`,
      `Risk Score: ${analysis.risk?.riskScore || 'N/A'}/100`
    ];
    
    enrichedData.metadata = {
      ...enrichedData.metadata,
      aiContent: {
        executiveSummary,
        investmentThesis: 'Analysis based on quantitative metrics and financial data.',
        keyInsights,
        riskAnalysis: `Risk assessment indicates ${this.getRiskLevel(analysis.risk?.riskScore || 50)} risk level.`,
        futureOutlook: 'Future performance dependent on market conditions and company execution.',
        actionItems: ['Monitor quarterly earnings', 'Track industry trends', 'Review position sizing'],
        recommendationRationale: `Recommendation based on composite score of ${Math.round((analysis.composite.overall || 0) * 100)}/100.`,
        generatedAt: new Date().toISOString(),
        aiProvider: 'fallback',
        confidence: 0.5
      }
    };
    
    return enrichedData;
  }

  /**
   * Generates minimal error report when critical failures occur
   */
  private generateErrorReport(error: Error): GeneratedReport {
    const errorSlide = {
      slideNumber: 1,
      title: 'Report Generation Error',
      layout: 'title' as const,
      content: [
        {
          type: 'text' as const,
          data: {
            title: 'Error Generating Report',
            subtitle: error.message,
            date: new Date().toLocaleDateString()
          }
        }
      ]
    };
    
    return {
      reportId: this.config.reportId || `error-${Date.now()}`,
      companyData: {
        ticker: this.config.ticker || this.config.symbol || 'ERROR',
        companyName: 'Report Generation Failed',
        description: '',
        sector: '',
        industry: '',
        financials: {} as any,
        news: [],
        transcripts: [],
        technicals: {} as any,
        analysts: {} as any,
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      },
      slides: [errorSlide],
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: {},
        analysisResults: {} as any,
        errors: this.status.errors
      },
      outputPath: '',
      fileSize: 0
    };
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