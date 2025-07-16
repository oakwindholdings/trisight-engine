// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/escalator.ts
// Pure function escalator pattern detector
// Detects body-only HH+HL / LL+LH sequences
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Strict HA-only detection logic - no OHLC substitution allowed

import { MIN_ESCALATOR_LENGTH, MAX_STEP_DURATION } from '../constants';
import { Candle, EscalatorRun, StepBox } from '../types';
import { ThrustDirection } from '../models/PatternTypes';
import { debugLog, summaryLog, DEBUG_MODE, logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // Enforce HA-only detection
import { 
  TradeAction, 
  SignalType, 
  TradeActionSignal,
  emitBuySignal,
  emitShortSignal,
  emitSellSignal,
  emitCoverSignal,
  emitTradeBiasSignal,
  calculateRiskLevel 
} from '../utils/trading/TradeActionSignal';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { registerStopLoss } from '../engine/StopLossManager';
import { canEmitSignal } from '../utils/patternDebounceManager';

/**
 * Detects escalator patterns in candlestick data based on body-only higher highs/higher lows
 * or lower lows/lower highs sequences.
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively for trend detection
 * 
 * @param candles - Array of candlestick data
 * @param minLength - Minimum number of candles for a valid escalator (default: MIN_ESCALATOR_LENGTH)
 * @param maxStepBars - Maximum duration for a single step (default: MAX_STEP_DURATION)
 * @returns Array of detected escalator runs
 */
export function detectEscalators(
  candles: Candle[],
  minLength = MIN_ESCALATOR_LENGTH,
  maxStepBars = MAX_STEP_DURATION
): EscalatorRun[] {
  if (!candles || candles.length === 0) return [];
  if (candles.length < minLength) {
    logDebug('DEBUG_PATTERN_DETECT', `[EscalatorDetector] Not enough candles: ${candles?.length} min required: ${minLength}`);
    return [];
  }

  // DICK O'LEARY COMPLIANCE: Convert to HA candles for all detection analysis
  const haCandles = convertToHeikinAshi(candles);

  logDebug('DEBUG_PATTERN_DETECT', `[EscalatorDetector] Starting HA detection on ${candles.length} candles`);
  logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] First HA candle:', {
    datetime: candles[0].datetime,
    haOpen: haCandles[0].open,
    haClose: haCandles[0].close,
    haBodyHigh: Math.max(haCandles[0].open, haCandles[0].close),
    haBodyLow: Math.min(haCandles[0].open, haCandles[0].close),
    dickOLearyCompliant: true
  });
  logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Last HA candle:', {
    datetime: candles[candles.length-1].datetime,
    haOpen: haCandles[haCandles.length-1].open,
    haClose: haCandles[haCandles.length-1].close,
    haBodyHigh: Math.max(haCandles[haCandles.length-1].open, haCandles[haCandles.length-1].close),
    haBodyLow: Math.min(haCandles[haCandles.length-1].open, haCandles[haCandles.length-1].close),
    dickOLearyCompliant: true
  });

  const runs: EscalatorRun[] = [];
  let i = 0;
  let attemptCount = 0;
  let failureReasons: Record<string, number> = {};

  while (i < haCandles.length - 1) {
    // Try to start a run from current position using HA candles
    attemptCount++;
    const run = detectRunFromIndex(haCandles, candles, i, minLength, maxStepBars);
    
    if (run) {
      runs.push(run);
      logDebug('DEBUG_PATTERN_DETECT', `[EscalatorDetector] Found run at index ${i} direction: ${run.direction} length: ${run.endIndex - run.startIndex + 1}`);
      // Move past this run
      i = run.endIndex + 1;
    } else {
      // Track why we failed to find a run
      if (i < haCandles.length - 1) {
        const dir = determineInitialDirection(haCandles[i], haCandles[i + 1]);
        if (!dir) {
          failureReasons['no_initial_direction'] = (failureReasons['no_initial_direction'] || 0) + 1;
        } else {
          failureReasons['run_too_short'] = (failureReasons['run_too_short'] || 0) + 1;
        }
      }
      // Move to next candle
      i++;
    }
  }
  
  logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Detection complete:', {
    runsFound: runs.length,
    attemptsMade: attemptCount,
    failureReasons
  });

  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  runs.forEach(evaluateEscalatorForEntry);

  return runs;
}

