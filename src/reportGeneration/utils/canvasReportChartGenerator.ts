// src/reportGeneration/utils/canvasReportChartGenerator.ts
// Generates static chart images using our proprietary canvas rendering engine
// Leverages the multi-layered canvas system with transparent labels for signal emission

import { CandlestickData } from '../../models/ChartTypes';
import { Pattern } from '../../models/PatternTypes';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { createPriceScale } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
// Import types only to avoid runtime dependencies on React components
import type { ConvictionCloudItem } from '../../components/Chart/ConvictionCloudRenderer';
import { TradeActionSignal } from '../../utils/trading/TradeActionSignal';
import { GeneratedChart as BaseGeneratedChart } from './chartGenerator';
import { logDebug } from '../../utils/logger';

// Report paths emit node-canvas Buffers in data; widen locally rather than in the shared type
type GeneratedChart = Omit<BaseGeneratedChart, 'data'> & { data: string | Buffer };

// Local hybrid wrapper: this file calls scales directly (d3-style) AND via .ticks/.invert;
// the shared factories return method objects, so bind the callable form here.
function asCallableScale(obj: any): any {
  const fn: any = (v: any) => obj.scale(v);
  fn.scale = obj.scale; fn.invert = obj.invert; fn.ticks = obj.ticks;
  return fn;
}


// TwelveData ULTRA features we can leverage
interface TwelveDataUltraConfig {
  useExtendedHistory: boolean; // 30+ years of data
  includeAllIndicators: boolean; // All technical indicators
  streamingEnabled: boolean; // Real-time WebSocket data
  unlimitedAPICalls: boolean; // No rate limits
}

export interface ReportChartOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  quality?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showPatterns?: boolean;
  showSignals?: boolean;
  showConvictionCloud?: boolean;
  showVolume?: boolean;
  showGrid?: boolean;
  transparentLabels?: boolean; // Enable transparent label rendering for signal emission
  ultraFeatures?: TwelveDataUltraConfig;
}

export class CanvasReportChartGenerator {
  private defaultMargin = { top: 20, right: 60, bottom: 40, left: 60 };
  
  /**
   * Generates a candlestick chart with our proprietary rendering system
   */
  async generateCandlestickChart(
    data: CandlestickData[],
    patterns: Pattern[] = [],
    options: ReportChartOptions
  ): Promise<GeneratedChart> {
    const { width, height, margin = this.defaultMargin, showVolume = true, showGrid = true } = options;
    
    // Create canvas with our multi-layer approach
    const mainCanvas = createCanvas(width, height);
    const mainCtx = mainCanvas.getContext('2d');
    
    // Create buffer canvas for double buffering (performance)
    const bufferCanvas = createCanvas(width, height);
    const bufferCtx = bufferCanvas.getContext('2d');
    
    // Create patterns canvas for overlay
    const patternsCanvas = createCanvas(width, height);
    const patternsCtx = patternsCanvas.getContext('2d');
    
    // Clear canvases
    mainCtx.fillStyle = '#ffffff';
    mainCtx.fillRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
      return this.createEmptyChart(mainCanvas, options);
    }
    
    // Calculate chart dimensions
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Create scales using our proprietary scaling functions
    const priceExtent = this.getPriceExtent(data);
    const priceScale = asCallableScale(createPriceScale(chartHeight, priceExtent, [chartHeight, 0]));
    
    const timeScale = asCallableScale(createSequentialTimeScale(
      chartWidth,
      data as any,
      [0, chartWidth]
    ));
    
    // Render grid if enabled
    if (showGrid) {
      this.renderGrid(bufferCtx, chartWidth, chartHeight, margin, priceScale, timeScale);
    }
    
    // Render candlesticks directly
    bufferCtx.save();
    bufferCtx.translate(margin.left, margin.top);
    
