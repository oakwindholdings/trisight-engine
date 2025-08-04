// src/reportGeneration/engines/pdfEngine.ts
// Real PDF generation engine for regulatory-compliant reports
// Context: Creates actual PDF files with embedded charts and formatted content

import { jsPDF } from 'jspdf';
import { ReportSlide, CompanyData, ChartData } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { GeneratedChart } from '../utils/chartGenerator';
import { logDebug } from '../../utils/logger';

/**
 * PDF Report Configuration
 */
interface PDFConfig {
  orientation: 'portrait' | 'landscape';
  unit: 'mm' | 'pt' | 'in';
  format: 'a4' | 'letter' | 'legal';
  compress: boolean;
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
}

/**
 * Production PDF Generation Engine
 * Creates regulatory-compliant PDF reports with real data
 */
export class PDFEngine {
  private doc: jsPDF;
  private config: PDFConfig;
  private currentPage: number = 1;
  private pageHeight: number;
  private pageWidth: number;
  private margins = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };
  
  // Professional color scheme
  private colors = {
    primary: '#1e293b',      // Slate 800
    secondary: '#64748b',    // Slate 500
    accent: '#10b981',       // Emerald 500
    danger: '#ef4444',       // Red 500
    warning: '#f59e0b',      // Amber 500
    success: '#22c55e',      // Green 500
    text: '#0f172a',         // Slate 900
    textLight: '#64748b',    // Slate 500
    background: '#f8fafc',   // Slate 50
    border: '#e2e8f0'        // Slate 200
  };

  constructor(config?: Partial<PDFConfig>) {
    this.config = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      title: 'Investment Analysis Report',
      author: 'TriSight Analytics',
      subject: 'Equity Research Report',
      keywords: ['financial', 'analysis', 'investment'],
      creator: 'TriSight Report Generator v2.0',
      ...config
    };

    // Initialize jsPDF
    this.doc = new jsPDF({
      orientation: this.config.orientation,
      unit: this.config.unit,
      format: this.config.format,
      compress: this.config.compress
    });

    // Set document properties
    this.doc.setProperties({
      title: this.config.title,
      subject: this.config.subject,
      author: this.config.author,
      keywords: this.config.keywords.join(', '),
      creator: this.config.creator
    });

    // Get page dimensions
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // Add custom fonts if needed
    this.setupFonts();
  }

  /**
   * Generates a complete PDF report
   */
  async generatePDF(
    companyData: CompanyData,
    analysis: AnalysisResults,
    slides: ReportSlide[],
    charts: GeneratedChart[]
  ): Promise<Uint8Array> {
    logDebug('PDFEngine', `Generating PDF for ${companyData.ticker} with ${slides.length} slides`);

    try {
      // Process all slides - the comprehensive slide generator has already created the full structure
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        logDebug('PDFEngine', `Processing slide ${i + 1}/${slides.length}: ${slide.title}`);
        
        // Add new page for each slide (except the first one)
        if (i > 0) {
          this.addNewPage();
        }
        
        await this.processSlide(slide, charts, companyData, analysis);
      }

      // Return PDF as Uint8Array
      const pdfOutput = this.doc.output('arraybuffer');
      logDebug('PDFEngine', `PDF generation complete - ${this.currentPage} pages`);
      return new Uint8Array(pdfOutput);

    } catch (error) {
      logDebug('PDFEngine', `Error generating PDF: ${error}`);
      throw error;
    }
  }

  /**
   * Sets up custom fonts for professional appearance
   */
  private setupFonts(): void {
    // Default fonts are sufficient for now
    // In production, could add custom corporate fonts
    this.doc.setFont('helvetica');
  }

  /**
   * Adds professional cover page
   */
  private addCoverPage(data: CompanyData, analysis: AnalysisResults): void {
    const centerX = this.pageWidth / 2;
    
    // Company logo placeholder
    this.doc.setFillColor(this.colors.primary);
    this.doc.rect(centerX - 30, 30, 60, 20, 'F');

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(32);
    this.doc.setTextColor(this.colors.primary);
    this.doc.text(data.companyName, centerX, 80, { align: 'center' });

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(20);
    this.doc.setTextColor(this.colors.secondary);
    this.doc.text('Investment Analysis Report', centerX, 95, { align: 'center' });

    // Ticker and date
    this.doc.setFontSize(16);
    this.doc.text(`${data.ticker} | ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, centerX, 110, { align: 'center' });

    // Key metrics box
    const boxY = 140;
    const boxHeight = 80;
    this.doc.setDrawColor(this.colors.border);
    this.doc.setLineWidth(0.5);
    this.doc.rect(40, boxY, this.pageWidth - 80, boxHeight);

    // Recommendation
    const recommendation = analysis.composite.recommendation.toUpperCase();
    const recColor = this.getRecommendationColor(recommendation);
    this.doc.setFillColor(recColor);
    this.doc.rect(50, boxY + 10, 60, 25, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(recommendation, 80, boxY + 27, { align: 'center' });

    // Score
    this.doc.setTextColor(this.colors.text);
    this.doc.setFontSize(24);
    this.doc.text(`${analysis.composite.overall}/100`, centerX + 40, boxY + 27, { align: 'center' });
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Overall Score', centerX + 40, boxY + 35, { align: 'center' });

    // Key metrics grid
    const metricsY = boxY + 50;
    this.doc.setFontSize(14);
    const metrics = [
      { label: 'Growth', value: analysis.composite.growth },
      { label: 'Value', value: analysis.composite.value },
      { label: 'Quality', value: analysis.composite.quality },
      { label: 'Momentum', value: analysis.composite.momentum }
    ];

    metrics.forEach((metric, i) => {
      const x = 50 + (i * 35);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.label, x, metricsY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${metric.value}`, x, metricsY + 8);
    });

    // Footer
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.colors.textLight);
    this.doc.text('Generated by TriSight Analytics', centerX, this.pageHeight - 20, { align: 'center' });

    this.addNewPage();
  }

  /**
   * Adds table of contents
   */
  private addTableOfContents(slides: ReportSlide[]): void {
    this.addSectionHeader('Table of Contents');
    
    let yPosition = 60;
    const sections = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Financial Analysis', page: 4 },
      { title: 'Technical Analysis', page: 5 },
      { title: 'Valuation Metrics', page: 6 },
      { title: 'Risk Assessment', page: 7 },
      { title: 'Investment Thesis', page: 8 },
      { title: 'Appendix', page: 9 }
    ];

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);

    sections.forEach(section => {
      // Section title
      this.doc.setTextColor(this.colors.text);
      this.doc.text(section.title, this.margins.left, yPosition);
      
      // Dotted line
      const titleWidth = this.doc.getTextWidth(section.title);
      const dotsStart = this.margins.left + titleWidth + 5;
      const dotsEnd = this.pageWidth - this.margins.right - 20;
      
      for (let x = dotsStart; x < dotsEnd; x += 3) {
        this.doc.text('.', x, yPosition);
      }
      
      // Page number
      this.doc.text(section.page.toString(), this.pageWidth - this.margins.right - 10, yPosition);
      
      yPosition += 10;
    });

    this.addNewPage();
  }

  /**
   * Adds executive summary with real metrics
   */
  private addExecutiveSummary(data: CompanyData, analysis: AnalysisResults): void {
    this.addSectionHeader('Executive Summary');
    
    let yPosition = 60;
    
    // Investment recommendation box
    const recBox = {
      x: this.margins.left,
      y: yPosition,
      width: this.pageWidth - this.margins.left - this.margins.right,
      height: 30
    };
    
    const recommendation = analysis.composite.recommendation.toUpperCase();
    const recColor = this.getRecommendationColor(recommendation);
    
    this.doc.setFillColor(recColor);
    this.doc.rect(recBox.x, recBox.y, recBox.width, recBox.height, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.text(
      `Investment Recommendation: ${recommendation}`,
      this.pageWidth / 2,
      yPosition + 18,
      { align: 'center' }
    );
    
    yPosition += 40;
    
    // Key findings
    this.doc.setTextColor(this.colors.text);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Key Findings:', this.margins.left, yPosition);
    
    yPosition += 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    
    const findings = [
      `• Overall investment score of ${analysis.composite.overall}/100 with ${(analysis.composite.confidence * 100).toFixed(0)}% confidence`,
      `• ${data.companyName} shows ${analysis.growth.revenueGrowth.trend} revenue growth with ${analysis.growth.revenueGrowth.yoy.toFixed(1)}% YoY increase`,
      `• Current valuation appears ${analysis.valuation.valuation} with ${(analysis.valuation.marginOfSafety * 100).toFixed(1)}% margin of safety`,
      `• Risk assessment indicates ${this.getRiskLevel(analysis.risk.riskScore)} risk profile with beta of ${analysis.risk.beta.toFixed(2)}`,
      `• Quality metrics show ${analysis.quality.moat} moat with ROIC of ${analysis.quality.roic.toFixed(1)}%`
    ];
    
    findings.forEach(finding => {
      const lines = this.doc.splitTextToSize(finding, this.pageWidth - this.margins.left - this.margins.right - 10);
      lines.forEach(line => {
        this.doc.text(line, this.margins.left + 5, yPosition);
        yPosition += 6;
      });
    });
    
    yPosition += 10;
    
    // Financial highlights table
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Financial Highlights:', this.margins.left, yPosition);
    
    yPosition += 10;
    
    // Create metrics table
    const tableData = [
      ['Metric', 'Current', 'YoY Change', 'Assessment'],
      ['Revenue Growth', `${analysis.growth.revenueGrowth.yoy.toFixed(1)}%`, `${analysis.growth.revenueGrowth.trend}`, this.getAssessment(analysis.growth.revenueGrowth.yoy)],
      ['P/E Ratio', data.financials?.keyMetrics?.peRatio?.toFixed(1) || 'N/A', '-', this.getValuationAssessment(data.financials?.keyMetrics?.peRatio || 0)],
      ['ROE', `${((data.financials?.keyMetrics?.roe || 0) * 100).toFixed(1)}%`, '-', this.getQualityAssessment(data.financials?.keyMetrics?.roe || 0)],
      ['Debt/Equity', data.financials?.keyMetrics?.debtToEquity?.toFixed(2) || 'N/A', '-', this.getLeverageAssessment(data.financials?.keyMetrics?.debtToEquity || 0)]
    ];
    
    this.addTable(this.margins.left, yPosition, tableData);
    
    this.addNewPage();
  }

  /**
   * Processes individual slides
   */
  private async processSlide(
    slide: ReportSlide,
    charts: GeneratedChart[],
    data: CompanyData,
    analysis: AnalysisResults
  ): Promise<void> {
    let yPosition = 40;
    
    // Handle different slide layouts
    if (slide.layout === 'title') {
      // Title slide - special handling
      this.addTitleSlide(slide, data);
      return;
    }
    
    // Add section header for all other slides
    this.addSectionHeader(slide.title);
    yPosition = 60;
    
    for (const content of slide.content) {
      switch (content.type) {
        case 'text':
          yPosition = this.addTextContent(content.data, yPosition);
          break;
          
        case 'chart':
          yPosition = await this.addChartContent(content.data, charts, yPosition);
          break;
          
        case 'table':
          yPosition = this.addTableContent(content.data, yPosition);
          break;
          
        case 'bullets':
          yPosition = this.addBulletPoints(content.data, yPosition);
          break;
          
        case 'scorecard':
          yPosition = this.addScorecardContent(content.data, yPosition);
          break;
          
        case 'metrics':
          yPosition = this.addMetricsContent(content.data, yPosition);
          break;
          
        case 'metrics-grid':
          yPosition = this.addMetricsGridContent(content.data, yPosition);
          break;
          
        case 'recommendation':
          yPosition = this.addRecommendationContent(content.data, yPosition);
          break;
          
        case 'logo':
          // Skip logo for PDF
          break;
      }
      
      // Check if we need a new page
      if (yPosition > this.pageHeight - 50) {
        this.addNewPage();
        this.addSectionHeader(slide.title + ' (continued)');
        yPosition = 60;
      }
    }
  }

  /**
   * Adds text content to PDF
   */
  private addTextContent(data: any, yPosition: number): number {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(this.colors.text);
    
    if (data.title) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.text(data.title, this.margins.left, yPosition);
      yPosition += 10;
    }
    
    if (data.text) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      const lines = this.doc.splitTextToSize(data.text, this.pageWidth - this.margins.left - this.margins.right);
      lines.forEach(line => {
        this.doc.text(line, this.margins.left, yPosition);
        yPosition += 6;
      });
    }
    
    if (data.bullets) {
      yPosition = this.addBulletPoints({ items: data.bullets }, yPosition);
    }
    
    return yPosition + 10;
  }

  /**
   * Adds chart to PDF
   */
  private async addChartContent(data: any, charts: GeneratedChart[], yPosition: number): Promise<number> {
    // Find matching chart
    const chart = charts.find(c => c.type === data.type);
    
    logDebug('PDFEngine', `addChartContent called with data.type=${data.type}, found chart=${!!chart}, charts.length=${charts.length}`);
    
    if (chart) {
      try {
        // Calculate dimensions
        const chartWidth = this.pageWidth - this.margins.left - this.margins.right;
        const chartHeight = 100; // Fixed height for consistency
        
        if (chart.format === 'svg') {
          // For SVG charts, we need to convert to PNG for better PDF compatibility
          // In a real implementation, we'd use node-canvas or similar to convert SVG to PNG
          logDebug('PDFEngine', 'SVG chart detected - conversion to PNG needed for PDF embedding');
          
          // For now, we'll skip SVG charts as jsPDF has limited SVG support
          // A proper implementation would:
          // 1. Use node-canvas to render SVG to Canvas
          // 2. Export Canvas to PNG
          // 3. Embed PNG in PDF
          
          // Placeholder for chart
          this.doc.setDrawColor(this.colors.border);
          this.doc.setLineWidth(0.5);
          this.doc.rect(
            this.margins.left, 
            yPosition, 
            chartWidth, 
            chartHeight
          );
          
          // Add chart title in center
          this.doc.setTextColor(this.colors.textLight);
          this.doc.setFontSize(10);
          this.doc.text(
            `[${data.title || 'Chart'} - ${data.type}]`,
            this.pageWidth / 2,
            yPosition + chartHeight / 2,
            { align: 'center' }
          );
          
          return yPosition + chartHeight + 10;
        } else if (chart.format === 'png' || chart.format === 'jpeg') {
          // For PNG/JPEG charts, we can directly embed them
          const imageFormat = chart.format.toUpperCase() as 'PNG' | 'JPEG';
          
          // Add the image
          this.doc.addImage(
            chart.data, // Base64 data
            imageFormat,
            this.margins.left,
            yPosition,
            chartWidth,
            chartHeight
          );
          
          return yPosition + chartHeight + 10;
        }
      } catch (error) {
        logDebug('PDFEngine', `Failed to embed chart: ${error}`);
        
        // Fallback: render chart placeholder with title
        this.doc.setDrawColor(this.colors.border);
        this.doc.setLineWidth(0.5);
        this.doc.rect(
          this.margins.left, 
          yPosition, 
          this.pageWidth - this.margins.left - this.margins.right, 
          100
        );
        
        // Add chart title in center
        this.doc.setTextColor(this.colors.textLight);
        this.doc.setFontSize(10);
        this.doc.text(
          `[${data.title || 'Chart'} - ${data.type}]`,
          this.pageWidth / 2,
          yPosition + 50,
          { align: 'center' }
        );
        
        return yPosition + 110;
      }
    }
    
    // No chart found, skip
    return yPosition;
  }

  /**
   * Adds table to PDF
   */
  private addTableContent(data: any, yPosition: number): number {
    if (!data.headers || !data.rows) return yPosition;
    
    const tableData = [data.headers, ...data.rows];
    return this.addTable(this.margins.left, yPosition, tableData) + 10;
  }

  /**
   * Adds bullet points
   */
  private addBulletPoints(data: any, yPosition: number): number {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(this.colors.text);
    
    const items = data.items || [];
    items.forEach(item => {
      this.doc.text('•', this.margins.left, yPosition);
      
      const lines = this.doc.splitTextToSize(item, this.pageWidth - this.margins.left - this.margins.right - 10);
      lines.forEach((line, i) => {
        this.doc.text(line, this.margins.left + 10, yPosition + (i * 6));
      });
      
      yPosition += lines.length * 6 + 3;
    });
    
    return yPosition;
  }

  /**
   * Adds a formatted table
   */
  private addTable(x: number, y: number, data: string[][]): number {
    const cellWidth = (this.pageWidth - this.margins.left - this.margins.right) / data[0].length;
    const cellHeight = 8;
    let currentY = y;
    
    // Draw table
    data.forEach((row, rowIndex) => {
      let currentX = x;
      
      row.forEach((cell, colIndex) => {
        // Cell background for header
        if (rowIndex === 0) {
          this.doc.setFillColor(this.colors.primary);
          this.doc.rect(currentX, currentY, cellWidth, cellHeight, 'F');
          this.doc.setTextColor(255, 255, 255);
          this.doc.setFont('helvetica', 'bold');
        } else {
          this.doc.setDrawColor(this.colors.border);
          this.doc.rect(currentX, currentY, cellWidth, cellHeight);
          this.doc.setTextColor(this.colors.text);
          this.doc.setFont('helvetica', 'normal');
        }
        
        // Center text in cell
        this.doc.setFontSize(10);
        const textWidth = this.doc.getTextWidth(cell);
        const textX = currentX + (cellWidth - textWidth) / 2;
        this.doc.text(cell, textX, currentY + 5.5);
        
        currentX += cellWidth;
      });
      
      currentY += cellHeight;
    });
    
    return currentY;
  }

  /**
   * Adds section header
   */
  private addSectionHeader(title: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(this.colors.primary);
    this.doc.text(title, this.margins.left, 40);
    
    // Add horizontal line
    this.doc.setDrawColor(this.colors.accent);
    this.doc.setLineWidth(1);
    this.doc.line(this.margins.left, 45, this.pageWidth - this.margins.right, 45);
    
    // Add page number
    this.addPageNumber();
  }

  /**
   * Adds disclaimers page
   */
  private addDisclaimers(): void {
    this.addNewPage();
    this.addSectionHeader('Important Disclaimers');
    
    const disclaimers = [
      'This report is for informational purposes only and does not constitute investment advice.',
      'Past performance is not indicative of future results.',
      'All investments carry risk, including the potential loss of principal.',
      'The analysis and recommendations in this report are based on publicly available information.',
      'TriSight Analytics does not guarantee the accuracy or completeness of the information.',
      'Investors should conduct their own due diligence before making investment decisions.',
      'This report may contain forward-looking statements subject to risks and uncertainties.'
    ];
    
    let yPosition = 60;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.colors.textLight);
    
    disclaimers.forEach((disclaimer, i) => {
      const lines = this.doc.splitTextToSize(
        `${i + 1}. ${disclaimer}`,
        this.pageWidth - this.margins.left - this.margins.right
      );
      
      lines.forEach(line => {
        this.doc.text(line, this.margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 4;
    });
    
    // Add generation timestamp
    yPosition += 20;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.text(
      `Report generated on ${new Date().toLocaleString()} by TriSight Analytics v2.0`,
      this.pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
  }

  /**
   * Adds new page and increments counter
   */
  private addNewPage(): void {
    this.doc.addPage();
    this.currentPage++;
  }

  /**
   * Adds page number to current page
   */
  private addPageNumber(): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.colors.textLight);
    this.doc.text(
      `Page ${this.currentPage}`,
      this.pageWidth - this.margins.right,
      this.pageHeight - 10,
      { align: 'right' }
    );
  }

  /**
   * Helper methods for assessments
   */
  private getRecommendationColor(recommendation: string): string {
    switch (recommendation) {
      case 'STRONGBUY': return this.colors.success;
      case 'BUY': return this.colors.accent;
      case 'HOLD': return this.colors.warning;
      case 'SELL': return this.colors.danger;
      case 'STRONGSELL': return this.colors.danger;
      default: return this.colors.secondary;
    }
  }

  private getRiskLevel(score: number): string {
    if (score < 30) return 'low';
    if (score < 60) return 'moderate';
    return 'high';
  }

  private getAssessment(value: number): string {
    if (value > 20) return 'Strong';
    if (value > 10) return 'Good';
    if (value > 0) return 'Moderate';
    if (value > -10) return 'Weak';
    return 'Poor';
  }

  private getValuationAssessment(pe: number): string {
    if (pe < 15) return 'Undervalued';
    if (pe < 25) return 'Fair';
    if (pe < 35) return 'Premium';
    return 'Overvalued';
  }

  private getQualityAssessment(roe: number): string {
    if (roe > 0.20) return 'Excellent';
    if (roe > 0.15) return 'Good';
    if (roe > 0.10) return 'Average';
    return 'Poor';
  }

  private getLeverageAssessment(de: number): string {
    if (de < 0.5) return 'Conservative';
    if (de < 1.0) return 'Moderate';
    if (de < 2.0) return 'Aggressive';
    return 'High Risk';
  }

  /**
   * Adds title slide
   */
  private addTitleSlide(slide: ReportSlide, data: CompanyData): void {
    const centerX = this.pageWidth / 2;
    
    // Extract title data
    const titleContent = slide.content.find(c => c.type === 'text');
    const titleData = titleContent?.data || {};
    
    // Company logo placeholder
    this.doc.setFillColor(this.colors.primary);
    this.doc.rect(centerX - 30, 30, 60, 20, 'F');

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(32);
    this.doc.setTextColor(this.colors.primary);
    this.doc.text(titleData.title || data.companyName, centerX, 80, { align: 'center' });

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(20);
    this.doc.setTextColor(this.colors.secondary);
    this.doc.text(titleData.subtitle || 'Investment Analysis Report', centerX, 95, { align: 'center' });

    // Date
    this.doc.setFontSize(16);
    this.doc.text(titleData.date || new Date().toLocaleDateString(), centerX, 110, { align: 'center' });

    // Author
    if (titleData.author) {
      this.doc.setFontSize(14);
      this.doc.text(titleData.author, centerX, 125, { align: 'center' });
    }

    // Footer
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.colors.textLight);
    this.doc.text('Generated by TriSight Analytics', centerX, this.pageHeight - 20, { align: 'center' });
  }

  /**
   * Adds scorecard content
   */
  private addScorecardContent(data: any, yPosition: number): number {
    if (!data.items) return yPosition;
    
    const items = data.items;
    const boxWidth = (this.pageWidth - this.margins.left - this.margins.right) / items.length;
    const boxHeight = 40;
    
    items.forEach((item: any, i: number) => {
      const x = this.margins.left + (i * boxWidth);
      
      // Box background
      this.doc.setFillColor(item.color || this.colors.primary);
      this.doc.setDrawColor(this.colors.border);
      this.doc.setLineWidth(0.5);
      this.doc.rect(x, yPosition, boxWidth - 5, boxHeight, 'FD');
      
      // Label
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.text(item.label, x + boxWidth / 2, yPosition + 12, { align: 'center' });
      
      // Value
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(16);
      this.doc.text(item.value, x + boxWidth / 2, yPosition + 28, { align: 'center' });
    });
    
    return yPosition + boxHeight + 15;
  }

  /**
   * Adds metrics content
   */
  private addMetricsContent(data: any, yPosition: number): number {
    if (data.title) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.colors.text);
      this.doc.text(data.title, this.margins.left, yPosition);
      yPosition += 10;
    }
    
    if (data.metrics) {
      data.metrics.forEach((metric: any) => {
        // Metric label
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight);
        this.doc.text(metric.label + ':', this.margins.left, yPosition);
        
        // Metric value
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(metric.color || this.colors.text);
        this.doc.text(metric.current || metric.value, this.margins.left + 60, yPosition);
        
        // Change value
        if (metric.change) {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9);
          const changeColor = metric.change.startsWith('+') ? this.colors.success : this.colors.danger;
          this.doc.setTextColor(changeColor);
          this.doc.text(metric.change, this.margins.left + 120, yPosition);
        }
        
        yPosition += 8;
      });
    }
    
    return yPosition + 5;
  }

  /**
   * Adds metrics grid content
   */
  private addMetricsGridContent(data: any, yPosition: number): number {
    if (!data.metrics) return yPosition;
    
    const metrics = data.metrics;
    const cols = 4;
    const cellWidth = (this.pageWidth - this.margins.left - this.margins.right) / cols;
    const cellHeight = 20;
    
    let currentRow = 0;
    let currentCol = 0;
    
    metrics.forEach((metric: any, i: number) => {
      const x = this.margins.left + (currentCol * cellWidth);
      const y = yPosition + (currentRow * cellHeight);
      
      // Category header
      if (i === 0 || metrics[i - 1].category !== metric.category) {
        if (currentCol !== 0) {
          currentRow++;
          currentCol = 0;
        }
        
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(11);
        this.doc.setTextColor(this.colors.primary);
        this.doc.text(metric.category, this.margins.left, yPosition + (currentRow * cellHeight));
        currentRow++;
      }
      
      // Metric
      const metricX = this.margins.left + (currentCol * cellWidth);
      const metricY = yPosition + (currentRow * cellHeight);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(this.colors.textLight);
      this.doc.text(metric.label, metricX, metricY);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.colors.text);
      this.doc.text(metric.value, metricX, metricY + 8);
      
      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
    });
    
    return yPosition + ((currentRow + 1) * cellHeight) + 10;
  }

  /**
   * Adds recommendation content
   */
  private addRecommendationContent(data: any, yPosition: number): number {
    // Recommendation box
    const boxHeight = 60;
    const recColor = this.getRecommendationColor(data.rating);
    
    this.doc.setFillColor(recColor);
    this.doc.rect(this.margins.left, yPosition, this.pageWidth - this.margins.left - this.margins.right, boxHeight, 'F');
    
    // Rating
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.text(data.rating, this.pageWidth / 2, yPosition + 25, { align: 'center' });
    
    // Confidence
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.text(`${data.confidence}% Confidence`, this.pageWidth / 2, yPosition + 40, { align: 'center' });
    
    yPosition += boxHeight + 15;
    
    // Price targets
    this.doc.setTextColor(this.colors.text);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    
    const targetInfo = [
      `Current Price: $${data.currentPrice?.toFixed(2) || 'N/A'}`,
      `Price Target: $${data.priceTarget?.toFixed(2) || 'N/A'}`,
      `Timeframe: ${data.timeframe || '12 months'}`,
      `Expected Return: ${((data.priceTarget - data.currentPrice) / data.currentPrice * 100).toFixed(0)}%`
    ];
    
    targetInfo.forEach(info => {
      this.doc.text(info, this.margins.left, yPosition);
      yPosition += 8;
    });
    
    return yPosition + 5;
  }

  /**
   * Saves PDF to file (for Node.js environment)
   */
  async saveToFile(pdfData: Uint8Array, filepath: string): Promise<void> {
    if (typeof window === 'undefined') {
      // Node.js environment
      // Dynamic import to avoid webpack issues
      const { writeFileSync } = await import('fs');
      writeFileSync(filepath, Buffer.from(pdfData));
    } else {
      // Browser environment
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filepath.split('/').pop() || 'report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}