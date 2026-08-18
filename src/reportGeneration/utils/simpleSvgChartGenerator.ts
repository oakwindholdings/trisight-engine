// src/reportGeneration/utils/simpleSvgChartGenerator.ts
// Simple SVG chart generator for reports - no external dependencies
// Rule: Simple - Use basic SVG generation for reliable chart display

import { GeneratedChart } from './chartGenerator';
import { logDebug } from '../../utils/logger';

export interface SimpleChartOptions {
  width?: number; // optional: callers default to {} and the generator falls back internally
  height?: number;
  title?: string;
  theme?: 'light' | 'dark';
}

export interface SimpleDataPoint {
  x: string | number;
  y: number;
}

export interface SimpleCandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Simple SVG chart generator that works in all environments
 * No external dependencies - pure SVG generation
 */
export class SimpleSvgChartGenerator {
  private defaultOptions: SimpleChartOptions = {
    width: 800,
    height: 400,
    theme: 'light'
  };

  /**
   * Generates a simple line chart using SVG
   */
  async generateLineChart(
    data: SimpleDataPoint[],
    options: SimpleChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('SimpleSvgChartGenerator', 'Generating SVG line chart');

    if (!data || data.length === 0) {
      return this.generateEmptyChart(opts, 'No data available for line chart');
    }

    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const chartWidth = opts.width - margin.left - margin.right;
    const chartHeight = opts.height - margin.top - margin.bottom;

    // Find data ranges
    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;

    // Generate SVG
    let svg = `<svg width="${opts.width}" height="${opts.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${opts.width}" height="${opts.height}" fill="${opts.theme === 'dark' ? '#1F2937' : '#FFFFFF'}"/>`;
    
    // Title
    if (opts.title) {
      svg += `<text x="${opts.width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'}">${opts.title}</text>`;
    }

    // Chart area background
    svg += `<rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="none" stroke="${opts.theme === 'dark' ? '#374151' : '#E5E7EB'}"/>`;

    // Generate line path
    let pathData = '';
    data.forEach((point, index) => {
      const x = margin.left + (index / (data.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });

    // Draw line
    svg += `<path d="${pathData}" stroke="${opts.theme === 'dark' ? '#60A5FA' : '#2563EB'}" stroke-width="2" fill="none"/>`;

    // Draw data points
    data.forEach((point, index) => {
      const x = margin.left + (index / (data.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${opts.theme === 'dark' ? '#60A5FA' : '#2563EB'}"/>`;
    });

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = minY + (yRange * i / 4);
      const y = margin.top + chartHeight - (i / 4) * chartHeight;
      svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-family="Arial" font-size="12" fill="${opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'}">${value.toFixed(1)}</text>`;
    }

    svg += '</svg>';

    return {
      id: `svg-line-chart-${Date.now()}`,
      type: 'line',
      title: opts.title || 'Line Chart',
      data: `data:image/svg+xml;base64,${btoa(svg)}`,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: data.length,
        generated: new Date().toISOString(),
        library: 'SimpleSVG'
      }
    };
  }

  /**
   * Generates a simple bar chart using SVG
   */
  async generateBarChart(
    labels: string[],
    values: number[],
    options: SimpleChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('SimpleSvgChartGenerator', 'Generating SVG bar chart');

    if (!values || values.length === 0) {
      return this.generateEmptyChart(opts, 'No data available for bar chart');
    }

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const chartWidth = opts.width - margin.left - margin.right;
    const chartHeight = opts.height - margin.top - margin.bottom;

    const maxValue = Math.max(...values);
    const barWidth = chartWidth / values.length * 0.8;
    const barSpacing = chartWidth / values.length * 0.2;

    let svg = `<svg width="${opts.width}" height="${opts.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${opts.width}" height="${opts.height}" fill="${opts.theme === 'dark' ? '#1F2937' : '#FFFFFF'}"/>`;
    
    // Title
    if (opts.title) {
      svg += `<text x="${opts.width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'}">${opts.title}</text>`;
    }

    // Chart area
    svg += `<rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="none" stroke="${opts.theme === 'dark' ? '#374151' : '#E5E7EB'}"/>`;

    // Draw bars
    values.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = margin.top + chartHeight - barHeight;

      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${opts.theme === 'dark' ? '#60A5FA' : '#3B82F6'}"/>`;
      
      // Value label on top of bar
      svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-family="Arial" font-size="10" fill="${opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'}">${value.toFixed(1)}</text>`;
      
      // X-axis label
      if (labels[index]) {
        svg += `<text x="${x + barWidth / 2}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-family="Arial" font-size="10" fill="${opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'}">${labels[index]}</text>`;
      }
    });

    svg += '</svg>';

    return {
      id: `svg-bar-chart-${Date.now()}`,
      type: 'bar',
      title: opts.title || 'Bar Chart',
      data: `data:image/svg+xml;base64,${btoa(svg)}`,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: values.length,
        generated: new Date().toISOString(),
        library: 'SimpleSVG'
      }
    };
  }

  /**
   * Generates a simple candlestick chart using SVG
   */
  async generateCandlestickChart(
    data: SimpleCandlestickData[],
    options: SimpleChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('SimpleSvgChartGenerator', 'Generating SVG candlestick chart');

    if (!data || data.length === 0) {
      return this.generateEmptyChart(opts, 'No data available for candlestick chart');
    }

    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const chartWidth = opts.width - margin.left - margin.right;
    const chartHeight = opts.height - margin.top - margin.bottom;

    // Find price range
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = Math.max(2, chartWidth / data.length * 0.8);

    let svg = `<svg width="${opts.width}" height="${opts.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${opts.width}" height="${opts.height}" fill="${opts.theme === 'dark' ? '#1F2937' : '#FFFFFF'}"/>`;
    
    // Title
    if (opts.title) {
      svg += `<text x="${opts.width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'}">${opts.title}</text>`;
    }

    // Chart area
    svg += `<rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="none" stroke="${opts.theme === 'dark' ? '#374151' : '#E5E7EB'}"/>`;

    // Draw candlesticks
    data.forEach((candle, index) => {
      const x = margin.left + (index + 0.5) * (chartWidth / data.length);
      const openY = margin.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = margin.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = margin.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = margin.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      const isGreen = candle.close > candle.open;
      const color = isGreen ? '#10B981' : '#EF4444';

      // High-low line
      svg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1"/>`;

      // Candle body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      svg += `<rect x="${x - candleWidth / 2}" y="${bodyTop}" width="${candleWidth}" height="${bodyHeight}" fill="${color}"/>`;
    });

    svg += '</svg>';

    return {
      id: `svg-candlestick-chart-${Date.now()}`,
      type: 'candlestick',
      title: opts.title || 'Price Chart',
      data: `data:image/svg+xml;base64,${btoa(svg)}`,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: data.length,
        priceRange: { min: minPrice, max: maxPrice },
        generated: new Date().toISOString(),
        library: 'SimpleSVG'
      }
    };
  }

  /**
   * Generates an empty chart with error message
   */
  private generateEmptyChart(options: SimpleChartOptions, message: string): GeneratedChart {
    let svg = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${options.width}" height="${options.height}" fill="${options.theme === 'dark' ? '#1F2937' : '#F3F4F6'}"/>`;
    svg += `<text x="${options.width / 2}" y="${options.height / 2}" text-anchor="middle" font-family="Arial" font-size="14" fill="${options.theme === 'dark' ? '#9CA3AF' : '#6B7280'}">${message}</text>`;
    svg += '</svg>';

    return {
      id: `empty-chart-${Date.now()}`,
      type: 'empty',
      title: 'No Data',
      data: `data:image/svg+xml;base64,${btoa(svg)}`,
      format: 'base64',
      width: options.width,
      height: options.height,
      metadata: {
        dataPoints: 0,
        generated: new Date().toISOString(),
        library: 'SimpleSVG',
        error: message
      }
    };
  }
}
