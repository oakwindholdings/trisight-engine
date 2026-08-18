// src/reportGeneration/utils/canvasChartGenerator.ts
// Generates charts using Canvas rendering for report embedding
// Context: Creates PNG/JPEG images from Canvas-based charts for PDF/PPTX reports

import { CandlestickData } from '../../models/ChartTypes';
import { createPriceScale } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import { logDebug } from '../../utils/logger';

// Local hybrid wrapper: this file calls scales directly (d3-style) AND via .ticks/.invert;
// the shared factories return method objects, so bind the callable form here.
function asCallableScale(obj: any): any {
  const fn: any = (v: any) => obj.scale(v);
  fn.scale = obj.scale; fn.invert = obj.invert; fn.ticks = obj.ticks;
  return fn;
}


export interface CanvasChartConfig {
  width: number;
  height: number;
  format?: 'png' | 'jpeg';
  quality?: number; // For JPEG quality (0-1)
  backgroundColor?: string;
}

export interface GeneratedCanvasChart {
  type: string;
  format: 'png' | 'jpeg';
  data: string; // Base64 encoded image data
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Generates charts using Canvas rendering (compatible with TriSight's multi-layer approach)
 * Exports to PNG/JPEG for embedding in reports
 */
export class CanvasChartGenerator {
  private defaultConfig: CanvasChartConfig = {
    width: 800,
    height: 400,
    format: 'png',
    quality: 0.95,
    backgroundColor: '#FFFFFF'
  };

  /**
   * Generate a candlestick chart
   */
  async generateCandlestickChart(
    data: CandlestickData[],
    config: Partial<CanvasChartConfig> = {}
  ): Promise<GeneratedCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, quality, backgroundColor } = finalConfig;

    logDebug('CanvasChartGenerator', `Generating candlestick chart: ${width}x${height}, format=${format}`);

    // Create canvas
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const priceExtent = this.getPriceExtent(data);
    const priceScale = asCallableScale(createPriceScale(chartHeight, priceExtent, [chartHeight, 0]));
    
    const timeScale = asCallableScale(createSequentialTimeScale(
      chartWidth,
      data as any, // rows carry date/OHLC fields; the scale indexes by position
      [0, chartWidth]
    ));

    // Translate to chart area
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // Draw grid
    this.drawGrid(ctx, chartWidth, chartHeight);

    // Draw candlesticks
    this.drawCandlesticks(ctx, data, timeScale, priceScale, chartWidth, chartHeight);

    // Draw axes
    this.drawAxes(ctx, timeScale, priceScale, chartWidth, chartHeight);

    ctx.restore();

    // Convert to base64
    const imageData = await this.canvasToBase64(canvas, format, quality);

    return {
      type: 'candlestick',
      format,
      data: imageData,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a line chart
   */
  async generateLineChart(
    data: Array<{ date: string; [key: string]: any }>,
    series: string[],
    config: Partial<CanvasChartConfig> = {}
  ): Promise<GeneratedCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, quality, backgroundColor } = finalConfig;

    logDebug('CanvasChartGenerator', `Generating line chart: ${width}x${height}, series=${series.join(',')}`);

    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const allValues = data.flatMap(d => series.map(s => d[s])).filter(v => v != null);
    const yExtent = [Math.min(...allValues) * 0.95, Math.max(...allValues) * 1.05];
    const yScale = asCallableScale(createPriceScale(chartHeight, yExtent as [number, number], [chartHeight, 0]));
    
    const timeScale = asCallableScale(createSequentialTimeScale(
      chartWidth,
      data as any, // rows carry date/OHLC fields; the scale indexes by position
      [0, chartWidth]
    ));

    // Translate to chart area
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // Draw grid
    this.drawGrid(ctx, chartWidth, chartHeight);

    // Draw lines
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
    series.forEach((seriesName, idx) => {
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((d, i) => {
        const x = timeScale((d as any).date ?? (d as any).datetime);
        const y = yScale(d[seriesName]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });

    // Draw axes
    this.drawAxes(ctx, timeScale, yScale, chartWidth, chartHeight);

    ctx.restore();

    // Convert to base64
    const imageData = await this.canvasToBase64(canvas, format, quality);

    return {
      type: 'line',
      format,
      data: imageData,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a bar chart
   */
  async generateBarChart(
    data: Array<{ [key: string]: any }>,
    categoryField: string,
    valueFields: string[],
    config: Partial<CanvasChartConfig> = {}
  ): Promise<GeneratedCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, quality, backgroundColor } = finalConfig;

    logDebug('CanvasChartGenerator', `Generating bar chart: ${width}x${height}`);

    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const allValues = data.flatMap(d => valueFields.map(f => d[f])).filter(v => v != null);
    const yExtent = [0, Math.max(...allValues) * 1.1];
    const yScale = asCallableScale(createPriceScale(chartHeight, yExtent as [number, number], [chartHeight, 0]));

    const categories = data.map(d => d[categoryField]);
    const barWidth = chartWidth / (categories.length * (valueFields.length + 1));
    const groupWidth = barWidth * valueFields.length;

    // Translate to chart area
    ctx.save();
    ctx.translate(margin.left, margin.top);

    // Draw grid
    this.drawGrid(ctx, chartWidth, chartHeight);

    // Draw bars
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
    data.forEach((d, i) => {
      const x = (i * (groupWidth + barWidth)) + barWidth / 2;
      
      valueFields.forEach((field, j) => {
        const value = d[field] || 0;
        const barHeight = chartHeight - yScale(value);
        const barX = x + (j * barWidth);
        
        ctx.fillStyle = colors[j % colors.length];
        ctx.fillRect(barX, yScale(value), barWidth * 0.8, barHeight);
      });
    });

    // Draw axes
    this.drawAxes(ctx, null, yScale, chartWidth, chartHeight, categories);

    ctx.restore();

    // Convert to base64
    const imageData = await this.canvasToBase64(canvas, format, quality);

    return {
      type: 'bar',
      format,
      data: imageData,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a pie chart
   */
  async generatePieChart(
    data: Array<{ label: string; value: number }>,
    config: Partial<CanvasChartConfig> = {}
  ): Promise<GeneratedCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, quality, backgroundColor } = finalConfig;

    logDebug('CanvasChartGenerator', `Generating pie chart: ${width}x${height}`);

    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Calculate total
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      // No data to display
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      
      const imageData = await this.canvasToBase64(canvas, format, quality);
      return {
        type: 'pie',
        format,
        data: imageData,
        dimensions: { width, height }
      };
    }

    // Set up pie
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Draw slices
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Draw label if slice is big enough
      if (sliceAngle > 0.1) { // Only show labels for slices > ~6%
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${((d.value / total) * 100).toFixed(0)}%`, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendX = width * 0.75;
    let legendY = height * 0.2;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    
    data.forEach((d, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY, 12, 12);
      
      ctx.fillStyle = '#1f2937';
      ctx.fillText(d.label, legendX + 18, legendY + 10);
      
      legendY += 20;
    });

    // Convert to base64
    const imageData = await this.canvasToBase64(canvas, format, quality);

    return {
      type: 'pie',
      format,
      data: imageData,
      dimensions: { width, height }
    };
  }

  /**
   * Create a canvas element (works in Node.js and browser)
   */
  private createCanvas(width: number, height: number): HTMLCanvasElement {
    if (typeof window !== 'undefined') {
      // Browser environment
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    } else {
      // Node.js environment - would need node-canvas package
      throw new Error('Canvas generation in Node.js requires node-canvas package');
    }
  }

  /**
   * Convert canvas to base64 string
   */
  private async canvasToBase64(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpeg',
    quality?: number
  ): Promise<string> {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    // Remove the data URL prefix to get just the base64 string
    return dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
  }

  /**
   * Get price extent from candlestick data
   */
  private getPriceExtent(data: CandlestickData[]): [number, number] {
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const min = Math.min(...lows) * 0.98;
    const max = Math.max(...highs) * 1.02;
    return [min, max];
  }

  /**
   * Draw grid lines
   */
  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const hLines = 5;
    for (let i = 0; i <= hLines; i++) {
      const y = (height / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    const vLines = 8;
    for (let i = 0; i <= vLines; i++) {
      const x = (width / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /**
   * Draw candlesticks
   */
  private drawCandlesticks(
    ctx: CanvasRenderingContext2D,
    data: CandlestickData[],
    timeScale: any,
    priceScale: any,
    width: number,
    height: number
  ): void {
    const candleWidth = Math.max(1, (width / data.length) * 0.8);
    
    data.forEach(candle => {
      const x = timeScale((candle as any).date ?? candle.datetime);
      const openY = priceScale(candle.open);
      const closeY = priceScale(candle.close);
      const highY = priceScale(candle.high);
      const lowY = priceScale(candle.low);
      
      const isBullish = candle.close > candle.open;
      
      // Set colors
      if (isBullish) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.strokeStyle = '#059669';
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.strokeStyle = '#dc2626';
      }
      
      // Draw wick
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight || 1);
      ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight || 1);
    });
  }

  /**
   * Draw axes
   */
  private drawAxes(
    ctx: CanvasRenderingContext2D,
    timeScale: any,
    priceScale: any,
    width: number,
    height: number,
    categories?: string[]
  ): void {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#374151';
    
    // Draw axes lines
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    
    // Draw price axis labels
    const priceLabels = 5;
    for (let i = 0; i <= priceLabels; i++) {
      const y = (height / priceLabels) * i;
      const price = priceScale.invert(y);
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), -5, y + 4);
    }
    
    // Draw time axis labels
    if (categories) {
      // Bar chart categories
      categories.forEach((cat, i) => {
        const x = (i + 0.5) * (width / categories.length);
        ctx.textAlign = 'center';
        ctx.fillText(cat, x, height + 20);
      });
    } else if (timeScale) {
      // Time-based charts
      const timeLabels = 5;
      for (let i = 0; i <= timeLabels; i++) {
        const x = (width / timeLabels) * i;
        const date = timeScale.invert(x);
        ctx.textAlign = 'center';
        ctx.fillText(date, x, height + 20);
      }
    }
  }
}