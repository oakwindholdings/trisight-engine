// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/goldmine.ts
// Detects Goldmine signals from Escalator patterns
// Uses two-candle Blackjack scoring and StepBox floor/ceiling
// DICK O'LEARY COMPLIANCE: Strict HA-only breakout logic - no OHLC substitution allowed
// TODO: SOURCE_VERIFIED_FROM_DECKS - This logic assumes Dick O'Leary's breakout model is strictly HA-based

import { 
  Candle, 
  StepBox
} from '../types/pattern';
import { 
  getIntrinsicScore, 
  calcStepBlackjack
} from './blackjack';
import { 
  BJ_GOLD_THRESHOLD_LONG, 
  BJ_GOLD_THRESHOLD_SHORT 
} from '../constants/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // Enforce HA-only detection
import { TradeActionSignal, TradeAction, SignalType, emitTradeBiasSignal } from '../utils/trading/TradeActionSignal';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { registerStopLoss } from '../engine/StopLossManager';
import { canEmitSignal } from '../utils/patternDebounceManager';
import { AdaptiveGoldmineShaftDetector } from '../utils/patternDetection/AdaptiveGoldmineShaftDetector';
import { GoldmineShaftPattern, ThrustDirection } from '../models/PatternTypes';
import { MarketContext } from '../utils/patternDetection/core/MarketContext';

// Simplified GoldmineSignal interface for detectGoldmine
export interface GoldmineSignal {
  side: 'LONG' | 'SHORT';
  entryIndex: number; // Index of the entry candle (second reversal candle)
  entryPrice: number; // Step floor (SHORT) or ceiling (LONG)
  intrinsic: number;  // Intrinsic score of the second candle
  cumulative: number; // Sum of first two candles' intrinsic scores
  stepRef: string;    // Reference to the step (e.g., "7-9")
}

