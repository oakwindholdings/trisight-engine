// src/components/Chart/CandlestickRenderer.tsx
// Renders candlestick shapes
// Draws OHLC bars on canvas
import { CandlestickData } from '../../models/ChartTypes';
import { createPriceScale } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import { logDebug } from '../../utils/debug';
import { isNearMissGoldenCandle } from '../../utils/patternQualifiers';

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
  // Chart display options
  isHeikinAshi?: boolean;
  showVolume?: boolean;
  showGrid?: boolean;
}

// Heikin-Ashi specific color scheme for enhanced trend visibility
const HA_COLORS = {
  bullish: {
    fill: 'rgba(34, 197, 94, 0.85)',     // Emerald-500 with opacity
    stroke: '#059669',                    // Emerald-600
    wick: '#059669'
  },
  bearish: {
    fill: 'rgba(239, 68, 68, 0.85)',     // Red-500 with opacity  
    stroke: '#DC2626',                    // Red-600
    wick: '#DC2626'
  },
  doji: {
    fill: 'rgba(107, 114, 128, 0.7)',    // Gray-500 with opacity
    stroke: '#6B7280',                    // Gray-500
    wick: '#6B7280'
  }
} as const;

// Standard OHLC color scheme
const OHLC_COLORS = {
  bullish: {
    fill: 'rgba(67, 160, 71, 0.8)',
    stroke: '#2E7D32',
    wick: '#43A047'
  },
  bearish: {
    fill: 'rgba(229, 57, 53, 0.8)',
    stroke: '#C62828',
    wick: '#E53935'
  }
} as const;

// Implementation with 'Impl' suffix to match declaration in ChartComponents.d.ts
const CandlestickRendererImpl = {
  render(
    ctx: CanvasRenderingContext2D,
    data: CandlestickData[],
    timeScale: ReturnType<typeof createSequentialTimeScale>,
    priceScale: ReturnType<typeof createPriceScale>,
    dimensions: ChartDimensions,
    options?: {
      isHeikinAshi?: boolean;
      showVolume?: boolean;
      showGrid?: boolean;
      goldmineQual?: boolean[]; // Golden Candle indicators
      goldmineForensics?: boolean[]; // Golden Candle forensics overlay
    }
  ) {
    const { isHeikinAshi = false, showVolume = true, showGrid = true, goldmineQual = [], goldmineForensics = [] } = options || {};
    
    logDebug('DEBUG_RENDER_FLOW', '[CandlestickRenderer] Starting render:', {
      dataLength: data.length,
      contextAvailable: !!ctx,
      dimensions,
      isHeikinAshi,
      showVolume,
      showGrid
    });

    if (!ctx || data.length === 0) {
      logDebug('DEBUG_RENDER_FLOW', '[CandlestickRenderer] No context or data, skipping render');
      return;
    }

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
    const volumeHeight = showVolume ? (height - margin.top - margin.bottom) * 0.2 : 0;
    const volumeTop = height - margin.bottom - volumeHeight;
    
    // Find max volume for scaling
    const maxVolume = Math.max(...data.map(d => d.volume));
    
    logDebug('DEBUG_RENDER_FLOW', '[CandlestickRenderer] Drawing candles:', {
      candleWidth,
      totalWidth,
      candleCount,
      maxVolume,
      candleType: isHeikinAshi ? 'Heikin-Ashi' : 'OHLC'
    });

    // Draw grid (light background lines)
    if (showGrid) {
      this.drawGrid(ctx, timeScale, priceScale, dimensions);
    }
    
    let candlesDrawn = 0;
    
    // Draw each candlestick
    data.forEach((candle, index) => {
      const candleX = timeScale.scale(new Date(candle.timestamp));
      const centerX = candleX;
      const left = centerX - (candleWidth / 2);

      // Calculate price points
      const openY = priceScale.scale(candle.open);
      const closeY = priceScale.scale(candle.close);
      const highY = priceScale.scale(candle.high);
      const lowY = priceScale.scale(candle.low);
      
      if (index === 0) {
        logDebug('DEBUG_RENDER_FLOW', '[CandlestickRenderer] First candle position:', {
          candleX,
          openY,
          closeY,
          highY,
          lowY,
          candle,
          isHeikinAshi
        });
      }
      
      const isUp = candle.close >= candle.open;
      const isDoji = Math.abs(candle.close - candle.open) < (candle.high - candle.low) * 0.1;
      
      // Select color scheme based on candle type
      let colors;
      if (isHeikinAshi) {
        if (isDoji) {
          colors = HA_COLORS.doji;
        } else {
          colors = isUp ? HA_COLORS.bullish : HA_COLORS.bearish;
        }
      } else {
        colors = isUp ? OHLC_COLORS.bullish : OHLC_COLORS.bearish;
      }
      
      // Draw candle wick (high to low)
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.strokeStyle = colors.wick;
      ctx.lineWidth = isHeikinAshi ? 1.5 : 1; // Slightly thicker wicks for HA
      ctx.stroke();
      
      // Draw candle body
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      const bodyTop = isUp ? closeY : openY;
      
      ctx.beginPath();
      ctx.rect(left, bodyTop, candleWidth, bodyHeight);
      
      // Fill with proper color and opacity
      ctx.fillStyle = colors.fill;
      ctx.fill();
      
      // Stroke the outline
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isHeikinAshi ? 1.2 : 1; // Slightly thicker outlines for HA
      ctx.stroke();
      
      // Draw Golden Candle stroke if applicable
      if (goldmineQual[index]) {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw forensic overlay if applicable
      if (goldmineForensics[index]) {
        ctx.fillStyle = 'black';
        ctx.fillRect(left, bodyTop, candleWidth, bodyHeight);
      }
      
      // Draw near-miss Golden Candle overlay if applicable
      // DICK O'LEARY COMPLIANCE: Visualize near-miss Golden Candle candidates with black fill
      if (index >= 3) { // Ensure we have enough previous candles for analysis
        const previousCandles = data.slice(Math.max(0, index - 5), index);
        if (isNearMissGoldenCandle(candle, previousCandles)) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent black fill
          ctx.fillRect(left, bodyTop, candleWidth, bodyHeight);
          ctx.strokeRect(left, bodyTop, candleWidth, bodyHeight);
          
          logDebug('DEBUG_GOLDEN_MISS', '[CandlestickRenderer] Near-miss Golden Candle overlay rendered:', {
            candleIndex: index,
            candleClose: candle.close.toFixed(4),
            overlayStyle: 'black fill with 30% opacity',
            dickOLearyCompliant: true
          });
        }
      }
      
      // Draw volume bar (if enabled)
      if (showVolume && volumeHeight > 0) {
        const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
        
        ctx.beginPath();
        ctx.rect(
          left,
          volumeTop + (volumeHeight - volumeBarHeight),
          candleWidth,
          volumeBarHeight
        );
        
        // Fill with the same color as the candle but more transparent
        ctx.fillStyle = isUp 
          ? (isHeikinAshi ? 'rgba(34, 197, 94, 0.4)' : 'rgba(67, 160, 71, 0.5)')
          : (isHeikinAshi ? 'rgba(239, 68, 68, 0.4)' : 'rgba(229, 57, 53, 0.5)');
        ctx.fill();
      }
      
      candlesDrawn++;
    });
    
    logDebug('DEBUG_RENDER_FLOW', `[CandlestickRenderer] Finished rendering ${candlesDrawn} candles`);
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
