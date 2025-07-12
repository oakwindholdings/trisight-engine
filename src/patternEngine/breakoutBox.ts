// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/breakoutBox.ts
// Detects floor-ceiling breakout boxes in candlestick data
// Independent from escalator step detection
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Strict HA-only breakout logic - no OHLC substitution allowed
// TODO: SOURCE_VERIFIED_FROM_DECKS - Breakout detection thresholds should be explicitly defined from Dick O'Leary deck sources

import { Candle } from '../types/pattern';
import { debugLog, summaryLog, DEBUG_MODE, logDebug } from '../utils/debug';
import { calcStepBlackjack } from './blackjack';
import { convertToHeikinAshi } from '../utils/candleTransform'; // Enforce HA-only detection
import { TradeActionSignal, TradeAction, SignalType } from '../utils/trading/TradeActionSignal';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { emitTradeBiasSignal } from '../utils/trading/TradeActionSignal';
import { canEmitSignal, setPatternState, getPatternState } from '../utils/patternDebounceManager';
import { PatternState } from '../config/debounceConfig';

/**
 * Detects breakout boxes (floor-ceiling zones) in candlestick data
 * @param candles - Array of candlestick data
 * @param minStallLength - Minimum candles for a valid stall (default: 3)
 * @param stallThreshold - Threshold for stall detection (default: 0.1)
 * @param breakoutMultiplier - Multiplier for breakout detection (default: 0.5)
 * @returns Array of detected breakout boxes
 */
