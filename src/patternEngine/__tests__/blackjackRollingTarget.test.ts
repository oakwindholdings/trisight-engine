// src/patternEngine/__tests__/blackjackRollingTarget.test.ts
// Unit tests for computeRollingBlackjackScores and computeTargetBlackjackScore helpers
// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit → context → render.

import {
  computeRollingBlackjackScores,
  computeTargetBlackjackScore
} from '../blackjack';
import { Candle } from '../../types/pattern';

/**
 * Helper to fabricate a Candle quickly.
 */
function makeCandle(close: number, volume: number): Candle {
  return {
    datetime: '2025-01-01T00:00:00',
    timestamp: Date.now(),
    open: close, // open set equal for simplicity – intrinsic logic only uses close from previous bar
    high: close,
    low: close,
    close,
    volume
  };
}

/**
 * Rolling Blackjack Score tests
 */
describe('computeRollingBlackjackScores', () => {
  it('should compute expected rolling sums over default 5-bar window', () => {
    // Build deterministic candle series
    const candles: Candle[] = [
      makeCandle(100, 1000), // index 0 (no intrinsic score)
      makeCandle(101, 1100), // +1 (price↑ volume↑)
      makeCandle(102, 1050), // 0  (price↑ volume↓)
      makeCandle(101, 1150), // -1 (price↓ volume↑)
      makeCandle(101, 1000), // 0  (price flat volume↓)
      makeCandle(100, 1200)  // -1 (price↓ volume↑)
    ];

    const result = computeRollingBlackjackScores(candles);
    const scores = result.map(r => r.score);

    /* Expected intrinsic array => [0,+1,0,-1,0,-1]
       Rolling sums (window 5):
       idx0: 0
       idx1: 1
       idx2: 1
       idx3: 0
       idx4: 0
       idx5: -1
    */
    expect(scores).toEqual([0, 1, 1, 0, 0, -1]);
  });

  it('should return empty array for no candles', () => {
    expect(computeRollingBlackjackScores([])).toEqual([]);
  });
});

/**
 * Target Blackjack Score tests
 */
describe('computeTargetBlackjackScore', () => {
  it('should accumulate scores between floor and breakout candles inclusively', () => {
    /* Candle construction:
       idx0: base bar – not part of target window
       idx1: floor bar (startIndex)
       idx2: price↑ volume↑  => +1
       idx3: price↓ volume↑  => -1
       idx4: price↑ volume↑  => +1   (breakout, endIndex)
     */
    const candles: Candle[] = [
      makeCandle(100, 1000), // 0
      makeCandle( 99, 1000), // 1 – floor
      makeCandle(100, 1100), // 2 – +1
      makeCandle( 99, 1200), // 3 – -1
      makeCandle(100, 1300)  // 4 – +1 (breakout)
    ];

    const score = computeTargetBlackjackScore(candles, 1, 4);
    expect(score).toBe(1); // +1 + -1 + +1 = +1
  });

  it('should return 0 when endIndex <= startIndex', () => {
    const candles: Candle[] = [makeCandle(100, 1000), makeCandle(101, 1100)];
    expect(computeTargetBlackjackScore(candles, 1, 1)).toBe(0);
  });

  it('should return 0 for empty candle array', () => {
    expect(computeTargetBlackjackScore([], 0, 0)).toBe(0);
  });
});
