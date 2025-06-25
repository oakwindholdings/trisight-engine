// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/escalator.ts
// Pure function escalator pattern detector
// Detects body-only HH+HL / LL+LH sequences
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT

import { MIN_ESCALATOR_LENGTH, MAX_STEP_DURATION } from '../constants';
import { Candle, EscalatorRun, StepBox } from '../types';
import { ThrustDirection } from '../models/PatternTypes';
import { debugLog, summaryLog, DEBUG_MODE } from '../utils/debug';
import { logDebug } from '../utils/debug';

/**
 * Detects escalator patterns in candlestick data based on body-only higher highs/higher lows
 * or lower lows/lower highs sequences.
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

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Starting detection on', candles.length, 'candles');
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] First candle:', {
    datetime: candles[0].datetime,
    open: candles[0].open,
    close: candles[0].close,
    bodyHigh: Math.max(candles[0].open, candles[0].close),
    bodyLow: Math.min(candles[0].open, candles[0].close)
  });
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Last candle:', {
    datetime: candles[candles.length-1].datetime,
    open: candles[candles.length-1].open,
    close: candles[candles.length-1].close,
    bodyHigh: Math.max(candles[candles.length-1].open, candles[candles.length-1].close),
    bodyLow: Math.min(candles[candles.length-1].open, candles[candles.length-1].close)
  });

  const runs: EscalatorRun[] = [];
  let i = 0;
  let attemptCount = 0;
  let failureReasons: Record<string, number> = {};

  while (i < candles.length - 1) {
    // Try to start a run from current position
    attemptCount++;
    const run = detectRunFromIndex(candles, i, minLength, maxStepBars);
    
    if (run) {
      runs.push(run);
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[EscalatorDetector] Found run at index', i, 'direction:', run.direction, 'length:', run.endIndex - run.startIndex + 1);
      // Move past this run
      i = run.endIndex + 1;
    } else {
      // Track why we failed to find a run
      if (i < candles.length - 1) {
        const dir = determineInitialDirection(candles[i], candles[i + 1]);
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
  candles: Candle[],
  startIndex: number,
  minLength: number,
  maxStepBars: number
): EscalatorRun | null {
  if (startIndex >= candles.length - 1) {
    return null;
  }

  // Determine initial direction by comparing first two candles
  const direction = determineInitialDirection(candles[startIndex], candles[startIndex + 1]);
  if (!direction) {
    return null;
  }

  // Track the run
  const steps: StepBox[] = [];
  let currentStepStart = startIndex;
  let runLength = 1;
  let lastBodyHigh = getBodyHigh(candles[startIndex]);
  let lastBodyLow = getBodyLow(candles[startIndex]);

  for (let i = startIndex + 1; i < candles.length && runLength < maxStepBars; i++) {
    const currentCandle = candles[i];
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
    if (i === candles.length - 1 || runLength === maxStepBars) {
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
 * Determines the initial direction by comparing two candles
 */
function determineInitialDirection(candle1: Candle, candle2: Candle): ThrustDirection | null {
  const body1High = getBodyHigh(candle1);
  const body1Low = getBodyLow(candle1);
  const body2High = getBodyHigh(candle2);
  const body2Low = getBodyLow(candle2);

  if (body2High > body1High && body2Low > body1Low) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `Initial direction: BULLISH (body2High=${body2High} > body1High=${body1High}, body2Low=${body2Low} > body1Low=${body1Low})`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  Candle1: open=${candle1.open}, close=${candle1.close}, datetime=${candle1.datetime}`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  Candle2: open=${candle2.open}, close=${candle2.close}, datetime=${candle2.datetime}`);
    return ThrustDirection.BULLISH;
  } else if (body2High < body1High && body2Low < body1Low) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `Initial direction: BEARISH (body2High=${body2High} < body1High=${body1High}, body2Low=${body2Low} < body1Low=${body1Low})`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  Candle1: open=${candle1.open}, close=${candle1.close}, datetime=${candle1.datetime}`);
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', `  Candle2: open=${candle2.open}, close=${candle2.close}, datetime=${candle2.datetime}`);
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
