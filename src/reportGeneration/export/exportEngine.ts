// src/reportGeneration/export/exportEngine.ts
// Multi-format export engine for reports
// Context: Handles PDF, HTML, PowerPoint, Excel, and Markdown exports

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { GeneratedReport } from '../templates/reportTemplateEngine';
import { GeneratedChart } from '../visualization/visualizationEngine';

// Export format enum
export enum ExportFormat {
  PDF = 'pdf',
  HTML = 'html',
  POWERPOINT = 'powerpoint',
  EXCEL = 'excel',
  MARKDOWN = 'markdown'
}

// Export configuration interface
export interface ExportConfig {
  format: ExportFormat;
  outputPath: string;
  options?: ExportOptions;
  branding?: BrandingConfig;
  metadata?: MetadataConfig;
}

// Export options for different formats
export interface ExportOptions {
  // PDF options
  paperSize?: 'letter' | 'a4' | 'legal';
  margins?: { top: number; right: number; bottom: number; left: number };
  headerFooter?: boolean;
  tableOfContents?: boolean;
  pageNumbers?: boolean;
  
  // HTML options
  responsive?: boolean;
  includeNavigation?: boolean;
  includeSearch?: boolean;
  theme?: 'light' | 'dark';
  
  // PowerPoint options
  slideSize?: 'standard' | 'widescreen';
  includeNotes?: boolean;
  
  // Excel options
  includeCharts?: boolean;
  includeRawData?: boolean;
  addFormulas?: boolean;
  protectSheets?: boolean;
}

// Branding configuration
export interface BrandingConfig {
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  disclaimer?: string;
  watermark?: string;
}

// Metadata configuration
export interface MetadataConfig {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  createdDate?: Date;
  confidentiality?: 'public' | 'internal' | 'confidential';
}

// Export result interface
export interface ExportResult {
  format: ExportFormat;
  filePath: string;
  fileSize: number;
  pages?: number;
  warnings: string[];
  metadata: MetadataConfig;
}

/**
 * Main export engine class
 */
export class ExportEngine {
  private config: ExportConfig;
  
  constructor(config: ExportConfig) {
    this.config = config;
  }
  
  /**
   * Export report to specified format
   */
  async export(report: GeneratedReport, charts: GeneratedChart[] = []): Promise<ExportResult> {
    console.log(`🔄 Exporting ${report.title} to ${this.config.format.toUpperCase()}...`);
    
    let result: ExportResult;
    
    try {
      switch (this.config.format) {
        case ExportFormat.PDF:
          result = await this.exportToPDF(report, charts);
          break;
        case ExportFormat.HTML:
          result = await this.exportToHTML(report, charts);
          break;
        case ExportFormat.POWERPOINT:
          result = await this.exportToPowerPoint(report, charts);
          break;
        case ExportFormat.EXCEL:
          result = await this.exportToExcel(report, charts);
          break;
        case ExportFormat.MARKDOWN:
          result = await this.exportToMarkdown(report, charts);
          break;
        default:
          throw new Error(`Unsupported export format: ${this.config.format}`);
      }
      
      console.log(`✅ Export completed: ${path.basename(result.filePath)}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Export failed:`, error);
      throw error;
    }
  }
  
