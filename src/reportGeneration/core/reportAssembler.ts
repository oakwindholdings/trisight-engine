// src/reportGeneration/core/reportAssembler.ts
// Assembles processed data into final report format
// Context: Creates PPTX/PDF/HTML output with charts and formatted content

import { ReportConfig, GeneratedReport, CompanyData, ReportSlide, ReportGenerationOptions } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { ChartGenerator } from '../utils/chartGenerator';
import { logDebug } from '../../utils/logger';

export interface AssemblyResult {
  success: boolean;
  reportPath?: string;
  errors: any[];
}

export class ReportAssembler {
  private chartGenerator: ChartGenerator;
  private outputDirectory: string;

  constructor() {
    this.chartGenerator = new ChartGenerator();
    this.outputDirectory = './generated-reports/';
  }

  /**
   * Main entry point for report assembly
   * Creates the final report in the requested format
   */
  async assemble(
    config: ReportConfig,
    data: CompanyData,
    analysis: AnalysisResults
  ): Promise<GeneratedReport> {
    logDebug('ReportAssembler', `Assembling report for ${data.ticker}`);
    
    // Placeholder implementation
    // Phase 2 will implement actual PPTX/PDF generation
    
    const slides = this.createSlides(data, analysis);
    const outputPath = await this.generateOutput(config, slides);
    
    const report: GeneratedReport = {
      config,
      companyData: data,
      slides,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: 5000, // Placeholder
        dataFreshness: {
          financial: new Date().toISOString(),
          market: new Date().toISOString(),
          news: new Date().toISOString()
        },
        aiModel: 'gpt-4',
        version: '2.0'
      },
      outputPath
    };

    return report;
  }

  /**
   * Legacy method for backward compatibility
   */
  async assembleReport(
    config: ReportConfig,
    processedData: any,
    options: ReportGenerationOptions
  ): Promise<AssemblyResult> {
    logDebug('ReportAssembler', 'Legacy assemble method called');
    
    try {
      // Convert to new format
      const report = await this.assemble(
        config,
        processedData.companyData || {} as CompanyData,
        processedData.calculations || {} as AnalysisResults
      );
      
      return {
        success: true,
        reportPath: report.outputPath,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error]
      };
    }
  }

  private createSlides(data: CompanyData, analysis: AnalysisResults): ReportSlide[] {
    const slides: ReportSlide[] = [];
    
    // Title slide
    slides.push({
      slideNumber: 1,
      title: `${data.companyName} Investment Analysis`,
      content: [
        {
          type: 'text',
          data: {
            title: data.companyName,
            subtitle: `Ticker: ${data.ticker}`,
            date: new Date().toLocaleDateString()
          }
        }
      ],
      layout: 'title'
    });

    // Executive Summary slide
    slides.push({
      slideNumber: 2,
      title: 'Executive Summary',
      content: [
        {
          type: 'text',
          data: {
            text: `Investment recommendation: ${analysis.composite.recommendation.toUpperCase()}`,
            bullets: [
              `Overall Score: ${analysis.composite.overall}/100`,
              `Confidence: ${(analysis.composite.confidence * 100).toFixed(0)}%`,
              `Risk Level: ${this.getRiskLevel(analysis.risk.riskScore)}`
            ]
          }
        }
      ],
      layout: 'content'
    });

    // Financial Metrics slide
    slides.push({
      slideNumber: 3,
      title: 'Key Financial Metrics',
      content: [
        {
          type: 'table',
          data: {
            headers: ['Metric', 'Value', 'Assessment'],
            rows: [
              ['P/E Ratio', data.financials.keyMetrics.peRatio.toString(), 'Fair'],
              ['ROE', `${(data.financials.keyMetrics.roe * 100).toFixed(1)}%`, 'Good'],
              ['Debt/Equity', data.financials.keyMetrics.debtToEquity.toString(), 'Moderate']
            ]
          }
        }
      ],
      layout: 'content'
    });

    // Technical Analysis slide (placeholder)
    slides.push({
      slideNumber: 4,
      title: 'Technical Analysis',
      content: [
        {
          type: 'chart',
          data: {
            type: 'candlestick',
            title: 'Price Action'
          }
        }
      ],
      layout: 'chart'
    });

    return slides;
  }

  private async generateOutput(config: ReportConfig, slides: ReportSlide[]): Promise<string> {
    const format = config.outputFormat || 'pptx';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${config.ticker}_report_${timestamp}.${format}`;
    const outputPath = `${this.outputDirectory}${filename}`;
    
    // Placeholder - actual file generation will be implemented in Phase 2
    logDebug('ReportAssembler', `Report would be saved to: ${outputPath}`);
    
    return outputPath;
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore < 30) return 'Low';
    if (riskScore < 60) return 'Moderate';
    return 'High';
  }

  /**
   * Validates output before generation
   */
  async validateOutput(report: GeneratedReport): Promise<boolean> {
    // Placeholder validation
    return report.slides.length > 0;
  }
}