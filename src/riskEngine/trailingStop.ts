// src/riskEngine/trailingStop.ts
// Implements Escalator-style trailing stop (i-2 candle) and overnight gap check
// Manages positions opened by Goldmine signals end-to-end

import { Candle } from '../types';
import { StepBox } from '../types/pattern';
import { GAP_MAX_RISK_DEFAULT, MIN_ESCALATOR_LENGTH } from '../constants/pattern';

export interface Position {
  side: 'LONG' | 'SHORT';
  openIndex: number;
  step: StepBox;
}

export interface StopLossEvent {
  index: number;
  price: number;
  type: 'TRAIL' | 'GAP';
}

export interface ExitEvent {
  index: number;
  price: number;
  reason: 'GAP_NO_STEP';
}

/**
 * Compute Escalator-style trailing stop using i-2 candle method.
 * For LONG positions, trail at the low of candle[i-2].
 * For SHORT positions, trail at the high of candle[i-2].
 * 
 * @param position - The open position with side, openIndex, and step info
 * @param candles - Full candle array
 * @returns StopLossEvent when price crosses trail level, null otherwise
 */
export function computeEscalatorStop(
  position: Position,
  candles: Candle[]
): StopLossEvent | null {
  const { side, openIndex } = position;
  
  // Need at least openIndex + 2 candles to start trailing
  if (candles.length < openIndex + 3) {
    return null;
  }
  
  let previousTrail: number | null = null;
  
  // Start checking from openIndex + 2 onwards
  for (let i = openIndex + 2; i < candles.length; i++) {
    const trailCandle = candles[i - 2];
    const currentCandle = candles[i];
    
    let trailLevel: number;
    
    if (side === 'LONG') {
      // For LONG, trail at the low of i-2 candle, but only ratchet up
      trailLevel = previousTrail !== null 
        ? Math.max(trailCandle.low, previousTrail)
        : trailCandle.low;
      
      // Check if current candle breached the trail (low <= trail)
      if (currentCandle.low <= trailLevel) {
        return {
          index: i,
          price: trailLevel,
          type: 'TRAIL'
        };
      }
    } else {
      // For SHORT, trail at the high of i-2 candle, but only ratchet down
      trailLevel = previousTrail !== null
        ? Math.min(trailCandle.high, previousTrail)
        : trailCandle.high;
      
      // Check if current candle breached the trail (high >= trail)
      if (currentCandle.high >= trailLevel) {
        return {
          index: i,
          price: trailLevel,
          type: 'TRAIL'
        };
      }
    }
    
    previousTrail = trailLevel;
  }
  
  return null;
}

/**
 * Check for overnight gap risk and determine if position should exit.
 * If gap exceeds threshold, wait for candle #2 close (5-min absolute).
 * Exit only if no step is forming at that time.
 * 
 * @param prevClose - Previous day's closing price
 * @param openPrice - Current day's opening price
 * @param candle1 - First candle of the day
 * @param candle2 - Second candle of the day (5-min after open)
 * @param stepForming - Whether a step pattern is currently forming
 * @returns ExitEvent if gap breach and no step forming, null otherwise
 */
export function gapCheck(
  prevClose: number,
  openPrice: number,
  candle1: Candle,
  candle2: Candle,
  stepForming: boolean
): ExitEvent | null {
  // Calculate gap percentage
  const gapPercent = Math.abs(openPrice - prevClose) / prevClose;
  
  // Check if gap exceeds risk threshold
  if (gapPercent >= GAP_MAX_RISK_DEFAULT) {
    // Wait for candle #2 close (5-min absolute)
    // If no step is forming at that time, exit at candle2 close
    if (!stepForming) {
      return {
        index: 1, // Index 1 represents candle2
        price: candle2.close,
        reason: 'GAP_NO_STEP'
      };
    }
  }
  
  // Either gap is within threshold or step is forming
  return null;
}

/**
 * Helper to determine if a new step is forming based on candle patterns.
 * This is a simplified check - actual implementation would use full Escalator detection.
 * 
 * @param candles - Recent candles to check for step formation
 * @param minLength - Minimum candles required for a valid step
 * @returns true if step pattern detected, false otherwise
 */
export function isStepForming(candles: Candle[], minLength: number = MIN_ESCALATOR_LENGTH): boolean {
  if (candles.length < minLength) {
    return false;
  }
  
  // Simplified logic: check if recent candles are consolidating
  // In real implementation, this would use Escalator pattern detection
  const recentCandles = candles.slice(-minLength);
  const avgBody = recentCandles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / minLength;
  const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / minLength;
  
  // Step forming if bodies are small relative to range (consolidation)
  return avgBody < avgRange * 0.3;
}
