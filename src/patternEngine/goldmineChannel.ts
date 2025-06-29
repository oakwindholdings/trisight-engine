// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/patternEngine/goldmineChannel.ts
// Detects goldmine channel patterns in candlestick data
// Identifies horizontal, ascending, and descending channel formations
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Uses HA candles exclusively

import { Candle } from '../types/pattern';
import { ChannelDirection, ThrustDirection, GoldmineChannelPattern } from '../models/PatternTypes';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';
import { emitTradeSignal } from '../framework/tradeActionEmitter';
import { TradeActionSignal, SignalType, TradeAction } from '../utils/trading/TradeActionSignal';
import { AdaptiveGoldmineChannelDetector } from '../utils/patternDetection/AdaptiveGoldmineChannelDetector';
import { MarketContext } from '../utils/patternDetection/core/MarketContext';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

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
 * DICK O'LEARY COMPLIANCE: Uses HA candles exclusively
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
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] Starting detection on', candles.length, 'candles');
  
  if (!candles || candles.length < minChannelLength) {
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] Not enough candles for detection:', candles?.length, 'min required:', minChannelLength);
    return [];
  }

  // Convert to HA candles for Dick O'Leary compliance
  const haCandles = convertToHeikinAshi(candles);
  const channels: GoldmineChannelDetection[] = [];

  // Look for cup-shaped consolidation channels with breakout potential
  for (let i = 20; i < candles.length - 10; i++) {
    // 1. Find potential channel base (consolidation period)
    const channelStart = Math.max(0, i - 20);
    const channelEnd = Math.min(candles.length - 1, i + 15);
    const channelHACandles = haCandles.slice(channelStart, channelEnd + 1);
    
    if (channelHACandles.length < minChannelLength) continue;
    
    // 2. Calculate channel boundaries using HA candles exclusively
    const haHighs = channelHACandles.map(c => c.high);
    const haLows = channelHACandles.map(c => c.low);
    const upperBoundary = Math.max(...haHighs);
    const lowerBoundary = Math.min(...haLows);
    const channelWidth = (upperBoundary - lowerBoundary) / lowerBoundary;
    
    // 3. Check for 15-30% depth consolidation requirement
    const depthPercent = channelWidth * 100;
    if (depthPercent < 15 || depthPercent > 30) {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] HA channel depth requirement not met:', {
        depthPercent: depthPercent.toFixed(1) + '%',
        required: '15-30%',
        channelStart: channelStart,
        upperBoundary: upperBoundary.toFixed(2),
        lowerBoundary: lowerBoundary.toFixed(2),
        dickOLearyCompliant: true
      });
      continue;
    }
    
    // 4. Verify uptrend before channel (look back 20 candles before channel start)
    const preChannelStart = Math.max(0, channelStart - 20);
    const preChannelHACandles = haCandles.slice(preChannelStart, channelStart);
    
    if (preChannelHACandles.length < 10) continue;
    
    const preChannelLow = Math.min(...preChannelHACandles.map(c => c.low));
    const channelEntryPrice = channelHACandles[0].close;
    const uptrendConfirmed = channelEntryPrice > preChannelLow * 1.1; // 10% uptrend minimum
    
    if (!uptrendConfirmed) {
      if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] Uptrend requirement not met:', {
        channelEntryPrice: channelEntryPrice.toFixed(2),
        preChannelLow: preChannelLow.toFixed(2),
        uptrendGain: (((channelEntryPrice / preChannelLow) - 1) * 100).toFixed(1) + '%',
        required: '10%+ uptrend'
      });
      continue;
    }
    
    if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] HA channel requirements met:', {
      depthPercent: depthPercent.toFixed(1) + '%',
      uptrendGain: (((channelEntryPrice / preChannelLow) - 1) * 100).toFixed(1) + '%',
      channelLength: channelHACandles.length,
      channelStart: channelStart,
      channelEnd: channelEnd
    });
    
    // 5. Identify touch points on upper and lower boundaries
    const touchPoints: Array<{ time: Date; price: number; isUpper: boolean; candleIndex: number }> = [];
    const tolerance = channelWidth * 0.1; // 10% tolerance for touch point detection
    
    channelHACandles.forEach((candle, idx) => {
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
      if (haCandles[j].close > upperBoundary) {
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
        logDebug('DEBUG_PATTERN_DETECT', `HA Goldmine Channel detected`, {
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
          timeRange: `${channelHACandles[0].datetime} to ${channelHACandles[channelHACandles.length-1].datetime}`,
          signalStrength: confidence >= 0.8 ? 'STRONG' : confidence >= 0.6 ? 'MEDIUM' : 'WEAK'
        });
      }
      
      channels.push(channelDetection);
    }
  }

  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] Detection complete. Found', channels.length, 'channels');
  
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
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] STUB: Direction calculation not implemented');
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
  if (DEBUG_MODE) logDebug('DEBUG_PATTERN_DETECT', '[HA GoldmineChannel] STUB: Consistency validation not implemented');
  return 0.5; // Placeholder score
}