/**
 * Evaluate Escalator pattern for entry signals
 * @param escalatorRun - Detected Escalator run pattern
 */
export function evaluateEscalatorForEntry(escalatorRun: EscalatorRun): void {
  const { direction, consistency, steps } = escalatorRun;
  
  // Use consistency as confidence measure — only trade high-consistency Escalator runs
  const confidence = consistency;
  if (confidence < 0.6) return;
  
  // CRITICAL FIX: Separate pattern detection from trade signal emission
  // Pattern detection and rendering should NEVER be debounced
  // Only trade signal emission should be debounced
  const now = Date.now();
  const canEmitTradeSignal = canEmitSignal('ESCALATOR', now);
  
  if (!canEmitTradeSignal && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Escalator] Trade signal debounced (but pattern will still render)', {
      pattern: 'ESCALATOR',
      timestamp: new Date(now).toISOString(),
      direction: direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'
    });
  }
  
  // Get the latest step for entry price
  const latestStep = steps[steps.length - 1];
  if (!latestStep) return;
  
  // 🔴 CRITICAL FIX: Inverted logic for tactical escalator entries
  // BULLISH escalator = SHORT at step highs (fade the momentum)
  // BEARISH escalator = BUY at step lows (fade the momentum)
  const action = direction === ThrustDirection.BULLISH ? 'SHORT' : 'BUY';
  const signalType = direction === ThrustDirection.BULLISH ? 'SHORT_ENTRY' : 'LONG_ENTRY';
  
  // CRITICAL FIX: Only emit trade signals when debounce allows
  // Pattern detection and rendering continues regardless of debounce
  if (canEmitTradeSignal) {
    // 🔍 AUDIT: Pattern instrumentation - EMIT tracking
    console.log("[EMIT]", "ESCALATOR", signalType, latestStep.level.toFixed(4), "Confidence:", (confidence * 100).toFixed(1) + "%");
    
    emitTradeSignal({
      action: action as any,
      signalType: signalType as any,
      pattern: 'Escalator',
      confidence,
      price: latestStep.level,
      timestamp: latestStep.endTime,
      reason: `Escalator confirmed (${direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'})`,
      riskLevel: 'MEDIUM'
    });

    // Register stop loss for this entry position
    const positionId = `ESCALATOR_${latestStep.startIndex}_${direction}`;
    const stopLossType = direction === ThrustDirection.BULLISH ? 'SHORT' : 'LONG';
    
    // 🔍 AUDIT: Pattern instrumentation - REGISTER STOP tracking
    console.log("[REGISTER STOP]", "ESCALATOR", stopLossType, latestStep.endIndex, "Trail:2", "Price:", latestStep.level.toFixed(4));
    
    registerStopLoss(
      positionId,
      stopLossType,
      latestStep.endIndex,
      2, // Trail 2 candles back
      latestStep.level,
      'ESCALATOR',
      confidence
    );

    // Emit TRADE_BIAS signal for directional bias indication
    const biasDirection = direction === ThrustDirection.BULLISH ? 'LONG' : 'SHORT';
    emitTradeBiasSignal(
      'ESCALATOR',
      confidence,
      latestStep.level,
      latestStep.endTime,
      biasDirection,
      `Escalator directional bias: ${direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'}`,
      { riskLevel: 'MEDIUM' }
    );
  }
}

/**
 * Detects Escalator actionable trade signals for trend continuation trading
 * TradeAction Framework v1.0.0: Emits BUY/SHORT signals for trend confirmation
 * Based on user-provided escalator_signal_patch.ts approach
 * @param candles - Array of candlestick data
 * @returns Array of TradeActionSignal objects with actionable BUY/SHORT/SELL/COVER commands
 */
