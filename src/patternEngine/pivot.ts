// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/pivot.ts
// Detects pivot support and resistance patterns in candlestick data
// Identifies significant price reversal points with multiple confirmations
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// HEIKIN-ASHI: Superior pivot detection with HA smoothing - cleaner support/resistance levels, reduced false signals
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle } from '../types/pattern';
import { PivotType } from '../models/PatternTypes';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';
import AdaptivePivotDetector from '../utils/patternDetection/AdaptivePivotDetector';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { TradeAction, SignalType } from '../utils/trading/TradeActionSignal';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

export interface PivotDetection {
  startIndex: number;
  endIndex: number;
  stepRef: string;
  pivotType: PivotType;
  pivotLevel: number;
  pivotIndex: number;
  timestamp: Date;
  touchCount: number;
  touchPoints: Array<{ 
    time: Date; 
    price: number;
    candleIndex: number;
    touchStrength: number;
  }>;
  confidence: number;
  touchStrength: number;
  temporalDistribution: number;
  priceConsistency: number;
  volumeReactions: number[];
  priceReactions: number[];
  strengthScore: number;
  adaptiveZoneWidth: number;
}

/**
 * Detects pivot support and resistance patterns in candlestick data
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
 * @param candles - Array of candlestick data
 * @param minTouchPoints - Minimum touch points for valid pivot (default: 3)
 * @param pivotLookback - Lookback period for pivot identification (default: 5)
 * @param zoneTolerance - Price tolerance for pivot zone (default: 0.002)
 * @returns Array of detected pivot patterns
 */