export function detectGoldmine(
  step: StepBox,
  candles: Candle[],
  existingSignal?: GoldmineSignal
): GoldmineSignal | null {
  // One-and-done: if signal already exists for this Escalator, return null
  if (existingSignal) {
    return null;
  }
  
  // Guard against invalid inputs
  if (!candles || candles.length === 0 || step.endIndex >= candles.length) {
    return null;
  }

  // DICK O'LEARY COMPLIANCE: Convert to HA candles for all breakout analysis
  // This ensures strict adherence to HA body/wick/close logic with no OHLC substitution
  const haCandles = convertToHeikinAshi(candles);
  
  logDebug('DEBUG_PATTERN_DETECT', '[Goldmine:HA] Using Heikin-Ashi candles for breakout detection:', {
    originalCandles: candles.length,
    haCandles: haCandles.length,
    stepRef: `${step.startIndex}-${step.endIndex}`,
    dickOLearyCompliance: true
  });
  
  // Determine step direction from height
  // Positive height = rising = look for SHORT signal (HA candle through floor)
  // Negative height = falling = look for LONG signal (HA candle through ceiling)
  const isRising = step.height > 0;
  const targetSide = isRising ? 'SHORT' : 'LONG';
  
  // Use the step's floor and ceiling properties
  const keyLevel = isRising ? step.floor : step.ceiling;
  const entryPrice = keyLevel;
  
  // Search for two consecutive reversal candles after the step using HA metrics
  const reversalCandles: Candle[] = [];
  let firstReversalIndex = -1;
  
  for (let i = step.endIndex + 1; i < haCandles.length - 1; i++) {
    const haCandle = haCandles[i];
    const nextHACandle = haCandles[i + 1];
    
    // DICK O'LEARY COMPLIANCE: Use HA close/open for trend confirmation, HA body size for breakout analysis
    // For rising step (SHORT): look for HA lower-low and lower-high pattern
    // For falling step (LONG): look for HA higher-high and higher-low pattern
    let isFirstReversal = false;
    let isSecondReversal = false;
    
    if (isRising) {
      // SHORT: First HA candle must trade through floor (HA low ≤ floor)
      isFirstReversal = haCandle.low <= step.floor;
      
      // SHORT: Second HA candle must have lower-low and lower-high (strict HA logic)
      if (isFirstReversal && nextHACandle) {
        isSecondReversal = nextHACandle.low < haCandle.low && nextHACandle.high < haCandle.high;
      }
    } else {
      // LONG: First HA candle must trade through ceiling (HA high ≥ ceiling)
      isFirstReversal = haCandle.high >= step.ceiling;
      
      // LONG: Second HA candle must have higher-high and higher-low (strict HA logic)
      if (isFirstReversal && nextHACandle) {
        isSecondReversal = nextHACandle.high > haCandle.high && nextHACandle.low > haCandle.low;
      }
    }
    
    if (isFirstReversal && isSecondReversal) {
      reversalCandles.push(haCandle, nextHACandle);
      firstReversalIndex = i;
      logDebug('DEBUG_PATTERN_DETECT', '[Goldmine:HA] Confirmed HA reversal at index', i, {
        direction: targetSide,
        keyLevel,
        haCandleClose: haCandle.close.toFixed(4),
        haBodySize: Math.abs(haCandle.close - haCandle.open).toFixed(4),
        reversalType: isRising ? 'bearish' : 'bullish',
        dickOLearyCompliant: true
      });
      break;
    }
  }
  
  // Need exactly two reversal candles
  if (reversalCandles.length !== 2) {
    return null;
  }
  
  // Calculate Blackjack score for the two HA reversal candles
  const bjScore = calcStepBlackjack(reversalCandles);
  
  // Check cumulative score meets threshold
  if (targetSide === 'SHORT' && bjScore.cumulativeScore > BJ_GOLD_THRESHOLD_SHORT) {
    return null;
  }
  if (targetSide === 'LONG' && bjScore.cumulativeScore < BJ_GOLD_THRESHOLD_LONG) {
    return null;
  }
  
  // Verify intrinsic score of second HA candle has strict polarity
  if (targetSide === 'SHORT' && bjScore.intrinsicScore !== -1) {
    return null;
  }
  if (targetSide === 'LONG' && bjScore.intrinsicScore !== 1) {
    return null;
  }
  
  // All conditions met - construct signal using HA-derived metrics
  logDebug('DEBUG_PATTERN_DETECT', '[Goldmine:HA] Signal qualified with Dick O\'Leary HA compliance:', {
    side: targetSide,
    entryIndex: firstReversalIndex + 1,
    entryPrice,
    intrinsic: bjScore.intrinsicScore,
    cumulative: bjScore.cumulativeScore,
    stepRef: `${step.startIndex}-${step.endIndex}`
  });
  
  return {
    side: targetSide,
    entryIndex: firstReversalIndex + 1, // Second HA reversal candle index
    entryPrice,
    intrinsic: bjScore.intrinsicScore,
    cumulative: bjScore.cumulativeScore,
    stepRef: `${step.startIndex}-${step.endIndex}`
  };
}

// ─────────────────────────────────────────────────────────────
// TriSight Goldmine Shaft → TradeAction Signal Integration
// Pattern : Goldmine Shaft  
// Purpose : Emit BUY/SELL signals after validated thrust/retrace pattern
// Note    : Dick O'Leary compliant Fibonacci retracement validation
// ─────────────────────────────────────────────────────────────

/**
 * Detect Goldmine Shaft patterns using AdaptiveGoldmineShaftDetector
 */
export function detectGoldmineShaftPatterns(candles: Candle[]): GoldmineShaftPattern[] {
  // DICK O'LEARY COMPLIANCE: Use Heikin-Ashi candles exclusively
  const haCandles = convertToHeikinAshi(candles);
  
  const detector = new AdaptiveGoldmineShaftDetector({
    minimumConfidence: 0.35,
    detectBullishShafts: true,
    detectBearishShafts: true,
    enableLogging: true
  });
  
  // Create basic market context
  const context: MarketContext = {
    activeChannels: [],
    channelWidthPercentage: 0.05, 
    currentPositionInChannel: 0.5,
    breakoutPotential: 0.3,
    structure: 'TRENDING' as any,
    timeframe: '5min' as any,
    volatility: 0.02,
    volumeProfile: { highVolume: [], lowVolume: [] } as any,
    phase: 'TRENDING' as any,
    detectedPatternDensity: new Map(),
    recentPatterns: [],
    getVolatilityFactor: () => 1.0
  };
  
  const patterns = detector.detect(haCandles.map(candle => ({
    datetime: new Date(candle.timestamp).toISOString(),
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume || 1000
  })), context);
  
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_SHAFT_SIGNALS) {
    console.log(`[GoldmineShaft:Detection] Found ${patterns.length} shaft patterns`);
    patterns.forEach((pattern, idx) => {
      console.log(`[GoldmineShaft:${idx}] ${pattern.direction} | Confidence: ${(pattern.confidence * 100).toFixed(1)}% | Retracement: ${pattern.retracementPercentage?.toFixed(1)}%`);
    });
  }
  
  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  patterns.forEach(evaluateGoldmineShaftForEntry);
  
  return patterns;
}