export function detectEscalatorTradeSignals(candles: Candle[]): TradeActionSignal[] {
  logDebug('DEBUG_ESCALATOR_TRADE_SIGNALS', `[HA Escalator TRADE SIGNALS] Starting trend signal detection on ${candles.length} candles`);
  
  const signals: TradeActionSignal[] = [];
  
  if (!candles || candles.length === 0) {
    return signals;
  }

  // Get Escalator pattern detections
  const escalatorRuns = detectEscalators(candles);
  
  // Convert each Escalator run to actionable trade signals
  escalatorRuns.forEach(run => {
    const { direction, startIndex, endIndex, consistency, averageStepHeight, steps } = run;
    
    // Calculate floor and ceiling from steps
    const stepFloors = steps.map(step => step.floor);
    const stepCeilings = steps.map(step => step.ceiling);
    const floor = Math.min(...stepFloors);
    const ceiling = Math.max(...stepCeilings);
    
    // Confidence gate — Dick doesn't want low-consistency trend signals
    if (consistency < 0.65 || averageStepHeight < 0.25) {
      logDebug('DEBUG_ESCALATOR_TRADE_SIGNALS', '[ESCALATOR FILTERED] Low consistency/step height filtered out', {
        startIndex,
        consistency: (consistency * 100).toFixed(1) + '%',
        averageStepHeight: averageStepHeight.toFixed(3),
        consistencyThreshold: '65%',
        stepHeightThreshold: '0.25'
      });
      return;
    }
    
    const entryCandle = candles[startIndex];
    const price = direction === 'BULLISH' ? floor : ceiling;
    const confidence = consistency;
    const riskLevel = calculateRiskLevel(confidence);
    
    // Evaluate escalator for entry signals based on trend direction
    if (direction === 'BULLISH') {
      // Bullish escalator trend = BUY signal
      const buySignal = emitBuySignal(
        'ESCALATOR',
        confidence,
        price,
        new Date(entryCandle.datetime),
        `Escalator BULLISH trend confirmed - Consistency: ${(consistency * 100).toFixed(1)}%`,
        {
          candleIndex: startIndex,
          riskLevel,
          stopLoss: floor * 0.99, // 1% below floor
          targetPrice: ceiling * 1.02, // 2% above ceiling 
          positionSize: confidence * 100
        }
      );
      signals.push(buySignal);
      
    } else if (direction === 'BEARISH') {
      // Bearish escalator trend = SHORT signal  
      const shortSignal = emitShortSignal(
        'ESCALATOR',
        confidence,
        price,
        new Date(entryCandle.datetime),
        `Escalator BEARISH trend confirmed - Consistency: ${(consistency * 100).toFixed(1)}%`,
        {
          candleIndex: startIndex,
          riskLevel,
          stopLoss: ceiling * 1.01, // 1% above ceiling
          targetPrice: floor * 0.98, // 2% below floor
          positionSize: confidence * 100
        }
      );
      signals.push(shortSignal);
    }
    
    // Log signal emission for debugging
    if (DEBUG_MODE) {
      logDebug('DEBUG_ESCALATOR_TRADE_SIGNALS', '[ACTIONABLE ESCALATOR SIGNAL] Trend signal emitted', {
        action: direction === 'BULLISH' ? 'BUY' : 'SHORT',
        startIndex,
        endIndex,
        direction,
        price: price.toFixed(2),
        confidence: (confidence * 100).toFixed(1) + '%',
        consistency: (consistency * 100).toFixed(1) + '%',
        averageStepHeight: averageStepHeight.toFixed(3),
        floor: floor.toFixed(2),
        ceiling: ceiling.toFixed(2),
        riskLevel,
        dickOLearyCompliant: true
      });
    }
  });
  
  if (DEBUG_MODE) {
    logDebug('DEBUG_ESCALATOR_TRADE_SIGNALS', '[HA Escalator TRADE SIGNALS] Signal detection complete', {
      totalSignals: signals.length,
      buySignals: signals.filter(s => s.action === 'BUY').length,
      shortSignals: signals.filter(s => s.action === 'SHORT').length,
      totalRuns: escalatorRuns.length,
      strongRuns: escalatorRuns.filter(r => r.consistency >= 0.65 && r.averageStepHeight >= 0.25).length
    });
  }
  
  return signals;
}

