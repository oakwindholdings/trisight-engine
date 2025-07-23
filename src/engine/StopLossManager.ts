// src/engine/StopLossManager.ts
// Signal-Driven Trailing Stop Loss Scaffold
// Manages active stop loss positions and triggers STOP_EXIT signals

import { Candle } from "../types/pattern";
import { TradeActionSignal, TradeAction, SignalType } from "../utils/trading/TradeActionSignal";
import { stopExitTraceAnalyzer } from '../utils/audit/StopExitTraceAnalyzer';
import { emitTradeSignal } from "../framework/tradeActionEmitter";
import { emitPatternFeedSignal } from "../framework/emitPatternFeedSignal";
import { logDebug } from "../utils/debug";

type StopLossType = "LONG" | "SHORT";

interface StopLossTracker {
  positionId: string;
  type: StopLossType;
  entryCandleIndex: number;
  trailingIndex: number;
  triggered: boolean;
  entryPrice: number;
  pattern: string;
  confidence: number;
  // 🎯 CRITICAL FIX: Store trigger candle data for unique signal emission
  triggerCandle?: Candle;
  triggerTimestamp?: string;
  triggerPrice?: number;
  triggerCandleIndex?: number;
}

const activeStopLosses: StopLossTracker[] = [];

/**
 * Register a new stop loss for a position
 * @param positionId - Unique identifier for the position
 * @param type - Position type (LONG or SHORT)
 * @param entryCandleIndex - Index of the entry candle
 * @param trailingIndex - Number of candles to trail behind
 * @param entryPrice - Entry price for the position
 * @param pattern - Pattern name that triggered the position
 * @param confidence - Signal confidence level
 */
export function registerStopLoss(
  positionId: string,
  type: "LONG" | "SHORT",
  entryCandleIndex: number,
  trailingIndex: number,
  entryPrice: number,
  pattern: string,
  confidence: number
): void {
  const tracker: StopLossTracker = {
    positionId,
    type,
    entryCandleIndex,
    trailingIndex,
    entryPrice,
    pattern,
    confidence,
    triggered: false
  };

  activeStopLosses.push(tracker);
  
  // 🔍 AUDIT: Pattern instrumentation - REGISTER STOP tracking
  console.log("🔵 [REGISTER STOP LOSS]", {
    positionId,
    type,
    entryCandleIndex,
    trailingIndex,
    entryPrice: entryPrice.toFixed(4),
    pattern,
    confidence,
    totalActiveStops: activeStopLosses.length
  });

  logDebug('STOP_LOSS_MANAGER', `Stop loss registered for ${positionId}`, {
    type,
    entryCandleIndex,
    trailingIndex,
    entryPrice,
    pattern,
    confidence,
    totalActive: activeStopLosses.length
  });
}

/**
 * Evaluate all active stop losses for the current candle
 * @param candles - Array of candles to evaluate against
 * @param candleIndex - Current candle index being evaluated
 */