// ─────────────────────────────────────────────────────────────
// TriSight Goldmine Channel → TradeAction Signal Integration
// Pattern : Goldmine Channel  
// Purpose : Emit BUY/SELL signals after validated cup-shaped breakout
// Note    : Dick O'Leary compliant breakout continuation signals
// ─────────────────────────────────────────────────────────────

/**
 * Detect Goldmine Channel patterns using AdaptiveGoldmineChannelDetector
 */
export function detectGoldmineChannelPatterns(candles: Candle[]): GoldmineChannelPattern[] {
  // DICK O'LEARY COMPLIANCE: Use Heikin-Ashi candles exclusively
  const haCandles = convertToHeikinAshi(candles);
  
  const detector = new AdaptiveGoldmineChannelDetector({
    minimumConfidence: 0.35,
    enableLogging: true
  });
  
  // Create basic market context
  const context: MarketContext = {
    activeChannels: [],
    channelWidthPercentage: 0.05, 
    currentPositionInChannel: 0.5,
    breakoutPotential: 0.3,
    structure: 'TRENDING' as any,
    timeframe: '5min' as any,
    volatility: 0.02,
    volumeProfile: { highVolume: [], lowVolume: [] } as any,
    phase: 'TRENDING' as any,
    detectedPatternDensity: new Map(),
    recentPatterns: [],
    getVolatilityFactor: () => 1.0
  };
  
  const patterns = detector.detect(haCandles.map(candle => ({
    datetime: new Date(candle.timestamp).toISOString(),
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume || 1000
  })), context);
  
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_CHANNEL_SIGNALS) {
    console.log(`[GoldmineChannel:Detection] Found ${patterns.length} channel patterns`);
    patterns.forEach((pattern, idx) => {
      console.log(`[GoldmineChannel:${idx}] ${pattern.direction} | Confidence: ${(pattern.confidence * 100).toFixed(1)}% | Width: ${((pattern.upperBoundary - pattern.lowerBoundary) / pattern.lowerBoundary * 100).toFixed(1)}%`);
    });
  }
  
  // 🔗 Pattern Detector Signal Evaluation Hook - Ensure emitTradeSignal() is triggered
  patterns.forEach(evaluateGoldmineChannelForEntry);
  
  return patterns;
}

/**
 * Emit BUY/SHORT trade signals for validated Goldmine Channel breakout continuation
 */
export function detectGoldmineChannelTradeSignals(candles: Candle[]): void {
  if (!candles.length) return;
  
  const patterns = detectGoldmineChannelPatterns(candles);
  
  patterns.forEach(channel => {
    evaluateGoldmineChannelForEntry(channel);
  });
}

/**
 * Evaluate Goldmine Channel pattern for entry signal after validated breakout
 * Canonical structure: emits BUY/SHORT signals for cup-shaped consolidation breakout
 */
