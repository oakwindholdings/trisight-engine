// src/patternEngine/goldmineShaft.patch.ts
// PATCH: Add explicit TRANSITIONED tag for Goldmine Shaft lifecycle compliance
// Addresses audit finding: Missing TRANSITIONED lifecycle tag

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

// Enhanced lifecycle event for Goldmine Shaft
export interface GoldmineShaftLifecycleEvent {
  type: 'GOLDMINE_SHAFT_EMERGED' | 'GOLDMINE_SHAFT_CONFIRMED' | 'GOLDMINE_SHAFT_TRANSITIONED' | 'GOLDMINE_SHAFT_EXITED';
  timestamp: Date;
  candleIndex: number;
  shaftId: string;
  transitionData?: {
    fromPhase: 'THRUST' | 'RETRACEMENT' | 'BREAKOUT';
    toPhase: 'THRUST' | 'RETRACEMENT' | 'BREAKOUT' | 'COMPLETED';
    retracementPercentage?: number;
    thrustMagnitude?: number;
    transitionReason: string;
  };
}

// Enhanced Goldmine Shaft pattern with lifecycle tracking
export interface EnhancedGoldmineShaftPattern {
  id: string;
  startIndex: number;
  endIndex: number;
  direction: 'UP' | 'DOWN';
  thrustPhase: {
    startIndex: number;
    endIndex: number;
    magnitude: number;
    completed: boolean;
  };
  retracementPhase: {
    startIndex: number;
    endIndex: number;
    percentage: number;
    fibonacciLevel: number;
    inProgress: boolean;
    completed: boolean;
  };
  breakoutPhase: {
    startIndex: number;
    endIndex: number;
    confirmed: boolean;
    completed: boolean;
  };
  currentPhase: 'THRUST' | 'RETRACEMENT' | 'BREAKOUT' | 'COMPLETED';
  lifecycleEvents: GoldmineShaftLifecycleEvent[];
  confidence: number;
}

/**
 * Monitor Goldmine Shaft for phase transitions and emit TRANSITIONED events
 * ADDRESSES AUDIT FINDING: Explicit TRANSITIONED tag emission
 */
export function monitorGoldmineShaftTransitions(
  pattern: EnhancedGoldmineShaftPattern,
  candles: Candle[],
  currentIndex: number
): GoldmineShaftLifecycleEvent[] {
  const haCandles = convertToHeikinAshi(candles);
  const events: GoldmineShaftLifecycleEvent[] = [];
  
  // Check for thrust completion -> retracement transition
  if (pattern.currentPhase === 'THRUST' && !pattern.thrustPhase.completed) {
    const thrustEnd = detectThrustCompletion(haCandles, pattern, currentIndex);
    if (thrustEnd) {
      const transitionEvent: GoldmineShaftLifecycleEvent = {
        type: 'GOLDMINE_SHAFT_TRANSITIONED',
        timestamp: new Date(haCandles[currentIndex].datetime),
        candleIndex: currentIndex,
        shaftId: pattern.id,
        transitionData: {
          fromPhase: 'THRUST',
          toPhase: 'RETRACEMENT',
          thrustMagnitude: pattern.thrustPhase.magnitude,
          transitionReason: 'Thrust momentum exhausted, retracement phase initiated'
        }
      };
      
      events.push(transitionEvent);
      pattern.currentPhase = 'RETRACEMENT';
      pattern.thrustPhase.completed = true;
      pattern.retracementPhase.inProgress = true;
      
      logDebug('DEBUG_PATTERN_DETECT', '[Goldmine Shaft] TRANSITIONED: Thrust -> Retracement:', {
        shaftId: pattern.id,
        thrustMagnitude: pattern.thrustPhase.magnitude.toFixed(4),
        transitionIndex: currentIndex,
        reason: transitionEvent.transitionData?.transitionReason
      });
    }
  }
  
  // Check for retracement completion -> breakout transition
  if (pattern.currentPhase === 'RETRACEMENT' && pattern.retracementPhase.inProgress) {
    const retracementEnd = detectRetracementCompletion(haCandles, pattern, currentIndex);
    if (retracementEnd) {
      const transitionEvent: GoldmineShaftLifecycleEvent = {
        type: 'GOLDMINE_SHAFT_TRANSITIONED',
        timestamp: new Date(haCandles[currentIndex].datetime),
        candleIndex: currentIndex,
        shaftId: pattern.id,
        transitionData: {
          fromPhase: 'RETRACEMENT',
          toPhase: 'BREAKOUT',
          retracementPercentage: pattern.retracementPhase.percentage,
          transitionReason: `Retracement completed at ${pattern.retracementPhase.percentage.toFixed(1)}% (Fib: ${pattern.retracementPhase.fibonacciLevel})`
        }
      };
      
      events.push(transitionEvent);
      pattern.currentPhase = 'BREAKOUT';
      pattern.retracementPhase.completed = true;
      pattern.breakoutPhase.confirmed = true;
      
      logDebug('DEBUG_PATTERN_DETECT', '[Goldmine Shaft] TRANSITIONED: Retracement -> Breakout:', {
        shaftId: pattern.id,
        retracementPercentage: pattern.retracementPhase.percentage.toFixed(1),
        fibonacciLevel: pattern.retracementPhase.fibonacciLevel,
        transitionIndex: currentIndex,
        reason: transitionEvent.transitionData?.transitionReason
      });
    }
  }
  
  // Check for breakout completion -> pattern completed transition
  if (pattern.currentPhase === 'BREAKOUT' && pattern.breakoutPhase.confirmed) {
    const breakoutEnd = detectBreakoutCompletion(haCandles, pattern, currentIndex);
    if (breakoutEnd) {
      const transitionEvent: GoldmineShaftLifecycleEvent = {
        type: 'GOLDMINE_SHAFT_TRANSITIONED',
        timestamp: new Date(haCandles[currentIndex].datetime),
        candleIndex: currentIndex,
        shaftId: pattern.id,
        transitionData: {
          fromPhase: 'BREAKOUT',
          toPhase: 'COMPLETED',
          transitionReason: 'Breakout confirmed, Goldmine Shaft pattern completed successfully'
        }
      };
      
      events.push(transitionEvent);
      pattern.currentPhase = 'COMPLETED';
      pattern.breakoutPhase.completed = true;
      
      logDebug('DEBUG_PATTERN_DETECT', '[Goldmine Shaft] TRANSITIONED: Breakout -> Completed:', {
        shaftId: pattern.id,
        totalDuration: currentIndex - pattern.startIndex,
        transitionIndex: currentIndex,
        finalConfidence: pattern.confidence,
        reason: transitionEvent.transitionData?.transitionReason
      });
    }
  }
  
  return events;
}

