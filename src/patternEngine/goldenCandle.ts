// src/patternEngine/goldenCandle.ts
// Detects golden candle patterns in candlestick data
// Golden candles are high-confidence breakout candles confirmed by prior step consolidation and strong Blackjack scores
// HEIKIN-ASHI: Improved breakout signal clarity with HA smoothing - reduces noise in consolidation phases, enhances trend confirmation

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';

export interface GoldenCandlePattern {
  index: number;
  timestamp: Date;
  direction: 'LONG' | 'SHORT';
  goldenScore: number;
  intrinsicScore: number;
  cumulativeScore: number;
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  candlePrice: number;
  stepBoxCeiling?: number;
  stepBoxFloor?: number;
  confidence: number;
}

export interface GoldenCandleCandidate {
  index: number;
  timestamp: Date;
  intrinsicScore: number;
  cumulativeScore: number;
  stepContinuanceCount: number;
  stepBreakoutCount: number;
  stepIntrinsicCount: number;
  candlePrice: number;
  failureReason: string;
  nearMissType: 'CONTINUATION_LOW' | 'INTRINSIC_ZERO' | 'CUMULATIVE_WEAK' | 'NO_BREAKOUT';
}

/**
 * Detects golden candle patterns in candlestick data
 * @param candles - Array of candlestick data
 * @param stepIntrinsicCounts - Array of step intrinsic counts per candle
 * @param stepBreakoutCounts - Array of step breakout counts per candle
 * @param stepContinuanceCounts - Array of step continuance counts per candle
 * @param bjIntrinsic - Array of blackjack intrinsic scores per candle
 * @param bjCumulative - Array of blackjack cumulative scores per candle
 * @returns Array of detected golden candle patterns
 */
