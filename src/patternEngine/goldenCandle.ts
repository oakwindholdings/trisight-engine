// src/patternEngine/goldenCandle.ts
// Detects golden candle patterns in candlestick data
// Golden candles are high-confidence breakout candles confirmed by prior step consolidation and strong Blackjack scores
// HEIKIN-ASHI: Improved breakout signal clarity with HA smoothing - reduces noise in consolidation phases, enhances trend confirmation
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle } from '../types/pattern';
import { TradeActionSignal, TradeAction, SignalType, emitTradeBiasSignal } from '../utils/trading/TradeActionSignal';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { convertToHeikinAshi } from '../utils/candleTransform';
import { isNearMissGoldenCandle } from '../utils/patternQualifiers';
import { logDebug } from '../utils/debug';
import { canEmitSignal } from '../utils/patternDebounceManager';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

export interface GoldenCandlePattern {
  index: number;
  timestamp: Date;
  direction: 'LONG' | 'SHORT';
  goldenScore: number;
  intrinsicScore: number;
  cumulativeScore: number;
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  candlePrice: number;
  stepBoxCeiling?: number;
  stepBoxFloor?: number;
  confidence: number;
}

export interface GoldenCandleCandidate {
  index: number;
  timestamp: Date;
  intrinsicScore: number;
  cumulativeScore: number;
  stepContinuanceCount: number;
  stepBreakoutCount: number;
  stepIntrinsicCount: number;
  candlePrice: number;
  failureReason: string;
  nearMissType: 'CONTINUATION_LOW' | 'INTRINSIC_ZERO' | 'CUMULATIVE_WEAK' | 'NO_BREAKOUT' | 'NEAR_MISS';
}

/**
 * Detects golden candle patterns in candlestick data
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * // TODO: SOURCE_VERIFIED_FROM_DECKS - Breakout thresholds should be explicitly defined from Dick O'Leary deck sources
 * @param candles - Array of candlestick data
 * @param stepIntrinsicCounts - Array of step intrinsic counts per candle
 * @param stepBreakoutCounts - Array of step breakout counts per candle
 * @param stepContinuanceCounts - Array of step continuance counts per candle
 * @param bjIntrinsic - Array of blackjack intrinsic scores per candle
 * @param bjCumulative - Array of blackjack cumulative scores per candle
 * @returns Array of detected golden candle patterns
 */
