// src/reportGeneration/utils/nodeCanvasChartGenerator.ts
// Generates charts using node-canvas for server-side rendering
// Context: Creates PNG/JPEG images from Canvas for PDF/PPTX reports in Node.js

import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { CandlestickData } from '../../models/ChartTypes';
import { logDebug } from '../../utils/logger';

export interface NodeCanvasChartConfig {
  width: number;
  height: number;
  format?: 'png' | 'jpeg';
  quality?: number; // For JPEG quality (0-1)
  backgroundColor?: string;
}

export interface GeneratedNodeCanvasChart {
  type: string;
  format: 'png' | 'jpeg';
  data: string; // Base64 encoded image data
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Generates charts using node-canvas for server-side rendering
 * This works in Node.js environment for report generation
 */
export class NodeCanvasChartGenerator {
  private defaultConfig: NodeCanvasChartConfig = {
    width: 800,
    height: 400,
    format: 'png',
    quality: 0.95,
    backgroundColor: '#FFFFFF'
  };

  /**
   * Generate a simple candlestick chart
   */
  async generateCandlestickChart(
    data: CandlestickData[],
    config: Partial<NodeCanvasChartConfig> = {}
  ): Promise<GeneratedNodeCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, backgroundColor } = finalConfig;

    logDebug('NodeCanvasChartGenerator', `Generating candlestick chart: ${width}x${height}, format=${format}`);

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!data || data.length === 0) {
      // No data message
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No price data available', width / 2, height / 2);
    } else {
      // Calculate price range
      const prices = data.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices) * 0.98;
      const maxPrice = Math.max(...prices) * 1.02;
      const priceRange = maxPrice - minPrice;

      // Draw chart area
      ctx.save();
      ctx.translate(margin.left, margin.top);

      // Draw grid
      this.drawGrid(ctx, chartWidth, chartHeight);

      // Draw candlesticks
      const candleWidth = Math.max(1, (chartWidth / data.length) * 0.8);
      
      data.forEach((candle, i) => {
        const x = (i + 0.5) * (chartWidth / data.length);
        const openY = chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
        const closeY = chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
        const highY = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
        const lowY = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
        
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
        const bodyHeight = Math.abs(closeY - openY) || 1;
        const bodyY = Math.min(openY, closeY);
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
        ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      });

      // Draw axes
      this.drawAxes(ctx, chartWidth, chartHeight, minPrice, maxPrice, data);

      ctx.restore();
    }

    // Convert to base64
    const buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
    const base64 = buffer.toString('base64');

    return {
      type: 'candlestick',
      format,
      data: base64,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a simple line chart
   */
  async generateLineChart(
    data: Array<{ date: string; [key: string]: any }>,
    series: string[],
    config: Partial<NodeCanvasChartConfig> = {}
  ): Promise<GeneratedNodeCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, backgroundColor } = finalConfig;

    logDebug('NodeCanvasChartGenerator', `Generating line chart: ${width}x${height}, series=${series.join(',')}`);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!data || data.length === 0) {
      // No data message
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
    } else {
      // Calculate value range
      const allValues = data.flatMap(d => series.map(s => d[s])).filter(v => v != null && !isNaN(v));
      const minValue = Math.min(...allValues) * 0.95;
      const maxValue = Math.max(...allValues) * 1.05;
      const valueRange = maxValue - minValue;

      // Draw chart area
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
        
        let firstPoint = true;
        data.forEach((d, i) => {
          const value = d[seriesName];
          if (value != null && !isNaN(value)) {
            const x = (i / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
            
            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        
        ctx.stroke();
      });

      // Draw axes with simple labels
      this.drawSimpleAxes(ctx, chartWidth, chartHeight, minValue, maxValue);

      ctx.restore();
    }

    // Convert to base64
    const buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
    const base64 = buffer.toString('base64');

    return {
      type: 'line',
      format,
      data: base64,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a simple bar chart
   */
  async generateBarChart(
    data: Array<{ [key: string]: any }>,
    categoryField: string,
    valueFields: string[],
    config: Partial<NodeCanvasChartConfig> = {}
  ): Promise<GeneratedNodeCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, backgroundColor } = finalConfig;

    logDebug('NodeCanvasChartGenerator', `Generating bar chart: ${width}x${height}`);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!data || data.length === 0) {
      // No data message
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
    } else {
      // Calculate value range
      const allValues = data.flatMap(d => valueFields.map(f => d[f])).filter(v => v != null && !isNaN(v));
      const maxValue = Math.max(...allValues) * 1.1;

      // Draw chart area
      ctx.save();
      ctx.translate(margin.left, margin.top);

      // Draw grid
      this.drawGrid(ctx, chartWidth, chartHeight);

      // Draw bars
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
      const barWidth = chartWidth / (data.length * (valueFields.length + 1));
      const groupWidth = barWidth * valueFields.length;

      data.forEach((d, i) => {
        const x = (i * (groupWidth + barWidth)) + barWidth / 2;
        
        valueFields.forEach((field, j) => {
          const value = d[field] || 0;
          const barHeight = (value / maxValue) * chartHeight;
          const barX = x + (j * barWidth);
          const barY = chartHeight - barHeight;
          
          ctx.fillStyle = colors[j % colors.length];
          ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
        });

        // Draw category label
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + groupWidth / 2, chartHeight + 15);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(d[categoryField] || '', 0, 0);
        ctx.restore();
      });

      // Draw axes
      this.drawSimpleAxes(ctx, chartWidth, chartHeight, 0, maxValue);

      ctx.restore();
    }

    // Convert to base64
    const buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
    const base64 = buffer.toString('base64');

    return {
      type: 'bar',
      format,
      data: base64,
      dimensions: { width, height }
    };
  }

  /**
   * Generate a simple pie chart
   */
  async generatePieChart(
    data: Array<{ label: string; value: number }>,
    config: Partial<NodeCanvasChartConfig> = {}
  ): Promise<GeneratedNodeCanvasChart> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { width, height, format, backgroundColor } = finalConfig;

    logDebug('NodeCanvasChartGenerator', `Generating pie chart: ${width}x${height}`);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor!;
    ctx.fillRect(0, 0, width, height);

    // Calculate total
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    
    if (total === 0 || data.length === 0) {
      // No data message
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
    } else {
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
    }

    // Convert to base64
    const buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
    const base64 = buffer.toString('base64');

    return {
      type: 'pie',
      format,
      data: base64,
      dimensions: { width, height }
    };
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
   * Draw axes for candlestick chart
   */
  private drawAxes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minPrice: number,
    maxPrice: number,
    data: CandlestickData[]
  ): void {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.font = '10px sans-serif';
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
    const priceRange = maxPrice - minPrice;
    for (let i = 0; i <= priceLabels; i++) {
      const y = (height / priceLabels) * i;
      const price = maxPrice - (priceRange * (i / priceLabels));
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), -5, y + 4);
    }
    
    // Draw time axis labels
    const timeLabels = Math.min(5, data.length);
    const step = Math.floor(data.length / timeLabels);
    for (let i = 0; i < timeLabels; i++) {
      const idx = i * step;
      const x = (idx / data.length) * width + width / (2 * data.length);
      const date = (data[idx] as any)?.date ?? data[idx]?.datetime ?? '';
      ctx.textAlign = 'center';
      ctx.fillText(date.substring(5, 10), x, height + 20); // MM-DD format
    }
  }

  /**
   * Draw simple axes
   */
  private drawSimpleAxes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minValue: number,
    maxValue: number
  ): void {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#374151';
    
    // Draw axes lines
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    
    // Draw value axis labels
    const valueLabels = 5;
    const valueRange = maxValue - minValue;
    for (let i = 0; i <= valueLabels; i++) {
      const y = (height / valueLabels) * i;
      const value = maxValue - (valueRange * (i / valueLabels));
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), -5, y + 4);
    }
  }
}