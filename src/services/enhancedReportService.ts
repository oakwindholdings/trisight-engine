// src/services/enhancedReportService.ts
// Enhanced report service that integrates with the existing UI
// Context: Bridges the EnhancedReportOrchestrator with the current reports page

import { EnhancedReportOrchestrator } from '../reportGeneration/enhanced/EnhancedReportOrchestrator';
import { logDebug, logError } from '../utils/logger';

interface EnhancedReportRequest {
  ticker: string;
  template: string;
  title: string;
  author: string;
  outputFormat?: 'pdf' | 'pptx' | 'json';
  reportType?: string;
  dataSources?: string[];
  sections?: string[];
  timeframe?: string;
  additionalOptions?: Record<string, any>;
}

interface EnhancedReportResponse {
  success: boolean;
  generationId: string;
  reportId: string;
  companyData?: any;
  slides?: any[];
  metadata?: any;
  outputPath?: string;
  downloadUrl?: string;
  fileSize?: number;
  format?: string;
  error?: string;
}

/**
 * Enhanced report service that provides superior report generation
 * Integrates seamlessly with the existing reports UI
 */
export class EnhancedReportService {
  private orchestrator: EnhancedReportOrchestrator;

  constructor() {
    this.orchestrator = new EnhancedReportOrchestrator();
  }