export function evaluateGoldmineChannelForEntry(channel: GoldmineChannelPattern): void {
  const { direction, upperBoundary, lowerBoundary, confidence, touchPoints, startTime, endTime } = channel;

  // Confidence gate — Dick doesn't want low-confidence breakout signals
  if (confidence < 0.6 || !touchPoints || touchPoints.length < 4) {
    return;
  }

  // 🔴 CRITICAL FIX: Tactical channel entry logic (NOT breakout chasing)
  // BUY at channel LOWS (lower boundary) - buy support
  // SHORT at channel HIGHS (upper boundary) - short resistance
  let action: TradeAction;
  let signalType: SignalType;
  let price: number;
  
  if (direction === ChannelDirection.ASCENDING || direction === ChannelDirection.HORIZONTAL) {
    // Ascending/Horizontal channel - BUY at lower boundary (support)
    action = TradeAction.BUY;
    signalType = SignalType.LONG_ENTRY;
    price = lowerBoundary; // Entry at lower boundary (support)
  } else if (direction === ChannelDirection.DESCENDING) {
    // Descending channel - SHORT at upper boundary (resistance)
    action = TradeAction.SHORT;
    signalType = SignalType.SHORT_ENTRY;
    price = upperBoundary; // Entry at upper boundary (resistance)
  } else {
    // Default: BUY at support
    action = TradeAction.BUY;
    signalType = SignalType.LONG_ENTRY;
    price = lowerBoundary;
  }
  
  // Use pattern detection timestamp, not current time (no lookahead)
  const patternTimestamp = endTime || startTime || new Date();

  // Canonical signal emission - only core fields needed
  emitTradeSignal({
    action,
    signalType,
    pattern: 'Goldmine Channel',
    confidence,
    price,
    timestamp: patternTimestamp,
    reason: `Cup-shaped consolidation breakout (${direction})`
  });


  
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_CHANNEL_SIGNALS) {
    console.log(`[GoldmineChannel:ENTRY] ${action} signal emitted:`, {
      direction: direction,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      touchPoints: touchPoints.length,
      price: price.toFixed(4),
      upperBoundary: upperBoundary.toFixed(4),
      lowerBoundary: lowerBoundary.toFixed(4),
      reason: `Cup-shaped consolidation breakout (${direction})`
    });
  }
}

/**
 * Monitor active Goldmine Channel patterns for exit signals (channel re-entry)
 */
export function monitorGoldmineChannelExitSignals(
  candles: Candle[], 
  activeChannels: GoldmineChannelPattern[]
): void {
  if (!candles.length || !activeChannels.length) return;
  
  const currentPrice = candles[candles.length - 1].close;
  const currentTime = new Date(candles[candles.length - 1].timestamp);

  activeChannels.forEach(channel => {
    monitorGoldmineChannelForExit(channel, currentPrice, currentTime);
  });
}

/**
 * Monitor individual Goldmine Channel for exit signal (re-entry into channel)
 * Canonical structure: emits SELL/COVER signals when breakout fails
 */
export function monitorGoldmineChannelForExit(
  channel: GoldmineChannelPattern, 
  livePrice: number, 
  currentTime: Date
): void {
  const { direction, confidence, upperBoundary, lowerBoundary } = channel;

  if (confidence < 0.6) return;

  // Check if price has re-entered the channel (breakout failure)
  const isBullishBreakout = direction === ChannelDirection.ASCENDING || direction === ChannelDirection.HORIZONTAL;
  const channelReEntry = isBullishBreakout 
    ? livePrice < upperBoundary  // Bullish breakout failed - price back below upper boundary
    : livePrice > lowerBoundary; // Bearish breakout failed - price back above lower boundary

  if (channelReEntry) {
    const action = isBullishBreakout ? TradeAction.SELL : TradeAction.COVER;
    const signalType = isBullishBreakout ? SignalType.LONG_EXIT : SignalType.SHORT_EXIT;

    // Canonical signal emission - only core fields needed
    emitTradeSignal({
      action,
      signalType,
      pattern: 'Goldmine Channel',
      confidence,
      price: livePrice,
      timestamp: currentTime,
      reason: `Breakout failed - price re-entered channel (${direction})`
    });
    
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_GOLDMINE_CHANNEL_SIGNALS) {
      console.log(`[GoldmineChannel:EXIT] ${action} signal emitted:`, {
        direction: direction,
        confidence: `${(confidence * 100).toFixed(1)}%`, 
        reEntryPrice: livePrice.toFixed(4),
        upperBoundary: upperBoundary.toFixed(4),
        lowerBoundary: lowerBoundary.toFixed(4),
        reason: `Breakout failed - price re-entered channel (${direction})`
      });
    }

  }
}
