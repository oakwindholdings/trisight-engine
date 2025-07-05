// src/components/Chart/SignalRenderer.tsx
// Canvas-based renderer for TradeActionSignal objects  
// Follows TriSight 5-stage lifecycle: detect → emit → context → render → score
// NOTE: TriSight uses Canvas, not SVG. All signal rendering uses Canvas 2D context methods.
// SUPPORTED SIGNAL TYPES: BUY, SELL, SHORT, COVER, TRADE_BIAS
// SUPPORTED BIAS TYPES: BIAS_LONG, BIAS_SHORT
// BIAS signals modulate the opacity/color intensity of underlying trade signals

import React from 'react';
import { TradeActionSignal, TradeAction, SignalType } from '../../utils/trading/TradeActionSignal';
import { CandlestickData } from '../../models/ChartTypes';
import { TimeScaleType, PriceScaleType } from '../Chart/ChartComponents';
import { getSignalValidation } from '../../framework/tradeActionEmitter';
import { stopExitTraceAnalyzer } from '../../utils/audit/StopExitTraceAnalyzer';
import { SignalFidelityValidator, FIDELITY_MODE_SETTINGS } from '../../utils/signalFidelityPatch';

/**
 * Find BIAS signal that correlates with a trade signal
 * BIAS signals modulate the opacity/color intensity of trade signals
 */
function findCorrelatedBiasSignal(tradeSignal: TradeActionSignal, allSignals: TradeActionSignal[]): TradeActionSignal | null {
  // Look for BIAS signals with same timestamp, pattern, and compatible direction
  return allSignals.find(signal => {
    if (signal.action !== TradeAction.TRADE_BIAS) return false;
    
    // Same timestamp and pattern
    if (signal.timestamp.getTime() !== tradeSignal.timestamp.getTime()) return false;
    if (signal.pattern !== tradeSignal.pattern) return false;
    
    // Compatible direction
    const isLongBias = signal.signalType === SignalType.BIAS_LONG;
    const isBuyAction = tradeSignal.action === TradeAction.BUY || tradeSignal.action === TradeAction.COVER;
    const isShortAction = tradeSignal.action === TradeAction.SHORT || tradeSignal.action === TradeAction.SELL;
    
    return (isLongBias && isBuyAction) || (!isLongBias && isShortAction);
  }) || null;
}

/**
 * Calculate color with BIAS-modulated opacity
 * BIAS confidence (0-1) modulates color intensity: 1.0 = full color, 0.1 = very light
 */
function modulateColorWithBias(baseColor: string, biasSignal: TradeActionSignal | null): string {
  if (!biasSignal) return baseColor;
  
  // Use BIAS confidence to modulate opacity (0.1 to 1.0)
  const intensity = Math.max(0.1, Math.min(1.0, biasSignal.confidence));
  
  // Convert hex to RGB and apply intensity
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Blend with white based on intensity (lower intensity = more white)
  const blendedR = Math.round(r * intensity + 255 * (1 - intensity));
  const blendedG = Math.round(g * intensity + 255 * (1 - intensity));
  const blendedB = Math.round(b * intensity + 255 * (1 - intensity));
  
  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

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
  fidelityMode?: boolean; // Enable signal fidelity mode
}

/**
 * Main canvas renderer for TradeActionSignal objects
 * Renders signal dots and labels using established TriSight canvas approach
 * BIAS signals modulate the opacity/color intensity of trade signal labels
 */
