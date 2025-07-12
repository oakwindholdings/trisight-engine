// src/utils/patternQualifiers.ts
// Near-miss pattern qualification utilities for forensic debugging
// DICK O'LEARY COMPLIANCE: Strict HA-only breakout logic - no OHLC substitution allowed

import { Candle } from '../types/pattern';
import { convertToHeikinAshi, getHABodySize } from './candleTransform';
import { logDebug } from './debug';

/**
 * Checks if a candle nearly qualifies for Golden Candle breakout
 * using strict HA body/wick breakout logic according to Dick O'Leary standards
 * 
 * @param candle - The candle to evaluate for near-miss qualification
 * @param previousCandles - Array of previous candles for context (minimum 5 recommended)
 * @returns boolean indicating if this is a near-miss Golden Candle candidate
 */
export function isNearMissGoldenCandle(candle: Candle, previousCandles: Candle[] = []): boolean {
  if (!candle || previousCandles.length < 3) {
    return false;
  }

  // DICK O'LEARY COMPLIANCE: Convert all candles to HA for analysis
  const allCandles = [...previousCandles, candle];
  const haCandles = convertToHeikinAshi(allCandles);
  const haCandle = haCandles[haCandles.length - 1]; // Current HA candle
  const prevHACandles = haCandles.slice(0, -1); // Previous HA candles

  // Near-miss criteria: relaxed thresholds for forensic detection
  const nearMissCriteria = {
    minBodySize: 0.005, // Relaxed from strict Golden Candle requirement
    minVolumeRatio: 1.2, // Relaxed volume requirement
    maxWickRatio: 0.4,   // Allow slightly larger wicks
    minBreakoutDistance: 0.002 // Relaxed breakout distance
  };

  let missReasons: string[] = [];
  let qualifyingFactors: string[] = [];

  // DICK O'LEARY COMPLIANCE: Use HA body size for breakout analysis
  const haBodySize = getHABodySize(haCandle);
  const haPriceRange = haCandle.high - haCandle.low;
  const haBodyRatio = haPriceRange > 0 ? haBodySize / haPriceRange : 0;

  // Check HA body size requirement (relaxed)
  if (haBodyRatio >= nearMissCriteria.minBodySize) {
    qualifyingFactors.push(`HA body ratio: ${(haBodyRatio * 100).toFixed(2)}%`);
  } else {
    missReasons.push(`HA body too small: ${(haBodyRatio * 100).toFixed(2)}% < ${(nearMissCriteria.minBodySize * 100).toFixed(2)}%`);
  }

  // Check HA wick requirements (relaxed)
  const haUpperWick = haCandle.high - Math.max(haCandle.open, haCandle.close);
  const haLowerWick = Math.min(haCandle.open, haCandle.close) - haCandle.low;
  const haMaxWick = Math.max(haUpperWick, haLowerWick);
  const haWickRatio = haBodySize > 0 ? haMaxWick / haBodySize : 0;

  if (haWickRatio <= nearMissCriteria.maxWickRatio) {
    qualifyingFactors.push(`HA wick ratio: ${haWickRatio.toFixed(3)}`);
  } else {
    missReasons.push(`HA wick too large: ${haWickRatio.toFixed(3)} > ${nearMissCriteria.maxWickRatio}`);
  }

  // Check HA trend confirmation (bullish/bearish direction)
  const isHABullish = haCandle.close > haCandle.open;
  const isHABearish = haCandle.close < haCandle.open;
  
  if (isHABullish || isHABearish) {
    qualifyingFactors.push(`HA trend: ${isHABullish ? 'bullish' : 'bearish'}`);
  } else {
    missReasons.push('HA doji - no clear trend direction');
  }

  // Check HA breakout potential against recent range
  if (prevHACandles.length >= 3) {
    const recentHAHigh = Math.max(...prevHACandles.slice(-3).map(c => c.high));
    const recentHALow = Math.min(...prevHACandles.slice(-3).map(c => c.low));
    const haBreakoutDistance = isHABullish ? 
      (haCandle.close - recentHAHigh) / recentHAHigh :
      (recentHALow - haCandle.close) / recentHALow;

    if (haBreakoutDistance >= nearMissCriteria.minBreakoutDistance) {
      qualifyingFactors.push(`HA breakout distance: ${(haBreakoutDistance * 100).toFixed(2)}%`);
    } else {
      missReasons.push(`HA breakout distance too small: ${(haBreakoutDistance * 100).toFixed(2)}% < ${(nearMissCriteria.minBreakoutDistance * 100).toFixed(2)}%`);
    }
  }

  // DICK O'LEARY COMPLIANCE: Volume confirmation (if available)
  if (candle.volume && prevHACandles.length >= 3) {
    const avgPrevVolume = prevHACandles.slice(-3).reduce((sum, c) => sum + (c.volume || 0), 0) / 3;
    const volumeRatio = avgPrevVolume > 0 ? candle.volume / avgPrevVolume : 1;

    if (volumeRatio >= nearMissCriteria.minVolumeRatio) {
      qualifyingFactors.push(`Volume ratio: ${volumeRatio.toFixed(2)}x`);
    } else {
      missReasons.push(`Volume too low: ${volumeRatio.toFixed(2)}x < ${nearMissCriteria.minVolumeRatio}x`);
    }
  }

  // Determine if this is a near-miss (has some qualifying factors but not all)
  const isNearMiss = qualifyingFactors.length >= 2 && missReasons.length >= 1;

  // DICK O'LEARY COMPLIANCE: Debug logging for forensic analysis
  if (isNearMiss) {
    logDebug('DEBUG_GOLDEN_MISS', '[Golden Candle Near-Miss] HA forensic detection:', {
      timestamp: candle.timestamp || 'unknown',
      haCandleClose: haCandle.close.toFixed(4),
      haBodySize: haBodySize.toFixed(4),
      haBodyRatio: (haBodyRatio * 100).toFixed(2) + '%',
      haWickRatio: haWickRatio.toFixed(3),
      qualifyingFactors,
      missReasons,
      dickOLearyCompliant: true
    });
  }

  return isNearMiss;
}

/**
 * Gets detailed miss analysis for a candle that nearly qualified for Golden Candle
 * @param candle - The candle to analyze
 * @param previousCandles - Array of previous candles for context
 * @returns Object with detailed miss reasons and qualifying factors
 */
export function getGoldenCandleMissAnalysis(candle: Candle, previousCandles: Candle[] = []) {
  const allCandles = [...previousCandles, candle];
  const haCandles = convertToHeikinAshi(allCandles);
  const haCandle = haCandles[haCandles.length - 1];

  const analysis = {
    isNearMiss: isNearMissGoldenCandle(candle, previousCandles),
    haMetrics: {
      bodySize: getHABodySize(haCandle),
      bodyRatio: getHABodySize(haCandle) / (haCandle.high - haCandle.low),
      upperWick: haCandle.high - Math.max(haCandle.open, haCandle.close),
      lowerWick: Math.min(haCandle.open, haCandle.close) - haCandle.low,
      isBullish: haCandle.close > haCandle.open,
      close: haCandle.close,
      dickOLearyCompliant: true
    },
    timestamp: candle.timestamp || new Date().toISOString()
  };

  return analysis;
}
