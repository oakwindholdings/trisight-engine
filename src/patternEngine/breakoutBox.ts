// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/breakoutBox.ts
// Detects floor-ceiling breakout boxes in candlestick data
// Independent from escalator step detection
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT

import { Candle } from '../types/pattern';
import { debugLog, summaryLog, DEBUG_MODE, logDebug } from '../utils/debug';
import { calcStepBlackjack } from './blackjack';

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
  
  // DIAGNOSTIC: Log detection start
  logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] detectBreakoutBoxes START:', {
    candlesLength: candles.length,
    minStallLength,
    stallThreshold,
    breakoutMultiplier
  });
  
  if (DEBUG_MODE) {
    debugLog('[detectBreakoutBoxes] Starting detection with', candles.length, 'candles');
  }
  
  if (candles.length < minStallLength + 1) {
    if (DEBUG_MODE) {
      debugLog('[detectBreakoutBoxes] Not enough candles for detection');
    }
    return boxes;
  }
  
  let i = 1; // Start from second candle
  
  while (i < candles.length - minStallLength) {
    // Look for potential stalling pattern
    const prevCandle = candles[i - 1];
    const firstStallCandle = candles[i];
    
    // Check if we have a potential stall start
    // Stall starts when a candle's body stays within previous candle's range
    if (isWithinRange(firstStallCandle, prevCandle)) {
      if (DEBUG_MODE) {
        debugLog('[detectBreakoutBoxes] Potential stall start at index', i);
      }
      
      // Find the extent of the stall
      let stallEnd = i;
      let floor = firstStallCandle.low;
      let ceiling = prevCandle.high;
      
      // Extend the stall while candles remain in range
      while (stallEnd < candles.length - 1) {
        const nextCandle = candles[stallEnd + 1];
        
        // Check if next candle stays within the box
        if (isWithinBox(nextCandle, floor, ceiling)) {
          // Update floor and ceiling
          floor = Math.min(floor, nextCandle.low);
          ceiling = Math.max(ceiling, nextCandle.high);
          stallEnd++;
          
          if (DEBUG_MODE) {
            debugLog('[detectBreakoutBoxes] Extending stall at index', stallEnd);
          }
        } else {
          // Potential breakout found
          if (DEBUG_MODE) {
            debugLog('[detectBreakoutBoxes] Breakout detected at index', stallEnd + 1);
          }
          
          // Check if the stall was long enough
          if (stallEnd - i + 1 >= minStallLength) {
            // We have a valid breakout!
            const breakoutCandle = nextCandle;
            const direction = breakoutCandle.close > ceiling ? 'RISING' : 'FALLING';
            
            // Only count valid breakouts (not just wicks)
            if ((direction === 'RISING' && breakoutCandle.close > ceiling) ||
                (direction === 'FALLING' && breakoutCandle.close < floor)) {
              
              const box: BreakoutBox = {
                startIndex: i,
                endIndex: stallEnd,
                stepRef: `${i}-${stallEnd}`,
                direction,
                floor,
                ceiling,
                height: ceiling - floor,
                breakoutCandle
              };
              
              // Extract stall candles and calculate Blackjack score
              const stallCandles = candles.slice(i, stallEnd + 1);
              const bjScore = calcStepBlackjack(stallCandles);
              
              // Attach scoring metadata
              box.blackjackScore = bjScore.cumulativeScore;
              box.blackjackComponents = [bjScore.intrinsicScore]; // Can expand to include per-candle scores if needed
              
              // Determine Goldmine qualification based on direction and score
              box.qualifiesForGoldmine = (
                (direction === 'RISING' && bjScore.cumulativeScore <= -2) ||
                (direction === 'FALLING' && bjScore.cumulativeScore >= 2)
              );
              
              // Always log scoring details to understand qualification
              logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [detectBreakoutBoxes] BreakoutBox qualification check:', { 
                stepRef: box.stepRef,
                direction: box.direction,
                stallLength: stallCandles.length,
                intrinsicScore: bjScore.intrinsicScore,
                cumulativeScore: bjScore.cumulativeScore,
                components: bjScore.components,
                qualifiesForGoldmine: box.qualifiesForGoldmine,
                qualificationReason: box.qualifiesForGoldmine ? 'QUALIFIED' : 
                  (direction === 'RISING' ? 
                    `Need score <= -2, got ${bjScore.cumulativeScore}` : 
                    `Need score >= 2, got ${bjScore.cumulativeScore}`)
              });
              
              // Log scoring in dev mode
              if (DEBUG_MODE) {
                logDebug('DEBUG_PATTERN_DETECT', '[Blackjack] BreakoutBox score:', { 
                  score: bjScore,
                  box: {
                    stepRef: box.stepRef,
                    direction: box.direction,
                    blackjackScore: box.blackjackScore,
                    qualifiesForGoldmine: box.qualifiesForGoldmine
                  }
                });
              }
              
              boxes.push(box);
              
              if (DEBUG_MODE) {
                debugLog('[detectBreakoutBoxes] Found box:', {
                  startIndex: box.startIndex,
                  endIndex: box.endIndex,
                  stallLength: stallEnd - i + 1,
                  direction: box.direction,
                  floor: box.floor,
                  ceiling: box.ceiling
                });
              }
              
              logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] detectBreakoutBoxes found box:', {
                startIndex: box.startIndex,
                endIndex: box.endIndex,
                stallLength: stallEnd - i + 1,
                direction: box.direction,
                height: box.height
              });
              
              // Skip past this box for next detection
              i = stallEnd + 2;
            } else {
              // Not a valid breakout, continue searching
              i++;
            }
          } else {
            // Stall too short, continue searching
            i++;
          }
          break; // Exit the while loop since we found a breakout
        }
      }
      
      // If we reached end of candles without breakout, move on
      if (stallEnd >= candles.length - 1) {
        i = candles.length;
      }
    } else {
      i++;
    }
  }
  
  // Summary log at end of detection
  const qualifiedCount = boxes.filter(b => b.qualifiesForGoldmine).length;
  logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [detectBreakoutBoxes] Detection complete:', {
    totalBoxes: boxes.length,
    qualifiedBoxes: qualifiedCount,
    qualifiedStepRefs: boxes
      .filter(b => b.qualifiesForGoldmine)
      .map(b => ({ stepRef: b.stepRef, score: b.blackjackScore }))
  });
  
  if (DEBUG_MODE) {
    debugLog('[detectBreakoutBoxes] Detection complete:', {
      totalBoxes: boxes.length,
      boxes: boxes.map(b => ({
        stepRef: b.stepRef,
        dir: b.direction,
        indices: `${b.startIndex}-${b.endIndex}`
      }))
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
