// src/utils/forensicsLogger.ts
// Forensics logger for HA/OHLC pattern detection miss comparisons
// Logs patterns missed by OHLC but triggered by HA (and vice versa) with full candle shape metrics

import { CandlestickData } from '../models/ChartTypes';
import { logDebug, isChannelEnabled } from './debug';

export interface PatternMiss {
  patternName: string;
  candleIndex: number;
  timestamp: string;
  detectedBy: 'HA_ONLY' | 'OHLC_ONLY' | 'BOTH';
  missReason: string;
  candleMetrics: {
    original: CandleShapeMetrics;
    heikinAshi: CandleShapeMetrics;
    comparison: CandleComparisonMetrics;
  };
  confidence?: number;
  strength?: number;
}

export interface CandleShapeMetrics {
  open: number;
  high: number;
  low: number;
  close: number;
  bodySize: number;
  upperWick: number;
  lowerWick: number;
  totalRange: number;
  bodyPosition: number; // Position of body within range (0-1)
  isDoji: boolean;
  isBullish: boolean;
}

export interface CandleComparisonMetrics {
  bodySizeDiff: number;
  rangeDiff: number;
  smoothingFactor: number;
  noiseReduction: number;
  trendClarity: number;
  wickReduction: number;
}

/**
 * Calculates comprehensive candle shape metrics for forensic analysis
 */
export function calculateCandleMetrics(candle: CandlestickData): CandleShapeMetrics {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const bodyPosition = totalRange > 0 ? (Math.min(candle.open, candle.close) - candle.low) / totalRange : 0.5;
  
  return {
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    bodySize,
    upperWick,
    lowerWick,
    totalRange,
    bodyPosition,
    isDoji: totalRange > 0 ? (bodySize / totalRange) <= 0.1 : true,
    isBullish: candle.close > candle.open
  };
}

/**
 * Calculates comparison metrics between OHLC and HA candles
 */
export function calculateComparisonMetrics(
  ohlcMetrics: CandleShapeMetrics,
  haMetrics: CandleShapeMetrics
): CandleComparisonMetrics {
  const bodySizeDiff = haMetrics.bodySize - ohlcMetrics.bodySize;
  const rangeDiff = haMetrics.totalRange - ohlcMetrics.totalRange;
  const wickReduction = (ohlcMetrics.upperWick + ohlcMetrics.lowerWick) - (haMetrics.upperWick + haMetrics.lowerWick);
  
  // Smoothing factor: how much HA reduces volatility
  const smoothingFactor = ohlcMetrics.totalRange > 0 ? 
    Math.abs(rangeDiff) / ohlcMetrics.totalRange : 0;
  
  // Noise reduction: how much HA reduces wick noise
  const noiseReduction = (ohlcMetrics.upperWick + ohlcMetrics.lowerWick) > 0 ?
    wickReduction / (ohlcMetrics.upperWick + ohlcMetrics.lowerWick) : 0;
  
  // Trend clarity: how much HA improves body-to-range ratio
  const ohlcBodyRatio = ohlcMetrics.totalRange > 0 ? ohlcMetrics.bodySize / ohlcMetrics.totalRange : 0;
  const haBodyRatio = haMetrics.totalRange > 0 ? haMetrics.bodySize / haMetrics.totalRange : 0;
  const trendClarity = haBodyRatio - ohlcBodyRatio;
  
  return {
    bodySizeDiff,
    rangeDiff,
    smoothingFactor,
    noiseReduction,
    trendClarity,
    wickReduction
  };
}

/**
 * Logs patterns missed by OHLC but triggered by HA (and vice versa)
 * with full candle shape metrics for forensic analysis
 */
