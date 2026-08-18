// src/reportGeneration/utils/chartGenerator.ts
// Chart generation for reports using D3.js
// Context: Creates static charts for embedding in PPTX/PDF reports

import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Time from 'd3-time';
import { ChartData, ChartConfig } from '../models/reportTypes';
import { logDebug } from '../../utils/logger';

export interface ChartOptions {
  width: number;
  height: number;
  theme?: 'light' | 'dark';
  format?: 'svg' | 'png' | 'base64';
}

export interface GeneratedChart {
  type: string;
  data: string; // SVG string or base64 image
  title?: string; // consumers match charts by title
  format?: string;
  dimensions?: { width: number; height: number };
  width?: number; // flat aliases some consumers read instead of dimensions
  height?: number;
  metadata?: { [field: string]: any }; // fallback charts carry their info here instead
  id?: string; // some generators stamp an id
  [extra: string]: any;
}

export class ChartGenerator {
  /**
   * Generates a candlestick chart using D3.js
   */
  async generateCandlestickChart(
    priceData: any[],
    options: ChartOptions = { width: 800, height: 400 }
  ): Promise<GeneratedChart> {
    logDebug('ChartGenerator', 'Generating candlestick chart');
    
    if (!priceData || priceData.length === 0) {
      throw new Error('No price data provided for candlestick chart');
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = options.width - margin.left - margin.right;
    const height = options.height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3Scale.scaleTime()
      .domain(d3Array.extent(priceData, d => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const yScale = d3Scale.scaleLinear()
      .domain(d3Array.extent(priceData, d => Math.max(d.high, d.low)) as [number, number])
      .range([height, 0]);

    // Create SVG string
    let svgString = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add candlesticks
    priceData.forEach(d => {
      const x = xScale(new Date(d.date));
      const yHigh = yScale(d.high);
      const yLow = yScale(d.low);
      const yOpen = yScale(d.open);
      const yClose = yScale(d.close);
      
      const color = d.close >= d.open ? '#00C851' : '#FF4444';
      const bodyHeight = Math.abs(yClose - yOpen);
      
      // High-low line
      svgString += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1"/>`;
      
      // Body rectangle
      svgString += `<rect x="${x-2}" y="${Math.min(yOpen, yClose)}" width="4" height="${bodyHeight}" fill="${color}"/>`;
    });
    
    // Add axes
    svgString += this.createAxis(xScale, yScale, width, height);
    svgString += '</g></svg>';

    return {
      type: 'candlestick',
      data: svgString,
      format: 'svg',
      dimensions: { width: options.width, height: options.height }
    };
  }

  /**
   * Generates a line chart
   */
  async generateLineChart(
    data: Array<{date: string; [key: string]: any}>,
    series: string[],
    options: ChartOptions = { width: 800, height: 400 }
  ): Promise<GeneratedChart> {
    logDebug('ChartGenerator', 'Generating line chart');
    
    if (!data || data.length === 0) {
      throw new Error('No data provided for line chart');
    }

    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const width = options.width - margin.left - margin.right;
    const height = options.height - margin.top - margin.bottom;
    const theme = options.theme || 'light';
    const colors = this.getColorPalette(theme);

    // Parse dates and prepare data
    const parsedData = data.map(d => ({
      ...d,
      date: new Date(d.date)
    }));

    // Create scales
    const xScale = d3Scale.scaleTime()
      .domain(d3Array.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, width]);

    // Find min/max across all series
    const allValues = series.flatMap(s => parsedData.map(d => d[s] || 0));
    const yScale = d3Scale.scaleLinear()
      .domain([d3Array.min(allValues) || 0, d3Array.max(allValues) || 0])
      .nice()
      .range([height, 0]);

    // Create SVG
    let svgString = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<rect width="${options.width}" height="${options.height}" fill="${theme === 'dark' ? '#1e1e1e' : 'white'}"/>`;
    svgString += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add grid lines
    svgString += this.createGridLines(xScale, yScale, width, height, theme);
    
    // Draw lines for each series
    series.forEach((seriesName, index) => {
      const lineData = parsedData.filter(d => d[seriesName] !== null && d[seriesName] !== undefined);
      if (lineData.length === 0) return;
      
      const color = colors[index % colors.length];
      
      // Create path
      let pathData = 'M';
      lineData.forEach((d, i) => {
        const x = xScale(d.date);
        const y = yScale(d[seriesName]);
        pathData += `${i === 0 ? '' : 'L'}${x},${y}`;
      });
      
      svgString += `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>`;
      
      // Add data points
      lineData.forEach(d => {
        const x = xScale(d.date);
        const y = yScale(d[seriesName]);
        svgString += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
      });
    });
    
    // Add axes
    svgString += this.createAxis(xScale, yScale, width, height, theme);
    
    // Add legend
    svgString += this.createLegend(series, colors, width, theme);
    
    svgString += '</g></svg>';

    return {
      type: 'line',
      data: svgString,
      format: 'svg',
      dimensions: { width: options.width, height: options.height }
    };
  }

  /**
   * Generates a bar chart
   */
  async generateBarChart(
    data: Array<{[key: string]: any}>,
    categoryKey: string,
    valueKeys: string[],
    options: ChartOptions = { width: 800, height: 400 }
  ): Promise<GeneratedChart> {
    logDebug('ChartGenerator', 'Generating bar chart');
    
    if (!data || data.length === 0) {
      throw new Error('No data provided for bar chart');
    }

    const margin = { top: 20, right: 120, bottom: 60, left: 80 };
    const width = options.width - margin.left - margin.right;
    const height = options.height - margin.top - margin.bottom;
    const theme = options.theme || 'light';
    const colors = this.getColorPalette(theme);

    // Create scales
    const x0Scale = d3Scale.scaleBand()
      .domain(data.map(d => d[categoryKey]))
      .range([0, width])
      .padding(0.1);

    const x1Scale = d3Scale.scaleBand()
      .domain(valueKeys)
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    // Find max value across all series
    const maxValue = d3Array.max(data, d =>
      d3Array.max(valueKeys, key => d[key] || 0)
    ) || 0;

    const yScale = d3Scale.scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding
      .nice()
      .range([height, 0]);

    // Create SVG
    let svgString = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<rect width="${options.width}" height="${options.height}" fill="${theme === 'dark' ? '#1e1e1e' : 'white'}"/>`;
    svgString += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add grid lines
    svgString += this.createGridLines(x0Scale, yScale, width, height, theme);
    
    // Draw bars
    data.forEach(d => {
      const x0 = x0Scale(d[categoryKey]) || 0;
      
      valueKeys.forEach((key, index) => {
        const value = d[key] || 0;
        const x = x0 + (x1Scale(key) || 0);
        const y = yScale(value);
        const barHeight = height - y;
        const color = colors[index % colors.length];
        
        svgString += `<rect x="${x}" y="${y}" width="${x1Scale.bandwidth()}" height="${barHeight}" fill="${color}"/>`;
        
        // Add value label on top of bar
        if (barHeight > 20) {
          svgString += `<text x="${x + x1Scale.bandwidth() / 2}" y="${y - 5}" `;
          svgString += `text-anchor="middle" font-size="12" fill="${theme === 'dark' ? '#fff' : '#333'}">`;
          svgString += `${this.formatValue(value)}</text>`;
        }
      });
    });
    
    // Add axes
    svgString += this.createBarChartAxis(x0Scale, yScale, width, height, theme);
    
    // Add legend
    svgString += this.createLegend(valueKeys, colors, width, theme);
    
    svgString += '</g></svg>';

    return {
      type: 'bar',
      data: svgString,
      format: 'svg',
      dimensions: { width: options.width, height: options.height }
    };
  }

  /**
   * Converts SVG to image format
   * Note: In browser environment, this requires canvas support
   */
  async convertToImage(svgString: string, format: 'png' | 'jpeg' = 'png'): Promise<string> {
    // In Node.js environment, we would use a library like sharp or canvas
    // For now, return the SVG as-is with a data URI wrapper
    // Production implementation would use node-canvas or puppeteer
    
    if (typeof window !== 'undefined' && window.document) {
      // Browser environment - use canvas
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, `image/${format}`);
        };
        
        img.onerror = () => reject(new Error('Failed to load SVG'));
        
        // Convert SVG string to data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      });
    } else {
      // Server environment - return SVG data URL
      // In production, use node-canvas or sharp for real conversion
      const base64 = Buffer.from(svgString).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  }

  /**
   * Gets available chart types
   */
  getAvailableChartTypes(): string[] {
    return ['candlestick', 'line', 'bar', 'pie', 'scatter', 'heatmap'];
  }

  /**
   * Generates a pie chart
   */
  async generatePieChart(
    data: Array<{label: string; value: number}>,
    options: ChartOptions = { width: 400, height: 400 }
  ): Promise<GeneratedChart> {
    logDebug('ChartGenerator', 'Generating pie chart');
    
    if (!data || data.length === 0) {
      throw new Error('No data provided for pie chart');
    }

    const margin = 40;
    const radius = Math.min(options.width, options.height) / 2 - margin;
    const centerX = options.width / 2;
    const centerY = options.height / 2;
    const theme = options.theme || 'light';
    const colors = this.getColorPalette(theme);

    // Calculate angles
    const total = (d3 as any).sum(data, (d: any) => d.value); // d3-array is declared shorthand, so members are untyped
    let currentAngle = -Math.PI / 2; // Start at top
    
    const arcs = data.map((d, i) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (d.value / total) * 2 * Math.PI;
      currentAngle = endAngle;
      
      return {
        ...d,
        startAngle,
        endAngle,
        color: colors[i % colors.length]
      };
    });

    // Create SVG
    let svgString = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<rect width="${options.width}" height="${options.height}" fill="${theme === 'dark' ? '#1e1e1e' : 'white'}"/>`;
    
    // Draw pie slices
    arcs.forEach(arc => {
      const x1 = centerX + radius * Math.cos(arc.startAngle);
      const y1 = centerY + radius * Math.sin(arc.startAngle);
      const x2 = centerX + radius * Math.cos(arc.endAngle);
      const y2 = centerY + radius * Math.sin(arc.endAngle);
      
      const largeArc = arc.endAngle - arc.startAngle > Math.PI ? 1 : 0;
      
      svgString += `<path d="M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z" `;
      svgString += `fill="${arc.color}" stroke="${theme === 'dark' ? '#1e1e1e' : 'white'}" stroke-width="2"/>`;
      
      // Add percentage label
      const percentage = ((arc.value / total) * 100).toFixed(1);
      const labelAngle = (arc.startAngle + arc.endAngle) / 2;
      const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
      const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
      
      if (arc.value / total > 0.05) { // Only show label if slice is > 5%
        svgString += `<text x="${labelX}" y="${labelY}" text-anchor="middle" alignment-baseline="middle" `;
        svgString += `font-size="14" font-weight="bold" fill="white">${percentage}%</text>`;
      }
    });
    
    // Add legend
    const legendX = 20;
    let legendY = 20;
    
    data.forEach((d, i) => {
      const color = colors[i % colors.length];
      svgString += `<rect x="${legendX}" y="${legendY}" width="15" height="15" fill="${color}"/>`;
      svgString += `<text x="${legendX + 20}" y="${legendY + 12}" font-size="14" `;
      svgString += `fill="${theme === 'dark' ? '#fff' : '#333'}">${d.label}: ${this.formatValue(d.value)}</text>`;
      legendY += 25;
    });
    
    svgString += '</svg>';

    return {
      type: 'pie',
      data: svgString,
      format: 'svg',
      dimensions: { width: options.width, height: options.height }
    };
  }

  /**
   * Generates a scatter plot
   */
  async generateScatterPlot(
    data: Array<{x: number; y: number; label?: string; size?: number}>,
    options: ChartOptions & { xLabel?: string; yLabel?: string } = { width: 800, height: 400 }
  ): Promise<GeneratedChart> {
    logDebug('ChartGenerator', 'Generating scatter plot');
    
    if (!data || data.length === 0) {
      throw new Error('No data provided for scatter plot');
    }

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = options.width - margin.left - margin.right;
    const height = options.height - margin.top - margin.bottom;
    const theme = options.theme || 'light';
    const primaryColor = theme === 'dark' ? '#4CAF50' : '#2196F3';

    // Create scales
    const xScale = d3Scale.scaleLinear()
      .domain(d3Array.extent(data, d => d.x) as [number, number])
      .nice()
      .range([0, width]);

    const yScale = d3Scale.scaleLinear()
      .domain(d3Array.extent(data, d => d.y) as [number, number])
      .nice()
      .range([height, 0]);

    // Create SVG
    let svgString = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<rect width="${options.width}" height="${options.height}" fill="${theme === 'dark' ? '#1e1e1e' : 'white'}"/>`;
    svgString += `<g transform="translate(${margin.left},${margin.top})">`;
    
    // Add grid lines
    svgString += this.createGridLines(xScale, yScale, width, height, theme);
    
    // Draw points
    data.forEach(d => {
      const x = xScale(d.x);
      const y = yScale(d.y);
      const size = d.size || 5;
      
      svgString += `<circle cx="${x}" cy="${y}" r="${size}" fill="${primaryColor}" opacity="0.7"/>`;
      
      // Add label if provided
      if (d.label) {
        svgString += `<text x="${x + size + 3}" y="${y + 3}" font-size="10" `;
        svgString += `fill="${theme === 'dark' ? '#fff' : '#333'}">${d.label}</text>`;
      }
    });
    
    // Add axes
    svgString += this.createAxis(xScale, yScale, width, height, theme);
    
    // Add axis labels
    if (options.xLabel) {
      svgString += `<text x="${width / 2}" y="${height + 50}" text-anchor="middle" font-size="14" `;
      svgString += `fill="${theme === 'dark' ? '#fff' : '#333'}">${options.xLabel}</text>`;
    }
    
    if (options.yLabel) {
      svgString += `<text x="${-height / 2}" y="-40" text-anchor="middle" font-size="14" `;
      svgString += `transform="rotate(-90 -40 ${-height / 2})" `;
      svgString += `fill="${theme === 'dark' ? '#fff' : '#333'}">${options.yLabel}</text>`;
    }
    
    svgString += '</g></svg>';

    return {
      type: 'scatter',
      data: svgString,
      format: 'svg',
      dimensions: { width: options.width, height: options.height }
    };
  }

