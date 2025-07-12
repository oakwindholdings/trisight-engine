// src/patternEngine/escalatorStep.ts
// Detects Escalator Step patterns (stalling ranges)
// Based on TriSight logic confirmed with Dick O'Leary
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle, StepBox } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

/**
 * Options for detecting escalator steps
 */
interface DetectEscalatorStepsOptions {
  minStepSize?: number;      // Minimum number of candles in a step (default: 2)
  maxLookback?: number;      // Maximum candles to look back for ceiling (default: 10)
  minEscalatorLength?: number; // Minimum escalator length before step (default: 3)
  maxStepSize?: number;      // Maximum step size (default: 20)
}

/**
 * Detects if a sequence of candles forms a valid escalator pattern
 * Returns the direction ('rising' | 'falling') or null if not valid
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 */
function detectEscalatorDirection(candles: Candle[], startIdx: number, endIdx: number): 'rising' | 'falling' | null {
  if (endIdx - startIdx < 2) return null;
  
  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  
  let isRising = true;
  let isFalling = true;
  let risingFailures = 0;
  let fallingFailures = 0;
  
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const currHA = haCandles[i];
    const prevHA = haCandles[i - 1];
    
    // Use HA candle body metrics exclusively
    const currBodyHigh = Math.max(currHA.open, currHA.close);
    const currBodyLow = Math.min(currHA.open, currHA.close);
    const prevBodyHigh = Math.max(prevHA.open, prevHA.close);
    const prevBodyLow = Math.min(prevHA.open, prevHA.close);
    
    // Check for higher high and higher low (rising)
    if (!(currBodyHigh > prevBodyHigh && currBodyLow > prevBodyLow)) {
      isRising = false;
      risingFailures++;
    }
    
    // Check for lower high and lower low (falling)
    if (!(currBodyHigh < prevBodyHigh && currBodyLow < prevBodyLow)) {
      isFalling = false;
      fallingFailures++;
    }
  }
  
  // Debug only first few attempts to avoid spam
  if (startIdx < 10 && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[HA detectEscalatorDirection] HA compliance check:', {
      range: `${startIdx}-${endIdx}`,
      candles: endIdx - startIdx + 1,
      isRising,
      isFalling,
      risingFailures,
      fallingFailures,
      firstHACandle: { open: haCandles[startIdx].open, close: haCandles[startIdx].close },
      lastHACandle: { open: haCandles[endIdx].open, close: haCandles[endIdx].close },
      dickOLearyCompliant: true
    });
  }
  
  if (isRising) return 'rising';
  if (isFalling) return 'falling';
  return null;
}

/**
 * Detects if a candle is stalling after an escalator sequence
 * Phase 2: Enhanced with wick-first trigger detection as per trisight.escalator_step.yml
 * A stalling candle breaks the escalator pattern but stays within a range
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 */
function isStalling(candles: Candle[], idx: number, escalatorDir: 'rising' | 'falling'): boolean {
  if (idx < 1) return false;
  
  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  const currHA = haCandles[idx];
  const prevHA = haCandles[idx - 1];
  
  // Use HA candle body metrics exclusively
  const currBodyHigh = Math.max(currHA.open, currHA.close);
  const currBodyLow = Math.min(currHA.open, currHA.close);
  const prevBodyHigh = Math.max(prevHA.open, prevHA.close);
  const prevBodyLow = Math.min(prevHA.open, prevHA.close);
  
  // Phase 2: First check if escalator pattern is broken (existing body logic)
  let isEscalatorBroken = false;
  
  if (escalatorDir === 'rising') {
    // For rising escalator, stalling means not making a higher high or higher low
    isEscalatorBroken = !(currBodyHigh > prevBodyHigh && currBodyLow > prevBodyLow);
  } else {
    // For falling escalator, stalling means not making a lower high or lower low
    isEscalatorBroken = !(currBodyHigh < prevBodyHigh && currBodyLow < prevBodyLow);
  }
  
  // If escalator pattern is not broken, not stalling
  if (!isEscalatorBroken) {
    return false;
  }
  
  // Phase 2: Wick-first trigger detection - look for significant wick
  const hasSignificantWick = checkForWickTrigger(currHA, escalatorDir);
  
  if (hasSignificantWick && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[HA isStalling] HA wick-first trigger detected:', {
      index: idx,
      direction: escalatorDir,
      haCandle: { open: currHA.open, close: currHA.close, high: currHA.high, low: currHA.low },
      wickType: escalatorDir === 'rising' ? 'bottom' : 'top',
      dickOLearyCompliant: true
    });
  }
  
  return isEscalatorBroken && hasSignificantWick;
}

