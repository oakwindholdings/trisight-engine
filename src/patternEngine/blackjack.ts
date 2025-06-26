// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/blackjack.ts
// Implements Intrinsic and Cumulative Blackjack scoring for Goldmine signal qualification
// Focuses on the first full Step candle for scoring
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT

import { Candle, BlackjackScore } from '../types/pattern';
import { BJ_GOLD_THRESHOLD_LONG, BJ_GOLD_THRESHOLD_SHORT } from '../constants/pattern';
import { logDebug } from '../utils/debug';

/**
 * Calculate the intrinsic score for a single candle based on price and volume
 * relationship compared to the previous candle.
 * 
 * @param candle - The current candle to score
 * @param prevCandle - The previous candle for comparison
 * @returns +1 for Price↑ & Volume↑, -1 for Price↓ & Volume↑, 0 for mixed/other
 */
export function getIntrinsicScore(
  candle: Candle,
  prevCandle: Candle
): -1 | 0 | 1 {
  const priceUp = candle.close > prevCandle.close;
  const priceDown = candle.close < prevCandle.close;
  const volumeUp = candle.volume > prevCandle.volume;
  
  // Apply standardized Blackjack scoring rule
  if (priceUp && volumeUp) {
    return 1;  // Price↑ & Volume↑ = Bullish signal
  }
  
  if (priceDown && volumeUp) {
    return -1; // Price↓ & Volume↑ = Bearish signal (unusual volume with price decline)
  }
  
  // All other cases (Price↑ & Volume↓, Price↓ & Volume↓, Price flat, Volume flat) = 0
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
  // For the first candle, use simple price direction as fallback (no volume comparison possible)
  const firstIntrinsic = firstCandle.close > firstCandle.open ? 1 : 
                        firstCandle.close < firstCandle.open ? -1 : 0;
  
  // For the second candle, use the standardized price/volume rule
  const secondIntrinsic = getIntrinsicScore(secondCandle, firstCandle);
  
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
export function computeRollingBlackjackScores(
  candles: Candle[],
  window: number = 5
): { timestamp: number; score: number }[] {
  if (!candles || candles.length === 0) return [];
  // Intrinsic per-candle (+1/0/-1) relative to previous candle
  const intrinsic: number[] = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const priceUp = curr.close > prev.close;
    const priceDown = curr.close < prev.close;
    // Treat flat volume as volume down (per spec)
    const volumeUp = curr.volume > prev.volume;
    const volumeDown = curr.volume < prev.volume; // flat will be false for both

    if (priceUp && volumeUp) intrinsic[i] = 1;
    else if (priceDown && volumeUp) intrinsic[i] = -1;
    else intrinsic[i] = 0;
  }

  // Rolling sum
  const rolling: { timestamp: number; score: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    let sum = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += intrinsic[j];
    }
    rolling.push({ timestamp: candles[i].timestamp ?? (candles[i] as any).datetime ?? i, score: sum });
  }

  logDebug('DEBUG_PATTERN_DETECT', '[Blackjack] Rolling Score Calculated:', {
    window,
    firstFive: rolling.slice(0, 5)
  });

  return rolling;
}

/**
 * Compute cumulative Blackjack score for an Escalator step between start & breakout candles (inclusive).
 */
export function computeTargetBlackjackScore(
  candles: Candle[],
  startIndex: number,
  endIndex: number
): number {
  if (!candles || candles.length === 0) return 0;
  if (endIndex <= startIndex) return 0;

  let score = 0;
  for (let i = startIndex + 1; i <= endIndex && i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const priceUp = curr.close > prev.close;
    const priceDown = curr.close < prev.close;
    const volumeUp = curr.volume > prev.volume;
    const volumeDown = curr.volume < prev.volume;

    if (priceUp && volumeUp) score += 1;
    else if (priceDown && volumeUp) score -= 1;
    // else 0, no change
  }

  return score;
}

export function getBlackjackSignal(cumulativeScore: number): 'LONG' | 'SHORT' | 'NEUTRAL' {
  if (cumulativeScore >= BJ_GOLD_THRESHOLD_LONG) {
    return 'LONG';
  }
  if (cumulativeScore <= BJ_GOLD_THRESHOLD_SHORT) {
    return 'SHORT';
  }
  return 'NEUTRAL';
}
