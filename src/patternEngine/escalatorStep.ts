// src/patternEngine/escalatorStep.ts
// Detects Escalator Step patterns (stalling ranges)
// Based on TriSight logic confirmed with Dick O'Leary

import { Candle, StepBox } from '../types/pattern';

/**
 * Options for detecting escalator steps
 */
interface DetectEscalatorStepsOptions {
  minStepSize?: number;      // Minimum number of candles in a step (default: 2)
  maxLookback?: number;      // Maximum candles to look back for ceiling (default: 10)
  minEscalatorLength?: number; // Minimum escalator length before step (default: 3)
}

/**
 * Detects if a sequence of candles forms a valid escalator pattern
 * Returns the direction ('rising' | 'falling') or null if not valid
 */
function detectEscalatorDirection(candles: Candle[], startIdx: number, endIdx: number): 'rising' | 'falling' | null {
  if (endIdx - startIdx < 2) return null;
  
  let isRising = true;
  let isFalling = true;
  
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    
    const currBodyHigh = Math.max(curr.open, curr.close);
    const currBodyLow = Math.min(curr.open, curr.close);
    const prevBodyHigh = Math.max(prev.open, prev.close);
    const prevBodyLow = Math.min(prev.open, prev.close);
    
    // Check for higher high and higher low (rising)
    if (!(currBodyHigh > prevBodyHigh && currBodyLow > prevBodyLow)) {
      isRising = false;
    }
    
    // Check for lower high and lower low (falling)
    if (!(currBodyHigh < prevBodyHigh && currBodyLow < prevBodyLow)) {
      isFalling = false;
    }
  }
  
  if (isRising) return 'rising';
  if (isFalling) return 'falling';
  return null;
}

/**
 * Detects if a candle is stalling after an escalator sequence
 * A stalling candle breaks the escalator pattern but stays within a range
 */
function isStalling(candles: Candle[], idx: number, escalatorDir: 'rising' | 'falling'): boolean {
  if (idx < 1) return false;
  
  const curr = candles[idx];
  const prev = candles[idx - 1];
  
  const currBodyHigh = Math.max(curr.open, curr.close);
  const currBodyLow = Math.min(curr.open, curr.close);
  const prevBodyHigh = Math.max(prev.open, prev.close);
  const prevBodyLow = Math.min(prev.open, prev.close);
  
  if (escalatorDir === 'rising') {
    // For rising escalator, stalling means not making a higher high or higher low
    return !(currBodyHigh > prevBodyHigh && currBodyLow > prevBodyLow);
  } else {
    // For falling escalator, stalling means not making a lower high or lower low
    return !(currBodyHigh < prevBodyHigh && currBodyLow < prevBodyLow);
  }
}

/**
 * Finds the ceiling (highest top wick) within a lookback range
 */
function findCeiling(candles: Candle[], floorIdx: number, lookback: number): number {
  const startIdx = Math.max(0, floorIdx - lookback);
  let ceilingIdx = floorIdx;
  let highestWick = candles[floorIdx].high;
  
  for (let i = startIdx; i < floorIdx; i++) {
    if (candles[i].high > highestWick) {
      highestWick = candles[i].high;
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
    minEscalatorLength = 3
  } = options;
  
  if (!candles || candles.length < minEscalatorLength + minStepSize) {
    return [];
  }
  
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
        while (endIdx + 1 < candles.length) {
          const nextCandle = candles[endIdx + 1];
          const stepHigh = candles[ceilingIdx].high;
          const stepLow = candles[floorIdx].low;
          
          // Check if next candle is within the step range
          if (nextCandle.high <= stepHigh * 1.02 && nextCandle.low >= stepLow * 0.98) {
            endIdx++;
          } else {
            break;
          }
        }
        
        // Create step box if it meets minimum size
        if (endIdx - ceilingIdx + 1 >= minStepSize) {
          // Calculate body high and low for the entire step
          let bodyHigh = -Infinity;
          let bodyLow = Infinity;
          let totalVolume = 0;
          let highestHigh = -Infinity;
          let lowestLow = Infinity;
          
          for (let j = ceilingIdx; j <= endIdx; j++) {
            const candle = candles[j];
            bodyHigh = Math.max(bodyHigh, Math.max(candle.open, candle.close));
            bodyLow = Math.min(bodyLow, Math.min(candle.open, candle.close));
            highestHigh = Math.max(highestHigh, candle.high);
            lowestLow = Math.min(lowestLow, candle.low);
            totalVolume += candle.volume;
          }
          
          const avgVolume = totalVolume / (endIdx - ceilingIdx + 1);
          const level = (bodyHigh + bodyLow) / 2;
          
          steps.push({
            startIndex: ceilingIdx,
            endIndex: endIdx,
            startTime: new Date(candles[ceilingIdx].datetime),
            endTime: new Date(candles[endIdx].datetime),
            level: level,
            height: bodyHigh - bodyLow,
            duration: endIdx - ceilingIdx + 1,
            isConsolidation: true, // Escalator steps are consolidation phases
            volumeProfile: avgVolume,
            floor: lowestLow,  // Maps to bodyLow concept
            ceiling: highestHigh  // Maps to bodyHigh concept
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