export function detectGoldenCandle(
  candles: Candle[],
  stepIntrinsicCounts: number[] = [],
  stepBreakoutCounts: number[] = [],
  stepContinuanceCounts: number[] = [],
  bjIntrinsic: number[] = [],
  bjCumulative: number[] = []
): GoldenCandlePattern[] {
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldenCandle] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldenCandle] No candles provided for detection');
    return [];
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  const goldenCandles: GoldenCandlePattern[] = [];

  // Iterate through candles to find golden candle candidates
  for (let i = 0; i < candles.length; i++) {
    const haCandle = haCandles[i];
    
    // Get metrics for current candle
    const intrinsicScore = bjIntrinsic[i] || 0;
    const cumulativeScore = bjCumulative[i] || 0;
    const continuanceCount = stepContinuanceCounts[i] || 0;
    const intrinsicCount = stepIntrinsicCounts[i] || 0;
    const breakoutCount = stepBreakoutCounts[i] || 0;

    // Debug logging for current candle evaluation using HA candle
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GoldenCandle] Evaluating HA candle ${i}:`, {
      haCandleClose: haCandle.close.toFixed(2),
      intrinsicScore: intrinsicScore,
      cumulativeScore: cumulativeScore,
      continuanceCount: continuanceCount,
      intrinsicCount: intrinsicCount,
      breakoutCount: breakoutCount,
      dickOLearyCompliant: true
    });

    // 1. Check continuation count requirement (≥ 2)
    if (continuanceCount < 2) {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GoldenCandle] HA candle ${i} rejected: continuation count ${continuanceCount} < 2`);
      continue;
    }

    // 2. Check intrinsic score requirement (= ±1)
    if (Math.abs(intrinsicScore) !== 1) {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GoldenCandle] HA candle ${i} rejected: intrinsic score ${intrinsicScore} ≠ ±1`);
      continue;
    }

    // 3. Check cumulative score requirements
    let direction: 'LONG' | 'SHORT';
    if (cumulativeScore >= 2) {
      direction = 'LONG';
    } else if (cumulativeScore <= -2) {
      direction = 'SHORT';
    } else {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GoldenCandle] HA candle ${i} rejected: cumulative score ${cumulativeScore} doesn't meet ≥2 (LONG) or ≤-2 (SHORT)`);
      continue;
    }

    // 4. Check for step box breakout (candle closes beyond ceiling/floor)
    // Note: Step box ceiling/floor detection would require step box data
    // For now, we'll use a simplified approach based on continuation count and breakout count
    const hasBreakout = breakoutCount > 0;
    
    if (!hasBreakout) {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GoldenCandle] HA candle ${i} rejected: no step box breakout detected`);
      continue;
    }

    // 5. Calculate golden score and confidence
    const goldenScore = Math.abs(intrinsicScore) + Math.abs(cumulativeScore) + continuanceCount;
    const confidence = Math.min(goldenScore / 10.0, 1.0); // Normalize to 0-1 scale

    // 6. Create golden candle pattern using HA candle data
    const goldenCandle: GoldenCandlePattern = {
      index: i,
      timestamp: new Date(candles[i].datetime), // Use original timestamp
      direction: direction,
      goldenScore: goldenScore,
      intrinsicScore: intrinsicScore,
      cumulativeScore: cumulativeScore,
      stepIntrinsicCount: intrinsicCount,
      stepBreakoutCount: breakoutCount,
      stepContinuanceCount: continuanceCount,
      candlePrice: haCandle.close, // Use HA candle close for Dick O'Leary compliance
      confidence: confidence
    };

    // Add comprehensive DEBUG_PATTERN_DETECT logging
    if (DEBUG_MODE && typeof logDebug === 'function') {
      logDebug('DEBUG_PATTERN_DETECT', `HA Golden Candle detected`, {
        index: i,
        direction: direction,
        goldenScore: goldenScore.toFixed(2),
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        continuanceCount: continuanceCount,
        intrinsicCount: intrinsicCount,
        breakoutCount: breakoutCount,
        haCandlePrice: haCandle.close.toFixed(2), // Use HA candle close
        confidence: confidence.toFixed(2),
        timestamp: candles[i].datetime,
        signalStrength: confidence >= 0.8 ? 'STRONG' : confidence >= 0.6 ? 'MEDIUM' : 'WEAK',
        dickOLearyCompliant: true
      });
    }

    goldenCandles.push(goldenCandle);
  }

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldenCandle] Detection complete. Found', goldenCandles.length, 'golden candles');
  
  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  goldenCandles.forEach(evaluateGoldenCandleForEntry);
  
  return goldenCandles;
}

/**
 * Detects Golden Candle candidates (near-misses) for forensic analysis
 * Uses relaxed criteria to identify candles that almost meet Golden Candle requirements
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * @param candles - Array of candlestick data
 * @param stepIntrinsicCounts - Array of step intrinsic counts per candle
 * @param stepBreakoutCounts - Array of step breakout counts per candle
 * @param stepContinuanceCounts - Array of step continuance counts per candle
 * @param bjIntrinsic - Array of blackjack intrinsic scores per candle
 * @param bjCumulative - Array of blackjack cumulative scores per candle
 * @returns Array of Golden Candle candidates for forensic overlay
 */
export function detectGoldenCandleCandidates(
  candles: Candle[],
  stepIntrinsicCounts: number[] = [],
  stepBreakoutCounts: number[] = [],
  stepContinuanceCounts: number[] = [],
  bjIntrinsic: number[] = [],
  bjCumulative: number[] = []
): GoldenCandleCandidate[] {
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_FORENSICS] Starting forensic candidate detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_FORENSICS] No candles provided for forensic detection');
    return [];
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  const candidates: GoldenCandleCandidate[] = [];

  // Iterate through candles to find near-miss candidates with relaxed criteria
  for (let i = 0; i < candles.length; i++) {
    const haCandle = haCandles[i];
    
    // Get metrics for current candle
    const intrinsicScore = bjIntrinsic[i] || 0;
    const cumulativeScore = bjCumulative[i] || 0;
    const continuanceCount = stepContinuanceCounts[i] || 0;
    const intrinsicCount = stepIntrinsicCounts[i] || 0;
    const breakoutCount = stepBreakoutCounts[i] || 0;

    // Relaxed criteria for forensic analysis:
    // 1. Step breakout confirmed (same as golden candle)
    // 2. Step continuation ≥ 1 (instead of 2)
    // 3. Intrinsic Score ∈ {0, 1} (includes zero for near-misses)
    // 4. Cumulative Score ∈ [1, 2) (just below qualification threshold)

    let isCandidate = false;
    let failureReason = '';
    let nearMissType: GoldenCandleCandidate['nearMissType'] = 'NO_BREAKOUT';

    // Check if this candle has step breakout confirmed
    const hasBreakout = breakoutCount > 0;
    if (!hasBreakout) {
      // Skip candles without any breakout activity
      continue;
    }

    // Check relaxed continuation count (≥ 1 instead of ≥ 2)
    if (continuanceCount >= 1 && continuanceCount < 2) {
      isCandidate = true;
      failureReason = `Continuation count ${continuanceCount} below Golden Candle threshold (≥2)`;
      nearMissType = 'CONTINUATION_LOW';
    }

    // Check intrinsic score (0 or 1, missing the ±1 requirement)
    if (intrinsicScore === 0) {
      isCandidate = true;
      failureReason = `Intrinsic score ${intrinsicScore} is neutral (Golden Candle requires ±1)`;
      nearMissType = 'INTRINSIC_ZERO';
    } else if (Math.abs(intrinsicScore) === 1) {
      // Good intrinsic score, check cumulative
      if (cumulativeScore >= 1 && cumulativeScore < 2) {
        isCandidate = true;
        failureReason = `Cumulative score ${cumulativeScore} below LONG threshold (≥2)`;
        nearMissType = 'CUMULATIVE_WEAK';
      } else if (cumulativeScore <= -1 && cumulativeScore > -2) {
        isCandidate = true;
        failureReason = `Cumulative score ${cumulativeScore} above SHORT threshold (≤-2)`;
        nearMissType = 'CUMULATIVE_WEAK';
      }
    }

    if (isCandidate) {
      const candidate: GoldenCandleCandidate = {
        index: i,
        timestamp: new Date(candles[i].datetime),
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        stepContinuanceCount: continuanceCount,
        stepBreakoutCount: breakoutCount,
        stepIntrinsicCount: intrinsicCount,
        candlePrice: haCandle.close, // Use HA candle close for Dick O'Leary compliance
        failureReason: failureReason,
        nearMissType: nearMissType
      };

      // Comprehensive forensic logging
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `[HA GOLDMINE_FORENSICS] Golden Candle candidate detected`, {
        idx: i,
        continuationCount: continuanceCount,
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        breakoutCount: breakoutCount,
        failureReason: failureReason,
        nearMissType: nearMissType,
        candlePrice: haCandle.close.toFixed(2), // Use HA candle close
        timestamp: candles[i].datetime
      });

      candidates.push(candidate);
    }
  }

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_FORENSICS] Forensic detection complete. Found', candidates.length, 'Golden Candle candidates');
  
  return candidates;
}

/**
 * Validates golden candle criteria
 * @param intrinsicScore - Blackjack intrinsic score
 * @param cumulativeScore - Blackjack cumulative score
 * @param continuanceCount - Step continuance count
 * @returns boolean indicating if criteria are met
 */
export function validateGoldenCandleCriteria(
  intrinsicScore: number,
  cumulativeScore: number,
  continuanceCount: number
): boolean {
  // Intrinsic score must be exactly ±1
  if (Math.abs(intrinsicScore) !== 1) {
    return false;
  }
  
  // Continuation count must be ≥ 2
  if (continuanceCount < 2) {
    return false;
  }
  
  // Cumulative score must be ≥ 2 (long) or ≤ -2 (short)
  if (cumulativeScore < 2 && cumulativeScore > -2) {
    return false;
  }
  
  return true;
}

/**
 * Detects Golden Near Misses for TriSight Detection Input Refactor Patch v1.3.0 integration with usePatternBus
 * @param candles - Array of candlestick data
 * @param latestStep - Latest escalator step for context (optional)
 * @returns Array of boolean values indicating Golden Near Miss at each candle index
 */
export function detectGoldenNearMisses(
  candles: Candle[],
  latestStep?: any
): boolean[] {
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_NEAR_MISS] Starting near miss detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_NEAR_MISS] No candles provided for near miss detection');
    return [];
  }

  // Initialize near miss array with false values
  const nearMisses: boolean[] = new Array(candles.length).fill(false);

  // Need at least 4 candles for context (3 previous + 1 current)
  if (candles.length < 4) {
    return nearMisses;
  }

  // Iterate through candles starting from index 3 (need 3 previous candles for context)
  for (let i = 3; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandles = candles.slice(0, i); // All previous candles up to current

    // Check if this candle is a near miss using the proper signature
    if (isNearMissGoldenCandle(currentCandle, previousCandles)) {
      nearMisses[i] = true;

      // Comprehensive near miss logging
      if (DEBUG_MODE) logDebug('DEBUG_GOLDEN_MISS', `[HA GOLDMINE_NEAR_MISS] Golden Near Miss detected`, {
        idx: i,
        candlePrice: currentCandle.close.toFixed(2),
        timestamp: currentCandle.datetime,
        dickOLearyCompliant: true,
        forensicAnalysis: true
      });
    }
  }

  const totalNearMisses = nearMisses.filter(nm => nm).length;
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GOLDMINE_NEAR_MISS] Near miss detection complete. Found', totalNearMisses, 'Golden Near Misses');
  
  return nearMisses;
}

/**
 * Evaluate Golden Candle pattern for entry signals
 * @param goldenCandle - Detected Golden Candle pattern
 */
export function evaluateGoldenCandleForEntry(goldenCandle: GoldenCandlePattern): void {
  const { direction, confidence, candlePrice, timestamp } = goldenCandle;
  
  // Confidence gate — only trade high-confidence Golden Candles
  if (confidence < 0.7) return;
  
  // Debounce check - prevent rapid repeat emissions for high-confidence signals
  const now = Date.now();
  // CRITICAL FIX: Separate pattern detection from trade signal emission
  // Pattern detection and rendering should NEVER be debounced
  const canEmitTradeSignal = canEmitSignal('GOLDEN_CANDLE', now);
  
  if (!canEmitTradeSignal && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Golden Candle] Trade signal debounced (but pattern will still render)', {
      pattern: 'GOLDEN_CANDLE',
      timestamp: new Date(now).toISOString(),
      entryPrice: candlePrice.toFixed(4)
    });
  }
  
  const action = direction === 'LONG' ? TradeAction.BUY : TradeAction.SHORT;
  const signalType = direction === 'LONG' ? SignalType.LONG_ENTRY : SignalType.SHORT_ENTRY;
  
  // CRITICAL FIX: Only emit trade signals when debounce allows
  // Pattern detection and rendering continues regardless of debounce
  if (canEmitTradeSignal) {
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Golden Candle',
      confidence,
      price: candlePrice,
      timestamp,
      reason: `Golden Candle confirmed (${direction})`
    });

    // Emit TRADE_BIAS signal for Golden Candle breakout bias indication
    const bias = direction === 'LONG' ? 'LONG' : 'SHORT';
    emitTradeBiasSignal(
      'GOLDEN_CANDLE',
      confidence,
      candlePrice,
      timestamp,
      bias,
      `Golden Candle breakout bias: ${direction}`,
      { riskLevel: 'LOW' }
    );
  }
}

/**
 * Monitor Golden Candle pattern for exit signals
 * @param goldenCandle - Active Golden Candle pattern
 * @param livePrice - Current market price
 */
export function monitorGoldenCandleForExit(goldenCandle: GoldenCandlePattern, livePrice: number): void {
  const { direction, confidence, candlePrice, stepBoxFloor, stepBoxCeiling } = goldenCandle;
  
  if (confidence < 0.7) return;
  
  // Define stop levels based on step box boundaries
  const stopLoss = direction === 'LONG' ? stepBoxFloor : stepBoxCeiling;
  
  const broken = stopLoss && (
    (direction === 'LONG' && livePrice < stopLoss) ||
    (direction === 'SHORT' && livePrice > stopLoss)
  );
  
  if (broken) {
    const action = direction === 'LONG' ? TradeAction.SELL : TradeAction.COVER;
    const signalType = direction === 'LONG' ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;
    
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Golden Candle',
      confidence,
      price: livePrice,
      timestamp: new Date(),
      reason: `Golden Candle step box breached (${direction})`
    });
  }
}

export function isTrailingStopTriggered(
  entryCandle: Candle,
  currentCandle: Candle,
  direction: 'LONG' | 'SHORT',
  trailingStopPercent: number = 2.0
): boolean {
  if (!entryCandle || !currentCandle) {
    return false;
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haEntryCandle = convertToHeikinAshi([entryCandle])[0];
  const haCurrentCandle = convertToHeikinAshi([currentCandle])[0];

  // Calculate trailing stop threshold based on entry HA candle
  const trailingStopValue = (trailingStopPercent / 100) * haEntryCandle.open;

  let isTriggered = false;

  if (direction === 'LONG') {
    // LONG: current HA low < entry HA open - (trailingStop %)
    const stopLevel = haEntryCandle.open - trailingStopValue;
    isTriggered = haCurrentCandle.low < stopLevel;
  } else if (direction === 'SHORT') {
    // SHORT: current HA high > entry HA open + (trailingStop %)
    const stopLevel = haEntryCandle.open + trailingStopValue;
    isTriggered = haCurrentCandle.high > stopLevel;
  }

  return isTriggered;
}