export function detectGoldenCandle(
  candles: Candle[],
  stepIntrinsicCounts: number[] = [],
  stepBreakoutCounts: number[] = [],
  stepContinuanceCounts: number[] = [],
  bjIntrinsic: number[] = [],
  bjCumulative: number[] = []
): GoldenCandlePattern[] {
  logDebug('DEBUG_PATTERN_DETECT', '[GoldenCandle] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    logDebug('DEBUG_PATTERN_DETECT', '[GoldenCandle] No candles provided for detection');
    return [];
  }

  const goldenCandles: GoldenCandlePattern[] = [];

  // Iterate through candles to find golden candle candidates
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    
    // Get metrics for current candle
    const intrinsicScore = bjIntrinsic[i] || 0;
    const cumulativeScore = bjCumulative[i] || 0;
    const continuanceCount = stepContinuanceCounts[i] || 0;
    const intrinsicCount = stepIntrinsicCounts[i] || 0;
    const breakoutCount = stepBreakoutCounts[i] || 0;

    // Debug logging for current candle evaluation
    logDebug('DEBUG_PATTERN_DETECT', `[GoldenCandle] Evaluating candle ${i}:`, {
      candleClose: candle.close.toFixed(2),
      intrinsicScore: intrinsicScore,
      cumulativeScore: cumulativeScore,
      continuanceCount: continuanceCount,
      intrinsicCount: intrinsicCount,
      breakoutCount: breakoutCount
    });

    // 1. Check continuation count requirement (≥ 2)
    if (continuanceCount < 2) {
      logDebug('DEBUG_PATTERN_DETECT', `[GoldenCandle] Candle ${i} rejected: continuation count ${continuanceCount} < 2`);
      continue;
    }

    // 2. Check intrinsic score requirement (= ±1)
    if (Math.abs(intrinsicScore) !== 1) {
      logDebug('DEBUG_PATTERN_DETECT', `[GoldenCandle] Candle ${i} rejected: intrinsic score ${intrinsicScore} ≠ ±1`);
      continue;
    }

    // 3. Check cumulative score requirements
    let direction: 'LONG' | 'SHORT';
    if (cumulativeScore >= 2) {
      direction = 'LONG';
    } else if (cumulativeScore <= -2) {
      direction = 'SHORT';
    } else {
      logDebug('DEBUG_PATTERN_DETECT', `[GoldenCandle] Candle ${i} rejected: cumulative score ${cumulativeScore} doesn't meet ≥2 (LONG) or ≤-2 (SHORT)`);
      continue;
    }

    // 4. Check for step box breakout (candle closes beyond ceiling/floor)
    // Note: Step box ceiling/floor detection would require step box data
    // For now, we'll use a simplified approach based on continuation count and breakout count
    const hasBreakout = breakoutCount > 0;
    
    if (!hasBreakout) {
      logDebug('DEBUG_PATTERN_DETECT', `[GoldenCandle] Candle ${i} rejected: no step box breakout detected`);
      continue;
    }

    // 5. Calculate golden score and confidence
    const goldenScore = Math.abs(intrinsicScore) + Math.abs(cumulativeScore) + continuanceCount;
    const confidence = Math.min(goldenScore / 10.0, 1.0); // Normalize to 0-1 scale

    // 6. Create golden candle pattern
    const goldenCandle: GoldenCandlePattern = {
      index: i,
      timestamp: new Date(candle.datetime),
      direction: direction,
      goldenScore: goldenScore,
      intrinsicScore: intrinsicScore,
      cumulativeScore: cumulativeScore,
      stepIntrinsicCount: intrinsicCount,
      stepBreakoutCount: breakoutCount,
      stepContinuanceCount: continuanceCount,
      candlePrice: candle.close,
      confidence: confidence
    };

    // Add comprehensive DEBUG_PATTERN_DETECT logging
    if (typeof logDebug === 'function') {
      logDebug('DEBUG_PATTERN_DETECT', `Golden Candle detected`, {
        index: i,
        direction: direction,
        goldenScore: goldenScore.toFixed(2),
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        continuanceCount: continuanceCount,
        intrinsicCount: intrinsicCount,
        breakoutCount: breakoutCount,
        candlePrice: candle.close.toFixed(2),
        confidence: confidence.toFixed(2),
        timestamp: candle.datetime,
        signalStrength: confidence >= 0.8 ? 'STRONG' : confidence >= 0.6 ? 'MEDIUM' : 'WEAK'
      });
    }

    goldenCandles.push(goldenCandle);
  }

  logDebug('DEBUG_PATTERN_DETECT', '[GoldenCandle] Detection complete. Found', goldenCandles.length, 'golden candles');
  
  return goldenCandles;
}

/**
 * Detects Golden Candle candidates (near-misses) for forensic analysis
 * Uses relaxed criteria to identify candles that almost meet Golden Candle requirements
 * @param candles - Array of candlestick data
 * @param stepIntrinsicCounts - Array of step intrinsic counts per candle
 * @param stepBreakoutCounts - Array of step breakout counts per candle
 * @param stepContinuanceCounts - Array of step continuance counts per candle
 * @param bjIntrinsic - Array of blackjack intrinsic scores per candle
 * @param bjCumulative - Array of blackjack cumulative scores per candle
 * @returns Array of Golden Candle candidates for forensic overlay
 */
