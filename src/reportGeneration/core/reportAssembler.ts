// src/reportGeneration/core/reportAssembler.ts
// Assembles processed data into final report format
// Context: Creates PPTX/PDF/HTML output with charts and formatted content

import { ReportConfig, GeneratedReport, CompanyData, ReportSlide, ReportGenerationOptions } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { ChartGenerator, GeneratedChart } from '../utils/chartGenerator';
import { NodeCanvasChartGenerator, GeneratedNodeCanvasChart } from '../utils/nodeCanvasChartGenerator';
import { CanvasReportChartGenerator } from '../utils/canvasReportChartGenerator';
import { PDFEngine } from '../engines/pdfEngine';
import { PPTXEngine } from '../engines/pptxEngine';
import { generateComprehensiveSlides } from './comprehensiveSlideGenerator';
import { AIGeneratedContent } from '../services/anthropicAIService';
import { logDebug } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface AssemblyResult {
  success: boolean;
  reportPath?: string;
  errors: any[];
}

export class ReportAssembler {
  private chartGenerator: ChartGenerator;
  private nodeCanvasChartGenerator: NodeCanvasChartGenerator;
  private canvasReportChartGenerator: CanvasReportChartGenerator;
  private pdfEngine: PDFEngine;
  private pptxEngine: PPTXEngine;
  private outputDirectory: string;
  private generatedCharts: GeneratedChart[] = [];

  constructor() {
    this.chartGenerator = new ChartGenerator();
    this.nodeCanvasChartGenerator = new NodeCanvasChartGenerator();
    this.canvasReportChartGenerator = new CanvasReportChartGenerator();
    this.pdfEngine = new PDFEngine();
    this.pptxEngine = new PPTXEngine();
    this.outputDirectory = './generated-reports/';
    
    // Ensure output directory exists
    this.ensureOutputDirectory();
  }

  /**
   * Main entry point for report assembly
   * Creates the final report in the requested format
   */
  async assemble(
    config: ReportConfig,
    data: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    logDebug('ReportAssembler', `Assembling report for ${data?.ticker || 'unknown'}`);
    
    console.log('[ReportAssembler] Input data structure:', {
      hasData: !!data,
      ticker: data?.ticker,
      companyName: data?.companyName,
      hasFinancials: !!data?.financials,
      hasAnalysis: !!analysis,
      analysisKeys: analysis ? Object.keys(analysis) : [],
      hasAIContent: !!aiContent
    });
    
    const slides = await this.createSlides(data, analysis, aiContent, config);
    const outputPath = await this.generateOutput(config, slides);
    
    const report: GeneratedReport = {
      config,
      companyData: data,
      slides,
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime: Date.now() - startTime || 5000, // Real generation time or fallback
        dataFreshness: {
          financial: new Date().toISOString(),
          market: new Date().toISOString(),
          news: new Date().toISOString()
        },
        aiModel: aiContent ? 'claude-3' : 'fallback',
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
      console.log('[ReportAssembler] ProcessedData structure:', {
        hasCompanyData: !!processedData.companyData,
        hasCalculations: !!processedData.calculations,
        hasProcessedSections: !!processedData.processedSections,
        processedSectionsCount: processedData.processedSections?.length || 0,
        calculationsKeys: processedData.calculations ? Object.keys(processedData.calculations) : [],
        processedDataKeys: Object.keys(processedData)
      });
      
      // If we have processed sections (slides), use them directly
      let slides = processedData.processedSections || [];
      
      // If no slides but we have company data, generate them
      if (slides.length === 0 && (processedData.companyData || config.companyData)) {
        slides = await this.createSlides(
          processedData.companyData || config.companyData,
          processedData.calculations || config.analysis
        );
      }
      
      // Generate the actual report file
      const outputPath = await this.generateOutput(config, slides);
      
      return {
        success: true,
        reportPath: outputPath,
        errors: []
      };
    } catch (error) {
      console.error('[ReportAssembler] Error in assembleReport:', error);
      return {
        success: false,
        errors: [error]
      };
    }
  }

  private async createSlides(
    data: CompanyData, 
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent,
    config?: ReportConfig
  ): Promise<ReportSlide[]> {
    // Always use comprehensive slide generator for professional reports
    // This generates 15-20 slides with full content
    const slides = await generateComprehensiveSlides(data, analysis, aiContent, config);
    
    logDebug('ReportAssembler', `Created ${slides.length} comprehensive slides (expected: 15-20)`);
    return slides;
  }