export function evaluateStopLoss(candles: Candle[], candleIndex: number): void {
  console.log("🔍 [EVALUATE STOP LOSS]", {
    activeStopLosses: activeStopLosses.length,
    candleIndex,
    currentPrice: candles[candleIndex]?.close?.toFixed(4) || "N/A"
  });
  
  if (activeStopLosses.length === 0) {
    console.log("⚠️ [NO ACTIVE STOP LOSSES] - No stop losses to evaluate");
    return;
  }
  
  for (const tracker of activeStopLosses) {
    if (tracker.triggered) continue;
    
    // Ensure we have enough candles to trail
    const trailingCandleIndex = candleIndex - tracker.trailingIndex;
    if (trailingCandleIndex < 0 || trailingCandleIndex < tracker.entryCandleIndex) {
      console.log("⏭️ [SKIP STOP EVALUATION] - Not enough candles", {
        positionId: tracker.positionId,
        candleIndex,
        trailingCandleIndex,
        entryCandleIndex: tracker.entryCandleIndex
      });
      continue;
    }

    const trailingCandle = candles[trailingCandleIndex];
    const currentCandle = candles[candleIndex];

    if (!trailingCandle || !currentCandle) {
      console.log("⚠️ [MISSING CANDLE DATA]", {
        positionId: tracker.positionId,
        trailingCandleIndex,
        currentCandleIndex: candleIndex,
        hasTrailingCandle: !!trailingCandle,
        hasCurrentCandle: !!currentCandle
      });
      continue;
    }

    // LONG position: Stop if current close drops below trailing candle's low
    if (tracker.type === "LONG" && currentCandle.close < trailingCandle.low) {
      console.log("🔴 [STOP TRIGGERED - LONG]", {
        positionId: tracker.positionId,
        currentPrice: currentCandle.close.toFixed(4),
        trailingStop: trailingCandle.low.toFixed(4),
        entryPrice: tracker.entryPrice.toFixed(4)
      });
      
      // 🎯 CRITICAL FIX: Store trigger candle data for unique signal emission
      tracker.triggerCandle = currentCandle;
      tracker.triggerTimestamp = currentCandle.datetime;
      tracker.triggerPrice = currentCandle.close;
      tracker.triggerCandleIndex = candleIndex;
      
      emitStop(tracker, currentCandle, trailingCandle);
    }

    // SHORT position: Stop if current close rises above trailing candle's high
    if (tracker.type === "SHORT" && currentCandle.close > trailingCandle.high) {
      console.log("🔴 [STOP TRIGGERED - SHORT]", {
        positionId: tracker.positionId,
        currentPrice: currentCandle.close.toFixed(4),
        trailingStop: trailingCandle.high.toFixed(4),
        entryPrice: tracker.entryPrice.toFixed(4)
      });
      
      // 🎯 CRITICAL FIX: Store trigger candle data for unique signal emission
      tracker.triggerCandle = currentCandle;
      tracker.triggerTimestamp = currentCandle.datetime;
      tracker.triggerPrice = currentCandle.close;
      tracker.triggerCandleIndex = candleIndex;
      
      emitStop(tracker, currentCandle, trailingCandle);
    }
    
    // Debug current evaluation status
    console.log("📊 [STOP EVALUATION STATUS]", {
      positionId: tracker.positionId,
      type: tracker.type,
      currentPrice: currentCandle.close.toFixed(4),
      trailingStop: tracker.type === "LONG" ? trailingCandle.low.toFixed(4) : trailingCandle.high.toFixed(4),
      entryPrice: tracker.entryPrice.toFixed(4),
      triggered: tracker.triggered,
      shouldTrigger: tracker.type === "LONG" ? currentCandle.close < trailingCandle.low : currentCandle.close > trailingCandle.high
    });
  }
}

/**
 * Emit a STOP_EXIT signal for triggered stop loss
 * @param tracker - The stop loss tracker that was triggered
 * @param current - Current candle that triggered the stop
 * @param ref - Reference trailing candle
 */