  /**
   * Export to PDF using jsPDF
   */
  private async exportToPDF(report: GeneratedReport, charts: GeneratedChart[]): Promise<ExportResult> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: this.config.options?.paperSize || 'letter'
    });
    
    const warnings: string[] = [];
    let currentY = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = this.config.options?.margins || { top: 50, right: 50, bottom: 50, left: 50 };
    const contentWidth = pageWidth - margins.left - margins.right;
    
    // Add watermark if specified
    if (this.config.branding?.watermark) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(48);
      doc.text(this.config.branding.watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45
      });
      doc.setTextColor(0, 0, 0); // Reset color
    }
    
    // Title page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    currentY += 100;
    doc.text(report.title, margins.left, currentY, { maxWidth: contentWidth });
    
    if (report.subtitle) {
      currentY += 40;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(report.subtitle, margins.left, currentY, { maxWidth: contentWidth });
    }
    
    // Company branding
    if (this.config.branding?.companyName) {
      currentY += 60;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(this.config.branding.companyName, margins.left, currentY);
    }
    
    // Date
    currentY += 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margins.left, currentY);
    
    // Table of contents (if enabled)
    if (this.config.options?.tableOfContents) {
      doc.addPage();
      currentY = margins.top + 50;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Table of Contents', margins.left, currentY);
      currentY += 40;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      report.sections.forEach((section, index) => {
        doc.text(`${index + 1}. ${section.title}`, margins.left + 20, currentY);
        currentY += 20;
      });
      
      currentY += 40;
    }
    
    // Content sections
    for (const section of report.sections) {
      // Check if we need a new page
      if (currentY > pageHeight - margins.bottom - 100) {
        doc.addPage();
        currentY = margins.top + 50;
      }
      
      // Section title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      if (this.config.branding?.primaryColor) {
        const color = this.hexToRgb(this.config.branding.primaryColor);
        if (color) {
          doc.setTextColor(color.r, color.g, color.b);
        }
      }
      doc.text(section.title, margins.left, currentY, { maxWidth: contentWidth });
      doc.setTextColor(0, 0, 0); // Reset color
      currentY += 30;
      
      // Section content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Convert markdown-like content to plain text for PDF
      const plainContent = this.stripMarkdown(section.content);
      const lines = doc.splitTextToSize(plainContent, contentWidth);
      
      for (const line of lines) {
        if (currentY > pageHeight - margins.bottom - 20) {
          doc.addPage();
          currentY = margins.top + 50;
        }
        doc.text(line, margins.left, currentY);
        currentY += 15;
      }
      
      currentY += 20;
      
      // Add tables
      if (section.tables) {
        for (const table of section.tables) {
          currentY = await this.addTableToPDF(doc, table, margins.left, currentY, contentWidth, pageHeight, margins);
        }
      }
      
      // Add charts
      if (section.charts) {
        for (const chartSpec of section.charts) {
          const chart = charts.find(c => c.config.title === chartSpec.config.title);
          if (chart) {
            currentY = await this.addChartToPDF(doc, chart, margins.left, currentY, contentWidth, pageHeight, margins);
          }
        }
      }
      
      currentY += 30;
    }
    
    // Add disclaimer footer on last page
    if (this.config.branding?.disclaimer) {
      const finalY = pageHeight - margins.bottom - 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(this.config.branding.disclaimer, margins.left, finalY, { 
        maxWidth: contentWidth,
        align: 'justify'
      });
    }
    
    // Add page numbers if enabled
    if (this.config.options?.pageNumbers) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom + 20, {
          align: 'right'
        });
      }
    }
    
    // Save the PDF
    const outputBuffer = doc.output('arraybuffer');
    fs.writeFileSync(this.config.outputPath, Buffer.from(outputBuffer));
    
    const stats = fs.statSync(this.config.outputPath);
    
    return {
      format: ExportFormat.PDF,
      filePath: this.config.outputPath,
      fileSize: stats.size,
      pages: doc.getNumberOfPages(),
      warnings,
      metadata: this.config.metadata || {}
    };
  }
  
  /**
   * Add table to PDF
   */
  private async addTableToPDF(
    doc: jsPDF, 
    table: any, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number, 
    margins: any
  ): Promise<number> {
    const cellPadding = 5;
    const rowHeight = 25;
    const headerHeight = 30;
    const colWidth = maxWidth / table.headers.length;
    
    let currentY = y;
    
    // Check if table fits on current page
    const tableHeight = headerHeight + (table.rows.length * rowHeight);
    if (currentY + tableHeight > pageHeight - margins.bottom) {
      doc.addPage();
      currentY = margins.top + 50;
    }
    
    // Draw table headers
    doc.setFillColor(240, 240, 240);
    doc.rect(x, currentY, maxWidth, headerHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    table.headers.forEach((header: string, index: number) => {
      const cellX = x + (index * colWidth) + cellPadding;
      doc.text(header, cellX, currentY + headerHeight / 2 + 3);
    });
    
    currentY += headerHeight;
    
    // Draw table rows
    doc.setFont('helvetica', 'normal');
    
    table.rows.forEach((row: string[]) => {
      if (currentY + rowHeight > pageHeight - margins.bottom) {
        doc.addPage();
        currentY = margins.top + 50;
      }
      
      // Draw row background (alternating)
      if (table.rows.indexOf(row) % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(x, currentY, maxWidth, rowHeight, 'F');
      }
      
      row.forEach((cell: string, index: number) => {
        const cellX = x + (index * colWidth) + cellPadding;
        doc.text(cell, cellX, currentY + rowHeight / 2 + 3);
      });
      
      currentY += rowHeight;
    });
    
    // Draw table borders
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, maxWidth, currentY - y);
    
    // Draw column separators
    for (let i = 1; i < table.headers.length; i++) {
      const lineX = x + (i * colWidth);
      doc.line(lineX, y, lineX, currentY);
    }
    
    // Add caption if provided
    if (table.caption) {
      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(table.caption, x, currentY);
      currentY += 15;
    }
    
    return currentY + 20;
  }
  
  /**
   * Add chart to PDF using html2canvas (browser environment only)
   * In Node.js environment, this will add a placeholder
   */
  private async addChartToPDF(
    doc: jsPDF, 
    chart: GeneratedChart, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number, 
    margins: any
  ): Promise<number> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Create a temporary DOM element with the chart SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = chart.svg;
        tempDiv.style.width = `${maxWidth}px`;
        tempDiv.style.height = '300px';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Convert to canvas
        const canvas = await html2canvas(tempDiv, {
          width: maxWidth,
          height: 300,
          backgroundColor: '#ffffff'
        });
        
        // Remove temporary element
        document.body.removeChild(tempDiv);
        
        // Add to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = 200; // Fixed height for charts
        
        if (y + imgHeight > pageHeight - margins.bottom) {
          doc.addPage();
          y = margins.top + 50;
        }
        
        doc.addImage(imgData, 'PNG', x, y, maxWidth, imgHeight);
        
        // Add chart title
        if (chart.config.title) {
          const titleY = y + imgHeight + 15;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(chart.config.title, x, titleY);
        }
        
        return y + imgHeight + 30;
      } else {
        // Node.js environment - add placeholder
        const placeholderHeight = 100;
        
        if (y + placeholderHeight > pageHeight - margins.bottom) {
          doc.addPage();
          y = margins.top + 50;
        }
        
        // Draw placeholder rectangle
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);
        doc.rect(x, y, maxWidth, placeholderHeight, 'FD');
        
        // Add chart title and placeholder text
        const titleY = y + placeholderHeight / 2 - 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(chart.config.title || 'Chart', x + maxWidth / 2, titleY, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('[Chart visualization placeholder]', x + maxWidth / 2, titleY + 20, { align: 'center' });
        
        return y + placeholderHeight + 30;
      }
      
    } catch (error) {
      console.warn('Failed to add chart to PDF:', error);
      return y;
    }
  }
  
  /**
   * Export to HTML
   */
  private async exportToHTML(report: GeneratedReport, charts: GeneratedChart[]): Promise<ExportResult> {
    const warnings: string[] = [];
    
    // HTML template
    const templateSource = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        :root {
            --primary-color: {{primaryColor}};
            --secondary-color: {{secondaryColor}};
            --font-family: {{fontFamily}};
            --bg-color: {{#if isDark}}#1a1a1a{{else}}#ffffff{{/if}};
            --text-color: {{#if isDark}}#ffffff{{else}}#333333{{/if}};
            --border-color: {{#if isDark}}#444444{{else}}#e0e0e0{{/if}};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-family);
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        {{#if includeNavigation}}
        .report-nav {
            background: var(--primary-color);
            color: white;
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
        }
        
        .nav-links li {
            margin-left: 20px;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            padding: 5px 10px;
            border-radius: 3px;
            transition: background-color 0.3s;
        }
        
        .nav-links a:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        {{/if}}
        
        {{#if includeSearch}}
        .report-search {
            margin: 20px 0;
            padding: 20px;
            background: var(--border-color);
            border-radius: 8px;
        }
        
        .search-input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 16px;
            background: var(--bg-color);
            color: var(--text-color);
        }
        {{/if}}
        
        .report-header {
            text-align: center;
            margin: 40px 0;
            padding: 40px 20px;
            border-bottom: 3px solid var(--primary-color);
        }
        
        .report-title {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        .report-subtitle {
            font-size: 1.3em;
            color: var(--secondary-color);
            margin-bottom: 20px;
        }
        
        .report-meta {
            font-size: 0.9em;
            color: #666;
        }
        
        .section {
            margin: 40px 0;
            padding: 30px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-title {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: var(--primary-color);
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 10px;
        }
        
        .section-content {
            margin-bottom: 20px;
        }
        
        .section-content h1 {
            font-size: 1.5em;
            margin: 20px 0 10px 0;
            color: var(--primary-color);
        }
        
        .section-content h2 {
            font-size: 1.3em;
            margin: 15px 0 8px 0;
            color: var(--secondary-color);
        }
        
        .section-content p {
            margin-bottom: 15px;
        }
        
        .section-content ul, .section-content ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        .section-content li {
            margin-bottom: 5px;
        }
        
        .section-content strong {
            color: var(--primary-color);
        }
        
        .section-content code {
            background: var(--border-color);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        .section-content pre {
            background: var(--border-color);
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 15px 0;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: var(--bg-color);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .data-table th {
            background: var(--primary-color);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        
        .data-table td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .data-table tbody tr:hover {
            background: var(--border-color);
        }
        
        .table-caption {
            margin-top: 10px;
            font-style: italic;
            color: #666;
            font-size: 0.9em;
        }
        
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            text-align: center;
        }
        
        .chart-title {
            font-size: 1.2em;
            margin-bottom: 15px;
            color: var(--primary-color);
        }
        
        .chart-svg {
            max-width: 100%;
            height: auto;
        }
        
        .chart-caption {
            margin-top: 10px;
            font-style: italic;
            color: #666;
            font-size: 0.9em;
        }
        
        .report-footer {
            margin-top: 60px;
            padding: 30px 20px;
            border-top: 3px solid var(--primary-color);
            text-align: center;
        }
        
        .company-name {
            font-size: 1.2em;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 10px;
        }
        
        .disclaimer {
            font-size: 0.8em;
            color: #666;
            font-style: italic;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .report-title {
                font-size: 2em;
            }
            
            .section {
                padding: 20px;
            }
            
            .data-table {
                font-size: 0.9em;
            }
            
            .nav-content {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
    {{#if includeSearch}}
    <script>
        function searchReport() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const sections = document.querySelectorAll('.section');
            
            sections.forEach(section => {
                const content = section.textContent.toLowerCase();
                if (content.includes(searchTerm) || searchTerm === '') {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }
    </script>
    {{/if}}
</head>
<body>
    {{#if includeNavigation}}
    <nav class="report-nav">
        <div class="nav-content">
            <div class="company-name">{{companyName}}</div>
            <ul class="nav-links">
                {{#each sections}}
                <li><a href="#section-{{id}}">{{title}}</a></li>
                {{/each}}
            </ul>
        </div>
    </nav>
    {{/if}}
    
    <div class="container">
        {{#if includeSearch}}
        <div class="report-search">
            <input type="text" id="searchInput" class="search-input" placeholder="Search report content..." onkeyup="searchReport()">
        </div>
        {{/if}}
        
        <header class="report-header">
            <h1 class="report-title">{{title}}</h1>
            {{#if subtitle}}
            <h2 class="report-subtitle">{{subtitle}}</h2>
            {{/if}}
            <div class="report-meta">
                Generated on {{date}} | {{#if author}}By {{author}}{{/if}}
            </div>
        </header>
        
        <main>
            {{#each sections}}
            <section class="section" id="section-{{id}}">
                <h2 class="section-title">{{title}}</h2>
                <div class="section-content">
                    {{{markdownToHtml content}}}
                </div>
                
                {{#if tables}}
                {{#each tables}}
                <table class="data-table">
                    <thead>
                        <tr>
                            {{#each headers}}
                            <th>{{this}}</th>
                            {{/each}}
                        </tr>
                    </thead>
                    <tbody>
                        {{#each rows}}
                        <tr>
                            {{#each this}}
                            <td>{{this}}</td>
                            {{/each}}
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
                {{#if caption}}
                <div class="table-caption">{{caption}}</div>
                {{/if}}
                {{/each}}
                {{/if}}
                
                {{#if charts}}
                {{#each charts}}
                <div class="chart-container">
                    {{#if config.title}}
                    <div class="chart-title">{{config.title}}</div>
                    {{/if}}
                    <div class="chart-svg">{{{../findChartSvg config.title}}}</div>
                    {{#if caption}}
                    <div class="chart-caption">{{caption}}</div>
                    {{/if}}
                </div>
                {{/each}}
                {{/if}}
            </section>
            {{/each}}
        </main>
        
        <footer class="report-footer">
            {{#if companyName}}
            <div class="company-name">{{companyName}}</div>
            {{/if}}
            <div>Report generated by TriSight Export Engine</div>
            {{#if disclaimer}}
            <div class="disclaimer">{{disclaimer}}</div>
            {{/if}}
        </footer>
    </div>
</body>
</html>
    `;
    
    // Prepare template data
    const templateData = {
      title: report.title,
      subtitle: report.subtitle,
      date: new Date().toLocaleDateString(),
      author: this.config.metadata?.author,
      sections: report.sections,
      companyName: this.config.branding?.companyName,
      primaryColor: this.config.branding?.primaryColor || '#0066CC',
      secondaryColor: this.config.branding?.secondaryColor || '#666666',
      fontFamily: this.config.branding?.fontFamily || 'Inter, sans-serif',
      disclaimer: this.config.branding?.disclaimer,
      includeNavigation: this.config.options?.includeNavigation,
      includeSearch: this.config.options?.includeSearch,
      isDark: this.config.options?.theme === 'dark',
      findChartSvg: (title: string) => {
        const chart = charts.find(c => c.config.title === title);
        return chart ? chart.svg : '';
      }
    };
    
    // Register Handlebars helpers
    Handlebars.registerHelper('markdownToHtml', (content: string) => {
      return this.markdownToHtml(content);
    });
    
    // Compile and render template
    const template = Handlebars.compile(templateSource);
    const html = template(templateData);
    
    // Write HTML file
    fs.writeFileSync(this.config.outputPath, html, 'utf-8');
    
    const stats = fs.statSync(this.config.outputPath);
    
    return {
      format: ExportFormat.HTML,
      filePath: this.config.outputPath,
      fileSize: stats.size,
      warnings,
      metadata: this.config.metadata || {}
    };
  }
  
  /**
   * Export to PowerPoint
   */
  private async exportToPowerPoint(report: GeneratedReport, charts: GeneratedChart[]): Promise<ExportResult> {
    const pptx = new PptxGenJS();
    const warnings: string[] = [];
    
    // Configure slide size
    if (this.config.options?.slideSize === 'widescreen') {
      pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.33, height: 7.5 });
      pptx.layout = 'LAYOUT_WIDE';
    }
    
    // Title slide
    const titleSlide = pptx.addSlide();
    
    // Background color
    if (this.config.branding?.primaryColor) {
      titleSlide.background = { color: this.config.branding.primaryColor };
    }
    
    titleSlide.addText(report.title, {
      x: 1,
      y: 2,
      w: 11,
      h: 2,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      align: 'center'
    });
    
    if (report.subtitle) {
      titleSlide.addText(report.subtitle, {
        x: 1,
        y: 4,
        w: 11,
        h: 1,
        fontSize: 24,
        color: 'FFFFFF',
        align: 'center'
      });
    }
    
    if (this.config.branding?.companyName) {
      titleSlide.addText(this.config.branding.companyName, {
        x: 1,
        y: 6,
        w: 11,
        h: 0.5,
        fontSize: 18,
        color: 'FFFFFF',
        align: 'center'
      });
    }
    
    titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 1,
      y: 6.8,
      w: 11,
      h: 0.3,
      fontSize: 12,
      color: 'FFFFFF',
      align: 'center'
    });
    
    // Content slides
    for (const section of report.sections) {
      const slide = pptx.addSlide();
      
      // Section title
      slide.addText(section.title, {
        x: 0.5,
        y: 0.3,
        w: 12,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: this.config.branding?.primaryColor || '333333'
      });
      
      // Section content
      const plainContent = this.stripMarkdown(section.content);
      slide.addText(plainContent, {
        x: 0.5,
        y: 1.3,
        w: 6,
        h: 5,
        fontSize: 14,
        valign: 'top'
      });
      
      // Add tables as text (PowerPoint doesn't handle complex tables well)
      if (section.tables && section.tables.length > 0) {
        let tableY = 3;
        section.tables.forEach(table => {
          const tableData = [
            table.headers,
            ...table.rows
          ];
          
          slide.addTable(tableData, {
            x: 7,
            y: tableY,
            w: 5.5,
            h: 2,
            fontSize: 10,
            border: { pt: 1, color: 'CCCCCC' },
            fill: { color: 'F8F8F8' }
          });
          
          tableY += 2.5;
        });
      }
      
      // Add charts (convert SVG to image - simplified)
      if (section.charts && section.charts.length > 0) {
        warnings.push('Chart embedding in PowerPoint requires additional image processing');
      }
      
      // Add speaker notes if enabled
      if (this.config.options?.includeNotes) {
        slide.addNotes(`Section: ${section.title}\n\nContent: ${plainContent.substring(0, 200)}...`);
      }
    }
    
    // Save PowerPoint file
    await pptx.writeFile({ fileName: this.config.outputPath });
    
    const stats = fs.statSync(this.config.outputPath);
    
    return {
      format: ExportFormat.POWERPOINT,
      filePath: this.config.outputPath,
      fileSize: stats.size,
      pages: pptx.slides.length,
      warnings,
      metadata: this.config.metadata || {}
    };
  }
  
  /**
   * Export to Excel
   */
  private async exportToExcel(report: GeneratedReport, charts: GeneratedChart[]): Promise<ExportResult> {
    const workbook = XLSX.utils.book_new();
    const warnings: string[] = [];
    
    // Summary sheet
    const summaryData = [
      ['Report Title', report.title],
      ['Subtitle', report.subtitle || ''],
      ['Generated', new Date().toLocaleDateString()],
      ['Author', this.config.metadata?.author || ''],
      ['Total Sections', report.sections.length],
      ['Company', this.config.branding?.companyName || '']
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    
    // Content sheets - one per section
    report.sections.forEach((section, index) => {
      const sectionData = [
        [`Section ${index + 1}: ${section.title}`],
        [''],
        ['Content:'],
        [this.stripMarkdown(section.content)],
        ['']
      ];
      
      // Add tables
      if (section.tables) {
        section.tables.forEach(table => {
          sectionData.push(['']);
          sectionData.push([`Table: ${table.caption || 'Data Table'}`]);
          sectionData.push(table.headers);
          table.rows.forEach(row => {
            sectionData.push(row);
          });
        });
      }
      
      const sectionWS = XLSX.utils.aoa_to_sheet(sectionData);
      
      // Set column widths
      sectionWS['!cols'] = [{ width: 50 }];
      
      const sheetName = `Section_${index + 1}`.substring(0, 31); // Excel sheet name limit
      XLSX.utils.book_append_sheet(workbook, sectionWS, sheetName);
    });
    
    // Data sheet with all tables consolidated
    if (this.config.options?.includeRawData) {
      const allTablesData = [['Section', 'Table', 'Data']];
      
      report.sections.forEach(section => {
        if (section.tables) {
          section.tables.forEach(table => {
            allTablesData.push([section.title, table.caption || 'Table', '']);
            allTablesData.push(['', '', ...table.headers]);
            table.rows.forEach(row => {
              allTablesData.push(['', '', ...row]);
            });
            allTablesData.push(['', '', '']); // Separator
          });
        }
      });
      
      if (allTablesData.length > 1) {
        const dataWS = XLSX.utils.aoa_to_sheet(allTablesData);
        XLSX.utils.book_append_sheet(workbook, dataWS, 'All_Data');
      }
    }
    
    // Charts reference sheet
    if (this.config.options?.includeCharts && charts.length > 0) {
      const chartsData = [
        ['Chart Title', 'Type', 'Section'],
        ...charts.map(chart => [chart.config?.title || 'Untitled', chart.type, 'Various'])
      ];
      
      const chartsWS = XLSX.utils.aoa_to_sheet(chartsData);
      XLSX.utils.book_append_sheet(workbook, chartsWS, 'Charts_Reference');
      
      warnings.push('Chart images cannot be embedded in Excel format');
    }
    
    // Metadata sheet
    const metadataData = [
      ['Property', 'Value'],
      ['Export Format', 'Excel'],
      ['Generated At', new Date().toISOString()],
      ['Title', this.config.metadata?.title || ''],
      ['Author', this.config.metadata?.author || ''],
      ['Subject', this.config.metadata?.subject || ''],
      ['Keywords', this.config.metadata?.keywords?.join(', ') || ''],
      ['Confidentiality', this.config.metadata?.confidentiality || 'public']
    ];
    
    const metadataWS = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata');
    
    // Add formulas if requested
    if (this.config.options?.addFormulas) {
      // This would require more complex implementation
      warnings.push('Advanced formulas not implemented in this version');
    }
    
    // Protect sheets if requested
    if (this.config.options?.protectSheets) {
      warnings.push('Sheet protection not implemented in this version');
    }
    
    // Write Excel file
    XLSX.writeFile(workbook, this.config.outputPath);
    
    const stats = fs.statSync(this.config.outputPath);
    
    return {
      format: ExportFormat.EXCEL,
      filePath: this.config.outputPath,
      fileSize: stats.size,
      warnings,
      metadata: this.config.metadata || {}
    };
  }
  
  /**
   * Export to Markdown
   */
  private async exportToMarkdown(report: GeneratedReport, charts: GeneratedChart[]): Promise<ExportResult> {
    const warnings: string[] = [];
    let markdown = '';
    
    // Front matter
    if (this.config.metadata) {
      markdown += '---\n';
      markdown += `title: "${report.title}"\n`;
      if (report.subtitle) {
        markdown += `subtitle: "${report.subtitle}"\n`;
      }
      if (this.config.metadata.author) {
        markdown += `author: "${this.config.metadata.author}"\n`;
      }
      if (this.config.metadata.subject) {
        markdown += `description: "${this.config.metadata.subject}"\n`;
      }
      if (this.config.metadata.keywords) {
        markdown += `tags: [${this.config.metadata.keywords.map(k => `"${k}"`).join(', ')}]\n`;
      }
      markdown += `date: "${new Date().toISOString().split('T')[0]}"\n`;
      if (this.config.metadata.confidentiality) {
        markdown += `confidentiality: "${this.config.metadata.confidentiality}"\n`;
      }
      markdown += '---\n\n';
    }
    
    // Title
    markdown += `# ${report.title}\n\n`;
    
    if (report.subtitle) {
      markdown += `*${report.subtitle}*\n\n`;
    }
    
    // Metadata
    markdown += '---\n\n';
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    if (this.config.metadata?.author) {
      markdown += `**Author:** ${this.config.metadata.author}\n\n`;
    }
    if (this.config.branding?.companyName) {
      markdown += `**Organization:** ${this.config.branding.companyName}\n\n`;
    }
    markdown += '---\n\n';
    
    // Table of contents
    markdown += '## Table of Contents\n\n';
    report.sections.forEach((section, index) => {
      const anchor = section.id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      markdown += `${index + 1}. [${section.title}](#${anchor})\n`;
    });
    markdown += '\n';
    
    // Sections
    report.sections.forEach(section => {
      const anchor = section.id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      markdown += `## ${section.title} {#${anchor}}\n\n`;
      
      // Content
      markdown += section.content + '\n\n';
      
      // Tables
      if (section.tables) {
        section.tables.forEach(table => {
          // Markdown table
          markdown += '| ' + table.headers.join(' | ') + ' |\n';
          markdown += '|' + table.headers.map(() => '---').join('|') + '|\n';
          
          table.rows.forEach(row => {
            markdown += '| ' + row.join(' | ') + ' |\n';
          });
          
          if (table.caption) {
            markdown += `\n*${table.caption}*\n`;
          }
          
          markdown += '\n';
        });
      }
      
      // Chart references
      if (section.charts) {
        section.charts.forEach(chartSpec => {
          const chart = charts.find(c => c.config.title === chartSpec.config.title);
          if (chart) {
            markdown += `### ${chart.config.title || 'Chart'}\n\n`;
            markdown += `<!-- Chart Type: ${chart.type} -->\n`;
            markdown += `<!-- SVG data available but not displayed in Markdown -->\n\n`;
            if (chartSpec.caption) {
              markdown += `*${chartSpec.caption}*\n\n`;
            }
            warnings.push(`Chart '${chart.config.title}' referenced but not embedded (Markdown limitation)`);
          }
        });
      }
      
      markdown += '\n---\n\n';
    });
    
    // Footer
    if (this.config.branding?.disclaimer) {
      markdown += '## Disclaimer\n\n';
      markdown += this.config.branding.disclaimer + '\n\n';
    }
    
    markdown += '---\n\n';
    markdown += `*Generated by TriSight Export Engine on ${new Date().toLocaleDateString()}*\n`;
    
    // Write markdown file
    fs.writeFileSync(this.config.outputPath, markdown, 'utf-8');
    
    const stats = fs.statSync(this.config.outputPath);
    
    return {
      format: ExportFormat.MARKDOWN,
      filePath: this.config.outputPath,
      fileSize: stats.size,
      warnings,
      metadata: this.config.metadata || {}
    };
  }
  
  /**
   * Helper: Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * Helper: Strip markdown formatting
   */
  private stripMarkdown(content: string): string {
    return content
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/^\s*[-\*\+]\s+/gm, '') // List items
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .trim();
  }
  
  /**
   * Helper: Convert markdown to HTML
   */
  private markdownToHtml(content: string): string {
    return content
      .replace(/#{6}\s+(.+)/g, '<h6>$1</h6>')
      .replace(/#{5}\s+(.+)/g, '<h5>$1</h5>')
      .replace(/#{4}\s+(.+)/g, '<h4>$1</h4>')
      .replace(/#{3}\s+(.+)/g, '<h3>$1</h3>')
      .replace(/#{2}\s+(.+)/g, '<h2>$1</h2>')
      .replace(/#{1}\s+(.+)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^\s*[-\*\+]\s+(.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\s*\d+\.\s+(.+)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/, '<p>$1</p>');
  }
}

/**
 * Factory function to create export engine
 */
export function createExportEngine(config: ExportConfig): ExportEngine {
  return new ExportEngine(config);
}

/**
 * Batch export to multiple formats
 */
export async function batchExport(
  report: GeneratedReport,
  charts: GeneratedChart[],
  formats: ExportFormat[],
  baseConfig: Omit<ExportConfig, 'format' | 'outputPath'>
): Promise<ExportResult[]> {
  console.log(`🚀 Starting batch export to ${formats.length} formats...`);
  
  const results: ExportResult[] = [];
  const startTime = Date.now();
  
  // Export to each format
  for (const format of formats) {
    try {
      const outputPath = baseConfig.outputPath 
        ? baseConfig.outputPath.replace(/\.[^.]+$/, `.${format}`)
        : `./output/batch_export_${Date.now()}.${format}`;
      
      const config: ExportConfig = {
        ...baseConfig,
        format,
        outputPath
      };
      
      const engine = createExportEngine(config);
      const result = await engine.export(report, charts);
      results.push(result);
      
    } catch (error) {
      console.error(`❌ Batch export failed for ${format}:`, error);
      results.push({
        format,
        filePath: '',
        fileSize: 0,
        warnings: [`Export failed: ${error.message}`],
        metadata: baseConfig.metadata || {}
      });
    }
  }
  
  const duration = Date.now() - startTime;
  const successful = results.filter(r => r.fileSize > 0).length;
  
  console.log(`✅ Batch export completed in ${duration}ms`);
  console.log(`📊 Success rate: ${successful}/${formats.length} formats`);
  
  return results;
}