  /**
   * Helper method to create axis elements for SVG
   */
  private createAxis(xScale: any, yScale: any, width: number, height: number, theme: string = 'light'): string {
    let axisString = '';
    
    const strokeColor = theme === 'dark' ? '#666' : '#000';
    const textColor = theme === 'dark' ? '#ccc' : '#333';
    
    // X-axis
    axisString += `<g transform="translate(0,${height})">`;
    axisString += `<line x1="0" y1="0" x2="${width}" y2="0" stroke="${strokeColor}" stroke-width="1"/>`;
    
    // X-axis ticks
    const xTicks = xScale.ticks ? xScale.ticks(6) : xScale.domain();
    xTicks.forEach((tick: any) => {
      const x = xScale(tick);
      const tickText = tick instanceof Date ? tick.toLocaleDateString() : tick.toString();
      axisString += `<line x1="${x}" y1="0" x2="${x}" y2="6" stroke="${theme === 'dark' ? '#666' : '#000'}" stroke-width="1"/>`;
      axisString += `<text x="${x}" y="20" text-anchor="middle" font-size="12" fill="${theme === 'dark' ? '#ccc' : '#333'}">${tickText}</text>`;
    });
    axisString += '</g>';
    
    // Y-axis
    axisString += '<g>';
    axisString += `<line x1="0" y1="0" x2="0" y2="${height}" stroke="${strokeColor}" stroke-width="1"/>`;
    
    // Y-axis ticks
    const yTicks = yScale.ticks ? yScale.ticks(6) : yScale.domain();
    yTicks.forEach((tick: number) => {
      const y = yScale(tick);
      axisString += `<line x1="0" y1="${y}" x2="-6" y2="${y}" stroke="${strokeColor}" stroke-width="1"/>`;
      axisString += `<text x="-10" y="${y + 4}" text-anchor="end" font-size="12" fill="${textColor}">${this.formatValue(tick)}</text>`;
    });
    axisString += '</g>';
    
    return axisString;
  }