/**
 * Detect thrust phase completion based on momentum analysis
 */
function detectThrustCompletion(
  haCandles: Candle[],
  pattern: EnhancedGoldmineShaftPattern,
  currentIndex: number
): boolean {
  if (currentIndex < pattern.thrustPhase.startIndex + 2) return false;
  
  const recentCandles = haCandles.slice(currentIndex - 2, currentIndex + 1);
  const thrustCandles = haCandles.slice(pattern.thrustPhase.startIndex, currentIndex + 1);
  
  // Calculate momentum deceleration
  const recentMomentum = calculateMomentum(recentCandles);
  const thrustMomentum = calculateMomentum(thrustCandles);
  
  // Thrust completes when momentum drops below 50% of peak
  return recentMomentum < (thrustMomentum * 0.5);
}

/**
 * Detect retracement phase completion using Fibonacci levels
 */
function detectRetracementCompletion(
  haCandles: Candle[],
  pattern: EnhancedGoldmineShaftPattern,
  currentIndex: number
): boolean {
  const currentPrice = haCandles[currentIndex].close;
  const thrustStart = haCandles[pattern.thrustPhase.startIndex].close;
  const thrustEnd = haCandles[pattern.thrustPhase.endIndex].close;
  
  const thrustRange = Math.abs(thrustEnd - thrustStart);
  const retracementFromPeak = Math.abs(currentPrice - thrustEnd);
  const retracementPercentage = (retracementFromPeak / thrustRange) * 100;
  
  // Update pattern retracement data
  pattern.retracementPhase.percentage = retracementPercentage;
  
  // Check Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%)
  const fibLevels = [23.6, 38.2, 50.0, 61.8, 78.6];
  const tolerance = 3.0; // 3% tolerance
  
  for (const level of fibLevels) {
    if (Math.abs(retracementPercentage - level) <= tolerance) {
      pattern.retracementPhase.fibonacciLevel = level;
      return true; // Retracement at Fibonacci level
    }
  }
  
  // Also complete if retracement exceeds 78.6% (failure threshold)
  return retracementPercentage > 78.6;
}

/**
 * Detect breakout phase completion
 */
function detectBreakoutCompletion(
  haCandles: Candle[],
  pattern: EnhancedGoldmineShaftPattern,
  currentIndex: number
): boolean {
  const breakoutLength = currentIndex - pattern.breakoutPhase.startIndex;
  const minBreakoutLength = 3; // Minimum candles for breakout confirmation
  
  if (breakoutLength < minBreakoutLength) return false;
  
  const currentPrice = haCandles[currentIndex].close;
  const thrustEnd = haCandles[pattern.thrustPhase.endIndex].close;
  
  // Breakout completes when price exceeds thrust high (for up trend)
  if (pattern.direction === 'UP') {
    return currentPrice > thrustEnd;
  } else {
    return currentPrice < thrustEnd;
  }
}

/**
 * Calculate price momentum for a candle segment
 */
function calculateMomentum(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  
  const startPrice = candles[0].close;
  const endPrice = candles[candles.length - 1].close;
  const priceChange = Math.abs(endPrice - startPrice);
  const timeSpan = candles.length;
  
  return priceChange / timeSpan;
}

/**
 * Create enhanced Goldmine Shaft pattern with lifecycle tracking
 */
export function createEnhancedGoldmineShaftPattern(
  startIndex: number,
  direction: 'UP' | 'DOWN',
  thrustEndIndex: number,
  thrustMagnitude: number
): EnhancedGoldmineShaftPattern {
  const patternId = `goldmine_shaft_${startIndex}_${Date.now()}`;
  
  return {
    id: patternId,
    startIndex,
    endIndex: thrustEndIndex,
    direction,
    thrustPhase: {
      startIndex,
      endIndex: thrustEndIndex,
      magnitude: thrustMagnitude,
      completed: false
    },
    retracementPhase: {
      startIndex: thrustEndIndex,
      endIndex: thrustEndIndex,
      percentage: 0,
      fibonacciLevel: 0,
      inProgress: false,
      completed: false
    },
    breakoutPhase: {
      startIndex: thrustEndIndex,
      endIndex: thrustEndIndex,
      confirmed: false,
      completed: false
    },
    currentPhase: 'THRUST',
    lifecycleEvents: [],
    confidence: 0.7
  };
}
