// src/components/Chart/SignalRenderer.tsx
// Canvas-based renderer for TradeActionSignal objects  
// Follows TriSight 5-stage lifecycle: detect → emit → context → render → score
// NOTE: TriSight uses Canvas, not SVG. All signal rendering uses Canvas 2D context methods.

import React from 'react';
import { TradeActionSignal, TradeAction } from '../../utils/trading/TradeActionSignal';
import { CandlestickData } from '../../models/ChartTypes';
import { TimeScaleType, PriceScaleType } from '../Chart/ChartComponents';
import { getSignalValidation } from '../../framework/tradeActionEmitter';

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface SignalRenderSettings {
  showLabels: boolean;
  showIcons: boolean;
  showRiskLevels?: boolean;
  iconSize?: number;
}

/**
 * Main canvas renderer for TradeActionSignal objects
 * Renders signal dots and labels using established TriSight canvas approach
 */
export function renderTradeActionSignals(
  ctx: CanvasRenderingContext2D,
  signals: TradeActionSignal[],
  timeScale: any,
  priceScale: any,
  dimensions: ChartDimensions,
  settings: SignalRenderSettings = { showLabels: true, showIcons: true }
): void {
  if (!signals?.length || (!settings.showLabels && !settings.showIcons)) return;

  ctx.save();

  signals.forEach(signal => {
    const centerX = timeScale.scale(signal.timestamp);
    const centerY = priceScale.scale(signal.price);

    // Skip signals outside viewport (zoom/pan filtering)
    if (
      centerX < dimensions.margin.left ||
      centerX > dimensions.width - dimensions.margin.right ||
      centerY < dimensions.margin.top ||
      centerY > dimensions.height - dimensions.margin.bottom
    ) return;

    // Render signal icon/dot first (background layer)
    if (settings.showIcons) {
      drawSignalDot(ctx, signal, centerX, centerY, settings.iconSize || 4);
    }

    // Render signal label second (foreground layer)
    if (settings.showLabels) {
      drawSignalLabel(ctx, signal, centerX, centerY - 15); // 15px above dot
    }

    // Optional: Render risk level indicator
    if (settings.showRiskLevels && signal.riskLevel) {
      drawRiskIndicator(ctx, signal, centerX, centerY + 15); // 15px below dot
    }
  });

  ctx.restore();
}

/**
 * Helper function to find candle index by timestamp matching
 * Matches signal timestamp to closest candle datetime within ±1 second tolerance
 */
function findCandleIndex(candles: any[], timestamp: Date): number {
  if (!candles?.length || !timestamp) return -1;
  
  const targetTime = new Date(timestamp).getTime();
  const tolerance = 1000; // ±1 second tolerance
  
  // First try exact match
  let exactIndex = candles.findIndex(candle => {
    const candleTime = new Date(candle.datetime || candle.timestamp).getTime();
    return Math.abs(candleTime - targetTime) === 0;
  });
  
  if (exactIndex !== -1) return exactIndex;
  
  // Fall back to closest match within tolerance
  let closestIndex = -1;
  let closestDiff = Infinity;
  
  candles.forEach((candle, index) => {
    const candleTime = new Date(candle.datetime || candle.timestamp).getTime();
    const diff = Math.abs(candleTime - targetTime);
    
    if (diff <= tolerance && diff < closestDiff) {
      closestDiff = diff;
      closestIndex = index;
    }
  });
  
  return closestIndex;
}

/**
 * Renders TradeActionSignal as black candle with left-extending leader line and colored label
 * For qualifying signals, renders the action candle as solid black with directional leader
 */