/**
 * Monitors escalator runs for floor/ceiling breach and emits exit signals (SELL/COVER)
 * Based on user-provided monitorEscalatorForExit approach
 * @param candles - Array of candlestick data  
 * @param activeRuns - Array of active escalator runs being monitored
 * @returns Array of exit TradeActionSignal objects
 */
export function monitorEscalatorExitSignals(
  candles: Candle[], 
  activeRuns: EscalatorRun[]
): TradeActionSignal[] {
  logDebug('DEBUG_ESCALATOR_EXIT_SIGNALS', `[ESCALATOR EXIT MONITOR] Monitoring ${activeRuns.length} active runs for floor/ceiling breach`);
  
  const exitSignals: TradeActionSignal[] = [];
  
  if (!candles || candles.length === 0 || !activeRuns || activeRuns.length === 0) {
    return exitSignals;
  }
  
  const currentCandle = candles[candles.length - 1];
  const livePrice = currentCandle.close;
  
  activeRuns.forEach(run => {
    const { direction, consistency, steps, startIndex, endIndex } = run;
    
    // Calculate floor and ceiling from steps
    const stepFloors = steps.map(step => step.floor);
    const stepCeilings = steps.map(step => step.ceiling);
    const floor = Math.min(...stepFloors);
    const ceiling = Math.max(...stepCeilings);
    
    // Require strong consistency for exit monitoring
    if (consistency < 0.65) return;
    
    // Check for floor/ceiling breach
    const broken = 
      (direction === 'BULLISH' && livePrice < floor) ||
      (direction === 'BEARISH' && livePrice > ceiling);
    
    if (broken) {
      const action = direction === 'BULLISH' ? 'SELL' : 'COVER';
      const exitConfidence = consistency; // Use original consistency for exit
      const breachLevel = direction === 'BULLISH' ? floor : ceiling;
      
      if (action === 'SELL') {
        // Floor breach = SELL signal (exit long)
        const sellSignal = emitSellSignal(
          'ESCALATOR',
          exitConfidence,
          livePrice,
          new Date(currentCandle.datetime),
          `ESCALATOR floor breach @ ${breachLevel.toFixed(2)} - Exit LONG position`,
          {
            candleIndex: candles.length - 1,
            riskLevel: 'MEDIUM'
          }
        );
        exitSignals.push(sellSignal);
        
      } else if (action === 'COVER') {
        // Ceiling breach = COVER signal (exit short)
        const coverSignal = emitCoverSignal(
          'ESCALATOR',
          exitConfidence,
          livePrice,
          new Date(currentCandle.datetime),
          `ESCALATOR ceiling breach @ ${breachLevel.toFixed(2)} - Exit SHORT position`,
          {
            candleIndex: candles.length - 1,
            riskLevel: 'MEDIUM'
          }
        );
        exitSignals.push(coverSignal);
      }
      
      if (DEBUG_MODE) {
        logDebug('DEBUG_ESCALATOR_EXIT_SIGNALS', '[ESCALATOR BREACH EXIT] Floor/ceiling breach detected', {
          action,
          direction,
          breachLevel: breachLevel.toFixed(2),
          breachPrice: livePrice.toFixed(2),
          originalStartIndex: startIndex,
          originalEndIndex: endIndex,
          consistency: (consistency * 100).toFixed(1) + '%',
          reason: `Escalator floor/ceiling breached (${direction})`
        });
      }
    }
  });
  
  if (DEBUG_MODE && exitSignals.length > 0) {
    logDebug('DEBUG_ESCALATOR_EXIT_SIGNALS', '[ESCALATOR EXIT MONITOR] Exit signals generated', {
      totalExitSignals: exitSignals.length,
      sellSignals: exitSignals.filter(s => s.action === 'SELL').length,
      coverSignals: exitSignals.filter(s => s.action === 'COVER').length
    });
  }
  
  return exitSignals;
}