/**
 * Phase 2: Wick-first trigger detection helper
 * Checks if a candle has a significant wick that indicates step trigger
 * DICK O'LEARY COMPLIANCE: Uses HA candle metrics exclusively
 */
function checkForWickTrigger(haCandle: Candle, escalatorDir: 'rising' | 'falling'): boolean {
  // Use HA candle body metrics exclusively
  const bodyHigh = Math.max(haCandle.open, haCandle.close);
  const bodyLow = Math.min(haCandle.open, haCandle.close);
  const bodySize = Math.abs(haCandle.close - haCandle.open);
  
  if (escalatorDir === 'rising') {
    // For rising escalator, look for bottom wick (rejection of lower prices)
    const bottomWickSize = bodyLow - haCandle.low;
    const topWickSize = haCandle.high - bodyHigh;
    
    // Bottom wick must be significant relative to body and total range
    const totalRange = haCandle.high - haCandle.low;
    const bottomWickRatio = totalRange > 0 ? bottomWickSize / totalRange : 0;
    
    // Trigger conditions:
    // 1. Bottom wick exists and is at least 20% of total range
    // 2. Bottom wick is larger than top wick (shows rejection of lower prices)
    // 3. Or bottom wick is at least 1.5x the body size (significant rejection)
    return bottomWickSize > 0 && (
      bottomWickRatio >= 0.2 ||
      bottomWickSize > topWickSize ||
      (bodySize > 0 && bottomWickSize >= bodySize * 1.5)
    );
  } else {
    // For falling escalator, look for top wick (rejection of higher prices)
    const topWickSize = haCandle.high - bodyHigh;
    const bottomWickSize = bodyLow - haCandle.low;
    
    // Top wick must be significant relative to body and total range
    const totalRange = haCandle.high - haCandle.low;
    const topWickRatio = totalRange > 0 ? topWickSize / totalRange : 0;
    
    // Trigger conditions:
    // 1. Top wick exists and is at least 20% of total range
    // 2. Top wick is larger than bottom wick (shows rejection of higher prices)
    // 3. Or top wick is at least 1.5x the body size (significant rejection)
    return topWickSize > 0 && (
      topWickRatio >= 0.2 ||
      topWickSize > bottomWickSize ||
      (bodySize > 0 && topWickSize >= bodySize * 1.5)
    );
  }
}

/**
 * Finds the ceiling (highest top wick) within a lookback range
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 */
function findCeiling(candles: Candle[], floorIdx: number, lookback: number): number {
  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  
  const startIdx = Math.max(0, floorIdx - lookback);
  let ceilingIdx = floorIdx;
  let highestWick = haCandles[floorIdx].high;
  
  for (let i = startIdx; i < floorIdx; i++) {
    if (haCandles[i].high > highestWick) {
      highestWick = haCandles[i].high;
      ceilingIdx = i;
    }
  }
  
  return ceilingIdx;
}

/**
 * Detects Escalator Steps - stalling ranges that follow escalator sequences
 * 
 * Logic:
 * 1. Identify a stalling candle that follows a valid escalator sequence
 * 2. From that candle (Floor), search backward for the highest top wick (Ceiling)
 * 3. A valid Step must contain at least one Floor + Ceiling bounding range
 * 4. Return StepBox objects with proper indices and body values
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * 
 * @param candles Array of candle data
 * @param options Detection options
 * @returns Array of StepBox objects representing detected steps
 */