/**
 * Emit BUY/SHORT trade signals for validated Goldmine Shaft thrust/retracement completion
 */
export function detectGoldmineShaftTradeSignals(candles: Candle[]): TradeActionSignal[] {
  const patterns = detectGoldmineShaftPatterns(candles);
  
  // Signal emission is now handled directly by evaluateGoldmineShaftForEntry
  patterns.forEach(evaluateGoldmineShaftForEntry);
  
  // Return empty array since signals are emitted to TradeActionBus
  return [];
}

/**
 * Evaluate Goldmine Shaft pattern for entry signal after validated thrust/retracement
 */
export function evaluateGoldmineShaftForEntry(shaft: GoldmineShaftPattern): void {
  const { direction, retracementPercentage, confidence, thrustStartTime, thrustEndTime, thrustLowPrice, thrustHighPrice } = shaft;

  // Confidence gate — Dick doesn't want low-confidence retracement signals
  if (confidence < 0.6 || !retracementPercentage || retracementPercentage < 23.6 || retracementPercentage > 78.6) {
    return;
  }

  // Debounce check - prevent rapid repeat emissions for retracement patterns
  const now = Date.now();
  const canEmitTradeSignal = canEmitSignal('GOLDMINE_SHAFT', now);
  
  if (!canEmitTradeSignal && process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_SHAFT_SIGNALS) {
    logDebug('DEBUG_PATTERN_DETECT', '[Goldmine Shaft] Trade signal debounced (but pattern will still render)', {
      pattern: 'GOLDMINE_SHAFT',
      timestamp: new Date(now).toISOString(),
      direction: direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'
    });
  }

  // 🔴 CRITICAL FIX: Inverted logic for tactical retracement entries
  // BULLISH thrust + retracement = SHORT at retracement resistance (high)
  // BEARISH thrust + retracement = BUY at retracement support (low)
  const action = direction === ThrustDirection.BULLISH ? TradeAction.SHORT : TradeAction.BUY;
  const signalType = direction === ThrustDirection.BULLISH ? SignalType.SHORT_ENTRY : SignalType.LONG_ENTRY;
  
  // Calculate retracement levels for tactical entries
  const thrustRange = Math.abs(thrustHighPrice - thrustLowPrice);
  const retracementDepth = thrustRange * (retracementPercentage / 100);
  
  // Tactical entry points at retracement extremes
  const logicalEntryPrice = direction === ThrustDirection.BULLISH
    ? thrustHighPrice - retracementDepth  // SHORT at retracement resistance for BULLISH
    : thrustLowPrice + retracementDepth;  // BUY at retracement support for BEARISH
  
  // CRITICAL FIX: Use thrust end time (retracement completion) instead of start time
  const logicalEntryTime = thrustEndTime || thrustStartTime;
  
  const stopLoss = direction === ThrustDirection.BULLISH 
    ? logicalEntryPrice * 0.98  // 2% below entry point
    : logicalEntryPrice * 1.02; // 2% above entry point
  const targetPrice = direction === ThrustDirection.BULLISH
    ? thrustHighPrice * 1.03  // 3% above thrust high  
    : thrustLowPrice * 0.97;  // 3% below thrust low

  // CRITICAL FIX: Only emit trade signals when debounce allows
  // Pattern detection and rendering continues regardless of debounce
  if (canEmitTradeSignal) {
    // 🔍 AUDIT: Pattern instrumentation - EMIT tracking
    console.log("[EMIT]", "GOLDMINE", signalType, logicalEntryPrice.toFixed(4), "Confidence:", (confidence * 100).toFixed(1) + "%", "Retracement:", retracementPercentage.toFixed(1) + "%");
    
    // Emit to TradeActionBus using correct single object parameter
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Goldmine Shaft',
      confidence,
      price: logicalEntryPrice,
      timestamp: logicalEntryTime,
      reason: `Fibonacci retracement bounce confirmed (${retracementPercentage.toFixed(1)}%)`,
      riskLevel: 'MEDIUM'
    });

    // Register stop loss for this goldmine shaft entry position
    const positionId = `GOLDMINE_${logicalEntryTime.getTime()}_${direction}_${logicalEntryPrice.toFixed(2)}`;
    const stopLossType = direction === ThrustDirection.BULLISH ? 'SHORT' : 'LONG'; // Inverted for retracement entries
    
    // 🔍 AUDIT: Pattern instrumentation - REGISTER STOP tracking
    console.log("[REGISTER STOP]", "GOLDMINE", stopLossType, "0", "Trail:2", "Price:", logicalEntryPrice.toFixed(4), "Direction:", direction, "(Retracement)");
    
    registerStopLoss(
      positionId,
      stopLossType,
      0, // Will be updated by StopLossManager with actual candle index
      2, // Trail 2 candles back
      logicalEntryPrice,
      'GOLDMINE_SHAFT',
      confidence
    );

    // Emit TRADE_BIAS signal for retracement directional bias indication
    const bias = direction === ThrustDirection.BULLISH ? 'SHORT' : 'LONG';
    emitTradeBiasSignal(
      'GOLDMINE_SHAFT',
      confidence,
      logicalEntryPrice,
      logicalEntryTime,
      bias,
      `Goldmine retracement directional bias: ${direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'} thrust`,
      { riskLevel: 'MEDIUM' }
    );
  }
  
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_SHAFT_SIGNALS) {
    console.log(`[GoldmineShaft:ENTRY] ${action} signal emitted:`, {
      direction: direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH',
      confidence: `${(confidence * 100).toFixed(1)}%`,
      retracement: `${retracementPercentage.toFixed(1)}%`,
      originalThrustLow: thrustLowPrice.toFixed(4),
      originalThrustHigh: thrustHighPrice.toFixed(4),
      logicalEntryPrice: logicalEntryPrice.toFixed(4),
      stopLoss: stopLoss.toFixed(4),
      target: targetPrice.toFixed(4),
      signalAnchoredToRetracement: true,
      reason: `Fibonacci retracement bounce confirmed (${retracementPercentage.toFixed(1)}%)`
    });
  }
}