/**
 * Attempts to detect an escalator run starting from a specific index
 */
function detectRunFromIndex(
  haCandles: Candle[],
  candles: Candle[],
  startIndex: number,
  minLength: number,
  maxStepBars: number
): EscalatorRun | null {
  const memo = new Map();
  const key = `${startIndex}_${minLength}_${maxStepBars}`;
  if (memo.has(key)) return memo.get(key);

  if (startIndex >= haCandles.length - 1) {
    return null;
  }

  // Determine initial direction by comparing first two candles
  const direction = determineInitialDirection(haCandles[startIndex], haCandles[startIndex + 1]);
  if (!direction) {
    return null;
  }

  // Track the run
  const steps: StepBox[] = [];
  let currentStepStart = startIndex;
  let runLength = 1;
  let lastBodyHigh = getBodyHigh(haCandles[startIndex]);
  let lastBodyLow = getBodyLow(haCandles[startIndex]);

  for (let i = startIndex + 1; i < haCandles.length && runLength < maxStepBars; i++) {
    const currentCandle = haCandles[i];
    const currentBodyHigh = getBodyHigh(currentCandle);
    const currentBodyLow = getBodyLow(currentCandle);

    const isValid = direction === ThrustDirection.BULLISH
      ? currentBodyHigh > lastBodyHigh && currentBodyLow > lastBodyLow  // HH + HL
      : currentBodyHigh < lastBodyHigh && currentBodyLow < lastBodyLow; // LH + LL

    if (isValid) {
      // Continue the run
      runLength++;
      lastBodyHigh = currentBodyHigh;
      lastBodyLow = currentBodyLow;
    } else {
      // Run violated - check if we should create a step
      if (i - currentStepStart >= 1) {
        steps.push(createStepBox(candles, currentStepStart, i - 1, false));
      }
      break;
    }

    // Check if we've reached the last candle
    if (i === haCandles.length - 1 || runLength === maxStepBars) {
      // Create final step
      steps.push(createStepBox(candles, currentStepStart, i, false));
      runLength = i - startIndex + 1;
      break;
    }
  }

  // Check if run meets minimum length
  if (runLength < minLength) {
    return null;
  }

  const endIndex = startIndex + runLength - 1;
  
  const result = {
    startIndex,
    endIndex,
    direction,
    steps: steps.length > 0 ? steps : [createStepBox(candles, startIndex, endIndex, false)],
    averageStepHeight: calculateAverageStepHeight(candles, startIndex, endIndex, direction),
    consistency: calculateConsistency(candles, startIndex, endIndex, direction)
  };
  memo.set(key, result);
  return result;
}

/**
 * Determines the initial direction (BULLISH or BEARISH) based on the first two candles
 * DICK O'LEARY COMPLIANCE: Uses HA candle body metrics exclusively
 */
function determineInitialDirection(haCandle1: Candle, haCandle2: Candle): ThrustDirection | null {
  const body1High = getBodyHigh(haCandle1);
  const body1Low = getBodyLow(haCandle1);
  const body2High = getBodyHigh(haCandle2);
  const body2Low = getBodyLow(haCandle2);

  if (body2High > body1High && body2Low > body1Low) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `HA Initial direction: BULLISH (haBody2High=${body2High} > haBody1High=${body1High}, haBody2Low=${body2Low} > haBody1Low=${body1Low})`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  HA Candle1: open=${haCandle1.open}, close=${haCandle1.close}, datetime=${haCandle1.datetime}`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  HA Candle2: open=${haCandle2.open}, close=${haCandle2.close}, datetime=${haCandle2.datetime}, dickOLearyCompliant=true`);
    return ThrustDirection.BULLISH;
  } else if (body2High < body1High && body2Low < body1Low) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `HA Initial direction: BEARISH (haBody2High=${body2High} < haBody1High=${body1High}, haBody2Low=${body2Low} < haBody1Low=${body1Low})`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  HA Candle1: open=${haCandle1.open}, close=${haCandle1.close}, datetime=${haCandle1.datetime}`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  HA Candle2: open=${haCandle2.open}, close=${haCandle2.close}, datetime=${haCandle2.datetime}, dickOLearyCompliant=true`);
    return ThrustDirection.BEARISH;
  }

  return null;
}