  /**
   * Creates axis for bar charts with rotated labels
   */
  private createBarChartAxis(xScale: any, yScale: any, width: number, height: number, theme: string = 'light'): string {
    let axisString = '';
    const strokeColor = theme === 'dark' ? '#666' : '#000';
    const textColor = theme === 'dark' ? '#ccc' : '#333';
    
    // X-axis
    axisString += `<g transform="translate(0,${height})">`;
    axisString += `<line x1="0" y1="0" x2="${width}" y2="0" stroke="${strokeColor}" stroke-width="1"/>`;
    
    // X-axis labels (rotated for bar chart)
    const xDomain = xScale.domain();
    xDomain.forEach((label: string) => {
      const x = xScale(label) + xScale.bandwidth() / 2;
      axisString += `<text x="${x}" y="15" text-anchor="start" font-size="12" fill="${textColor}" `;
      axisString += `transform="rotate(45 ${x} 15)">${label}</text>`;
    });
    axisString += '</g>';
    
    // Y-axis
    axisString += '<g>';
    axisString += `<line x1="0" y1="0" x2="0" y2="${height}" stroke="${strokeColor}" stroke-width="1"/>`;
    
    const yTicks = yScale.ticks(6);
    yTicks.forEach((tick: number) => {
      const y = yScale(tick);
      axisString += `<line x1="0" y1="${y}" x2="-6" y2="${y}" stroke="${strokeColor}" stroke-width="1"/>`;
      axisString += `<text x="-10" y="${y + 4}" text-anchor="end" font-size="12" fill="${textColor}">${this.formatValue(tick)}</text>`;
    });
    axisString += '</g>';
    
    return axisString;
  }

