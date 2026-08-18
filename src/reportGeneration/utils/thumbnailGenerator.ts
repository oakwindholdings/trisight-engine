// src/reportGeneration/utils/thumbnailGenerator.ts  
// Generates thumbnail previews for reports
// Context: Creates visual previews of report first pages

import { GeneratedReport, ReportSlide } from '../models/reportTypes';
import { logDebug } from '../../utils/logger';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
}

/**
 * Generates thumbnail previews of reports
 */
export class ThumbnailGenerator {
  private defaultOptions: Required<ThumbnailOptions> = {
    width: 200,
    height: 150,
    quality: 0.8,
    format: 'jpeg'
  };

  /**
   * Generate thumbnail from report
   */
  async generateFromReport(
    report: GeneratedReport, 
    options?: ThumbnailOptions
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get the first slide or title slide
      const titleSlide = report.slides.find(s => s.layout === 'title') || report.slides[0];
      
      if (!titleSlide) {
        return this.generatePlaceholder(report.config.ticker || 'Report', opts);
      }
      
      // Generate thumbnail from slide content
      return await this.generateFromSlide(titleSlide, report, opts);
    } catch (error) {
      logDebug('ThumbnailGenerator', `Failed to generate thumbnail: ${error}`);
      return this.generatePlaceholder(report.config.ticker || 'Report', opts);
    }
  }

  /**
   * Generate thumbnail from a specific slide
   */
  private async generateFromSlide(
    slide: ReportSlide,
    report: GeneratedReport,
    options: Required<ThumbnailOptions>
  ): Promise<string> {
    if (typeof window === 'undefined') {
      // Node.js environment - use node-canvas
      return this.generateNodeCanvasThumbnail(slide, report, options);
    } else {
      // Browser environment - use HTML Canvas
      return this.generateBrowserThumbnail(slide, report, options);
    }
  }

  /**
   * Generate thumbnail in browser environment
   */
  private generateBrowserThumbnail(
    slide: ReportSlide,
    report: GeneratedReport,
    options: Required<ThumbnailOptions>
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.generatePlaceholder(report.config.ticker || 'Report', { ...this.defaultOptions, ...options });
    }

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);

    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, options.width, options.height);

    // Draw company name
    const companyName = report.companyData?.companyName || report.config.ticker || 'Report';
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(companyName, options.width / 2, 30);

    // Draw ticker
    if (report.config.ticker) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(report.config.ticker, options.width / 2, 50);
    }

    // Draw slide title
    ctx.font = '14px Arial';
    ctx.fillStyle = '#374151';
    const lines = this.wrapText(ctx, slide.title, options.width - 20);
    lines.forEach((line, i) => {
      ctx.fillText(line, options.width / 2, 80 + (i * 20));
    });

    // Draw report type badge
    if (report.config.reportType) {
      const badge = report.config.reportType.toUpperCase();
      ctx.font = 'bold 10px Arial';
      const badgeWidth = ctx.measureText(badge).width + 10;
      
      // Badge background
      ctx.fillStyle = '#10b981';
      ctx.fillRect(options.width - badgeWidth - 10, 10, badgeWidth, 20);
      
      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(badge, options.width - 15, 24);
    }

    // Add date
    ctx.font = '10px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    const date = new Date().toLocaleDateString();
    ctx.fillText(date, options.width / 2, options.height - 10);

    // Convert to data URL
    return canvas.toDataURL(`image/${options.format}`, options.quality);
  }

  /**
   * Generate thumbnail in Node.js environment
   */
  private async generateNodeCanvasThumbnail(
    slide: ReportSlide,
    report: GeneratedReport,
    options: Required<ThumbnailOptions>
  ): Promise<string> {
    try {
      const { createCanvas } = await import('canvas');
      const canvas = createCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d');

      // Similar drawing logic as browser version
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, options.width, options.height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, options.width, options.height);

      const companyName = report.companyData?.companyName || report.config.ticker || 'Report';
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(companyName, options.width / 2, 30);

      if (report.config.ticker) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText(report.config.ticker, options.width / 2, 50);
      }

      // Convert to base64
      const buffer = (canvas as any).toBuffer(options.format === 'png' ? 'image/png' : 'image/jpeg', {
        quality: options.quality
      });
      return `data:image/${options.format};base64,${buffer.toString('base64')}`;
    } catch (error) {
      logDebug('ThumbnailGenerator', `Node canvas error: ${error}`);
      return this.generatePlaceholder(report.config.ticker || 'Report', { ...this.defaultOptions, ...options });
    }
  }

  /**
   * Generate a placeholder thumbnail
   */
  private generatePlaceholder(text: string, options: Required<ThumbnailOptions>): string {
    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${options.width}" height="${options.height}" fill="#f3f4f6"/>
        <rect x="0" y="0" width="${options.width}" height="${options.height}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        <text x="${options.width / 2}" y="${options.height / 2}" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
          ${text}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Wrap text to fit within width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.slice(0, 2); // Max 2 lines
  }

  /**
   * Extract color from report type
   */
  private getReportTypeColor(reportType: string): string {
    const colors: { [key: string]: string } = {
      'comprehensive': '#10b981',
      'technical': '#3b82f6',
      'fundamental': '#8b5cf6',
      'risk': '#ef4444',
      'esg': '#06b6d4',
      'earnings': '#f59e0b'
    };
    
    return colors[reportType] || '#6b7280';
  }
}