export function detectEscalatorSteps(
  candles: Candle[], 
  options: DetectEscalatorStepsOptions = {}
): StepBox[] {
  const {
    minStepSize = 2,
    maxLookback = 10,
    minEscalatorLength = 3,
    maxStepSize = 20
  } = options;
  
  if (!candles || candles.length < minEscalatorLength + minStepSize) {
    return [];
  }
  
  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  
  const steps: StepBox[] = [];
  let i = minEscalatorLength; // Start after minimum escalator length
  
  while (i < candles.length) {
    // Look for an escalator sequence before current position
    let escalatorStart = -1;
    let escalatorDir: 'rising' | 'falling' | null = null;
    
    // Search backward for longest escalator sequence ending at i-1
    for (let j = Math.max(0, i - 20); j < i - minEscalatorLength + 1; j++) {
      const dir = detectEscalatorDirection(candles, j, i - 1);
      if (dir) {
        escalatorStart = j;
        escalatorDir = dir;
        break; // Use the longest sequence found
      }
    }
    
    // If we found an escalator and current candle is stalling
    if (escalatorStart >= 0 && escalatorDir && isStalling(candles, i, escalatorDir)) {
      // Current candle is the floor
      const floorIdx = i;
      
      // Find ceiling (highest wick in lookback range)
      const ceilingIdx = findCeiling(candles, floorIdx, maxLookback);
      
      // Ensure ceiling is before floor and within the stalling range
      if (ceilingIdx < floorIdx) {
        // Find the extent of the stalling range
        let endIdx = floorIdx;
        
        // Continue forward while candles are still stalling
        while (endIdx + 1 < candles.length && endIdx - ceilingIdx < maxStepSize - 1) {
          const nextHACandle = haCandles[endIdx + 1];
          const stepHigh = haCandles[ceilingIdx].high;
          const stepLow = haCandles[floorIdx].low;
          
          // Use tighter tolerance (0.5% instead of 2%) and check body containment
          const nextBodyHigh = Math.max(nextHACandle.open, nextHACandle.close);
          const nextBodyLow = Math.min(nextHACandle.open, nextHACandle.close);
          
          // Check if next candle body is within the step range with tighter tolerance
          if (nextBodyHigh <= stepHigh * 1.005 && nextBodyLow >= stepLow * 0.995) {
            // Additional check: ensure we're not trending strongly
            if (endIdx >= floorIdx + 2) {
              const recentHACandle = haCandles[endIdx];
              const recentBodyMid = (Math.max(recentHACandle.open, recentHACandle.close) + 
                                   Math.min(recentHACandle.open, recentHACandle.close)) / 2;
              const nextBodyMid = (nextBodyHigh + nextBodyLow) / 2;
              
              // If price is trending more than 0.2% per candle, stop extending
              const trendPercent = Math.abs(nextBodyMid - recentBodyMid) / recentBodyMid;
              if (trendPercent > 0.002) {
                break;
              }
            }
            endIdx++;
          } else {
            break;
          }
        }
        
        // Create step box if it meets minimum size
        if (endIdx - ceilingIdx + 1 >= minStepSize) {
          // Calculate body high and low for the entire step using HA candles
          let bodyHigh = -Infinity;
          let bodyLow = Infinity;
          let totalVolume = 0;
          let highestHigh = -Infinity;
          let lowestLow = Infinity;
          
          for (let j = ceilingIdx; j <= endIdx; j++) {
            const haCandle = haCandles[j];
            const originalCandle = candles[j]; // Volume from original candle
            bodyHigh = Math.max(bodyHigh, Math.max(haCandle.open, haCandle.close));
            bodyLow = Math.min(bodyLow, Math.min(haCandle.open, haCandle.close));
            highestHigh = Math.max(highestHigh, haCandle.high);
            lowestLow = Math.min(lowestLow, haCandle.low);
            totalVolume += originalCandle.volume;
          }
          
          const avgVolume = totalVolume / (endIdx - ceilingIdx + 1);
          const level = (bodyHigh + bodyLow) / 2;
          
          // Phase 1: Core Metrics - Calculate stepIntrinsicCount
          // Count candles in the directional escalator prior to stall (from escalatorStart to floorIdx-1)
          const stepIntrinsicCount = escalatorStart >= 0 ? (floorIdx - escalatorStart) : 0;
          
          // Phase 1: Initialize breakout and continuance counts (to be calculated post-breakout)
          const stepBreakoutCount = 0; // Will be updated when breakout is detected
          const stepContinuanceCount = stepIntrinsicCount + stepBreakoutCount;
          
          steps.push({
            startIndex: ceilingIdx,
            endIndex: endIdx,
            startTime: new Date(candles[ceilingIdx].timestamp),
            endTime: new Date(candles[endIdx].timestamp),
            level: level,
            height: bodyHigh - bodyLow,
            duration: endIdx - ceilingIdx + 1,
            isConsolidation: true, // Escalator steps are consolidation phases
            volumeProfile: avgVolume,
            floor: lowestLow,  // Maps to bodyLow concept
            ceiling: highestHigh,  // Maps to bodyHigh concept
            direction: escalatorDir === 'rising' ? 'UP' : 'DOWN', // Add direction based on escalator
            isCompleted: false, // Active step
            
            // Phase 1: Core Metrics (as per trisight.escalator_step.yml)
            stepIntrinsicCount,
            stepBreakoutCount,
            stepContinuanceCount
          });
          
          // Debug log the detected step
          logDebug('DEBUG_PATTERN_DETECT', '[detectEscalatorSteps] Found step:', {
            direction: escalatorDir === 'rising' ? 'UP' : 'DOWN',
            escalatorDir,
            indices: { start: ceilingIdx, end: endIdx },
            price: { floor: lowestLow, ceiling: highestHigh }
          });
          
          // Skip past this step
          i = endIdx + 1;
          continue;
        }
      }
    }
    
    i++;
  }
  
  return steps;
}