export function renderTradeActionSignals(
  ctx: CanvasRenderingContext2D,
  signals: TradeActionSignal[],
  timeScale: any,
  priceScale: any,
  dimensions: ChartDimensions,
  settings: SignalRenderSettings = { showLabels: true, showIcons: true, fidelityMode: true }
): void {
  // Signal Fidelity Mode: Apply fidelity filtering
  const fidelitySettings = settings.fidelityMode ? FIDELITY_MODE_SETTINGS : null;
  
  if (!signals?.length || (!settings.showLabels && !settings.showIcons)) return;

  ctx.save();

  signals.forEach(signal => {
    const centerX = timeScale.scale(signal.timestamp);
    const centerY = priceScale.scale(signal.price);

    // STOP_EXIT signals: ALWAYS render regardless of viewport or fidelity mode
    const isStopExitSignal = signal.action === TradeAction.SELL || signal.action === TradeAction.COVER;
    
    // 🗺️ COORDINATE DEBUG: Track X positioning for STOP_EXIT signals
    if (isStopExitSignal) {
      console.log("🗺️ [COORDINATE_DEBUG] STOP_EXIT positioning", {
        action: signal.action,
        pattern: signal.pattern,
        price: signal.price.toFixed(4),
        timestamp: signal.timestamp.toISOString(),
        calculatedX: centerX.toFixed(2),
        calculatedY: centerY.toFixed(2),
        chartDimensions: {
          width: dimensions.width,
          height: dimensions.height,
          marginLeft: dimensions.margin.left,
          marginRight: dimensions.margin.right
        },
        isOffCanvas: centerX < dimensions.margin.left || centerX > dimensions.width - dimensions.margin.right
      });
    }
    
    // Skip signals outside viewport (zoom/pan filtering) - BUT NOT STOP_EXIT signals
    if (!isStopExitSignal && (
      centerX < dimensions.margin.left ||
      centerX > dimensions.width - dimensions.margin.right ||
      centerY < dimensions.margin.top ||
      centerY > dimensions.height - dimensions.margin.bottom
    )) {
      console.log(`[VIEWPORT_FILTER] Skipping non-STOP_EXIT signal outside viewport: ${signal.action}`);
      return;
    }
    
    // Log STOP_EXIT signals that bypass viewport filtering
    if (isStopExitSignal) {
      console.log(`🚨 [STOP_EXIT_BYPASS] STOP_EXIT signal rendered regardless of viewport: ${signal.action} at ${signal.price}`);
    }

    // Signal Fidelity Mode: Check if signal should be rendered (BUT NOT for STOP_EXIT)
    if (!isStopExitSignal && fidelitySettings && !SignalFidelityValidator.shouldRenderSignal(signal, fidelitySettings)) {
      return; // Skip this signal in fidelity mode
    }

    // Render signal icon/dot first (background layer)
    if (settings.showIcons) {
      drawSignalDot(ctx, signal, centerX, centerY, settings.iconSize || 4);
    }

    // Render signal label second (foreground layer)
    if (settings.showLabels) {
      const labelOptions = {
        dashed: signal.action === TradeAction.TRADE_BIAS,
        size: signal.action === TradeAction.TRADE_BIAS ? 'small' as const : 'normal' as const,
        confidence: signal.confidence
      };
      drawSignalLabel(ctx, signal, centerX, centerY - 15, labelOptions, signals); // Pass signals array for BIAS correlation
      
      // 🔍 AUDIT: Record STOP_EXIT render trace
      if (signal.action === TradeAction.SELL || signal.action === TradeAction.COVER) {
        const signalId = `${signal.pattern}_${signal.timestamp.getTime()}_${signal.price.toFixed(4)}`;
        stopExitTraceAnalyzer.recordRender(
          signalId,
          true, // labelVisible
          true, // isRendered
          { x: centerX, y: centerY }
        );
        
        // 🕐 RENDER TIMING DEBUG: Track when and why STOP_EXIT labels are being rendered
        const renderTimestamp = performance.now();
        console.log("⏰ [RENDER_TIMING] STOP_EXIT", {
          action: signal.action,
          price: signal.price.toFixed(4),
          pattern: signal.pattern,
          timestamp: renderTimestamp.toFixed(2) + 'ms',
          canvasSize: { width: ctx.canvas.width, height: ctx.canvas.height },
          renderCall: 'renderTradeActionSignals',
          stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' -> ') || 'unknown'
        });
      }
    }

    // Optional: Render risk level indicator
    if (settings.showRiskLevels && signal.riskLevel) {
      drawRiskIndicator(ctx, signal, centerX, centerY + 15); // 15px below dot
    }
  });

  ctx.restore();
}

/**
 * Deduplicate STOP_EXIT signals by timestamp and price to prevent occlusion
 */