export function logHAMissComparisons(
  patternName: string,
  ohlcCandles: CandlestickData[],
  haCandles: CandlestickData[],
  ohlcResults: any[],
  haResults: any[]
): void {
  if (!isChannelEnabled('DEBUG_PATTERN_DETECT')) {
    return;
  }

  const misses: PatternMiss[] = [];

  // Find patterns detected by HA but missed by OHLC
  haResults.forEach(haPattern => {
    const matchingOHLC = ohlcResults.find(ohlc => 
      Math.abs(ohlc.index - haPattern.index) <= 2
    );
    
    if (!matchingOHLC) {
      const originalCandle = ohlcCandles[haPattern.index];
      const haCandle = haCandles[haPattern.index];
      
      if (originalCandle && haCandle) {
        const ohlcMetrics = calculateCandleMetrics(originalCandle);
        const haMetrics = calculateCandleMetrics(haCandle);
        const comparison = calculateComparisonMetrics(ohlcMetrics, haMetrics);
        
        misses.push({
          patternName,
          candleIndex: haPattern.index,
          timestamp: originalCandle.datetime,
          detectedBy: 'HA_ONLY',
          missReason: `HA smoothing revealed pattern missed by OHLC noise. Smoothing factor: ${comparison.smoothingFactor.toFixed(3)}, Noise reduction: ${comparison.noiseReduction.toFixed(3)}`,
          candleMetrics: {
            original: ohlcMetrics,
            heikinAshi: haMetrics,
            comparison
          },
          confidence: haPattern.confidence,
          strength: haPattern.strength || haPattern.strengthScore
        });
      }
    }
  });

  // Find patterns detected by OHLC but missed by HA
  ohlcResults.forEach(ohlcPattern => {
    const matchingHA = haResults.find(ha => 
      Math.abs(ha.index - ohlcPattern.index) <= 2
    );
    
    if (!matchingHA) {
      const originalCandle = ohlcCandles[ohlcPattern.index];
      const haCandle = haCandles[ohlcPattern.index];
      
      if (originalCandle && haCandle) {
        const ohlcMetrics = calculateCandleMetrics(originalCandle);
        const haMetrics = calculateCandleMetrics(haCandle);
        const comparison = calculateComparisonMetrics(ohlcMetrics, haMetrics);
        
        misses.push({
          patternName,
          candleIndex: ohlcPattern.index,
          timestamp: originalCandle.datetime,
          detectedBy: 'OHLC_ONLY',
          missReason: `HA smoothing filtered out pattern detected by OHLC. Possible noise or over-smoothing. Smoothing factor: ${comparison.smoothingFactor.toFixed(3)}`,
          candleMetrics: {
            original: ohlcMetrics,
            heikinAshi: haMetrics,
            comparison
          },
          confidence: ohlcPattern.confidence,
          strength: ohlcPattern.strength || ohlcPattern.strengthScore
        });
      }
    }
  });

  // Log comprehensive forensics report
  if (misses.length > 0) {
    logDebug('DEBUG_PATTERN_DETECT', `[FORENSICS] ${patternName} Miss Analysis:`, {
      totalMisses: misses.length,
      haOnlyMisses: misses.filter(m => m.detectedBy === 'HA_ONLY').length,
      ohlcOnlyMisses: misses.filter(m => m.detectedBy === 'OHLC_ONLY').length,
      haAdvantage: misses.filter(m => m.detectedBy === 'HA_ONLY').length - misses.filter(m => m.detectedBy === 'OHLC_ONLY').length,
      summary: {
        haBetter: misses.filter(m => m.detectedBy === 'HA_ONLY').length > misses.filter(m => m.detectedBy === 'OHLC_ONLY').length,
        avgSmoothingFactor: misses.reduce((sum, m) => sum + m.candleMetrics.comparison.smoothingFactor, 0) / misses.length,
        avgNoiseReduction: misses.reduce((sum, m) => sum + m.candleMetrics.comparison.noiseReduction, 0) / misses.length
      }
    });

    // Log detailed miss analysis for first few misses
    misses.slice(0, 3).forEach((miss, index) => {
      logDebug('DEBUG_PATTERN_DETECT', `[FORENSICS] ${patternName} Miss Detail ${index + 1}:`, {
        detectedBy: miss.detectedBy,
        candleIndex: miss.candleIndex,
        timestamp: miss.timestamp,
        reason: miss.missReason,
        confidence: miss.confidence?.toFixed(3) || 'N/A',
        candleComparison: {
          ohlcBodySize: miss.candleMetrics.original.bodySize.toFixed(4),
          haBodySize: miss.candleMetrics.heikinAshi.bodySize.toFixed(4),
          ohlcRange: miss.candleMetrics.original.totalRange.toFixed(4),
          haRange: miss.candleMetrics.heikinAshi.totalRange.toFixed(4),
          smoothingFactor: miss.candleMetrics.comparison.smoothingFactor.toFixed(4),
          noiseReduction: miss.candleMetrics.comparison.noiseReduction.toFixed(4),
          trendClarity: miss.candleMetrics.comparison.trendClarity.toFixed(4)
        }
      });
    });
  } else {
    logDebug('DEBUG_PATTERN_DETECT', `[FORENSICS] ${patternName}: Perfect agreement between HA and OHLC detection - no misses detected`);
  }
}

/**
 * Exports forensics data for external analysis
 */
export function exportForensicsData(misses: PatternMiss[]): string {
  const csvHeader = 'PatternName,CandleIndex,Timestamp,DetectedBy,MissReason,Confidence,OHLCBodySize,HABodySize,OHLCRange,HARange,SmoothingFactor,NoiseReduction,TrendClarity\n';
  
  const csvRows = misses.map(miss => [
    miss.patternName,
    miss.candleIndex,
    miss.timestamp,
    miss.detectedBy,
    `"${miss.missReason}"`,
    miss.confidence?.toFixed(3) || 'N/A',
    miss.candleMetrics.original.bodySize.toFixed(6),
    miss.candleMetrics.heikinAshi.bodySize.toFixed(6),
    miss.candleMetrics.original.totalRange.toFixed(6),
    miss.candleMetrics.heikinAshi.totalRange.toFixed(6),
    miss.candleMetrics.comparison.smoothingFactor.toFixed(6),
    miss.candleMetrics.comparison.noiseReduction.toFixed(6),
    miss.candleMetrics.comparison.trendClarity.toFixed(6)
  ].join(','));

  return csvHeader + csvRows.join('\n');
}
