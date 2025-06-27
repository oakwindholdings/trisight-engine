// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/goldmine.ts
// Detects Goldmine signals from Escalator patterns
// Uses two-candle Blackjack scoring and StepBox floor/ceiling
// DICK O'LEARY COMPLIANCE: Strict HA-only breakout logic - no OHLC substitution allowed

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
