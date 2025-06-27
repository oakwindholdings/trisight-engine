// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/goldmineChannel.ts
// Detects goldmine channel patterns in candlestick data
// Identifies horizontal, ascending, and descending channel formations
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT

import { Candle } from '../types/pattern';
import { ChannelDirection, ThrustDirection } from '../models/PatternTypes';
import { logDebug } from '../utils/debug';

export interface GoldmineChannelDetection {
  startIndex: number;
  endIndex: number;
  stepRef: string;
  direction: ChannelDirection;
  upperBoundary: number;
  lowerBoundary: number;
  touchPoints: Array<{ 
    time: Date; 
    price: number; 
    isUpper: boolean;
    candleIndex: number;
  }>;
  confidence: number;
  channelWidth: number;
  touchPointCount: number;
  priceConsistency: number;
  volumeProfile: number;
}

/**
 * Detects goldmine channel patterns in candlestick data
 * @param candles - Array of candlestick data
 * @param minTouchPoints - Minimum touch points for valid channel (default: 4)
 * @param maxChannelWidth - Maximum channel width as percentage (default: 0.05)
 * @param minChannelLength - Minimum channel length in candles (default: 10)
 * @returns Array of detected goldmine channel patterns
 */
export function detectGoldmineChannel(
  candles: Candle[],
  minTouchPoints: number = 4,
  maxChannelWidth: number = 0.05,
  minChannelLength: number = 10
): GoldmineChannelDetection[] {
  logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length < minChannelLength) {
    logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Not enough candles for detection:', candles?.length, 'min required:', minChannelLength);
    return [];
  }

  const channels: GoldmineChannelDetection[] = [];

  // Look for cup-shaped consolidation channels with breakout potential
  for (let i = 20; i < candles.length - 10; i++) {
    // 1. Find potential channel base (consolidation period)
    const channelStart = Math.max(0, i - 20);
    const channelEnd = Math.min(candles.length - 1, i + 15);
    const channelCandles = candles.slice(channelStart, channelEnd + 1);
    
    if (channelCandles.length < minChannelLength) continue;
    
    // 2. Calculate channel boundaries
    const highs = channelCandles.map(c => c.high);
    const lows = channelCandles.map(c => c.low);
    const upperBoundary = Math.max(...highs);
    const lowerBoundary = Math.min(...lows);
    const channelWidth = (upperBoundary - lowerBoundary) / lowerBoundary;
    
    // 3. Check for 15-30% depth consolidation requirement
    const depthPercent = channelWidth * 100;
    if (depthPercent < 15 || depthPercent > 30) {
      logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Channel depth requirement not met:', {
        depthPercent: depthPercent.toFixed(1) + '%',
        required: '15-30%',
        channelStart: channelStart,
        upperBoundary: upperBoundary.toFixed(2),
        lowerBoundary: lowerBoundary.toFixed(2)
      });
      continue;
    }
    
    // 4. Verify uptrend before channel (look back 20 candles before channel start)
    const preChannelStart = Math.max(0, channelStart - 20);
    const preChannelCandles = candles.slice(preChannelStart, channelStart);
    
    if (preChannelCandles.length < 10) continue;
    
    const preChannelLow = Math.min(...preChannelCandles.map(c => c.low));
    const channelEntryPrice = channelCandles[0].close;
    const uptrendConfirmed = channelEntryPrice > preChannelLow * 1.1; // 10% uptrend minimum
    
    if (!uptrendConfirmed) {
      logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Uptrend requirement not met:', {
        channelEntryPrice: channelEntryPrice.toFixed(2),
        preChannelLow: preChannelLow.toFixed(2),
        uptrendGain: (((channelEntryPrice / preChannelLow) - 1) * 100).toFixed(1) + '%',
        required: '10%+ uptrend'
      });
      continue;
    }
    
    logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Channel requirements met:', {
      depthPercent: depthPercent.toFixed(1) + '%',
      uptrendGain: (((channelEntryPrice / preChannelLow) - 1) * 100).toFixed(1) + '%',
      channelLength: channelCandles.length,
      channelStart: channelStart,
      channelEnd: channelEnd
    });
    
    // 5. Identify touch points on upper and lower boundaries
    const touchPoints: Array<{ time: Date; price: number; isUpper: boolean; candleIndex: number }> = [];
    const tolerance = channelWidth * 0.1; // 10% tolerance for touch point detection
    
    channelCandles.forEach((candle, idx) => {
      const globalIdx = channelStart + idx;
      
      // Upper boundary touch
      if (Math.abs(candle.high - upperBoundary) <= tolerance) {
        touchPoints.push({
          time: new Date(candle.datetime),
          price: candle.high,
          isUpper: true,
          candleIndex: globalIdx
        });
      }
      
      // Lower boundary touch  
      if (Math.abs(candle.low - lowerBoundary) <= tolerance) {
        touchPoints.push({
          time: new Date(candle.datetime),
          price: candle.low,
          isUpper: false,
          candleIndex: globalIdx
        });
      }
    });
    
    // 6. Validate minimum touch points
    if (touchPoints.length < minTouchPoints) {
      continue;
    }
    
    // 7. Check for breakout confirmation (candle close above channel high)
    let breakoutConfirmed = false;
    let breakoutIndex = -1;
    
    for (let j = channelEnd + 1; j < Math.min(candles.length, channelEnd + 5); j++) {
      if (candles[j].close > upperBoundary) {
        breakoutConfirmed = true;
        breakoutIndex = j;
        break;
      }
    }
    
    // 8. Calculate pattern confidence and metrics
    const upperTouches = touchPoints.filter(tp => tp.isUpper).length;
    const lowerTouches = touchPoints.filter(tp => !tp.isUpper).length;
    const touchBalance = Math.min(upperTouches, lowerTouches) / Math.max(upperTouches, lowerTouches);
    
    const consistency = validateChannelConsistency(touchPoints, channelWidth);
    const direction = calculateChannelDirection(touchPoints);
    
    // Base confidence on touch points, consistency, and breakout confirmation
    let confidence = 0.4; // Base confidence
    confidence += (touchPoints.length - minTouchPoints) * 0.1; // Bonus for extra touches
    confidence += consistency * 0.3; // Consistency bonus
    confidence += touchBalance * 0.2; // Touch balance bonus
    
    if (breakoutConfirmed) {
      confidence += 0.3; // Breakout confirmation bonus
    }
    
    confidence = Math.min(confidence, 1.0);
    
    // 9. Create channel detection if confidence is sufficient
    if (confidence >= 0.5) {
      const channelDetection: GoldmineChannelDetection = {
        startIndex: channelStart,
        endIndex: breakoutConfirmed ? breakoutIndex : channelEnd,
        stepRef: `${channelStart}-${channelEnd}`,
        direction: direction,
        upperBoundary: upperBoundary,
        lowerBoundary: lowerBoundary,
        touchPoints: touchPoints,
        confidence: confidence,
        channelWidth: channelWidth,
        touchPointCount: touchPoints.length,
        priceConsistency: consistency,
        volumeProfile: 0.5 // Placeholder for volume analysis
      };
      
      // Add comprehensive DEBUG_PATTERN_DETECT logging
      if (typeof logDebug === 'function') {
        logDebug('DEBUG_PATTERN_DETECT', `Goldmine Channel detected`, {
          direction: direction,
          depthPercent: depthPercent.toFixed(1) + '%',
          channelStart: channelStart,
          channelEnd: channelEnd,
          upperBoundary: upperBoundary.toFixed(2),
          lowerBoundary: lowerBoundary.toFixed(2),
          channelWidth: (channelWidth * 100).toFixed(1) + '%',
          touchPoints: touchPoints.length,
          upperTouches: upperTouches,
          lowerTouches: lowerTouches,
          confidence: confidence.toFixed(2),
          consistency: consistency.toFixed(2),
          uptrendConfirmed: uptrendConfirmed,
          breakoutConfirmed: breakoutConfirmed,
          breakoutIndex: breakoutIndex,
          timeRange: `${channelCandles[0].datetime} to ${channelCandles[channelCandles.length-1].datetime}`,
          signalStrength: confidence >= 0.8 ? 'STRONG' : confidence >= 0.6 ? 'MEDIUM' : 'WEAK'
        });
      }
      
      channels.push(channelDetection);
    }
  }

  logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] Detection complete. Found', channels.length, 'channels');
  
  return channels;
}

/**
 * Calculates channel direction based on touch point trend
 * @param touchPoints - Array of touch points with timestamps and prices
 * @returns Channel direction (HORIZONTAL, ASCENDING, DESCENDING)
 */
export function calculateChannelDirection(
  touchPoints: Array<{ time: Date; price: number; isUpper: boolean }>
): ChannelDirection {
  // PLACEHOLDER: Implement direction calculation
  logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] STUB: Direction calculation not implemented');
  return ChannelDirection.HORIZONTAL;
}

/**
 * Validates channel consistency based on touch point distribution
 * @param touchPoints - Array of touch points
 * @param channelWidth - Width of the channel
 * @returns Consistency score (0-1)
 */
export function validateChannelConsistency(
  touchPoints: Array<{ time: Date; price: number; isUpper: boolean }>,
  channelWidth: number
): number {
  // PLACEHOLDER: Implement consistency validation
  logDebug('DEBUG_PATTERN_DETECT', '[GoldmineChannel] STUB: Consistency validation not implemented');
  return 0.5; // Placeholder score
}