export function renderSignalCandleAction(
  ctx: CanvasRenderingContext2D,
  signals: TradeActionSignal[],
  candles: any[], // Candlestick data for OHLC values
  timeScale: any,
  priceScale: any,
  dimensions: ChartDimensions,
  confidenceThreshold: number = 0.6 // Only render signals above this confidence
): void {
  if (!signals?.length || !candles?.length) return;

  ctx.save();

  // Filter signals by confidence threshold
  const qualifyingSignals = signals.filter(signal => signal.confidence >= confidenceThreshold);
  
  // Debug logging
  console.log(`[SignalRenderer] Processing ${qualifyingSignals.length} qualifying signals (threshold: ${confidenceThreshold})`);

  qualifyingSignals.forEach((signal, idx) => {
    // Find the corresponding candle by timestamp or index
    let candleIndex = signal.candleIndex;
    
    // If candleIndex is missing or invalid, use timestamp matching
    if (candleIndex === undefined || candleIndex < 0 || candleIndex >= candles.length) {
      candleIndex = findCandleIndex(candles, signal.timestamp);
      console.log(`[SignalRenderer] Signal ${idx}: Using timestamp matching, found candleIndex: ${candleIndex}`);
    }
    
    if (candleIndex === -1 || candleIndex >= candles.length) {
      console.warn(`[SignalRenderer] Signal ${idx}: No matching candle found for timestamp:`, signal.timestamp);
      return; // Skip if no valid candle found
    }

    const candle = candles[candleIndex];
    if (!candle) {
      console.warn(`[SignalRenderer] Signal ${idx}: Candle at index ${candleIndex} is null/undefined`);
      return;
    }

    const centerX = timeScale.scale(signal.timestamp);
    
    // Skip signals outside viewport (zoom/pan filtering)
    if (
      centerX < dimensions.margin.left ||
      centerX > dimensions.width - dimensions.margin.right
    ) {
      console.log(`[SignalRenderer] Signal ${idx}: Outside viewport, centerX=${centerX}`);
      return;
    }

    // Calculate OHLC positions
    const openY = priceScale.scale(candle.open);
    const closeY = priceScale.scale(candle.close);
    const highY = priceScale.scale(candle.high);
    const lowY = priceScale.scale(candle.low);
    
    console.log(`[SignalRenderer] Signal ${idx}: Rendering black candle at x=${centerX}, action=${signal.action}, price=${signal.price}`);

    // Render black candle override
    renderBlackCandle(ctx, centerX, openY, closeY, highY, lowY);

    // Render left-extending leader line with colored label
    renderSignalLeaderLine(ctx, signal, centerX, closeY, timeScale, priceScale, dimensions);
  });

  ctx.restore();
}

/**
 * Draws signal dot/icon using Canvas 2D context
 * Color-coded by TradeAction type
 */
