// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/rocketman.ts
// Wrapper for RocketmanDetector to provide consistent pattern engine interface
// Detects rapid price acceleration with volume confirmation
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// HEIKIN-ASHI: Enhanced acceleration detection with HA smoothing - reduces false breakouts, improves momentum analysis

import { Candle } from '../types/pattern';
import { RocketmanDetector } from '../utils/patternDetection/RocketmanDetector';
import { logDebug } from '../utils/debug';

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
 * @param candles - Array of candlestick data
 * @returns Array of detected rocketman patterns
 */
export function detectRocketman(candles: Candle[]): RocketmanDetection[] {
  logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length === 0) {
    logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] No candles provided');
    return [];
  }

  // Convert Candle[] to CandlestickData[] for the detector
  const candlestickData = candles.map(candle => ({
    datetime: candle.datetime,
    timestamp: new Date(candle.datetime).getTime(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }));

  // Use the restored RocketmanDetector
  const detector = new RocketmanDetector();
  const rocketmanPatterns = detector.detect(candlestickData);
  
  logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] Detection complete. Found', rocketmanPatterns.length, 'patterns');
  
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

    // DEBUG_PATTERN_DETECT: Log each detected pattern
    logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] Detected pattern at', peakIndex, 'with confidence', pattern.confidence, {
      direction: pattern.direction,
      accelerationRate: pattern.accelerationRate,
      intensity: pattern.intensity,
      momentumScore: pattern.momentumScore,
      signalStrength: pattern.signalStrength,
      peakPrice: pattern.peakPrice,
      volumeConfirmation: pattern.volumeConfirmation
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

  logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] Converted', detections.length, 'patterns to detections');
  
  return detections;
}