export function detectGoldenCandleCandidates(
  candles: Candle[],
  stepIntrinsicCounts: number[] = [],
  stepBreakoutCounts: number[] = [],
  stepContinuanceCounts: number[] = [],
  bjIntrinsic: number[] = [],
  bjCumulative: number[] = []
): GoldenCandleCandidate[] {
  logDebug('DEBUG_PATTERN_DETECT', '[GOLDMINE_FORENSICS] Starting forensic candidate detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    logDebug('DEBUG_PATTERN_DETECT', '[GOLDMINE_FORENSICS] No candles provided for forensic detection');
    return [];
  }

  const candidates: GoldenCandleCandidate[] = [];

  // Iterate through candles to find near-miss candidates with relaxed criteria
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    
    // Get metrics for current candle
    const intrinsicScore = bjIntrinsic[i] || 0;
    const cumulativeScore = bjCumulative[i] || 0;
    const continuanceCount = stepContinuanceCounts[i] || 0;
    const intrinsicCount = stepIntrinsicCounts[i] || 0;
    const breakoutCount = stepBreakoutCounts[i] || 0;

    // Relaxed criteria for forensic analysis:
    // 1. Step breakout confirmed (same as golden candle)
    // 2. Step continuation ≥ 1 (instead of 2)
    // 3. Intrinsic Score ∈ {0, 1} (includes zero for near-misses)
    // 4. Cumulative Score ∈ [1, 2) (just below qualification threshold)

    let isCandidate = false;
    let failureReason = '';
    let nearMissType: GoldenCandleCandidate['nearMissType'] = 'NO_BREAKOUT';

    // Check if this candle has step breakout confirmed
    const hasBreakout = breakoutCount > 0;
    if (!hasBreakout) {
      // Skip candles without any breakout activity
      continue;
    }

    // Check relaxed continuation count (≥ 1 instead of ≥ 2)
    if (continuanceCount >= 1 && continuanceCount < 2) {
      isCandidate = true;
      failureReason = `Continuation count ${continuanceCount} below Golden Candle threshold (≥2)`;
      nearMissType = 'CONTINUATION_LOW';
    }

    // Check intrinsic score (0 or 1, missing the ±1 requirement)
    if (intrinsicScore === 0) {
      isCandidate = true;
      failureReason = `Intrinsic score ${intrinsicScore} is neutral (Golden Candle requires ±1)`;
      nearMissType = 'INTRINSIC_ZERO';
    } else if (Math.abs(intrinsicScore) === 1) {
      // Good intrinsic score, check cumulative
      if (cumulativeScore >= 1 && cumulativeScore < 2) {
        isCandidate = true;
        failureReason = `Cumulative score ${cumulativeScore} below LONG threshold (≥2)`;
        nearMissType = 'CUMULATIVE_WEAK';
      } else if (cumulativeScore <= -1 && cumulativeScore > -2) {
        isCandidate = true;
        failureReason = `Cumulative score ${cumulativeScore} above SHORT threshold (≤-2)`;
        nearMissType = 'CUMULATIVE_WEAK';
      }
    }

    if (isCandidate) {
      const candidate: GoldenCandleCandidate = {
        index: i,
        timestamp: new Date(candle.datetime),
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        stepContinuanceCount: continuanceCount,
        stepBreakoutCount: breakoutCount,
        stepIntrinsicCount: intrinsicCount,
        candlePrice: candle.close,
        failureReason: failureReason,
        nearMissType: nearMissType
      };

      // Comprehensive forensic logging
      logDebug('DEBUG_PATTERN_DETECT', `[GOLDMINE_FORENSICS] Golden Candle candidate detected`, {
        idx: i,
        continuationCount: continuanceCount,
        intrinsicScore: intrinsicScore,
        cumulativeScore: cumulativeScore,
        breakoutCount: breakoutCount,
        failureReason: failureReason,
        nearMissType: nearMissType,
        candlePrice: candle.close.toFixed(2),
        timestamp: candle.datetime
      });

      candidates.push(candidate);
    }
  }

  logDebug('DEBUG_PATTERN_DETECT', '[GOLDMINE_FORENSICS] Forensic detection complete. Found', candidates.length, 'Golden Candle candidates');
  
  return candidates;
}

/**
 * Validates golden candle criteria
 * @param intrinsicScore - Blackjack intrinsic score
 * @param cumulativeScore - Blackjack cumulative score
 * @param continuanceCount - Step continuance count
 * @returns boolean indicating if criteria are met
 */
export function validateGoldenCandleCriteria(
  intrinsicScore: number,
  cumulativeScore: number,
  continuanceCount: number
): boolean {
  // Intrinsic score must be exactly ±1
  if (Math.abs(intrinsicScore) !== 1) {
    return false;
  }
  
  // Continuation count must be ≥ 2
  if (continuanceCount < 2) {
    return false;
  }
  
  // Cumulative score must be ≥ 2 (long) or ≤ -2 (short)
  if (cumulativeScore < 2 && cumulativeScore > -2) {
    return false;
  }
  
  return true;
}