function drawSignalDot(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number,
  radius: number = 4
): void {
  ctx.save();
  
  // Set colors based on TradeAction
  const signalColors = {
    [TradeAction.BUY]: '#10b981',      // Emerald green (entry)
    [TradeAction.SELL]: '#ef4444',     // Red (exit)
    [TradeAction.SHORT]: '#f59e0b',    // Amber orange (short entry)
    [TradeAction.COVER]: '#3b82f6'     // Blue (short exit)
  };

  // Draw outer ring for confidence visualization
  const confidenceRadius = radius + (signal.confidence * 3); // 0-3px confidence ring
  ctx.beginPath();
  ctx.arc(x, y, confidenceRadius, 0, 2 * Math.PI);
  ctx.fillStyle = signalColors[signal.action] + '40'; // 25% opacity ring
  ctx.fill();

  // Draw main signal dot
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = signalColors[signal.action];
  ctx.fill();

  // Add white border for visibility
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws signal label with validation flags for ENTRY signals
 * Shows BUY/SHORT entry points with VALID/LATE validation flags
 */
function drawSignalLabel(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number
): void {
  ctx.save();
  
  // 🔴 CRITICAL FIX: Get validation result for this ENTRY signal
  const validationResult = getSignalValidation(signal);
  const validationFlag = validationResult?.validationFlag || '🟢 VALID';
  const isLateSignal = validationResult?.validationFlag === '🔴 LATE';
  
  // Set font and alignment properties
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Generate ENTRY signal label text (price + action)
  const text = `${signal.action} ${signal.price.toFixed(2)}`;
  
  // Dynamic text measurement
  const textWidth = ctx.measureText(text).width;
  const labelWidth = Math.max(textWidth + 16, 80); // Minimum width
  const labelHeight = 24;
  const labelX = x - labelWidth / 2;
  const labelY = y - labelHeight / 2;
  
  // Background color based on action (dimmed if LATE)
  const baseColors = {
    [TradeAction.BUY]: '#10b981',     // Green for BUY
    [TradeAction.SHORT]: '#ef4444',   // Red for SHORT
    [TradeAction.SELL]: '#ef4444',    // Red for SELL (exit)
    [TradeAction.COVER]: '#10b981'    // Green for COVER (exit)
  };
  
  const baseColor = baseColors[signal.action];
  const labelColor = isLateSignal ? baseColor + '60' : baseColor; // Add transparency for LATE
  
  // Draw label background
  ctx.fillStyle = labelColor;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  
  // Draw label border (red for LATE signals)
  ctx.strokeStyle = isLateSignal ? '#ef4444' : '#ffffff';
  ctx.lineWidth = isLateSignal ? 2 : 1;
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  
  // Draw label text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  
  // 🟢🔴 Draw validation flag ABOVE the label
  if (validationResult) {
    const flagY = labelY - 18;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = isLateSignal ? '#ef4444' : '#10b981';
    ctx.fillText(validationFlag, x, flagY);
    
    // Add issue text for LATE signals
    if (validationResult.issues.length > 0 && isLateSignal) {
      const issueText = validationResult.issues[0].substring(0, 30) + '...'; // Truncate
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(issueText, x, flagY - 14);
    }
  }
  
  ctx.restore();
}

/**
 * Draws risk level indicator below signal dot
 * Optional enhancement for risk-aware visualization
 */
function drawRiskIndicator(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number
): void {
  if (!signal.riskLevel) return;
  
  ctx.save();
  
  const riskColors = {
    'LOW': '#10b981',     // Green
    'MEDIUM': '#f59e0b',  // Amber
    'HIGH': '#ef4444'     // Red
  };
  
  const riskSymbols = {
    'LOW': '●',
    'MEDIUM': '◐', 
    'HIGH': '●'
  };
  
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = riskColors[signal.riskLevel];
  ctx.fillText(riskSymbols[signal.riskLevel], x, y);
  
  ctx.restore();
}

/**
 * Helper function to filter signals by visible time range
 * Can be used by calling components to optimize rendering
 */
export function filterVisibleSignals(
  signals: TradeActionSignal[],
  visibleStartTime: Date,
  visibleEndTime: Date
): TradeActionSignal[] {
  return signals.filter(signal => 
    signal.timestamp >= visibleStartTime && 
    signal.timestamp <= visibleEndTime
  );
}

/**
 * Signal rendering configuration presets
 */
export const SignalRenderPresets: Record<string, SignalRenderSettings> = {
  minimal: { showLabels: false, showIcons: true, iconSize: 3 },
  standard: { showLabels: true, showIcons: true, iconSize: 4 },
  detailed: { showLabels: true, showIcons: true, showRiskLevels: true, iconSize: 5 }
};

/**
 * Renders a solid black candle at the signal location
 * Overrides normal OHLC coloring to indicate action candle
 */
function renderBlackCandle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  openY: number,
  closeY: number,
  highY: number,
  lowY: number,
  candleWidth: number = 8
): void {
  ctx.save();
  
  // Draw high-low line (wick)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, highY);
  ctx.lineTo(centerX, lowY);
  ctx.stroke();
  
  // Draw body (solid black rectangle)
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  const halfWidth = candleWidth / 2;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(centerX - halfWidth, bodyTop, candleWidth, bodyHeight);
  
  // Add white border for visibility
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - halfWidth, bodyTop, candleWidth, bodyHeight);
  
  ctx.restore();
}

/**
 * Renders leader line extending to the left with directional arrow and colored label
 */
