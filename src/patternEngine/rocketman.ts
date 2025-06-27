// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/rocketman.ts
// Wrapper for RocketmanDetector to provide consistent pattern engine interface
// Detects rapid price acceleration with volume confirmation
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// HEIKIN-ASHI: Enhanced acceleration detection with HA smoothing - reduces false breakouts, improves momentum analysis
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle } from '../types/pattern';
import { RocketmanDetector } from '../utils/patternDetection/RocketmanDetector';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

export interface RocketmanDetection {
  startIndex: number;
  endIndex: number;
  stepRef: string;
  direction: 'BULLISH' | 'BEARISH';
  accelerationRate: number;
  peakIndex: number;
  peakTime: Date;
  peakPrice: number;
  intensity: number;
  confidence: number;
  priceChanges: number[];
  volumeChanges: number[];
  momentumScore: number;
  volumeConfirmation: number;
  signalStrength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK';
  adaptiveThreshold: number;
}

/**
 * Detects rocketman acceleration patterns in candlestick data
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * @param candles - Array of candlestick data
 * @returns Array of detected rocketman patterns
 */
export function detectRocketman(candles: Candle[]): RocketmanDetection[] {
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] No candles provided');
    return [];
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);

  // Convert HA Candle[] to CandlestickData[] for the detector using HA metrics exclusively
  const haCandlestickData = haCandles.map(haCandle => ({
    datetime: haCandle.datetime,
    timestamp: new Date(haCandle.datetime).getTime(),
    open: haCandle.open,    // Use HA open
    high: haCandle.high,    // Use HA high
    low: haCandle.low,      // Use HA low
    close: haCandle.close,  // Use HA close
    volume: haCandle.volume // Volume remains from original candle
  }));

  // Use the restored RocketmanDetector with HA data
  const detector = new RocketmanDetector();
  const rocketmanPatterns = detector.detect(haCandlestickData);
  
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] Detection complete. Found', rocketmanPatterns.length, 'patterns with HA compliance');
  
  // Convert RocketmanPattern[] to RocketmanDetection[] for pattern bus compatibility
  const detections: RocketmanDetection[] = rocketmanPatterns.map((pattern, index) => {
    // Find start and end indices in the original candles array
    const startIndex = candles.findIndex(candle => 
      new Date(candle.datetime).getTime() === pattern.startTime.getTime()
    );
    const endIndex = candles.findIndex(candle => 
      new Date(candle.datetime).getTime() === pattern.endTime.getTime()
    );
    
    // Find peak index
    const peakIndex = candles.findIndex(candle => 
      new Date(candle.datetime).getTime() === pattern.peakTime.getTime()
    );

    // DEBUG_PATTERN_DETECT: Log each detected pattern with HA compliance
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] Detected HA pattern at', peakIndex, 'with confidence', pattern.confidence, {
      direction: pattern.direction,
      accelerationRate: pattern.accelerationRate,
      intensity: pattern.intensity,
      dickOLearyCompliant: true
    });

    return {
      startIndex: startIndex >= 0 ? startIndex : 0,
      endIndex: endIndex >= 0 ? endIndex : candles.length - 1,
      stepRef: `${startIndex}-${endIndex}`,
      direction: pattern.direction,
      accelerationRate: pattern.accelerationRate,
      peakIndex: peakIndex >= 0 ? peakIndex : 0,
      peakTime: pattern.peakTime,
      peakPrice: pattern.peakPrice,
      intensity: pattern.intensity,
      confidence: pattern.confidence,
      priceChanges: pattern.priceChanges,
      volumeChanges: pattern.volumeChanges,
      momentumScore: pattern.momentumScore,
      volumeConfirmation: pattern.volumeConfirmation,
      signalStrength: pattern.signalStrength,
      adaptiveThreshold: pattern.adaptiveThreshold
    };
  });

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] Converted', detections.length, 'patterns to detections');
  
  return detections;
}
