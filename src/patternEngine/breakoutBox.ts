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
          break; // Exit the while loop since we found a breakout
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
}
