// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/rocketman.ts
// Wrapper for RocketmanDetector to provide consistent pattern engine interface
// Detects rapid price acceleration with volume confirmation
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// HEIKIN-ASHI: Enhanced acceleration detection with HA smoothing - reduces false breakouts, improves momentum analysis
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';
import AdaptiveRocketmanDetector from '../utils/patternDetection/AdaptiveRocketmanDetector';
import { CandlestickData } from '../models/ChartTypes';
import { RocketmanPattern } from '../models/PatternTypes';
import { TradeActionSignal, TradeAction, SignalType, emitTradeBiasSignal } from '../utils/trading/TradeActionSignal';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { registerStopLoss } from '../engine/StopLossManager';
import { canEmitSignal } from '../utils/patternDebounceManager';

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

  // Use the AdaptiveRocketmanDetector with HA data (migrated from legacy RocketmanDetector)
  const detector = new AdaptiveRocketmanDetector();
  const rocketmanPatterns = detector.detect(haCandlestickData);
  
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Rocketman] Detection complete. Found', rocketmanPatterns.length, 'patterns with HA compliance');
  
  // Convert RocketmanPattern[] to RocketmanDetection[] for pattern bus compatibility
  const detections: RocketmanDetection[] = rocketmanPatterns.map((pattern: RocketmanPattern, index: number) => {
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
  
  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  detections.forEach(evaluateRocketmanForEntry);
  
  return detections;
}

/**
 * Evaluates Rocketman pattern for entry signals
 * Canonical structure: emits BUY/SHORT signals for momentum acceleration
 * @param rocket - Rocketman detection object
 */
export function evaluateRocketmanForEntry(rocket: RocketmanDetection): void {
  const { direction, confidence, peakTime, peakPrice, accelerationRate, signalStrength, adaptiveThreshold } = rocket;

  // Confidence gate - Only emit strong momentum signals above threshold
  if (confidence < 0.75 || accelerationRate < 0.02 || signalStrength !== 'STRONG') return;

  // Debounce check - prevent rapid repeat emissions for momentum patterns
  const now = Date.now();
  // CRITICAL FIX: Separate pattern detection from trade signal emission
  // Pattern detection and rendering should NEVER be debounced
  const canEmitTradeSignal = canEmitSignal('ROCKETMAN', now);
  
  if (!canEmitTradeSignal && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Rocketman] Trade signal debounced (but pattern will still render)', {
      pattern: 'ROCKETMAN',
      timestamp: new Date(now).toISOString(),
      direction: direction === 'BULLISH' ? 'BULLISH' : 'BEARISH'
    });
  }

  // 🔴 CRITICAL FIX: INVERTED LOGIC - Contrarian entries at momentum extremes
  // BULLISH momentum (price UP) = SHORT at the HIGH (fade the move)
  // BEARISH momentum (price DOWN) = BUY at the LOW (fade the move)  
  const action = direction === 'BULLISH' ? TradeAction.SHORT : TradeAction.BUY;
  const signalType = direction === 'BULLISH' ? SignalType.SHORT_ENTRY : SignalType.LONG_ENTRY;

  // Entry at momentum extremes for contrarian tactical trading
  // BULLISH: SHORT at peak (momentum exhaustion)
  // BEARISH: BUY at trough (momentum exhaustion)
  const logicalEntryPrice = direction === 'BULLISH'
    ? peakPrice  // SHORT at peak for BULLISH momentum exhaustion
    : peakPrice; // BUY at trough for BEARISH momentum exhaustion
  
  // Use peak time as the logical entry timing (when momentum is confirmed)
  // This is the earliest point where tactical entry should be considered
  const logicalEntryTime = peakTime;

  // CRITICAL FIX: Only emit trade signals when debounce allows
  // Pattern detection and rendering continues regardless of debounce
  if (canEmitTradeSignal) {
    // 🔍 AUDIT: Pattern instrumentation - EMIT tracking
    console.log("[EMIT]", "ROCKETMAN", signalType, logicalEntryPrice.toFixed(4), "Confidence:", (confidence * 100).toFixed(1) + "%", "Direction:", direction);
    
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Rocketman',
      confidence,
      price: logicalEntryPrice,
      timestamp: logicalEntryTime,
      reason: `Rocketman momentum confirmed (Accel=${accelerationRate.toFixed(3)}, Strength=${signalStrength})`,
      riskLevel: 'HIGH'
    });

    // Register stop loss for this rocketman entry position
    const positionId = `ROCKETMAN_${peakTime.getTime()}_${direction}_${logicalEntryPrice.toFixed(2)}`;
    const stopLossType = direction === 'BULLISH' ? 'SHORT' : 'LONG'; // Inverted for contrarian entries
    
    // 🔍 AUDIT: Pattern instrumentation - REGISTER STOP tracking
    console.log("[REGISTER STOP]", "ROCKETMAN", stopLossType, "0", "Trail:2", "Price:", logicalEntryPrice.toFixed(4), "Direction:", direction, "(Contrarian)");
    
    registerStopLoss(
      positionId,
      stopLossType,
      0, // Will be updated by StopLossManager with actual candle index
      2, // Trail 2 candles back
      logicalEntryPrice,
      'ROCKETMAN',
      confidence
    );
  }

  // Emit TRADE_BIAS signal for directional momentum bias indication
  const bias = direction === 'BULLISH' ? 'LONG' : 'SHORT';
  emitTradeBiasSignal(
    'ROCKETMAN',
    confidence,
    logicalEntryPrice,
    logicalEntryTime,
    bias,
    `Rocketman directional bias: ${direction} momentum`,
    { riskLevel: 'HIGH' }
  );

  // Enhanced debug logging for signal placement validation
  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Rocketman Entry] Signal emitted', {
      action,
      signalType,
      confidence: (confidence * 100).toFixed(1) + '%',
      accelerationRate: accelerationRate.toFixed(3),
      signalStrength,
      // Signal placement validation data
      originalPeakPrice: peakPrice.toFixed(4),
      logicalEntryPrice: logicalEntryPrice.toFixed(4),
      adaptiveThreshold: adaptiveThreshold.toFixed(4),
      signalAnchoredToConfirmation: true,
      dickOLearyCompliant: true
    });
  }
}

