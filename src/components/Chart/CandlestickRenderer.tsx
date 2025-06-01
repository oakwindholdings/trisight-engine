// src/components/Chart/CandlestickRenderer.tsx
// Renders candlestick shapes
// Draws OHLC bars on canvas
import { CandlestickData } from '../../models/ChartTypes';
import { createPriceScale } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showingTradingHoursOnly?: boolean;
}

// Implementation with 'Impl' suffix to match declaration in ChartComponents.d.ts
const CandlestickRendererImpl = {
  render(
    ctx: CanvasRenderingContext2D,
    data: CandlestickData[],
    timeScale: ReturnType<typeof createSequentialTimeScale>,
    priceScale: ReturnType<typeof createPriceScale>,
    dimensions: ChartDimensions
  ) {
    if (!ctx || data.length === 0) return;

    const { width, height, margin } = dimensions;
    
    // Calculate candle width based on available space and data points
    const totalWidth = width - margin.left - margin.right;
    const candleCount = data.length;
    
    // Adjust candle width and spacing based on whether we're showing only trading hours
    // When we show only trading hours, we want to eliminate gaps between candles
    const widthRatio = dimensions.showingTradingHoursOnly ? 0.95 : 0.8; 
    const gapRatio = dimensions.showingTradingHoursOnly ? 0.025 : 0.1;
    
    // Calculate the width for each candle (with appropriate gaps based on mode)
    const candleWidth = Math.max(1, (totalWidth / candleCount) * widthRatio);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const candleOffset = (totalWidth / candleCount) * gapRatio; // Gap between candles
    
    // Volume scaling - use bottom 20% of chart for volume
    const volumeHeight = (height - margin.top - margin.bottom) * 0.2;
    const volumeTop = height - margin.bottom - volumeHeight;
    
    // Find max volume for scaling
    const maxVolume = Math.max(...data.map(d => d.volume));
    
    // Draw grid (light background lines)
    this.drawGrid(ctx, timeScale, priceScale, dimensions);
    
    // Draw each candlestick
    data.forEach((candle) => {
      const candleX = timeScale.scale(new Date(candle.timestamp));
      const centerX = candleX;
      const left = centerX - (candleWidth / 2);

      // Calculate price points
      const openY = priceScale.scale(candle.open);
      const closeY = priceScale.scale(candle.close);
      const highY = priceScale.scale(candle.high);
      const lowY = priceScale.scale(candle.low);
      
      const isUp = candle.close >= candle.open;
      
      // Draw candle wick (high to low)
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.strokeStyle = isUp ? '#43A047' : '#E53935';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw candle body
      ctx.beginPath();
      ctx.rect(
        left,
        isUp ? closeY : openY,
        candleWidth,
        Math.max(1, Math.abs(closeY - openY))
      );
      
      // Fill with proper color and opacity
      ctx.fillStyle = isUp ? 'rgba(67, 160, 71, 0.8)' : 'rgba(229, 57, 53, 0.8)';
      ctx.fill();
      
      // Stroke the outline
      ctx.strokeStyle = isUp ? '#2E7D32' : '#C62828';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw volume bar
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      
      ctx.beginPath();
      ctx.rect(
        left,
        volumeTop + (volumeHeight - volumeBarHeight),
        candleWidth,
        volumeBarHeight
      );
      
      // Fill with the same color as the candle but more transparent
      ctx.fillStyle = isUp ? 'rgba(67, 160, 71, 0.5)' : 'rgba(229, 57, 53, 0.5)';
      ctx.fill();
    });
  },
  
  drawGrid(
    ctx: CanvasRenderingContext2D,
    timeScale: ReturnType<typeof createSequentialTimeScale>,
    priceScale: ReturnType<typeof createPriceScale>,
    dimensions: ChartDimensions
  ) {
    const { width, height, margin } = dimensions;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw horizontal price grid lines
    const priceTicks = priceScale.ticks(5);
    priceTicks.forEach(price => {
      const y = priceScale.scale(price);
      
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    });
    
    // Draw vertical time grid lines
    const timeTicks = timeScale.ticks(10);
    timeTicks.forEach((tick) => {
      const x = timeScale.scale(tick);
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    });
    
    // Draw volume section separator
    const volumeTop = height - margin.bottom - ((height - margin.top - margin.bottom) * 0.2);
    
    ctx.beginPath();
    ctx.moveTo(margin.left, volumeTop);
    ctx.lineTo(width - margin.right, volumeTop);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.stroke();
  }
};

// Export directly with the name expected by importers
const CandlestickRenderer = CandlestickRendererImpl;
export default CandlestickRenderer;