function renderSignalLeaderLine(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  candleX: number,
  candleY: number,
  timeScale: any,
  priceScale: any,
  dimensions: ChartDimensions
): void {
  ctx.save();
  
  // Determine line direction and color based on action
  const isUpward = signal.action === TradeAction.BUY || signal.action === TradeAction.COVER;
  const lineLength = 60; // Fixed leader line length
  const labelOffset = 10; // Additional offset for label
  
  // Calculate leader line end point
  const startX = candleX - 15; // Start 15px left of candle center
  const startY = candleY;
  const endX = startX - lineLength;
  const endY = startY + (isUpward ? -30 : 30); // 30px up/down
  
  // Set line color based on action
  const lineColors = {
    [TradeAction.BUY]: '#10b981',      // Green
    [TradeAction.SELL]: '#ef4444',     // Red
    [TradeAction.SHORT]: '#f59e0b',    // Orange
    [TradeAction.COVER]: '#3b82f6'     // Blue
  };
  
  ctx.strokeStyle = lineColors[signal.action];
  ctx.lineWidth = 2;
  
  // Draw leader line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw arrowhead at end of line
  const arrowSize = 6;
  ctx.fillStyle = lineColors[signal.action];
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  
  if (isUpward) {
    // Arrow pointing up
    ctx.lineTo(endX - arrowSize, endY + arrowSize);
    ctx.lineTo(endX + arrowSize, endY + arrowSize);
  } else {
    // Arrow pointing down
    ctx.lineTo(endX - arrowSize, endY - arrowSize);
    ctx.lineTo(endX + arrowSize, endY - arrowSize);
  }
  ctx.closePath();
  ctx.fill();
  
  // Render colored label box at end of leader line
  renderActionLabel(ctx, signal, endX - labelOffset, endY);
  
  ctx.restore();
}

/**
 * Renders colored label box with action and price information
 */
function renderActionLabel(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number
): void {
  ctx.save();
  
  // Generate label text
  const text = `${signal.action} NOW @ $${signal.price.toFixed(2)}`;
  
  // Set font and measure text
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right'; // Right-align since extending left
  ctx.textBaseline = 'middle';
  
  const textWidth = ctx.measureText(text).width;
  const padX = 8, padY = 4;
  
  // Get validation result for this signal
  const validationResult = getSignalValidation(signal);
  const validationFlag = validationResult?.validationFlag || '🟢 VALID';
  const isLateSignal = validationResult?.validationFlag === '🔴 LATE';
  
  // Set background color based on action
  const labelColors = {
    [TradeAction.BUY]: '#10b981',      // Green
    [TradeAction.SELL]: '#ef4444',     // Red
    [TradeAction.SHORT]: '#f59e0b',    // Orange
    [TradeAction.COVER]: '#3b82f6'     // Blue
  };
  
  // Draw colored action label at end of leader line
  const labelWidth = 80;
  const labelHeight = 24;
  const labelX = x - labelWidth / 2;
  const labelY = y - labelHeight / 2;
  
  // Label background with action-specific colors (dimmed if LATE)
  const baseColor = labelColors[signal.action];
  const labelColor = isLateSignal ? baseColor + '80' : baseColor; // Add transparency for LATE signals
  ctx.fillStyle = labelColor;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  
  // Label border (red for LATE signals)
  ctx.strokeStyle = isLateSignal ? '#ef4444' : '#ffffff';
  ctx.lineWidth = isLateSignal ? 2 : 1;
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  
  // Label text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const labelText = `${signal.action} ${signal.price.toFixed(2)}`;
  ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
  
  // Draw validation flag above the label
  if (validationResult) {
    const flagY = labelY - 16;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = isLateSignal ? '#ef4444' : '#10b981';
    ctx.textAlign = 'center';
    ctx.fillText(validationFlag, labelX + labelWidth / 2, flagY);
    
    // Add debug info if validation has issues
    if (validationResult.issues.length > 0 && isLateSignal) {
      const issueText = validationResult.issues[0]; // Show first issue
      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(issueText, labelX + labelWidth / 2, flagY - 12);
    }
  }
  
  ctx.restore();
}

// ... (rest of the code remains the same)