export function detectBreakoutBoxes(
  candles: Candle[],
  minStallLength: number = 3,
  stallThreshold: number = 0.1,
  breakoutMultiplier: number = 0.5
): BreakoutBox[] {
  const boxes: BreakoutBox[] = [];
  
  // DICK O'LEARY COMPLIANCE: Convert to HA candles for all breakout analysis
  // This ensures strict adherence to HA body/wick/close logic with no OHLC substitution
  const haCandles = convertToHeikinAshi(candles);
  
  // DIAGNOSTIC: Log detection start with HA compliance
  logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] detectBreakoutBoxes START with HA compliance:', {
    originalCandles: candles.length,
    haCandles: haCandles.length,
    minStallLength,
    stallThreshold,
    breakoutMultiplier,
    dickOLearyCompliance: true
  });
  
  if (DEBUG_MODE) {
    debugLog('[detectBreakoutBoxes] Starting HA detection with', haCandles.length, 'HA candles');
  }
  
  if (haCandles.length < minStallLength + 1) {
    if (DEBUG_MODE) {
      debugLog('[detectBreakoutBoxes] Not enough HA candles for detection');
    }
    return boxes;
  }
  
  let i = 1; // Start from second HA candle
  
  while (i < haCandles.length - minStallLength) {
    // Look for potential stalling pattern using HA candles
    const prevHACandle = haCandles[i - 1];
    const firstStallHACandle = haCandles[i];
    
    // DICK O'LEARY COMPLIANCE: Check if HA candle's body stays within previous HA candle's range
    // Use HA close/open for trend confirmation, HA body size for breakout analysis
    if (isWithinRange(firstStallHACandle, prevHACandle)) {
      if (DEBUG_MODE) {
        debugLog('[detectBreakoutBoxes] Potential HA stall start at index', i);
      }
      
      // Find the extent of the stall using HA metrics
      let stallEnd = i;
      let floor = firstStallHACandle.low;
      let ceiling = prevHACandle.high;
      
      // Extend the stall while HA candles remain in range
      while (stallEnd < haCandles.length - 1) {
        const nextHACandle = haCandles[stallEnd + 1];
        
        // DICK O'LEARY COMPLIANCE: Check if next HA candle stays within the box
        if (isWithinBox(nextHACandle, floor, ceiling)) {
          // Update floor and ceiling using HA low/high
          floor = Math.min(floor, nextHACandle.low);
          ceiling = Math.max(ceiling, nextHACandle.high);
          stallEnd++;
          
          if (DEBUG_MODE) {
            debugLog('[detectBreakoutBoxes] Extending HA stall at index', stallEnd);
          }
        } else {
          // Potential HA breakout found
          if (DEBUG_MODE) {
            debugLog('[detectBreakoutBoxes] HA breakout detected at index', stallEnd + 1);
          }
          
          // Check if the HA stall was long enough
          if (stallEnd - i + 1 >= minStallLength) {
            // We have a valid HA breakout!
            const breakoutHACandle = nextHACandle;
            const direction = breakoutHACandle.close > ceiling ? 'RISING' : 'FALLING';
            
            // DICK O'LEARY COMPLIANCE: Only count valid HA breakouts (not just wicks)
            // Use HA close for breakout confirmation
            if ((direction === 'RISING' && breakoutHACandle.close > ceiling) ||
                (direction === 'FALLING' && breakoutHACandle.close < floor)) {
              
              const box: BreakoutBox = {
                startIndex: i,
                endIndex: stallEnd,
                stepRef: `${i}-${stallEnd}`,
                direction,
                floor,
                ceiling,
                height: ceiling - floor,
                breakoutCandle: breakoutHACandle
              };
              
              // Calculate HA-based Blackjack score for stall candles
              const stallHACandles = haCandles.slice(i, stallEnd + 1);
              const bjScore = calcStepBlackjack(stallHACandles);
              box.blackjackScore = bjScore.cumulativeScore;
              box.blackjackComponents = Array.isArray(bjScore.components) ? bjScore.components : [bjScore.intrinsicScore];
              
              // DICK O'LEARY COMPLIANCE: Qualify based on HA-derived Blackjack scores
              // Rising breakout needs bearish setup (cumulative score <= -2)
              // Falling breakout needs bullish setup (cumulative score >= 2)
              box.qualifiesForGoldmine = (direction === 'RISING' && bjScore.cumulativeScore <= -2) ||
                                        (direction === 'FALLING' && bjScore.cumulativeScore >= 2);
              
              // Always log HA scoring details to understand qualification
              logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [detectBreakoutBoxes] HA BreakoutBox qualification check:', { 
                stepRef: box.stepRef,
                direction: box.direction,
                stallLength: stallHACandles.length,
                intrinsicScore: bjScore.intrinsicScore,
                cumulativeScore: bjScore.cumulativeScore,
                components: bjScore.components,
                qualifiesForGoldmine: box.qualifiesForGoldmine,
                qualificationReason: box.qualifiesForGoldmine ? 'QUALIFIED' : 
                  (direction === 'RISING' ? 
                    `Need score <= -2, got ${bjScore.cumulativeScore}` : 
                    `Need score >= 2, got ${bjScore.cumulativeScore}`),
                dickOLearyCompliant: true,
                haBodySize: Math.abs(breakoutHACandle.close - breakoutHACandle.open).toFixed(4)
              });
              
              // Log HA scoring in dev mode
              if (DEBUG_MODE) {
                logDebug('DEBUG_PATTERN_DETECT', '[Blackjack:HA] BreakoutBox score:', { 
                  score: bjScore,
                  box: {
                    stepRef: box.stepRef,
                    direction: box.direction,
                    blackjackScore: box.blackjackScore,
                    qualifiesForGoldmine: box.qualifiesForGoldmine
                  },
                  dickOLearyCompliant: true
                });
              }
              
              boxes.push(box);
              
              if (DEBUG_MODE) {
                debugLog('[detectBreakoutBoxes] Found HA box:', {
                  startIndex: box.startIndex,
                  endIndex: box.endIndex,
                  stallLength: stallEnd - i + 1,
                  direction: box.direction,
                  floor: box.floor,
                  ceiling: box.ceiling
                });
              }
              
              logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] detectBreakoutBoxes found HA box:', {
                startIndex: box.startIndex,
                endIndex: box.endIndex,
                stallLength: stallEnd - i + 1,
                direction: box.direction,
                height: box.height,
                dickOLearyCompliant: true
              });
              
              // Skip past this box for next detection
              i = stallEnd + 2;
            } else {
              // Not a valid HA breakout, continue searching
              i++;
            }
          } else {
            // HA stall too short, continue searching
            i++;
          }
          break; // Exit inner while loop after processing breakout, continue outer loop
        }
      }
      
      // If we reached end of HA candles without breakout, move on
      if (stallEnd >= haCandles.length - 1) {
        i = haCandles.length;
      }
    } else {
      i++;
    }
  }
  
  // Summary log at end of HA detection
  const qualifiedCount = boxes.filter(b => b.qualifiesForGoldmine).length;
  logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [detectBreakoutBoxes] HA Detection complete:', {
    totalBoxes: boxes.length,
    qualifiedBoxes: qualifiedCount,
    qualifiedStepRefs: boxes
      .filter(b => b.qualifiesForGoldmine)
      .map(b => ({ stepRef: b.stepRef, score: b.blackjackScore })),
    dickOLearyCompliance: true
  });
  
  if (DEBUG_MODE) {
    debugLog('[detectBreakoutBoxes] HA Detection complete:', {
      totalBoxes: boxes.length,
      boxes: boxes.map(b => ({
        stepRef: b.stepRef,
        dir: b.direction,
        indices: `${b.startIndex}-${b.endIndex}`
      })),
      dickOLearyCompliant: true
    });
  }
  
  return boxes;
}

