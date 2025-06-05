// src/patternEngine/goldmine.ts
// Detects Goldmine signals from Escalator patterns
// Uses two-candle Blackjack scoring and StepBox floor/ceiling

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
  
  // Determine step direction from height
  // Positive height = rising = look for SHORT signal (candle through floor)
  // Negative height = falling = look for LONG signal (candle through ceiling)
  const isRising = step.height > 0;
  const targetSide = isRising ? 'SHORT' : 'LONG';
  
  // Use the step's floor and ceiling properties
  const keyLevel = isRising ? step.floor : step.ceiling;
  const entryPrice = keyLevel;
  
  // Search for two consecutive reversal candles after the step
  const reversalCandles: Candle[] = [];
  let firstReversalIndex = -1;
  
  for (let i = step.endIndex + 1; i < candles.length - 1; i++) {
    const candle = candles[i];
    const nextCandle = candles[i + 1];
    
    // For rising step (SHORT): look for lower-low and lower-high pattern
    // For falling step (LONG): look for higher-high and higher-low pattern
    let isFirstReversal = false;
    let isSecondReversal = false;
    
    if (isRising) {
      // SHORT: First candle must trade through floor
      isFirstReversal = candle.low <= step.floor;
      
      // SHORT: Second candle must have lower-low and lower-high
      if (isFirstReversal && nextCandle) {
        isSecondReversal = nextCandle.low < candle.low && nextCandle.high < candle.high;
      }
    } else {
      // LONG: First candle must trade through ceiling
      isFirstReversal = candle.high >= step.ceiling;
      
      // LONG: Second candle must have higher-high and higher-low
      if (isFirstReversal && nextCandle) {
        isSecondReversal = nextCandle.high > candle.high && nextCandle.low > candle.low;
      }
    }
    
    if (isFirstReversal && isSecondReversal) {
      reversalCandles.push(candle, nextCandle);
      firstReversalIndex = i;
      break;
    }
  }
  
  // Need exactly two reversal candles
  if (reversalCandles.length !== 2) {
    return null;
  }
  
  // Calculate Blackjack score for the two reversal candles
  const bjScore = calcStepBlackjack(reversalCandles);
  
  // Check cumulative score meets threshold
  if (targetSide === 'SHORT' && bjScore.cumulativeScore > BJ_GOLD_THRESHOLD_SHORT) {
    return null;
  }
  if (targetSide === 'LONG' && bjScore.cumulativeScore < BJ_GOLD_THRESHOLD_LONG) {
    return null;
  }
  
  // Verify intrinsic score of second candle has strict polarity
  if (targetSide === 'SHORT' && bjScore.intrinsicScore !== -1) {
    return null;
  }
  if (targetSide === 'LONG' && bjScore.intrinsicScore !== 1) {
    return null;
  }
  
  // All conditions met - construct signal
  return {
    side: targetSide,
    entryIndex: firstReversalIndex + 1, // Second reversal candle index
    entryPrice,
    intrinsic: bjScore.intrinsicScore,
    cumulative: bjScore.cumulativeScore,
    stepRef: `${step.startIndex}-${step.endIndex}`
  };
}