/**
 * Updates StepBox metrics after breakout detection
 * Calculates stepBreakoutCount by counting candles that continue directional movement after breakout
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * 
 * @param step - The StepBox to update
 * @param candles - Array of candlestick data
 * @param breakoutIndex - Index where breakout occurred
 * @returns Updated StepBox with breakout metrics
 */
export function updateStepBoxMetricsAfterBreakout(
  step: StepBox,
  candles: Candle[],
  breakoutIndex: number
): StepBox {
  if (breakoutIndex < 0 || breakoutIndex >= candles.length) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA updateStepBoxMetricsAfterBreakout] Invalid breakout index:', breakoutIndex);
    return step;
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);

  let stepBreakoutCount = 0;
  const direction = step.direction;
  
  // Count candles after breakout that continue the directional movement
  for (let i = breakoutIndex + 1; i < candles.length; i++) {
    const currentHACandle = haCandles[i];
    const prevHACandle = haCandles[i - 1];
    
    // Check if candle continues the directional movement using HA close
    const isDirectionalMove = direction === 'UP' 
      ? currentHACandle.close > prevHACandle.close
      : currentHACandle.close < prevHACandle.close;
    
    if (isDirectionalMove) {
      stepBreakoutCount++;
    } else {
      // Stop counting on first reversal/stall
      break;
    }
    
    // Limit count to prevent runaway counting (max 20 candles)
    if (stepBreakoutCount >= 20) {
      break;
    }
  }
  
  // Update the step metrics
  const updatedStep: StepBox = {
    ...step,
    stepBreakoutCount,
    stepContinuanceCount: (step.stepIntrinsicCount || 0) + stepBreakoutCount,
    isCompleted: true // Mark as completed since breakout occurred
  };
  
  logDebug('DEBUG_PATTERN_DETECT', '[updateStepBoxMetricsAfterBreakout] Updated step metrics:', {
    stepRef: `${step.startIndex}-${step.endIndex}`,
    stepIntrinsicCount: step.stepIntrinsicCount,
    stepBreakoutCount,
    stepContinuanceCount: updatedStep.stepContinuanceCount,
    breakoutIndex
  });
  
  return updatedStep;
}

/**
 * Phase 4: Continuation Linking - Detects post-breakout escalator continuation
 * Links step breakouts back to escalator runs when HH/HL (or LL/LH) criteria resume
 * 
 * @param step - The StepBox that experienced breakout
 * @param candles - Full array of candlestick data
 * @param breakoutIndex - Index where breakout occurred
 * @param minContinuationLength - Minimum candles for valid continuation (default: 2)
 * @returns EscalatorRun if continuation is detected, null otherwise
 */