  /**
   * Creates grid lines for charts
   */
  private createGridLines(xScale: any, yScale: any, width: number, height: number, theme: string = 'light'): string {
    let gridString = '';
    const gridColor = theme === 'dark' ? '#333' : '#e0e0e0';
    
    // Horizontal grid lines
    const yTicks = yScale.ticks ? yScale.ticks(6) : yScale.domain();
    yTicks.forEach((tick: any) => {
      const y = yScale(tick);
      gridString += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${gridColor}" stroke-width="0.5" opacity="0.5"/>`;
    });
    
    return gridString;
  }

  /**
   * Creates legend for multi-series charts
   */
  private createLegend(series: string[], colors: string[], width: number, theme: string = 'light'): string {
    let legendString = '<g transform="translate(' + (width + 10) + ', 20)">';
    const textColor = theme === 'dark' ? '#ccc' : '#333';
    
    series.forEach((name, i) => {
      const y = i * 25;
      legendString += `<rect x="0" y="${y}" width="15" height="15" fill="${colors[i % colors.length]}"/>`;
      legendString += `<text x="20" y="${y + 12}" font-size="12" fill="${textColor}">${name}</text>`;
    });
    
    legendString += '</g>';
    return legendString;
  }

  /**
   * Gets color palette based on theme
   */
  private getColorPalette(theme: string): string[] {
    if (theme === 'dark') {
      return ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];
    }
    return ['#2E7D32', '#1565C0', '#E65100', '#C2185B', '#6A1B9A', '#00838F', '#F9A825', '#4E342E'];
  }

  /**
   * Formats numeric values for display
   */
  private formatValue(value: number): string {
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    } else if (value % 1 === 0) {
      return value.toString();
    } else {
      return value.toFixed(2);
    }
  }
}