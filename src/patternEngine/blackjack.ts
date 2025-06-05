// src/patternEngine/blackjack.ts
// Implements Intrinsic and Cumulative Blackjack scoring for Goldmine signal qualification
// Focuses on the first full Step candle for scoring

import { Candle, BlackjackScore } from '../types/pattern';
import { BJ_GOLD_THRESHOLD_LONG, BJ_GOLD_THRESHOLD_SHORT } from '../constants/pattern';

/**
 * Calculate the intrinsic score for a single candle based on its relationship
 * to the previous candle's body high and low.
 * 
 * @param candle - The current candle to score
 * @param prevBodyHigh - The body high (max of open/close) of the previous candle
 * @param prevBodyLow - The body low (min of open/close) of the previous candle
 * @returns +1 for bullish breakout, -1 for bearish breakdown, 0 for neutral
 */
export function getIntrinsicScore(
  candle: Candle,
  prevBodyHigh: number,
  prevBodyLow: number
): -1 | 0 | 1 {
  // Green breakout bar: close > open AND close > prevBodyHigh
  if (candle.close > candle.open && candle.close > prevBodyHigh) {
    return 1;
  }
  
  // Red reversal bar: close < open AND close < prevBodyLow
  if (candle.close < candle.open && candle.close < prevBodyLow) {
    return -1;
  }
  
  // Otherwise: inside bar, doji, or other neutral pattern
  return 0;
}

/**
 * Calculate the Blackjack score for step candles.
 * For Goldmine, sum the intrinsic scores of the first two reversal candles.
 * 
 * @param stepCandles - Array of at least 2 candles for scoring
 * @returns BlackjackScore with intrinsic (candle #2) and cumulative (sum of candles #1 and #2)
 */
export function calcStepBlackjack(stepCandles: Candle[]): BlackjackScore {
  // Guard against insufficient input
  if (!stepCandles || stepCandles.length < 2) {
    return {
      timestamp: new Date(),
      intrinsicScore: 0,
      cumulativeScore: 0,
      components: {
        priceChange: 0,
        volumeRatio: 0,
        momentum: 0,
        volatility: 0
      },
      signal: 'NEUTRAL'
    };
  }
  
  // Get the first two candles
  const firstCandle = stepCandles[0];
  const secondCandle = stepCandles[1];
  
  // Calculate intrinsic scores for each candle
  // For the first candle, use its own open as reference
  const firstIntrinsic = firstCandle.close > firstCandle.open ? 1 : 
                        firstCandle.close < firstCandle.open ? -1 : 0;
  
  // For the second candle, use the first candle's body as reference
  const prevBodyHigh = Math.max(firstCandle.open, firstCandle.close);
  const prevBodyLow = Math.min(firstCandle.open, firstCandle.close);
  const secondIntrinsic = getIntrinsicScore(secondCandle, prevBodyHigh, prevBodyLow);
  
  // Cumulative score is the sum of the two intrinsic scores
  const cumulativeScore = firstIntrinsic + secondIntrinsic;
  
  // Use the second candle's intrinsic as the reported intrinsic score
  const intrinsicScore = secondIntrinsic;
  
  // Calculate components based on both candles
  const priceChange = (secondCandle.close - firstCandle.open) / firstCandle.open;
  const volatility = Math.max(
    (firstCandle.high - firstCandle.low) / firstCandle.open,
    (secondCandle.high - secondCandle.low) / secondCandle.open
  );
  
  return {
    timestamp: new Date(secondCandle.datetime),
    intrinsicScore,
    cumulativeScore,
    components: {
      priceChange,
      volumeRatio: 1.0,
      momentum: priceChange,
      volatility
    },
    signal: getBlackjackSignal(cumulativeScore)
  };
}

/**
 * Helper function to determine if a cumulative score triggers a signal
 * @param cumulativeScore - The cumulative blackjack score
 * @returns 'LONG' if score >= threshold, 'SHORT' if score <= threshold, 'NEUTRAL' otherwise
 */
export function getBlackjackSignal(cumulativeScore: number): 'LONG' | 'SHORT' | 'NEUTRAL' {
  if (cumulativeScore >= BJ_GOLD_THRESHOLD_LONG) {
    return 'LONG';
  }
  if (cumulativeScore <= BJ_GOLD_THRESHOLD_SHORT) {
    return 'SHORT';
  }
  return 'NEUTRAL';
}