export function detectPivots(
  candles: Candle[],
  minTouchPoints: number = 3,
  pivotLookback: number = 5,
  zoneTolerance: number = 0.002
): PivotDetection[] {
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Pivot] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length < pivotLookback * 2 + 1) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Pivot] Not enough candles for detection:', candles?.length, 'min required:', pivotLookback * 2 + 1);
    return [];
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  const pivots: PivotDetection[] = [];

  // Detect pivot points (local highs and lows) using HA candles
  const pivotPoints: Array<{index: number, price: number, type: PivotType}> = [];
  
  for (let i = pivotLookback; i < haCandles.length - pivotLookback; i++) {
    const haCandle = haCandles[i];
    
    // Check for resistance (local high) using HA candles
    let isResistance = true;
    for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
      if (j !== i && haCandles[j].high >= haCandle.high) {
        isResistance = false;
        break;
      }
    }
    
    // Check for support (local low) using HA candles
    let isSupport = true;
    for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
      if (j !== i && haCandles[j].low <= haCandle.low) {
        isSupport = false;
        break;
      }
    }
    
    if (isResistance) {
      pivotPoints.push({ index: i, price: haCandle.high, type: PivotType.RESISTANCE });
    }
    if (isSupport) {
      pivotPoints.push({ index: i, price: haCandle.low, type: PivotType.SUPPORT });
    }
  }

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Pivot] Found', pivotPoints.length, 'potential pivot points');

  // Group nearby pivot points into zones
  const pivotZones = new Map<string, Array<{index: number, price: number, type: PivotType}>>();
  
  pivotPoints.forEach(point => {
    const zoneKey = `${point.type}_${Math.round(point.price / zoneTolerance)}`;
    if (!pivotZones.has(zoneKey)) {
      pivotZones.set(zoneKey, []);
    }
    pivotZones.get(zoneKey)!.push(point);
  });

  // Analyze each zone for valid pivots
  pivotZones.forEach((zonePoints, zoneKey) => {
    if (zonePoints.length >= minTouchPoints) {
      const pivotType = zonePoints[0].type;
      const avgPrice = zonePoints.reduce((sum, p) => sum + p.price, 0) / zonePoints.length;
      const touchCount = zonePoints.length;
      
      // Calculate strength based on touch count and volume
      const strength = Math.min(touchCount / minTouchPoints, 2.0);
      
      // Calculate adaptive zone width based on price volatility
      const priceRange = Math.max(...zonePoints.map(p => p.price)) - Math.min(...zonePoints.map(p => p.price));
      const adaptiveZoneWidth = Math.max(priceRange, avgPrice * zoneTolerance);
      
      // Create pivot detection
      const firstTouchIndex = Math.min(...zonePoints.map(p => p.index));
      const lastTouchIndex = Math.max(...zonePoints.map(p => p.index));
      
      const pivotDetection: PivotDetection = {
        startIndex: firstTouchIndex,
        endIndex: lastTouchIndex,
        stepRef: `${firstTouchIndex}-${lastTouchIndex}`,
        pivotType: pivotType,
        pivotLevel: avgPrice,
        pivotIndex: firstTouchIndex,
        timestamp: new Date(haCandles[firstTouchIndex].datetime),
        touchCount: touchCount,
        touchPoints: zonePoints.map(p => ({
          time: new Date(haCandles[p.index].datetime),
          price: p.price,
          candleIndex: p.index,
          touchStrength: 1.0
        })),
        confidence: Math.min(strength * 0.5 + (touchCount - minTouchPoints) * 0.1, 1.0),
        touchStrength: 1.0,
        temporalDistribution: 1.0,
        priceConsistency: 1.0,
        volumeReactions: [],
        priceReactions: [],
        strengthScore: strength,
        adaptiveZoneWidth: adaptiveZoneWidth
      };
      
      // Add comprehensive DEBUG_PATTERN_DETECT logging
      if (typeof logDebug === 'function') {
        logDebug('DEBUG_PATTERN_DETECT', `Pivot ${pivotType.toLowerCase()} detected`, {
          pivotType: pivotType,
          pivotLevel: avgPrice.toFixed(2),
          pivotIndex: firstTouchIndex,
          touchCount: touchCount,
          strength: strength.toFixed(2),
          confidence: (Math.min(strength * 0.5 + (touchCount - minTouchPoints) * 0.1, 1.0)).toFixed(2),
          zoneWidth: adaptiveZoneWidth.toFixed(4),
          stepRef: `${firstTouchIndex}-${lastTouchIndex}`,
          timeRange: `${haCandles[firstTouchIndex].datetime} to ${haCandles[lastTouchIndex].datetime}`,
          priceRange: `${Math.min(...zonePoints.map(p => p.price)).toFixed(2)} - ${Math.max(...zonePoints.map(p => p.price)).toFixed(2)}`,
          candidatePoints: zonePoints.length,
          qualifiedTouches: touchCount,
          adaptiveZoneCalculation: `${priceRange.toFixed(4)} range, ${(avgPrice * zoneTolerance).toFixed(4)} tolerance`,
          signalStrength: strength >= 1.5 ? 'STRONG' : strength >= 1.0 ? 'MEDIUM' : 'WEAK'
        });
      }
      
      pivots.push(pivotDetection);
      
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Pivot] Detected', pivotType, 'at', avgPrice.toFixed(4), 'with', touchCount, 'touches, confidence:', pivotDetection.confidence.toFixed(3));
    }
  });

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA Pivot] Detection complete. Found', pivots.length, 'valid pivots');
  
  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  pivots.forEach(evaluatePivotForEntry);
  
  return pivots;
}

/**
 * Evaluates Pivot pattern for entry signals
 * Canonical structure: emits BUY/SHORT signals at pivot levels
 * @param pivot - Pivot detection object
 */