    // Render candles
    data.forEach((candle, i) => {
      const x = timeScale(i);
      const candleWidth = chartWidth / data.length * 0.8;
      
      const open = priceScale(candle.open);
      const close = priceScale(candle.close);
      const high = priceScale(candle.high);
      const low = priceScale(candle.low);
      
      const bullish = candle.close >= candle.open;
      
      // Draw high-low line
      bufferCtx.strokeStyle = bullish ? '#10b981' : '#ef4444';
      bufferCtx.lineWidth = 1;
      bufferCtx.beginPath();
      bufferCtx.moveTo(x, high);
      bufferCtx.lineTo(x, low);
      bufferCtx.stroke();
      
      // Draw body
      bufferCtx.fillStyle = bullish ? '#10b981' : '#ef4444';
      const bodyTop = Math.min(open, close);
      const bodyHeight = Math.abs(open - close);
      bufferCtx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight || 1);
    });
    
    bufferCtx.restore();
    
    // Render patterns if enabled
    if (options.showPatterns && patterns.length > 0) {
      patternsCtx.save();
      patternsCtx.translate(margin.left, margin.top);
      
      // Render pattern overlays
      patterns.forEach(pattern => {
        patternsCtx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        patternsCtx.strokeStyle = '#3b82f6';
        patternsCtx.lineWidth = 2;
        
        // Simple pattern highlighting based on candle indices
        const p: any = pattern; // index fields live on runtime pattern events, not the Pattern model
        if (p.startIndex !== undefined && p.endIndex !== undefined) {
          const startX = timeScale(p.startIndex);
          const endX = timeScale(p.endIndex);
          const width = endX - startX;
          
          // Draw pattern highlight
          patternsCtx.fillRect(startX - 5, 0, width + 10, chartHeight);
          
          // Draw pattern label if transparent labels enabled
          if (options.transparentLabels) {
            patternsCtx.font = '12px Inter, sans-serif';
            patternsCtx.fillStyle = 'rgba(59, 130, 246, 0.01)'; // Nearly transparent for signal emission
            patternsCtx.fillText(pattern.type, startX, 20);
          }
        }
      });
      
      patternsCtx.restore();
    }
    
    // Render volume if enabled
    if (showVolume) {
      this.renderVolume(bufferCtx, data, timeScale, chartWidth, chartHeight, margin);
    }
    
    // Render axes
    this.renderPriceAxis(bufferCtx, priceScale, chartWidth, chartHeight, margin);
    this.renderTimeAxis(bufferCtx, data, timeScale, chartWidth, chartHeight, margin);
    
    // Composite all layers onto main canvas
    mainCtx.drawImage(bufferCanvas, 0, 0);
    if (options.showPatterns) {
      mainCtx.drawImage(patternsCanvas, 0, 0);
    }
    
    // Convert to buffer
    const buffer = options.format === 'png' 
      ? mainCanvas.toBuffer('image/png')
      : mainCanvas.toBuffer('image/jpeg', { quality: options.quality || 0.9 });
    
    return {
      type: 'candlestick',
      data: buffer,
      format: options.format,
      dimensions: { width, height },
      metadata: {
        candleCount: data.length,
        patternCount: patterns.length,
        timeframe: this.detectTimeframe(data),
        priceRange: priceExtent,
        renderTime: Date.now()
      }
    };
  }
  
  /**
   * Generates a technical analysis chart with indicators
   */
  async generateTechnicalChart(
    data: CandlestickData[],
    indicators: any[],
    signals: TradeActionSignal[],
    options: ReportChartOptions
  ): Promise<GeneratedChart> {
    const baseChart = await this.generateCandlestickChart(data, [], options);
    
    // Overlay indicators and signals
    // This would integrate with our signal bus system
    
    return {
      ...baseChart,
      type: 'technical',
      metadata: {
        ...baseChart.metadata,
        indicatorCount: indicators.length,
        signalCount: signals.length
      }
    };
  }
  
  /**
   * Generates a conviction cloud visualization
   */
  async generateConvictionCloudChart(
    data: CandlestickData[],
    convictionItems: ConvictionCloudItem[],
    options: ReportChartOptions
  ): Promise<GeneratedChart> {
    const { width, height, margin = this.defaultMargin } = options;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Render conviction cloud directly
    if (convictionItems.length > 0) {
      ctx.save();
      ctx.translate(margin.left, margin.top);
      
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      // Group items by time and aggregate conviction
      const convictionByTime = new Map<number, { bullish: number; bearish: number; neutral: number }>();
      
      convictionItems.forEach((item: any) => { // report payloads carry timestamp/sentiment/strength, unlike the UI ConvictionCloudItem
        const key = item.timestamp;
        if (!convictionByTime.has(key)) {
          convictionByTime.set(key, { bullish: 0, bearish: 0, neutral: 0 });
        }
        const conv = convictionByTime.get(key)!;
        
        if (item.sentiment === 'bullish') conv.bullish += item.strength;
        else if (item.sentiment === 'bearish') conv.bearish += item.strength;
        else conv.neutral += item.strength;
      });
      
      // Render as gradient bands
      const timeStamps = Array.from(convictionByTime.keys()).sort();
      const barWidth = chartWidth / timeStamps.length;
      
      timeStamps.forEach((timestamp, i) => {
        const conv = convictionByTime.get(timestamp)!;
        const total = conv.bullish + conv.bearish + conv.neutral;
        
        if (total > 0) {
          const x = i * barWidth;
          
          // Draw stacked bars
          let y = 0;
          
          // Bullish
          if (conv.bullish > 0) {
            const height = (conv.bullish / total) * chartHeight;
            ctx.fillStyle = '#10b98166';
            ctx.fillRect(x, y, barWidth, height);
            y += height;
          }
          
          // Neutral
          if (conv.neutral > 0) {
            const height = (conv.neutral / total) * chartHeight;
            ctx.fillStyle = '#6b728066';
            ctx.fillRect(x, y, barWidth, height);
            y += height;
          }
          
          // Bearish
          if (conv.bearish > 0) {
            const height = (conv.bearish / total) * chartHeight;
            ctx.fillStyle = '#ef444466';
            ctx.fillRect(x, y, barWidth, height);
          }
        }
      });
      
      ctx.restore();
    }
    
    const buffer = options.format === 'png' 
      ? canvas.toBuffer('image/png')
      : canvas.toBuffer('image/jpeg', { quality: options.quality || 0.9 });
    
    return {
      type: 'conviction-cloud',
      data: buffer,
      format: options.format,
      dimensions: { width, height },
      metadata: {
        convictionItemCount: convictionItems.length,
        renderTime: Date.now()
      }
    };
  }
  
  /**
   * Leverages TwelveData ULTRA features for enhanced charts
   */
  async generateUltraEnhancedChart(
    symbol: string,
    options: ReportChartOptions & { ultraFeatures: TwelveDataUltraConfig }
  ): Promise<GeneratedChart> {
    logDebug('CanvasReportChartGenerator', `Generating ULTRA-enhanced chart for ${symbol}`);
    
    // With ULTRA access, we can:
    // 1. Fetch 30+ years of historical data
    // 2. Include all technical indicators
    // 3. Stream real-time data if needed
    // 4. Make unlimited API calls without rate limits
    
    // This would integrate with our TwelveData adapter
    // to fetch comprehensive data and generate rich charts
    
    return this.createEmptyChart(createCanvas(options.width, options.height), options);
  }
  
  // Helper methods
  
  private getPriceExtent(data: CandlestickData[]): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    
    data.forEach(candle => {
      min = Math.min(min, candle.low);
      max = Math.max(max, candle.high);
    });
    
    // Add padding
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }
  
  private detectTimeframe(data: CandlestickData[]): string {
    if (data.length < 2) return 'unknown';
    
    const timeDiff = data[1].timestamp - data[0].timestamp;
    const msInMinute = 60 * 1000;
    const msInHour = 60 * msInMinute;
    const msInDay = 24 * msInHour;
    
    if (timeDiff < 5 * msInMinute) return '1min';
    if (timeDiff < 15 * msInMinute) return '5min';
    if (timeDiff < msInHour) return '15min';
    if (timeDiff < 4 * msInHour) return '1h';
    if (timeDiff < msInDay) return '4h';
    if (timeDiff < 7 * msInDay) return '1day';
    if (timeDiff < 31 * msInDay) return '1week';
    return '1month';
  }
  
  private renderGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    margin: any,
    priceScale: any,
    timeScale: any
  ): void {
    ctx.save();
    ctx.translate(margin.left, margin.top);
    
    // Grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    const priceSteps = 10;
    for (let i = 0; i <= priceSteps; i++) {
      const y = (height / priceSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    const timeSteps = 10;
    for (let i = 0; i <= timeSteps; i++) {
      const x = (width / timeSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  private renderVolume(
    ctx: CanvasRenderingContext2D,
    data: CandlestickData[],
    timeScale: any,
    width: number,
    height: number,
    margin: any
  ): void {
    ctx.save();
    ctx.translate(margin.left, margin.top);
    
    const volumeHeight = height * 0.2;
    const volumeY = height - volumeHeight;
    
    // Find max volume
    const maxVolume = Math.max(...data.map(d => d.volume || 0));
    
    // Render volume bars
    data.forEach((candle, i) => {
      const x = timeScale(i);
      const barWidth = width / data.length * 0.8;
      const barHeight = (candle.volume / maxVolume) * volumeHeight;
      
      ctx.fillStyle = candle.close >= candle.open ? '#10b98133' : '#ef444433';
      ctx.fillRect(x - barWidth / 2, volumeY + volumeHeight - barHeight, barWidth, barHeight);
    });
    
    ctx.restore();
  }
  
  private renderPriceAxis(
    ctx: CanvasRenderingContext2D,
    priceScale: any,
    width: number,
    height: number,
    margin: any
  ): void {
    ctx.save();
    ctx.translate(width + margin.left, margin.top);
    
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Render price labels
    const ticks = priceScale.ticks(5);
    ticks.forEach((price: number) => {
      const y = priceScale(price);
      ctx.fillText(price.toFixed(2), 5, y);
    });
    
    ctx.restore();
  }
  
  private renderTimeAxis(
    ctx: CanvasRenderingContext2D,
    data: CandlestickData[],
    timeScale: any,
    width: number,
    height: number,
    margin: any
  ): void {
    ctx.save();
    ctx.translate(margin.left, height + margin.top);
    
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Render time labels
    const step = Math.floor(data.length / 5);
    for (let i = 0; i < data.length; i += step) {
      const x = timeScale(i);
      const date = new Date(data[i].timestamp);
      ctx.fillText(date.toLocaleDateString(), x, 5);
    }
    
    ctx.restore();
  }
  
  private createEmptyChart(canvas: Canvas, options: ReportChartOptions): GeneratedChart {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);
    
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data available', options.width / 2, options.height / 2);
    
    const buffer = options.format === 'png' 
      ? canvas.toBuffer('image/png')
      : canvas.toBuffer('image/jpeg', { quality: options.quality || 0.9 });
    
    return {
      type: 'empty',
      data: buffer,
      format: options.format,
      dimensions: { width: options.width, height: options.height },
      metadata: {
        renderTime: Date.now()
      }
    };
  }
}

// Factory function
export function createCanvasReportChartGenerator(): CanvasReportChartGenerator {
  return new CanvasReportChartGenerator();
}