function deduplicateStopExitSignals(signals: TradeActionSignal[]): {
  exitSignals: Map<string, { signals: TradeActionSignal[], sellCount: number, coverCount: number }>;
  otherSignals: TradeActionSignal[];
} {
  const exitSignals = new Map<string, { signals: TradeActionSignal[], sellCount: number, coverCount: number }>();
  const otherSignals: TradeActionSignal[] = [];
  
  signals.forEach(signal => {
    if (signal.action === TradeAction.SELL || signal.action === TradeAction.COVER) {
      // Create a unique key for timestamp + price combination
      const key = `${signal.timestamp.getTime()}_${signal.price.toFixed(4)}`;
      
      if (!exitSignals.has(key)) {
        exitSignals.set(key, { signals: [], sellCount: 0, coverCount: 0 });
      }
      
      const group = exitSignals.get(key)!;
      group.signals.push(signal);
      
      if (signal.action === TradeAction.SELL) {
        group.sellCount++;
      } else {
        group.coverCount++;
      }
    } else {
      otherSignals.push(signal);
    }
  });
  
  return { exitSignals, otherSignals };
}

/**
 * Render consolidated STOP_EXIT label with count
 */
function renderConsolidatedStopExitLabel(
  ctx: CanvasRenderingContext2D,
  signals: TradeActionSignal[],
  sellCount: number,
  coverCount: number,
  centerX: number,
  centerY: number
): void {
  ctx.save();
  
  // Determine label text based on signal counts
  let labelText = "";
  if (sellCount > 0 && coverCount > 0) {
    labelText = `SELL(${sellCount}) COVER(${coverCount})`;
  } else if (sellCount > 0) {
    labelText = sellCount === 1 ? "SELL" : `SELL(${sellCount})`;
  } else if (coverCount > 0) {
    labelText = coverCount === 1 ? "COVER" : `COVER(${coverCount})`;
  }
  
  // Calculate label dimensions based on text length
  const labelWidth = Math.max(60, labelText.length * 8); // Dynamic width
  const labelHeight = 20;
  const labelX = centerX - labelWidth / 2;
  const labelY = centerY - 40; // Position above the signal dot
  
  // Red background
  ctx.fillStyle = '#ef4444'; // Red color
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  
  // White border for visibility
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  
  // White text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw the consolidated label
  ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
  
  // Draw price below the label
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText(signals[0].price.toFixed(2), labelX + labelWidth / 2, labelY + labelHeight + 12);
  
  ctx.restore();
  
  console.log("[LABEL_RENDER] CONSOLIDATED_STOP_EXIT", labelText, signals[0].price, `Total: ${signals.length}`);
}