/**
 * Monitors Rocketman pattern for exit signals
 * Canonical structure: emits SELL/COVER signals when momentum fails
 * @param rocket - Rocketman detection object
 * @param livePrice - Current market price
 */
export function monitorRocketmanForExit(rocket: RocketmanDetection, livePrice: number): void {
  const { direction, confidence, peakTime, peakPrice, accelerationRate } = rocket;

  // Confidence gate
  if (confidence < 0.75) return;

  // Check if momentum has failed (price reversal beyond threshold)
  const momentumFailed = 
    (direction === 'BULLISH' && livePrice < peakPrice * (1 - accelerationRate)) ||
    (direction === 'BEARISH' && livePrice > peakPrice * (1 + accelerationRate));

  if (momentumFailed) {
    const action = direction === 'BULLISH' ? TradeAction.SELL : TradeAction.COVER;
    const signalType = direction === 'BULLISH' ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;

    // 🎯 CRITICAL FIX: Use current timestamp for signal emission, not fixed peakTime
    // This ensures each COVER signal has a unique timestamp for correct chart positioning
    const currentTimestamp = new Date();
    
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Rocketman',
      confidence,
      price: livePrice,
      timestamp: currentTimestamp, // 🎯 Use current time instead of peakTime
      reason: `Rocketman momentum failed (${direction}) at peak: ${peakTime.toISOString()}`
    });
    
    // 🔍 DEBUG: Show timestamp fix in action
    console.log("🎯 [ROCKETMAN_TIMESTAMP_FIX] COVER signal emitted with current timestamp", {
      action,
      pattern: 'Rocketman',
      price: livePrice.toFixed(4),
      oldTimestamp: peakTime.toISOString(),
      newTimestamp: currentTimestamp.toISOString(),
      timestampFixed: true
    });

    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[Rocketman Exit] Signal emitted', {
        action,
        signalType,
        confidence: (confidence * 100).toFixed(1) + '%',
        momentumFailed: true,
        dickOLearyCompliant: true
      });
    }
  }
}