export function evaluatePivotForEntry(pivot: PivotDetection): void {
  const { pivotType, pivotLevel, strengthScore, touchCount, confidence, timestamp } = pivot;

  // Confidence gate - Only emit signals for strong pivots
  if (strengthScore < 0.65 || touchCount < 3) return;

  // ✅ CORRECT LOGIC: SUPPORT = BUY at LOW, RESISTANCE = SHORT at HIGH
  const action = pivotType === PivotType.SUPPORT ? TradeAction.BUY : TradeAction.SHORT;
  const signalType = pivotType === PivotType.SUPPORT ? SignalType.LONG_ENTRY : SignalType.SHORT_ENTRY;

  emitTradeSignal({
    action,
    signalType,
    pattern: 'Pivot',
    confidence,
    price: pivotLevel,
    timestamp,
    reason: `${pivotType} pivot @ ${pivotLevel.toFixed(2)} with ${touchCount} touches`
  });

  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Pivot Entry] Signal emitted', {
      action,
      signalType,
      pivotType,
      pivotLevel: pivotLevel.toFixed(2),
      confidence: (confidence * 100).toFixed(1) + '%',
      strengthScore: strengthScore.toFixed(2),
      touchCount,
      dickOLearyCompliant: true
    });
  }
}

/**
 * Monitors Pivot pattern for exit signals
 * Canonical structure: emits SELL/COVER signals when pivot levels are breached
 * @param pivot - Pivot detection object
 * @param livePrice - Current market price
 */
export function monitorPivotForExit(pivot: PivotDetection, livePrice: number): void {
  const { pivotType, pivotLevel, strengthScore, confidence, timestamp } = pivot;

  // Confidence gate
  if (strengthScore < 0.6) return;

  // Check for pivot level breach
  const breached = 
    (pivotType === PivotType.SUPPORT && livePrice < pivotLevel) ||
    (pivotType === PivotType.RESISTANCE && livePrice > pivotLevel);

  if (breached) {
    const action = pivotType === PivotType.SUPPORT ? TradeAction.SELL : TradeAction.COVER;
    const signalType = pivotType === PivotType.SUPPORT ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;
    const exitConfidence = 0.85; // High confidence on level breach

    emitTradeSignal({
      action,
      signalType,
      pattern: 'Pivot',
      confidence: exitConfidence,
      price: livePrice,
      timestamp,
      reason: `${pivotType} breach @ ${pivotLevel.toFixed(2)}`
    });

    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[Pivot Exit] Signal emitted', {
        action,
        signalType,
        pivotType,
        pivotLevel: pivotLevel.toFixed(2),
        breachPrice: livePrice.toFixed(2),
        confidence: (exitConfidence * 100).toFixed(1) + '%',
        dickOLearyCompliant: true
      });
    }
  }
}

/**
 * Identifies potential pivot points in candlestick data
 * @param candles - Array of candlestick data
 * @param lookback - Lookback period for pivot identification
 * @returns Array of potential pivot points with their types
 */
export function identifyPivotPoints(
  candles: Candle[],
  lookback: number
): Array<{ index: number; type: PivotType; level: number; strength: number }> {
  // PLACEHOLDER: Implement pivot point identification
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[Pivot] STUB: Pivot point identification not implemented');
  return [];
}

/**
 * Calculates touch strength based on price and volume reactions
 * @param candle - The candle touching the pivot level
 * @param pivotLevel - The pivot price level
 * @param previousCandles - Previous candles for context analysis
 * @returns Touch strength score (0-1)
 */
export function calculateTouchStrength(
  candle: Candle,
  pivotLevel: number,
  previousCandles: Candle[]
): number {
  // PLACEHOLDER: Implement touch strength calculation
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[Pivot] STUB: Touch strength calculation not implemented');
  return 0.5; // Placeholder score
}

/**
 * Calculates adaptive zone width based on market volatility
 * @param candles - Array of candlestick data around the pivot
 * @param baseTolerance - Base tolerance percentage
 * @returns Adaptive zone width
 */
export function calculateAdaptiveZoneWidth(
  candles: Candle[],
  baseTolerance: number
): number {
  // PLACEHOLDER: Implement adaptive zone width calculation
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[Pivot] STUB: Adaptive zone width calculation not implemented');
  return baseTolerance; // Placeholder - return base tolerance
}