/**
 * Gets the body high (max of open and close)
 */
function getBodyHigh(candle: Candle): number {
  return Math.max(candle.open, candle.close);
}

/**
 * Gets the body low (min of open and close)
 */
function getBodyLow(candle: Candle): number {
  return Math.min(candle.open, candle.close);
}

/**
 * Creates a StepBox from a range of candles
 */
function createStepBox(
  candles: Candle[],
  startIdx: number,
  endIdx: number,
  isConsolidation: boolean
): StepBox {
  const startCandle = candles[startIdx];
  const endCandle = candles[endIdx];
  const level = (getBodyHigh(endCandle) + getBodyLow(endCandle)) / 2;
  
  let totalVolume = 0;
  let floor = Infinity;
  let ceiling = -Infinity;
  let previousLevel = startIdx > 0 
    ? (getBodyHigh(candles[startIdx - 1]) + getBodyLow(candles[startIdx - 1])) / 2
    : level;

  for (let i = startIdx; i <= endIdx; i++) {
    totalVolume += candles[i].volume;
    floor = Math.min(floor, candles[i].low);
    ceiling = Math.max(ceiling, candles[i].high);
  }

  return {
    startTime: new Date(startCandle.datetime),
    endTime: new Date(endCandle.datetime),
    startIndex: startIdx,
    endIndex: endIdx,
    level,
    height: level - previousLevel,
    duration: endIdx - startIdx + 1,
    isConsolidation,
    volumeProfile: totalVolume / (endIdx - startIdx + 1),
    floor,
    ceiling
  };
}

/**
 * Calculates the average step height for the escalator
 */
function calculateAverageStepHeight(
  candles: Candle[],
  startIdx: number,
  endIdx: number,
  direction: ThrustDirection
): number {
  let totalHeight = 0;
  let stepCount = 0;

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const prevBodyHigh = getBodyHigh(candles[i - 1]);
    const prevBodyLow = getBodyLow(candles[i - 1]);
    const currBodyHigh = getBodyHigh(candles[i]);
    const currBodyLow = getBodyLow(candles[i]);

    if (direction === ThrustDirection.BULLISH) {
      totalHeight += (currBodyHigh - prevBodyHigh) + (currBodyLow - prevBodyLow);
    } else {
      totalHeight += Math.abs((currBodyHigh - prevBodyHigh) + (currBodyLow - prevBodyLow));
    }
    stepCount += 2; // Count both high and low changes
  }

  return stepCount > 0 ? totalHeight / stepCount : 0;
}

/**
 * Calculates the consistency score (0-1) based on how uniform the steps are
 */
function calculateConsistency(
  candles: Candle[],
  startIdx: number,
  endIdx: number,
  direction: ThrustDirection
): number {
  if (endIdx - startIdx < 1) return 1;

  const stepHeights: number[] = [];

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const prevMid = (getBodyHigh(candles[i - 1]) + getBodyLow(candles[i - 1])) / 2;
    const currMid = (getBodyHigh(candles[i]) + getBodyLow(candles[i])) / 2;
    const height = direction === ThrustDirection.BULLISH 
      ? currMid - prevMid 
      : prevMid - currMid;
    
    if (height > 0) {
      stepHeights.push(height);
    }
  }

  if (stepHeights.length === 0) return 0;

  // Calculate standard deviation
  const mean = stepHeights.reduce((a, b) => a + b, 0) / stepHeights.length;
  const variance = stepHeights.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / stepHeights.length;
  const stdDev = Math.sqrt(variance);

  // Normalize consistency score (lower std dev = higher consistency)
  // Use coefficient of variation for scale-independent measure
  const cv = mean > 0 ? stdDev / mean : 1;
  return Math.max(0, Math.min(1, 1 - cv));
}
