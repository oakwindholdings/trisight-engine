// src/patternEngine/examples/EscalatorStopLossIntegration.ts
// Example integration of StopLossManager with Escalator pattern
// Shows how patterns should register and manage stop losses

import { Candle } from "../../types/pattern";
import { TradeActionSignal, TradeAction, SignalType } from "../../utils/trading/TradeActionSignal";
import { emitTradeSignal } from "../../framework/tradeActionEmitter";
import { registerStopLoss } from "../../engine/StopLossManager";
import { logDebug } from "../../utils/debug";

/**
 * Example: Escalator pattern with integrated stop loss management
 * This shows the proper flow for pattern detection → signal emission → stop loss registration
 */
export function detectEscalatorWithStopLoss(candles: Candle[], currentIndex: number): void {
  // 1. Detect escalator pattern (simplified example)
  const escalatorDetected = detectEscalatorPattern(candles, currentIndex);
  
  if (!escalatorDetected) return;
  
  const { direction, confidence, entryPrice } = escalatorDetected;
  const currentCandle = candles[currentIndex];
  
  // 2. Emit trade signal for the escalator entry
  const signal: TradeActionSignal = {
    action: direction === 'UP' ? TradeAction.BUY : TradeAction.SHORT,
    signalType: direction === 'UP' ? SignalType.LONG_ENTRY : SignalType.SHORT_ENTRY,
    pattern: "ESCALATOR",
    confidence: confidence,
    price: entryPrice,
    timestamp: new Date(currentCandle.datetime),
    reason: `Escalator ${direction} breakout detected`,
    candleIndex: currentIndex,
    riskLevel: confidence > 0.7 ? 'LOW' : 'MEDIUM'
  };

  // Emit the signal via centralized framework
  emitTradeSignal(signal);

  // 3. Register stop loss for this position
  const positionId = `ESCALATOR_${currentIndex}_${direction}`;
  const stopLossType = direction === 'UP' ? 'LONG' : 'SHORT';
  const trailingCandles = 2; // Trail 2 candles back
  
  registerStopLoss(
    positionId,
    stopLossType,
    currentIndex,
    trailingCandles,
    entryPrice,
    "ESCALATOR",
    confidence
  );

  logDebug('ESCALATOR_STOP_LOSS', `Registered ${stopLossType} stop loss for ${positionId}`, {
    entryPrice: entryPrice.toFixed(4),
    trailingCandles,
    confidence: `${(confidence * 100).toFixed(1)}%`
  });
}

/**
 * Simplified escalator detection for example purposes
 * In real implementation, this would be much more sophisticated
 */
function detectEscalatorPattern(candles: Candle[], currentIndex: number): {
  direction: 'UP' | 'DOWN';
  confidence: number;
  entryPrice: number;
} | null {
  if (currentIndex < 5) return null;
  
  const current = candles[currentIndex];
  const prev = candles[currentIndex - 1];
  const prev2 = candles[currentIndex - 2];
  
  // Very simplified detection: look for 3 consecutive higher highs (UP) or lower lows (DOWN)
  const isUpEscalator = current.high > prev.high && prev.high > prev2.high;
  const isDownEscalator = current.low < prev.low && prev.low < prev2.low;
  
  if (isUpEscalator) {
    return {
      direction: 'UP',
      confidence: 0.75,
      entryPrice: current.close
    };
  }
  
  if (isDownEscalator) {
    return {
      direction: 'DOWN',
      confidence: 0.75,
      entryPrice: current.close
    };
  }
  
  return null;
}

/**
 * Example usage in main candle processing loop:
 * 
 * ```typescript
 * // In your main pattern detection loop
 * for (let i = 0; i < candles.length; i++) {
 *   // 1. Run pattern detection and signal emission
 *   detectEscalatorWithStopLoss(candles, i);
 *   
 *   // 2. Evaluate all active stop losses (this happens in usePatternBus now)
 *   evaluateStopLoss(candles, i);
 * }
 * ```
 */
