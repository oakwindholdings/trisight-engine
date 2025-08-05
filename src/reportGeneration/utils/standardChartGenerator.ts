// src/reportGeneration/utils/standardChartGenerator.ts
// Standard chart generation using Chart.js and D3.js for reports
// Rule: Simple - Replace proprietary charting with industry standard libraries

import { GeneratedChart } from './chartGenerator';
import { logDebug } from '../../utils/logger';

// Use dynamic imports for Node.js canvas and Chart.js to avoid browser issues
let createCanvas: any;
let Chart: any;

async function initializeChartLibraries() {
  if (typeof window === 'undefined') {
    // Node.js environment
    try {
      const canvasModule = await import('canvas');
      createCanvas = canvasModule.createCanvas;

      const chartModule = await import('chart.js');
      Chart = chartModule.Chart;
      Chart.register(...chartModule.registerables);
    } catch (error) {
      logDebug('StandardChartGenerator', 'Chart libraries not available, using fallback');
    }
  }
}

export interface StandardChartOptions {
  width: number;
  height: number;
  title?: string;
  theme?: 'light' | 'dark';
  format?: 'png' | 'svg';
}

export interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LineChartDataPoint {
  x: string | number;
  y: number;
}

/**
 * Standard chart generator using Chart.js for professional report charts
 * Replaces proprietary InfiniteZoomChart dependencies
 */
export class StandardChartGenerator {
  private defaultOptions: StandardChartOptions = {
    width: 800,
    height: 400,
    theme: 'light',
    format: 'png'
  };

  /**
   * Generates a line chart using Chart.js
   */
  async generateLineChart(
    data: LineChartDataPoint[],
    options: StandardChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('StandardChartGenerator', 'Generating line chart');

    const canvas = createCanvas(opts.width, opts.height);
    const ctx = canvas.getContext('2d') as any;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: opts.title || 'Data',
          data: data.map(d => d.y),
          borderColor: opts.theme === 'dark' ? '#60A5FA' : '#2563EB',
          backgroundColor: opts.theme === 'dark' ? '#1E40AF20' : '#3B82F620',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          title: {
            display: !!opts.title,
            text: opts.title,
            color: opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: opts.theme === 'dark' ? '#374151' : '#E5E7EB'
            },
            ticks: {
              color: opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }
          },
          y: {
            grid: {
              color: opts.theme === 'dark' ? '#374151' : '#E5E7EB'
            },
            ticks: {
              color: opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    
    // Convert to base64
    const buffer = canvas.toBuffer('image/png');
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    chart.destroy();

    return {
      id: `line-chart-${Date.now()}`,
      type: 'line',
      title: opts.title || 'Line Chart',
      data: base64,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: data.length,
        generated: new Date().toISOString(),
        library: 'Chart.js'
      }
    };
  }

  /**
   * Generates a bar chart using Chart.js
   */
  async generateBarChart(
    labels: string[],
    values: number[],
    options: StandardChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('StandardChartGenerator', 'Generating bar chart');

    const canvas = createCanvas(opts.width, opts.height);
    const ctx = canvas.getContext('2d') as any;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: opts.title || 'Data',
          data: values,
          backgroundColor: opts.theme === 'dark' ? '#60A5FA' : '#3B82F6',
          borderColor: opts.theme === 'dark' ? '#2563EB' : '#1D4ED8',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          title: {
            display: !!opts.title,
            text: opts.title,
            color: opts.theme === 'dark' ? '#F3F4F6' : '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: opts.theme === 'dark' ? '#374151' : '#E5E7EB'
            },
            ticks: {
              color: opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: opts.theme === 'dark' ? '#374151' : '#E5E7EB'
            },
            ticks: {
              color: opts.theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    
    const buffer = canvas.toBuffer('image/png');
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    chart.destroy();

    return {
      id: `bar-chart-${Date.now()}`,
      type: 'bar',
      title: opts.title || 'Bar Chart',
      data: base64,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: values.length,
        generated: new Date().toISOString(),
        library: 'Chart.js'
      }
    };
  }

  /**
   * Generates a simple candlestick chart using canvas drawing
   * For basic financial data visualization in reports
   */
  async generateCandlestickChart(
    data: CandlestickDataPoint[],
    options: StandardChartOptions = {}
  ): Promise<GeneratedChart> {
    const opts = { ...this.defaultOptions, ...options };
    logDebug('StandardChartGenerator', 'Generating candlestick chart');

    const canvas = createCanvas(opts.width, opts.height);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = opts.theme === 'dark' ? '#1F2937' : '#FFFFFF';
    ctx.fillRect(0, 0, opts.width, opts.height);

    // Calculate margins and chart area
    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const chartWidth = opts.width - margin.left - margin.right;
    const chartHeight = opts.height - margin.top - margin.bottom;

    // Find price range
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw title
    if (opts.title) {
      ctx.fillStyle = opts.theme === 'dark' ? '#F3F4F6' : '#1F2937';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, opts.width / 2, 25);
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / data.length * 0.8);
    
    data.forEach((candle, index) => {
      const x = margin.left + (index + 0.5) * (chartWidth / data.length);
      const openY = margin.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = margin.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = margin.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = margin.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      // Determine candle color
      const isGreen = candle.close > candle.open;
      ctx.strokeStyle = isGreen ? '#10B981' : '#EF4444';
      ctx.fillStyle = isGreen ? '#10B981' : '#EF4444';

      // Draw high-low line
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw candle body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight > 0) {
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji - draw a line
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, openY);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw axes
    ctx.strokeStyle = opts.theme === 'dark' ? '#374151' : '#E5E7EB';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    const buffer = canvas.toBuffer('image/png');
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    return {
      id: `candlestick-chart-${Date.now()}`,
      type: 'candlestick',
      title: opts.title || 'Price Chart',
      data: base64,
      format: 'base64',
      width: opts.width,
      height: opts.height,
      metadata: {
        dataPoints: data.length,
        priceRange: { min: minPrice, max: maxPrice },
        generated: new Date().toISOString(),
        library: 'Canvas'
      }
    };
  }
}