  private async generateOutput(config: ReportConfig, slides: ReportSlide[]): Promise<string> {
    const format = config.outputFormat || 'pptx';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${config.ticker}_report_${timestamp}.${format}`;
    const outputPath = path.join(this.outputDirectory, filename);
    
    logDebug('ReportAssembler', `Generating ${format.toUpperCase()} report: ${outputPath}`);
    
    // Get company data and analysis from the config or first slide
    const companyData = config.companyData || this.extractCompanyData(slides);
    const analysis = config.analysis || this.extractAnalysis(slides);
    
    // Generate charts for all slides that need them
    this.generatedCharts = await this.generateChartsForSlides(slides, companyData);
    logDebug('ReportAssembler', `Generated ${this.generatedCharts.length} charts`);
    
    try {
      let reportData: Uint8Array;
      
      switch (format.toLowerCase()) {
        case 'pdf':
          reportData = await this.pdfEngine.generatePDF(
            companyData,
            analysis,
            slides,
            this.generatedCharts
          );
          await this.pdfEngine.saveToFile(reportData, outputPath);
          break;
          
        case 'pptx':
        case 'powerpoint':
          reportData = await this.pptxEngine.generatePPTX(
            companyData,
            analysis,
            slides,
            this.generatedCharts
          );
          await this.pptxEngine.saveToFile(reportData, outputPath);
          break;
          
        case 'json':
          // Fallback to JSON for API/UI consumption
          const jsonData = {
            metadata: {
              ticker: config.ticker,
              reportType: config.reportType,
              generatedAt: new Date().toISOString(),
              format: format
            },
            companyData,
            analysis,
            slides,
            charts: this.generatedCharts.map(c => ({
              type: c.type,
              format: c.format,
              dimensions: c.dimensions
            })),
            summary: this.generateExecutiveSummary(slides)
          };
          
          if (typeof window === 'undefined') {
            // Node.js environment
            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
          } else {
            // Browser environment - store in memory
            (window as any).__generatedReport = jsonData;
          }
          break;
          
        default:
          throw new Error(`Unsupported output format: ${format}`);
      }
      
      logDebug('ReportAssembler', `Report successfully generated: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      logDebug('ReportAssembler', `Error generating report: ${error}`);
      throw error;
    }
  }

  /**
   * Ensures output directory exists
   */
  private ensureOutputDirectory(): void {
    if (typeof window === 'undefined') {
      // Node.js environment
      if (!fs.existsSync(this.outputDirectory)) {
        fs.mkdirSync(this.outputDirectory, { recursive: true });
      }
    }
  }

  /**
   * Extracts company data from slides
   */
  private extractCompanyData(slides: ReportSlide[]): CompanyData {
    // Extract from title slide or use defaults
    const titleSlide = slides.find(s => s.layout === 'title');
    const ticker = titleSlide?.content[0]?.data?.subtitle?.match(/Ticker: (\w+)/)?.[1] || 'UNKNOWN';
    const companyName = titleSlide?.content[0]?.data?.title || 'Unknown Company';
    
    return {
      ticker,
      companyName,
      description: '',
      sector: '',
      industry: '',
      financials: {
        incomeStatement: [],
        balanceSheet: [],
        cashFlow: [],
        historicalPrices: [],
        keyMetrics: {} // Empty metrics instead of fake values
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        sources: {},
        quality: { overall: 0.85 }
      }
    } as CompanyData;
  }

  /**
   * Extracts analysis results from slides
   */
  private extractAnalysis(slides: ReportSlide[]): AnalysisResults {
    // Extract from executive summary or use defaults
    const execSlide = slides.find(s => s.title === 'Executive Summary');
    
    // Return empty analysis results - these should be calculated from real data
    // Not extracted from slides or hardcoded
    return {} as AnalysisResults;
  }

  /**
   * Generates charts for slides that need them
   */
  private async generateChartsForSlides(slides: ReportSlide[], companyData: CompanyData): Promise<GeneratedChart[]> {
    const charts: GeneratedChart[] = [];
    
    logDebug('ReportAssembler', `Generating charts for ${slides.length} slides`);
    
    for (const slide of slides) {
      for (const content of slide.content) {
        if (content.type === 'chart') {
          logDebug('ReportAssembler', `Found chart request: type=${content.data.type}`);
          try {
            let chart: GeneratedChart;
            
            switch (content.data.type) {
              case 'candlestick':
                // Generate real candlestick chart from historical prices
                const priceData = companyData.financials?.historicalPrices;
                if (!priceData || priceData.length === 0) {
                  logDebug('ReportAssembler', 'No historical price data available for candlestick chart');
                  continue; // Skip this chart if no data
                }
                // Use our proprietary canvas chart generator with pattern detection
                // This leverages our multi-layered rendering system
                const canvasChart = await this.canvasReportChartGenerator.generateCandlestickChart(
                  priceData.slice(0, 90), // Show 90 days for better pattern visibility
                  [], // Patterns will be detected and rendered if available
                  { 
                    width: 800, 
                    height: 400, 
                    format: 'png',
                    showPatterns: true,
                    showSignals: true,
                    showVolume: true,
                    transparentLabels: true, // Enable signal emission
                    ultraFeatures: {
                      useExtendedHistory: true,
                      includeAllIndicators: false,
                      streamingEnabled: false,
                      unlimitedAPICalls: true
                    }
                  }
                );
                chart = canvasChart;
                break;
                
              case 'line':
                // Generate line chart for price trends
                const lineData = this.prepareLineChartData(companyData);
                if (lineData.length === 0) {
                  logDebug('ReportAssembler', 'No data available for line chart');
                  continue;
                }
                const lineCanvasChart = await this.nodeCanvasChartGenerator.generateLineChart(
                  lineData,
                  ['price', 'sma20'],
                  { width: 800, height: 400, format: 'png' }
                );
                chart = lineCanvasChart as GeneratedChart;
                break;
                
              case 'bar':
                // Generate bar chart for financial metrics
                const barData = this.prepareBarChartData(companyData);
                if (barData.length === 0) {
                  logDebug('ReportAssembler', 'No data available for bar chart');
                  continue;
                }
                const barCanvasChart = await this.nodeCanvasChartGenerator.generateBarChart(
                  barData,
                  'quarter',
                  ['revenue', 'netIncome'],
                  { width: 800, height: 400, format: 'png' }
                );
                chart = barCanvasChart as GeneratedChart;
                break;
                
              case 'pie':
                // Generate pie chart for revenue breakdown
                const pieData = this.preparePieChartData(companyData);
                if (pieData.length === 0) {
                  logDebug('ReportAssembler', 'No data available for pie chart');
                  continue;
                }
                const pieCanvasChart = await this.nodeCanvasChartGenerator.generatePieChart(
                  pieData,
                  { width: 400, height: 400, format: 'png' }
                );
                chart = pieCanvasChart as GeneratedChart;
                break;
                
              default:
                // Default to line chart
                const defaultData = this.prepareLineChartData(companyData);
                if (defaultData.length === 0) {
                  logDebug('ReportAssembler', 'No data available for default chart');
                  continue;
                }
                const defaultCanvasChart = await this.nodeCanvasChartGenerator.generateLineChart(
                  defaultData,
                  ['price'],
                  { width: 800, height: 400, format: 'png' }
                );
                chart = defaultCanvasChart as GeneratedChart;
            }
            
            charts.push(chart);
            
          } catch (error) {
            logDebug('ReportAssembler', `Failed to generate ${content.data.type} chart: ${error}`);
          }
        }
      }
    }
    
    return charts;
  }


  /**
   * Prepares data for line chart
   */
  private prepareLineChartData(companyData: CompanyData): any[] {
    const prices = companyData.financials?.historicalPrices;
    if (!prices || prices.length === 0) {
      return []; // Return empty array if no data
    }
    
    return prices.slice(0, 30).map((p, i) => ({
      date: p.date,
      price: p.close,
      sma20: this.calculateSMA(prices.slice(0, i + 20), 20)
    }));
  }

  /**
   * Prepares data for bar chart
   */
  private prepareBarChartData(companyData: CompanyData): any[] {
    const statements = companyData.financials?.incomeStatement || [];
    
    if (statements.length === 0) {
      return []; // Return empty array if no data
    }
    
    return statements.slice(0, 4).map(stmt => ({
      quarter: this.formatQuarter(stmt.date),
      revenue: (stmt.revenue || 0) / 1e6, // Convert to millions
      netIncome: (stmt.netIncome || 0) / 1e6
    }));
  }

  /**
   * Prepares data for pie chart
   */
  private preparePieChartData(companyData: CompanyData): any[] {
    const latestIncome = companyData.financials?.incomeStatement?.[0];
    const revenue = latestIncome?.revenue;
    
    if (!revenue) {
      return []; // Return empty array if no revenue data
    }
    
    // Without segment data, we can't create a meaningful pie chart
    // In a real implementation, this would come from segment reporting data
    return [
      { label: 'Total Revenue', value: revenue }
    ];
  }

  /**
   * Helper to calculate simple moving average
   */
  private calculateSMA(prices: any[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]?.close || 0;
    const sum = prices.slice(-period).reduce((acc, p) => acc + p.close, 0);
    return sum / period;
  }

  /**
   * Formats date to quarter string
   */
  private formatQuarter(dateStr: string): string {
    const date = new Date(dateStr);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  }

  /**
   * Generates executive summary from slides
   */
  private generateExecutiveSummary(slides: ReportSlide[]): string {
    const summarySlide = slides.find(s => s.title === 'Executive Summary');
    if (summarySlide && summarySlide.content.length > 0) {
      const textContent = summarySlide.content[0];
      if (textContent.type === 'text' && textContent.data.text) {
        return textContent.data.text;
      }
    }
    return 'Executive summary not available';
  }

  /**
   * Validates output before generation
   */
  async validateOutput(report: GeneratedReport): Promise<boolean> {
    if (!report.slides || report.slides.length === 0) {
      return false;
    }
    
    // Validate each slide has required content
    for (const slide of report.slides) {
      if (!slide.title || !slide.content || slide.content.length === 0) {
        return false;
      }
    }
    
    return true;
  }
}