  /**
   * Generate enhanced report compatible with existing UI
   */
  async generateReport(request: EnhancedReportRequest): Promise<EnhancedReportResponse> {
    const startTime = Date.now();
    
    try {
      logDebug('EnhancedReportService', `Starting enhanced report generation for ${request.ticker}`);

      // Map request to enhanced config
      const enhancedConfig = this.mapToEnhancedConfig(request);

      // Generate report using enhanced orchestrator
      const enhancedReport = await this.orchestrator.generateEnhancedReport(enhancedConfig);

      // Map back to UI-compatible format
      const response = this.mapToUIResponse(enhancedReport, request);

      const processingTime = Date.now() - startTime;
      logDebug('EnhancedReportService', `Enhanced report completed in ${processingTime}ms`);

      return response;

    } catch (error) {
      logError('EnhancedReportService', 'Enhanced report generation failed', error);
      
      return {
        success: false,
        generationId: '',
        reportId: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Map UI request to enhanced config
   */
  private mapToEnhancedConfig(request: EnhancedReportRequest): any {
    return {
      symbol: request.ticker,
      reportType: this.mapReportType(request.template),
      timeframe: this.mapTimeframe(request.timeframe || '1Y'),
      includePatterns: this.shouldIncludePatterns(request.sections),
      includeNews: this.shouldIncludeNews(request.sections),
      includeRisk: this.shouldIncludeRisk(request.sections),
      outputFormat: request.outputFormat || 'pdf'
    };
  }

  /**
   * Map template to enhanced report type
   */
  private mapReportType(template: string): 'comprehensive' | 'technical' | 'fundamental' | 'risk' {
    switch (template) {
      case 'equity-research':
      case 'comprehensive':
        return 'comprehensive';
      case 'technical-analysis':
        return 'technical';
      case 'fundamental-analysis':
        return 'fundamental';
      case 'risk-assessment':
        return 'risk';
      default:
        return 'comprehensive';
    }
  }

  /**
   * Map timeframe to enhanced format
   */
  private mapTimeframe(timeframe: string): '1M' | '3M' | '6M' | '1Y' | '2Y' {
    switch (timeframe) {
      case '1M':
      case '1 month':
        return '1M';
      case '3M':
      case '3 months':
        return '3M';
      case '6M':
      case '6 months':
        return '6M';
      case '1Y':
      case '1 year':
        return '1Y';
      case '2Y':
      case '2 years':
        return '2Y';
      default:
        return '1Y';
    }
  }

  /**
   * Check if patterns should be included
   */
  private shouldIncludePatterns(sections?: string[]): boolean {
    if (!sections) return true;
    return sections.some(section => 
      section.includes('technical') || 
      section.includes('pattern') ||
      section.includes('chart')
    );
  }

  /**
   * Check if news should be included
   */
  private shouldIncludeNews(sections?: string[]): boolean {
    if (!sections) return true;
    return sections.some(section => 
      section.includes('news') || 
      section.includes('sentiment') ||
      section.includes('market')
    );
  }

  /**
   * Check if risk should be included
   */
  private shouldIncludeRisk(sections?: string[]): boolean {
    if (!sections) return true;
    return sections.some(section => 
      section.includes('risk') || 
      section.includes('assessment')
    );
  }

  /**
   * Map enhanced report to UI-compatible response
   */
  private mapToUIResponse(enhancedReport: any, request: EnhancedReportRequest): EnhancedReportResponse {
    // Create slides from enhanced report data
    const slides = this.createSlidesFromEnhancedReport(enhancedReport);

    // Create company data structure
    const companyData = {
      ticker: request.ticker,
      companyName: enhancedReport.data.companyProfile?.name || `${request.ticker} Corporation`,
      description: enhancedReport.data.companyProfile?.description || '',
      industry: enhancedReport.data.companyProfile?.industry || 'Unknown',
      sector: enhancedReport.data.companyProfile?.sector || 'Unknown',
      marketCap: enhancedReport.data.marketData?.quote?.market_cap || 0,
      currentPrice: enhancedReport.data.marketData?.quote?.close || 0,
      priceTarget: enhancedReport.analysis.priceTarget || 0
    };

    return {
      success: true,
      generationId: enhancedReport.reportId,
      reportId: enhancedReport.reportId,
      companyData,
      slides,
      metadata: {
        generatedAt: enhancedReport.metadata.generatedAt,
        generationTime: enhancedReport.metadata.processingTime,
        dataQuality: enhancedReport.metadata.dataQuality,
        confidence: enhancedReport.analysis.confidence,
        sources: enhancedReport.metadata.sources,
        aiModel: 'claude-opus-4-max',
        version: '3.0-enhanced'
      },
      outputPath: enhancedReport.outputPath || '',
      downloadUrl: enhancedReport.downloadUrl || '',
      fileSize: 0, // Will be set by PDF generator
      format: request.outputFormat || 'pdf'
    };
  }

  /**
   * Create slides from enhanced report data
   */
  private createSlidesFromEnhancedReport(enhancedReport: any): any[] {
    const slides = [];

    // Title slide
    slides.push({
      type: 'title',
      title: `${enhancedReport.config.symbol} Enhanced Investment Analysis`,
      subtitle: `Generated by TriSight Enhanced Analytics`,
      content: {
        symbol: enhancedReport.config.symbol,
        reportType: enhancedReport.config.reportType,
        generatedAt: enhancedReport.metadata.generatedAt,
        confidence: Math.round(enhancedReport.analysis.confidence * 100)
      }
    });

    // Executive Summary slide
    slides.push({
      type: 'executive-summary',
      title: 'Executive Summary',
      content: {
        summary: enhancedReport.analysis.executiveSummary,
        keyFindings: enhancedReport.analysis.keyFindings,
        priceTarget: enhancedReport.analysis.priceTarget,
        confidence: enhancedReport.analysis.confidence
      }
    });

    // Market Analysis slide
    if (enhancedReport.data.marketData) {
      slides.push({
        type: 'market-analysis',
        title: 'Market Analysis',
        content: {
          quote: enhancedReport.data.marketData.quote,
          technicalIndicators: enhancedReport.data.technicalIndicators,
          timeSeries: enhancedReport.data.marketData.timeSeries
        }
      });
    }

    // AI Insights slide
    if (enhancedReport.data.aiInsights) {
      slides.push({
        type: 'ai-insights',
        title: 'AI-Powered Insights',
        content: {
          insights: enhancedReport.data.aiInsights,
          reasoning: enhancedReport.data.aiInsights.reasoning,
          confidence: enhancedReport.data.aiInsights.confidence
        }
      });
    }

    // Risk Assessment slide
    if (enhancedReport.data.riskAssessment) {
      slides.push({
        type: 'risk-assessment',
        title: 'Risk Assessment',
        content: {
          riskFactors: enhancedReport.analysis.riskFactors,
          riskScore: enhancedReport.data.riskAssessment.overallRiskScore,
          mitigationStrategies: enhancedReport.data.riskAssessment.mitigationStrategies
        }
      });
    }

    // Recommendations slide
    slides.push({
      type: 'recommendations',
      title: 'Investment Recommendations',
      content: {
        recommendations: enhancedReport.analysis.recommendations,
        priceTarget: enhancedReport.analysis.priceTarget,
        timeHorizon: '12 months',
        confidence: enhancedReport.analysis.confidence
      }
    });

    return slides;
  }

  /**
   * Get report status (for compatibility)
   */
  getStatus(reportId: string): any {
    return {
      stage: 'completed',
      progress: 100,
      currentTask: 'Report generation completed',
      errors: [],
      startTime: Date.now()
    };
  }

  /**
   * Cancel report generation (for compatibility)
   */
  cancel(reportId: string): boolean {
    logDebug('EnhancedReportService', `Cancel requested for report: ${reportId}`);
    return true;
  }
}

// Singleton instance
let instance: EnhancedReportService | null = null;

/**
 * Get enhanced report service instance
 */
export function getEnhancedReportService(): EnhancedReportService {
  if (!instance) {
    instance = new EnhancedReportService();
  }
  return instance;
}

export default EnhancedReportService;