function emitStop(
  tracker: StopLossTracker, 
  current: Candle, 
  ref: Candle
): void {
  tracker.triggered = true;

  // 🔍 AUDIT: Emission flow - STOP_EXIT tracking
  console.log("🚨 [STOP_EXIT EMISSION]", {
    signalType: tracker.type === "LONG" ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT,
    action: tracker.type === "LONG" ? TradeAction.SELL : TradeAction.COVER,
    patternId: tracker.pattern,
    price: current.close.toFixed(4),
    triggeredBy: `Trail candle at ${tracker.type === 'LONG' ? ref.low.toFixed(4) : ref.high.toFixed(4)} (${tracker.type === 'LONG' ? 'broke below' : 'broke above'})`,
    confidence: tracker.confidence,
    timestamp: current.datetime,
    positionId: tracker.positionId,
    trailingRef: `Candle[${tracker.entryCandleIndex - tracker.trailingIndex}]`,
    emitted: true
  });

  // 🎯 CRITICAL FIX: Use tracker's actual trigger candle data instead of shared current candle
  // This ensures each STOP_EXIT signal has its own unique timestamp/price for correct timeline placement
  const triggerCandle = tracker.triggerCandle || current; // Fallback to current if no trigger candle stored
  const triggerTimestamp = tracker.triggerTimestamp || current.datetime;
  const triggerPrice = tracker.triggerPrice || current.close;
  const triggerCandleIndex = tracker.triggerCandleIndex || tracker.entryCandleIndex;
  
  // 🔍 DEBUG: Show trigger candle data used for this signal
  console.log("🎯 [STOP_EXIT TRIGGER DATA]", {
    positionId: tracker.positionId,
    triggerPrice: triggerPrice.toFixed(4),
    triggerTimestamp: triggerTimestamp,
    triggerCandleIndex: triggerCandleIndex,
    originalCurrentPrice: current.close.toFixed(4),
    originalCurrentTimestamp: current.datetime,
    usedStoredTriggerData: !!tracker.triggerCandle
  });

  const signal: TradeActionSignal = {
    action: tracker.type === "LONG" ? TradeAction.SELL : TradeAction.COVER,
    signalType: tracker.type === "LONG" ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT,
    pattern: `STOPLOSS_${tracker.positionId}`,
    confidence: 1.0, // Stop losses are executed with full confidence
    price: triggerPrice, // 🎯 Use trigger price instead of current.close
    timestamp: new Date(triggerTimestamp), // 🎯 Use trigger timestamp instead of current.datetime
    reason: `Trailing stop triggered: ${tracker.type} position below/above ${tracker.trailingIndex}-candle trailing level`,
    candleIndex: triggerCandleIndex, // 🎯 Use trigger candle index
    riskLevel: 'HIGH', // Stop loss indicates risk management
    stopLoss: tracker.type === "LONG" ? ref.low : ref.high
  };

  // 🔍 AUDIT: Record STOP_EXIT emission trace
  stopExitTraceAnalyzer.recordEmission(
    tracker.pattern,
    signal.action,
    signal.price,
    signal.timestamp,
    `Trail candle at ${tracker.type === 'LONG' ? ref.low.toFixed(4) : ref.high.toFixed(4)} (${tracker.type === 'LONG' ? 'broke below' : 'broke above'})`
  );

  console.log("🚀 [EMITTING STOP_EXIT SIGNAL]", {
    action: signal.action,
    signalType: signal.signalType,
    pattern: signal.pattern,
    price: signal.price.toFixed(4),
    timestamp: signal.timestamp.toISOString(),
    confidence: signal.confidence,
    riskLevel: signal.riskLevel
  });

  // Emit the signal through the centralized framework
  emitTradeSignal(signal);

  // Feed emission – STOP_EXIT
  try {
    emitPatternFeedSignal(
      tracker.pattern?.toUpperCase() || 'STOPLOSS',
      { stopLoss: signal.stopLoss, price: signal.price },
      undefined,
      'STOP_EXIT'
    );
  } catch (err) {
    console.error('[PatternFeed] Failed to emit STOP_EXIT', err);
  }

  logDebug('STOP_LOSS_MANAGER', `Stop loss triggered for ${tracker.positionId}`, {
    type: tracker.type,
    entryPrice: tracker.entryPrice,
    exitPrice: current.close,
    trailingRef: tracker.type === "LONG" ? ref.low : ref.high,
    pnl: tracker.type === "LONG" 
      ? ((current.close - tracker.entryPrice) / tracker.entryPrice * 100).toFixed(2) + '%'
      : ((tracker.entryPrice - current.close) / tracker.entryPrice * 100).toFixed(2) + '%'
  });
}

/**
 * Get all active stop loss trackers (for debugging/monitoring)
 */
export function getActiveStopLosses(): readonly StopLossTracker[] {
  return [...activeStopLosses];
}

/**
 * Remove a specific stop loss tracker
 * @param positionId - Position ID to remove
 */
export function removeStopLoss(positionId: string): boolean {
  const index = activeStopLosses.findIndex(tracker => tracker.positionId === positionId);
  if (index >= 0) {
    activeStopLosses.splice(index, 1);
    logDebug('STOP_LOSS_MANAGER', `Removed stop loss tracker for ${positionId}`);
    return true;
  }
  return false;
}

/**
 * Clear all stop loss trackers (for reset/testing)
 */
export function clearAllStopLosses(): void {
  const count = activeStopLosses.length;
  activeStopLosses.length = 0;
  logDebug('STOP_LOSS_MANAGER', `Cleared ${count} stop loss trackers`);
}

/**
 * Get current trailing stop level for a position
 * @param positionId - Position ID to check
 * @param candles - Current candle array
 * @param currentIndex - Current candle index
 * @returns Current trailing stop price or null if not found
 */
export function getCurrentTrailingStop(
  positionId: string, 
  candles: Candle[], 
  currentIndex: number
): number | null {
  const tracker = activeStopLosses.find(t => t.positionId === positionId && !t.triggered);
  if (!tracker) return null;

  const trailingCandleIndex = currentIndex - tracker.trailingIndex;
  if (trailingCandleIndex < 0 || trailingCandleIndex < tracker.entryCandleIndex) return null;

  const trailingCandle = candles[trailingCandleIndex];
  if (!trailingCandle) return null;

  return tracker.type === "LONG" ? trailingCandle.low : trailingCandle.high;
}