/**
 * Checks if a candle's body is within the range of the previous candle
 */
function isWithinRange(candle: Candle, prevCandle: Candle): boolean {
  const bodyHigh = Math.max(candle.open, candle.close);
  const bodyLow = Math.min(candle.open, candle.close);
  
  return bodyHigh <= prevCandle.high && bodyLow >= prevCandle.low;
}

/**
 * Checks if a candle is within a box defined by floor and ceiling
 */
function isWithinBox(candle: Candle, floor: number, ceiling: number): boolean {
  const bodyHigh = Math.max(candle.open, candle.close);
  const bodyLow = Math.min(candle.open, candle.close);
  
  return bodyHigh <= ceiling && bodyLow >= floor;
}

/**
 * Breakout Box state management for staging control
 */
export enum BreakoutBoxState {
  FORMED = 'FORMED',         // Box detected but not confirmed
  TRIGGERED = 'TRIGGERED',   // Box breakout confirmed and ready for signals
  STAGED = 'STAGED',         // Box waiting for confirmation
  EXITED = 'EXITED',         // Box completed or invalidated
  SUPPRESSED = 'SUPPRESSED'  // Box temporarily suppressed
}

export interface BreakoutBox {
  startIndex: number;
  endIndex: number;
  stepRef: string;
  direction: 'RISING' | 'FALLING';
  floor: number;
  ceiling: number;
  height: number;
  breakoutCandle?: Candle;
  blackjackScore?: number;
  blackjackComponents?: number[];
  qualifiesForGoldmine?: boolean;
  // Dynamic exit confidence properties
  breakoutTimestamp?: number;
  breakoutVolume?: number;
  breakoutScore?: number;
  // Staging state management
  state?: BreakoutBoxState;
  patternKey?: string;  // Unique identifier for state tracking
}

/**
 * Calculates dynamic exit confidence for Breakout Box re-entry scenarios
 * Based on Dick O'Leary compliance: exits governed by precision, not assumptions
 * @param params - Exit confidence calculation parameters
 * @returns Confidence score between 0.4 and 1.0
 */
function calculateBoxExitConfidence({
  breakoutScore,
  reEntryVelocity,
  timeSinceBreakoutMs,
  volumeChangePct
}: {
  breakoutScore: number;
  reEntryVelocity: number;
  timeSinceBreakoutMs: number;
  volumeChangePct: number;
}): number {
  // Time decay factor: confidence degrades over 10 minutes
  const decayFactor = Math.min(1, timeSinceBreakoutMs / (10 * 60 * 1000));
  
  // Multi-factor confidence calculation
  const confidence =
    0.5 * breakoutScore +                                    // Original breakout strength (50%)
    0.3 * Math.max(0, Math.min(1, reEntryVelocity)) +       // Re-entry velocity (30%)
    0.1 * (volumeChangePct < 0 ? 1 : 0) +                   // Volume drop reward (10%)
    0.1 * (1 - decayFactor);                                // Time freshness (10%)
  
  // Clamp between 0.4 (minimum exit confidence) and 1.0 (maximum)
  return Math.min(1, Math.max(0.4, confidence));
}

/**
 * Evaluates BreakoutBox pattern for entry signals
 * Canonical structure: emits BUY/SHORT signals for qualified breakout box patterns
 * @param box - BreakoutBox detection object
 */