export function renderSignals(
  ctx: CanvasRenderingContext2D,
  signals: TradeActionSignal[],
  dimensions: ChartDimensions,
  timeScale: (timestamp: Date) => number,
  priceScale: (price: number) => number,
  settings: SignalRenderSettings = { showLabels: true, showIcons: true, fidelityMode: true },
  fidelitySettings?: any
): void {
  if (!signals || signals.length === 0) return;
  
  // Define color mapping for signal types
  const colorMap = {
    [TradeAction.BUY]: '#10b981',     // Green
    [TradeAction.SHORT]: '#f59e0b',   // Orange
    [TradeAction.SELL]: '#ef4444',    // Red
    [TradeAction.COVER]: '#ef4444',   // Red
    [TradeAction.TRADE_BIAS]: '#6b7280' // Gray
  };

  // Deduplicate STOP_EXIT signals to prevent occlusion
  const { exitSignals, otherSignals } = deduplicateStopExitSignals(signals);
  
  console.log("[SIGNAL_DEDUP] Stop-exit signal consolidation:", {
    totalSignals: signals.length,
    uniqueExitGroups: exitSignals.size,
    otherSignals: otherSignals.length,
    consolidatedExitSignals: Array.from(exitSignals.values()).reduce((total, group) => total + group.signals.length, 0)
  });

  // Render non-STOP_EXIT signals normally
  otherSignals.forEach(signal => {
    const timestamp = new Date(signal.timestamp);
    const centerX = timeScale(timestamp);
    const centerY = priceScale(signal.price);
    
    // Skip if outside visible area
    if (
      centerX < dimensions.margin.left ||
      centerX > dimensions.width - dimensions.margin.right ||
      centerY < dimensions.margin.top ||
      centerY > dimensions.height - dimensions.margin.bottom
    ) return;

    // Signal Fidelity Mode: Check if signal should be rendered
    if (fidelitySettings && !SignalFidelityValidator.shouldRenderSignal(signal, fidelitySettings)) {
      return; // Skip this signal in fidelity mode
    }

    // Render signal icon/dot first (background layer)
    if (settings.showIcons) {
      drawSignalDot(ctx, signal, centerX, centerY, settings.iconSize || 4);
    }

    // Render signal label second (foreground layer)
    if (settings.showLabels) {
      const labelOptions = {
        dashed: signal.action === TradeAction.TRADE_BIAS,
        size: signal.action === TradeAction.TRADE_BIAS ? 'small' as const : 'normal' as const,
        confidence: signal.confidence
      };
      drawSignalLabel(ctx, signal, centerX, centerY - 15, labelOptions, signals); // Pass signals array for BIAS correlation
    }

    // Optional: Render risk level indicator
    if (settings.showRiskLevels && signal.riskLevel) {
      drawRiskIndicator(ctx, signal, centerX, centerY + 15); // 15px below dot
    }
  });
  
  // Render consolidated STOP_EXIT signals
  exitSignals.forEach((group, key) => {
    const firstSignal = group.signals[0];
    const timestamp = new Date(firstSignal.timestamp);
    const centerX = timeScale(timestamp);
    const centerY = priceScale(firstSignal.price);
    
    // Signal Fidelity Mode: Override viewport filtering for STOP_EXIT signals
    const isFidelityMode = (window as any).signalFidelityPatch?.isFidelityModeOn?.() || false;
    
    // Skip if outside visible area (but bypass this check in fidelity mode)
    if (!isFidelityMode && (
      centerX < dimensions.margin.left ||
      centerX > dimensions.width - dimensions.margin.right ||
      centerY < dimensions.margin.top ||
      centerY > dimensions.height - dimensions.margin.bottom
    )) {
      console.log("[ZOOM_FILTER] STOP_EXIT signal outside viewport, but fidelity mode OFF, skipping", {
        centerX, centerY, timestamp, price: firstSignal.price
      });
      return;
    }
    
    // Log fidelity mode bypass for STOP_EXIT signals
    if (isFidelityMode) {
      console.log("[ZOOM_FILTER] STOP_EXIT signal rendered (fidelity mode bypass)", {
        centerX, centerY, timestamp, price: firstSignal.price, signalCount: group.signals.length
      });
    }

    // Signal Fidelity Mode: Check if signal should be rendered
    if (fidelitySettings && !SignalFidelityValidator.shouldRenderSignal(firstSignal, fidelitySettings)) {
      return; // Skip this signal in fidelity mode
    }

    // Render signal icon/dot first (background layer)
    if (settings.showIcons) {
      drawSignalDot(ctx, firstSignal, centerX, centerY, settings.iconSize || 4);
    }

    // 🚫 DISABLED: Prevent duplicate STOP_EXIT rendering
    // renderTradeActionSignals() already handles STOP_EXIT signals with correct large labels
    // This renderConsolidatedStopExitLabel() was overwriting them with tiny labels
    // renderConsolidatedStopExitLabel(
    //   ctx,
    //   group.signals,
    //   group.sellCount,
    //   group.coverCount,
    //   centerX,
    //   centerY
    // );
    
    console.log("🚫 [DUPLICATE_PREVENTION] Skipping renderConsolidatedStopExitLabel to prevent overwriting correct STOP_EXIT labels", {
      signalCount: group.signals.length,
      sellCount: group.sellCount,
      coverCount: group.coverCount,
      centerX: centerX.toFixed(2),
      centerY: centerY.toFixed(2)
    });
    
    // 🔍 AUDIT: Record STOP_EXIT render trace for consolidated signals
    group.signals.forEach(signal => {
      const signalId = `${signal.pattern}_${signal.timestamp.getTime()}_${signal.price.toFixed(4)}`;
      stopExitTraceAnalyzer.recordRender(
        signalId,
        true, // labelVisible
        true, // isRendered
        { x: centerX, y: centerY }
      );
    });

    // Optional: Render risk level indicator
    if (settings.showRiskLevels && firstSignal.riskLevel) {
      drawRiskIndicator(ctx, firstSignal, centerX, centerY + 15); // 15px below dot
    }
  });
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
    [TradeAction.COVER]: '#3b82f6',    // Blue (short exit)
    [TradeAction.TRADE_BIAS]: '#8b5cf6' // Purple (non-executional bias)
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
 * BIAS signals modulate the opacity/color intensity of trade signal labels
 * STOP_EXIT signals (SELL/COVER) get special large red label treatment
 */
function drawSignalLabel(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number,
  options: { dashed?: boolean, size?: 'small' | 'normal', confidence?: number } = {},
  allSignals: TradeActionSignal[] = []
): void {
  ctx.save();
  
  // BIAS signals should not render as separate labels - they modulate underlying signal appearance
  if (signal.action === TradeAction.TRADE_BIAS) {
    // Skip rendering BIAS signals directly - they are handled through opacity modulation
    ctx.restore();
    return;
  }
  
  // STOP_EXIT signals (SELL/COVER) get special large red label treatment
  const isStopExitSignal = signal.action === TradeAction.SELL || signal.action === TradeAction.COVER;
  
  if (isStopExitSignal) {
    // 🔒 AGGRESSIVE CONTEXT ISOLATION: Save and completely reset canvas state
    ctx.save();
    
    // Reset ALL canvas properties to prevent state corruption
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // Draw large, prominent red label for STOP_EXIT signals
    const labelText = signal.action === TradeAction.SELL ? "SELL" : "COVER";
    
    // Large label dimensions for readability
    const labelWidth = 90;
    const labelHeight = 30;
    const labelX = x - labelWidth / 2;
    const labelY = y - 50; // Position higher above the signal dot
    
    // 🔍 DEBUG: Log canvas coordinates and state
    console.log("🎯 [STOP_EXIT CANVAS DEBUG]", {
      labelText,
      pattern: signal.pattern,
      price: signal.price.toFixed(4),
      canvasCoordinates: { x: x.toFixed(2), y: y.toFixed(2) },
      labelPosition: { labelX: labelX.toFixed(2), labelY: labelY.toFixed(2) },
      labelDimensions: { width: labelWidth, height: labelHeight },
      canvasState: {
        fillStyle: ctx.fillStyle,
        strokeStyle: ctx.strokeStyle,
        font: ctx.font,
        globalAlpha: ctx.globalAlpha,
        globalCompositeOperation: ctx.globalCompositeOperation
      }
    });
    
    // 🔴 FORCE CANVAS PROPERTIES: Aggressively set all required styles
    ctx.fillStyle = '#dc2626'; // Darker red for better contrast
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    
    // White border for visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
    
    // 🔥 FORCE TEXT PROPERTIES: Aggressively override all text settings
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the SELL/COVER label
    ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
    
    // Draw price below the label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(signal.price.toFixed(2), labelX + labelWidth / 2, labelY + labelHeight + 15);
    
    // 🔍 DEBUG: Verify drawing actually occurred
    console.log("✅ [STOP_EXIT DRAWING COMPLETE]", {
      labelText,
      finalCoordinates: {
        rectX: labelX.toFixed(2),
        rectY: labelY.toFixed(2),
        textX: (labelX + labelWidth / 2).toFixed(2),
        textY: (labelY + labelHeight / 2).toFixed(2)
      },
      finalCanvasState: {
        fillStyle: ctx.fillStyle,
        font: ctx.font,
        globalAlpha: ctx.globalAlpha
      }
    });
    
    // 🔒 RESTORE ORIGINAL CONTEXT: Prevent corruption of subsequent draws
    ctx.restore();
    return;
  }
  
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
  
  // Find correlated BIAS signal for color modulation
  const correlatedBias = findCorrelatedBiasSignal(signal, allSignals);
  
  // Background color based on action (dimmed if LATE)
  const baseColors = {
    [TradeAction.BUY]: '#10b981',     // Green for BUY
    [TradeAction.SHORT]: '#ef4444',   // Red for SHORT
    [TradeAction.SELL]: '#ef4444',    // Red for SELL (exit)
    [TradeAction.COVER]: '#10b981',   // Green for COVER (exit)
    [TradeAction.TRADE_BIAS]: '#8b5cf6' // Purple for TRADE_BIAS
  };
  
  const baseColor = baseColors[signal.action];
  // Apply BIAS modulation to the base color
  const biasModulatedColor = modulateColorWithBias(baseColor, correlatedBias);
  const labelColor = isLateSignal ? biasModulatedColor + '60' : biasModulatedColor; // Add transparency for LATE
  
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
  
  // 🟢🔴 Draw validation flag ABOVE the label - DISABLED FOR READABILITY
  // The validation flag overlay (BIAS | XX%) was making labels unreadable
  // Only show validation flags for LATE signals as critical alerts
  if (validationResult && isLateSignal) {
    const flagY = labelY - 18;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('🔴 LATE', x, flagY);
    
    // Add issue text for LATE signals
    if (validationResult.issues.length > 0) {
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
 * SIGNAL FIDELITY MODE: Bypasses viewport filtering when fidelity mode is ON
 */
export function filterVisibleSignals(
  signals: TradeActionSignal[],
  visibleStartTime: Date,
  visibleEndTime: Date
): TradeActionSignal[] {
  // Signal Fidelity Mode: Bypass zoom-bound signal culling
  if ((window as any).signalFidelityPatch?.isFidelityModeOn?.()) {
    console.log("[ZOOM_FILTER] Fidelity mode ON — showing all signals.", {
      totalSignals: signals.length,
      visibleTimeRange: {
        start: visibleStartTime.toISOString(),
        end: visibleEndTime.toISOString()
      },
      bypassedViewportFiltering: true
    });
    return signals;
  }
  
  // Normal viewport filtering when fidelity mode is OFF
  // BUT ALWAYS show STOP_EXIT signals regardless of zoom
  const filteredSignals = signals.filter(signal => {
    // ALWAYS show STOP_EXIT signals (SELL/COVER) regardless of zoom
    if (signal.action === 'SELL' || signal.action === 'COVER') {
      return true;
    }
    
    // Normal viewport filtering for other signals
    return signal.timestamp >= visibleStartTime && 
           signal.timestamp <= visibleEndTime;
  });
  
  const stopExitCount = signals.filter(s => s.action === 'SELL' || s.action === 'COVER').length;
  
  console.log("[ZOOM_FILTER] Normal viewport filtering with STOP_EXIT persistence:", {
    totalSignals: signals.length,
    visibleSignals: filteredSignals.length,
    stopExitSignalsAlwaysVisible: stopExitCount,
    visibleTimeRange: {
      start: visibleStartTime.toISOString(),
      end: visibleEndTime.toISOString()
    },
    fidelityModeEnabled: false
  });
  
  return filteredSignals;
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
    [TradeAction.COVER]: '#3b82f6',    // Blue
    [TradeAction.TRADE_BIAS]: '#8b5cf6' // Purple
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
 * Enhanced to support TRADE_BIAS signals with directional arrows and confidence
 * 🎯 CRITICAL: Renders STOP_EXIT labels at the end of TRADE_BIAS leader lines
 */
function renderActionLabel(
  ctx: CanvasRenderingContext2D,
  signal: TradeActionSignal,
  x: number,
  y: number
): void {
  ctx.save();
  
  // 🎯 CRITICAL FIX: For TRADE_BIAS signals, render the corresponding STOP_EXIT label
  if (signal.action === TradeAction.TRADE_BIAS) {
    // Find the corresponding STOP_EXIT signal (SELL/COVER) that this BIAS signal is for
    // For now, render a generic STOP_EXIT label - this will be enhanced to find the actual signal
    const stopExitAction = signal.signalType === SignalType.BIAS_LONG ? 'SELL' : 'COVER';
    const labelText = `${stopExitAction} ${signal.price.toFixed(2)} ${Math.round(signal.confidence * 100)}%`;
    
    // Set font and measure text
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textWidth = ctx.measureText(labelText).width;
    const labelWidth = Math.max(textWidth + 16, 120); // Minimum width for STOP_EXIT labels
    const labelHeight = 28;
    const labelX = x - labelWidth / 2;
    const labelY = y - labelHeight / 2;
    
    // 🎯 BIAS-MODULATED BACKGROUND: Use logarithmic scaling for better visual separation
    const baseColor = stopExitAction === 'SELL' ? '#ef4444' : '#3b82f6'; // Red for SELL, Blue for COVER
    
    // Logarithmic scaling: Map actual data range (0.6-1.0) to intensity (0.15-1.0)
    const minConfidence = 0.6; // Actual minimum in data
    const maxConfidence = 1.0; // Actual maximum in data
    const minIntensity = 0.15; // Barely visible
    const maxIntensity = 1.0;  // Full intensity
    
    // Normalize confidence to 0-1 range within actual data bounds
    const normalizedConfidence = Math.max(0, Math.min(1, 
      (signal.confidence - minConfidence) / (maxConfidence - minConfidence)
    ));
    
    // Apply steep logarithmic curve: log(1 + 9*x) / log(10)
    // This creates dramatic separation where high confidence really stands out
    const logScaled = Math.log(1 + 9 * normalizedConfidence) / Math.log(10);
    
    // Map to intensity range
    const intensity = minIntensity + (maxIntensity - minIntensity) * logScaled;
    
    // Convert to RGB and apply intensity
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Apply intensity modulation
    const modulatedColor = `rgba(${r}, ${g}, ${b}, ${intensity})`;
    
    // Draw BIAS-modulated background
    ctx.fillStyle = modulatedColor;
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    
    // White border for visibility
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
    
    // Draw label text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
    
    console.log("🎯 [STOP_EXIT_LEADER_LABEL] Rendered STOP_EXIT label at end of TRADE_BIAS leader line", {
      labelText,
      biasConfidence: signal.confidence,
      intensity,
      coordinates: { x: labelX, y: labelY },
      modulatedColor
    });
    
    ctx.restore();
    return;
  }
  
  // Generate label text for execution signals
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
    [TradeAction.COVER]: '#3b82f6',    // Blue
    [TradeAction.TRADE_BIAS]: '#8b5cf6' // Purple
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

/**
 * Gets hover tooltip text for TradeActionSignal
 * Enhanced to support TRADE_BIAS signals with confidence and direction
 */
export function getSignalTooltip(signal: TradeActionSignal): string {
  if (signal.action === TradeAction.TRADE_BIAS) {
    const biasDirection = signal.signalType === SignalType.BIAS_LONG ? 'LONG' : 'SHORT';
    const confidenceText = signal.confidence ? ` (${Math.round(signal.confidence * 100)}% confidence)` : '';
    return `Bias: ${biasDirection}${confidenceText}`;
  }
  
  // For execution signals
  const confidenceText = signal.confidence ? ` (${Math.round(signal.confidence * 100)}% confidence)` : '';
  return `${signal.action}: ${signal.price.toFixed(4)}${confidenceText}`;
}

/**
 * Checks if a point is within signal hit area for hover detection
 * Returns true if the point (mouseX, mouseY) is within signal bounds
 */
export function isPointInSignal(
  signal: TradeActionSignal,
  mouseX: number,
  mouseY: number,
  timeScale: any,
  priceScale: any,
  hitRadius: number = 8
): boolean {
  const signalX = timeScale.scale(signal.timestamp);
  const signalY = priceScale.scale(signal.price);
  
  const distance = Math.sqrt(
    Math.pow(mouseX - signalX, 2) + Math.pow(mouseY - signalY, 2)
  );
  
  return distance <= hitRadius;
}

/**
 * Gets the signal at a specific point for hover interactions
 * Returns the signal if found, null otherwise
 */
export function getSignalAtPoint(
  signals: TradeActionSignal[],
  mouseX: number,
  mouseY: number,
  timeScale: any,
  priceScale: any,
  hitRadius: number = 8
): TradeActionSignal | null {
  // Check signals in reverse order (latest first) for proper layering
  for (let i = signals.length - 1; i >= 0; i--) {
    const signal = signals[i];
    if (isPointInSignal(signal, mouseX, mouseY, timeScale, priceScale, hitRadius)) {
      return signal;
    }
  }
  return null;
}

// All rendering utilities are already exported at their function definitions