/**
 * Monitor active Goldmine Shaft patterns for exit signals (retracement invalidation)
 */
export function monitorGoldmineShaftExitSignals(
  candles: Candle[], 
  activeShafts: GoldmineShaftPattern[]
): TradeActionSignal[] {
  if (!candles.length || !activeShafts.length) return [];
  
  const currentPrice = candles[candles.length - 1].close;
  const currentTime = new Date(candles[candles.length - 1].timestamp);

  // Exit signal emission is now handled directly by monitorGoldmineShaftForExit
  activeShafts.forEach(shaft => {
    monitorGoldmineShaftForExit(shaft, currentPrice, currentTime);
  });

  // Return empty array since signals are emitted to TradeActionBus
  return [];
}

/**
 * Monitor individual Goldmine Shaft for exit signal (invalidation)
 */
export function monitorGoldmineShaftForExit(
  shaft: GoldmineShaftPattern, 
  livePrice: number, 
  currentTime: Date
): void {
  const { direction, confidence, thrustEndTime, thrustLowPrice, thrustHighPrice } = shaft;

  if (confidence < 0.6) return;

  // Check if retracement has been invalidated
  const invalidated =
    (direction === ThrustDirection.BULLISH && livePrice < thrustLowPrice) ||
    (direction === ThrustDirection.BEARISH && livePrice > thrustHighPrice);

  if (invalidated) {
    const action = direction === ThrustDirection.BULLISH ? TradeAction.SELL : TradeAction.COVER;
    const signalType = direction === ThrustDirection.BULLISH ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;

    // Emit to TradeActionBus using correct single object parameter
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Goldmine Shaft',
      confidence,
      price: livePrice,
      timestamp: currentTime,
      reason: `Thrust level breached - retracement invalidated (${direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'})`
    });
    
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_SHAFT_SIGNALS) {
      console.log(`[GoldmineShaft:EXIT] ${action} signal emitted:`, {
        direction: direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH',
        confidence: `${(confidence * 100).toFixed(1)}%`, 
        invalidationPrice: livePrice.toFixed(4),
        thrustLow: thrustLowPrice.toFixed(4),
        thrustHigh: thrustHighPrice.toFixed(4),
        reason: `Thrust level breached - retracement invalidated (${direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'})`
      });
    }
  }
}