export function evaluateBreakoutBoxForEntry(box: BreakoutBox): void {
  const { direction, blackjackScore, qualifiesForGoldmine, breakoutCandle, floor, ceiling, state, patternKey } = box;

  // Confidence gate - Only emit signals for goldmine-qualified boxes
  if (!qualifiesForGoldmine || !blackjackScore || Math.abs(blackjackScore) < 2.0) {
    return;
  }

  // Generate unique pattern key if not provided
  const boxKey = patternKey || `breakout_${direction}_${floor.toFixed(2)}_${ceiling.toFixed(2)}`;
  
  // Staging state check - Only emit signals for TRIGGERED boxes
  const currentState = state || getPatternState(boxKey);
  if (currentState !== BreakoutBoxState.TRIGGERED && currentState !== PatternState.TRIGGERED) {
    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[BreakoutBox] Signal blocked by state', {
        pattern: 'BREAKOUT_BOX',
        patternKey: boxKey,
        currentState,
        requiredState: 'TRIGGERED',
        direction
      });
    }
    return;
  }

  // Debounce check - prevent rapid repeat emissions for breakout patterns
  const now = Date.now();
  // CRITICAL FIX: Separate pattern detection from trade signal emission
  // Pattern detection and rendering should NEVER be debounced
  const canEmitTradeSignal = canEmitSignal('BREAKOUT_BOX', now);
  
  if (!canEmitTradeSignal && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Breakout Box] Trade signal debounced (but pattern will still render)', {
      pattern: 'BREAKOUT_BOX',
      timestamp: new Date(now).toISOString(),
      breakoutDirection: direction,
      boxWidth: (ceiling - floor).toFixed(4)
    });
  }

  // Calculate confidence based on blackjack score strength
  const confidence = Math.min(0.9, 0.6 + (Math.abs(blackjackScore) - 2.0) * 0.1);
  
  // Entry logic: BUY on RISING breakout, SHORT on FALLING breakout
  const action = direction === 'RISING' ? TradeAction.BUY : TradeAction.SHORT;
  const signalType = direction === 'RISING' ? SignalType.LONG_ENTRY : SignalType.SHORT_ENTRY;
  
  // Use breakout candle price or ceiling/floor as entry price
  const entryPrice = breakoutCandle ? 
    (direction === 'RISING' ? breakoutCandle.high : breakoutCandle.low) :
    (direction === 'RISING' ? ceiling : floor);
  
  // Calculate timestamp from breakout candle or current time
  const timestamp = breakoutCandle ? new Date(breakoutCandle.datetime) : new Date();
  
  // CRITICAL FIX: Only emit trade signals when debounce allows
  // Pattern detection and rendering continues regardless of debounce
  if (canEmitTradeSignal) {
    // Emit the trade signal
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Breakout Box',
      confidence,
      price: entryPrice,
      timestamp,
      reason: `${direction} breakout (BJ: ${blackjackScore.toFixed(1)})`,
      riskLevel: confidence >= 0.8 ? 'LOW' : confidence >= 0.7 ? 'MEDIUM' : 'HIGH'
    });
  }

  // Emit TRADE_BIAS signal for directional bias indication
  const bias = direction === 'RISING' ? 'LONG' : 'SHORT';
  emitTradeBiasSignal(
    'BREAKOUT_BOX',
    confidence,
    entryPrice,
    timestamp,
    bias,
    `Breakout box ${direction.toLowerCase()} bias`,
    {
      riskLevel: confidence >= 0.8 ? 'LOW' : 'MEDIUM'
    }
  );

  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[BreakoutBox Entry] Signal emitted', {
      action,
      signalType,
      direction,
      confidence: (confidence * 100).toFixed(1) + '%',
      blackjackScore: blackjackScore.toFixed(1),
      entryPrice: entryPrice.toFixed(4),
      stepRef: box.stepRef,
      dickOLearyCompliant: true
    });
  }
}

/**
 * Monitors BreakoutBox pattern for exit signals
 * Canonical structure: emits SELL/COVER signals when box re-entry occurs
 * @param box - BreakoutBox detection object
 * @param livePrice - Current market price
 */
export function monitorBreakoutBoxForExit(box: BreakoutBox, livePrice: number, currentCandle?: Candle): void {
  const { direction, floor, ceiling, qualifiesForGoldmine } = box;

  // Only monitor qualified boxes
  if (!qualifiesForGoldmine) return;

  // Calculate dynamic exit confidence based on market context
  const reEntryLevel = direction === 'RISING' ? ceiling : floor;
  const reEntryVelocity = Math.abs((livePrice - reEntryLevel) / reEntryLevel);
  const timeSinceBreakout = box.breakoutTimestamp ? Date.now() - box.breakoutTimestamp : 5 * 60 * 1000; // Default 5 min
  const volumeChange = (currentCandle && box.breakoutVolume) ? 
    (currentCandle.volume - box.breakoutVolume) / box.breakoutVolume : 0;

  const confidence = calculateBoxExitConfidence({
    breakoutScore: box.breakoutScore || 0.6,
    reEntryVelocity,
    timeSinceBreakoutMs: timeSinceBreakout,
    volumeChangePct: volumeChange
  });

  // Check for box re-entry (breakout failure)
  const boxReEntry = (direction === 'RISING' && livePrice < ceiling) ||
                     (direction === 'FALLING' && livePrice > floor);

  if (boxReEntry) {
    const action = direction === 'RISING' ? TradeAction.SELL : TradeAction.COVER;
    const signalType = direction === 'RISING' ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;

    emitTradeSignal({
      action,
      signalType,
      pattern: 'Breakout Box',
      confidence,
      price: livePrice,
      timestamp: new Date(),
      reason: `Breakout failed - price re-entered box (${direction})`
    });

    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[BreakoutBox Exit] Signal emitted', {
        action,
        signalType,
        direction,
        reEntryPrice: livePrice.toFixed(4),
        floor: floor.toFixed(4),
        ceiling: ceiling.toFixed(4),
        dickOLearyCompliant: true
      });
    }
  }
}
