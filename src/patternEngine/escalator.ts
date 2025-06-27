// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/escalator.ts
// Pure function escalator pattern detector
// Detects body-only HH+HL / LL+LH sequences
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Strict HA-only detection logic - no OHLC substitution allowed

import { MIN_ESCALATOR_LENGTH, MAX_STEP_DURATION } from '../constants';
import { Candle, EscalatorRun, StepBox } from '../types';
import { ThrustDirection } from '../models/PatternTypes';
import { debugLog, summaryLog, DEBUG_MODE } from '../utils/debug';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // Enforce HA-only detection

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
  if (!candles || candles.length < minLength) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Not enough candles:', candles?.length, 'min required:', minLength);
    return [];
  }

  // DICK O'LEARY COMPLIANCE: Convert to HA candles for all detection analysis
  const haCandles = convertToHeikinAshi(candles);

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Starting HA detection on', candles.length, 'candles');
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] First HA candle:', {
    datetime: candles[0].datetime,
    haOpen: haCandles[0].open,
    haClose: haCandles[0].close,
    haBodyHigh: Math.max(haCandles[0].open, haCandles[0].close),
    haBodyLow: Math.min(haCandles[0].open, haCandles[0].close),
    dickOLearyCompliant: true
  });
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Last HA candle:', {
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
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Found run at index', i, 'direction:', run.direction, 'length:', run.endIndex - run.startIndex + 1);
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
  
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Detection complete:', {
    runsFound: runs.length,
    attemptsMade: attemptCount,
    failureReasons
  });

  return runs;
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
  
  return {
    startIndex,
    endIndex,
    direction,
    steps: steps.length > 0 ? steps : [createStepBox(candles, startIndex, endIndex, false)],
    averageStepHeight: calculateAverageStepHeight(candles, startIndex, endIndex, direction),
    consistency: calculateConsistency(candles, startIndex, endIndex, direction)
  };
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