export function detectStepContinuation(
  step: StepBox,
  candles: Candle[],
  breakoutIndex: number,
  minContinuationLength: number = 2
): any | null {
  if (breakoutIndex < 0 || breakoutIndex >= candles.length - 1) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA detectStepContinuation] Invalid breakout index:', breakoutIndex);
    return null;
  }

  const direction = step.direction;
  if (!direction) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA detectStepContinuation] No step direction available');
    return null;
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);

  // Start checking from breakout candle onwards
  let continuationStart = breakoutIndex;
  let continuationEnd = breakoutIndex;
  let validSteps = 0;
  
  // Look for continuation of escalator pattern after breakout
  for (let i = breakoutIndex + 1; i < Math.min(candles.length, breakoutIndex + 20); i++) {
    const currentHACandle = haCandles[i];
    const prevHACandle = haCandles[i - 1];
    
    // Use HA candle body metrics exclusively
    const currBodyHigh = Math.max(currentHACandle.open, currentHACandle.close);
    const currBodyLow = Math.min(currentHACandle.open, currentHACandle.close);
    const prevBodyHigh = Math.max(prevHACandle.open, prevHACandle.close);
    const prevBodyLow = Math.min(prevHACandle.open, prevHACandle.close);
    
    // Check if escalator pattern continues
    let isValidStep = false;
    
    if (direction === 'UP') {
      // For UP direction, need HH + HL (higher high and higher low)
      isValidStep = currBodyHigh > prevBodyHigh && currBodyLow > prevBodyLow;
    } else {
      // For DOWN direction, need LL + LH (lower low and lower high)
      isValidStep = currBodyHigh < prevBodyHigh && currBodyLow < prevBodyLow;
    }
    
    if (isValidStep) {
      validSteps++;
      continuationEnd = i;
      
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA detectStepContinuation] Valid HA step found:', {
        index: i,
        direction,
        validSteps,
        haCandle: { open: currentHACandle.open, close: currentHACandle.close },
        dickOLearyCompliant: true
      });
    } else {
      // Pattern broken, stop checking
      break;
    }
  }
  
  // Check if we have enough valid steps for continuation
  if (validSteps < minContinuationLength) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA detectStepContinuation] Insufficient continuation steps:', {
      validSteps,
      required: minContinuationLength,
      stepRef: `${step.startIndex}-${step.endIndex}`,
      dickOLearyCompliant: true
    });
    return null;
  }
  
  // Create continuation escalator run using HA candles
  const endHACandle = haCandles[continuationEnd];
  const continuationRun = {
    startIndex: continuationStart,
    endIndex: continuationEnd,
    direction: direction === 'UP' ? 'BULLISH' : 'BEARISH',
    steps: [{
      startIndex: continuationStart,
      endIndex: continuationEnd,
      startTime: new Date(candles[continuationStart].timestamp),
      endTime: new Date(candles[continuationEnd].timestamp),
      level: (Math.max(endHACandle.open, endHACandle.close) + 
             Math.min(endHACandle.open, endHACandle.close)) / 2,
      height: 0, // Will be calculated
      duration: continuationEnd - continuationStart + 1,
      isConsolidation: false,
      volumeProfile: 0, // Will be calculated
      floor: Math.min(...haCandles.slice(continuationStart, continuationEnd + 1).map(c => c.low)),
      ceiling: Math.max(...haCandles.slice(continuationStart, continuationEnd + 1).map(c => c.high)),
      direction: direction,
      isCompleted: false,
      
      // Phase 1: Core Metrics - Initialize for continuation
      stepIntrinsicCount: step.stepIntrinsicCount || 0, // Inherit from originating step
      stepBreakoutCount: validSteps,
      stepContinuanceCount: (step.stepIntrinsicCount || 0) + validSteps
    }],
    averageStepHeight: 0, // Will be calculated
    consistency: 1.0,
    
    // Link back to originating step
    originatingStep: {
      stepRef: `${step.startIndex}-${step.endIndex}`,
      stepIntrinsicCount: step.stepIntrinsicCount,
      breakoutIndex: breakoutIndex
    }
  };
  
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA detectStepContinuation] Continuation detected:', {
    stepRef: `${step.startIndex}-${step.endIndex}`,
    continuationRange: `${continuationStart}-${continuationEnd}`,
    direction,
    validSteps,
    stepIntrinsicCount: step.stepIntrinsicCount,
    stepBreakoutCount: validSteps,
    stepContinuanceCount: (step.stepIntrinsicCount || 0) + validSteps
  });
  
  return continuationRun;
}

/**
 * Helper function to validate a StepBox
 */
export function isValidStep(step: StepBox): boolean {
  return (
    step.startIndex >= 0 &&
    step.endIndex > step.startIndex &&
    step.ceiling > step.floor &&
    step.height > 0
  );
}

/**
 * Helper function to check if a candle index is within a step
 */
export function isInStep(idx: number, steps: StepBox[]): boolean {
  return steps.some(step => idx >= step.startIndex && idx <= step.endIndex);
}
