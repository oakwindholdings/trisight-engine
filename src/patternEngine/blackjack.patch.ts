// src/patternEngine/blackjack.patch.ts
// CRITICAL PATCH: Convert Blackjack to Attention-Only Signals
// Addresses audit findings: 21-day high trigger, attention-only vs trade signals, day-count filtering

import { Candle, BlackjackScore } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

// Blackjack attention signal - NOT a trade signal
export interface BlackjackAttentionSignal {
  type: 'ATTENTION_ONLY'; // Never BUY/SELL/SHORT/COVER
  index: number;
  timestamp: Date;
  price: number;
  signal: 'WATCH_LONG' | 'WATCH_SHORT'; // Attention signals only
  twentyOneDayHigh: boolean;
  daysSinceSignal: number;
  intrinsicScore: number;
  cumulativeScore: number;
  attentionReason: string;
  isWatchlistOnly: true; // Always true for Blackjack
}

export interface TwentyOneDayAnalysis {
  currentPrice: number;
  twentyOneDayHigh: number;
  twentyOneDayLow: number;
  isAtTwentyOneDayHigh: boolean;
  daysSinceHigh: number;
  highConfidence: boolean;
}

/**
 * Calculate 21-day high analysis for Blackjack trigger validation
 * ADDRESSES AUDIT FINDING: 21-day high trigger requirement
 */
function analyzeTwentyOneDayHigh(candles: Candle[], currentIndex: number): TwentyOneDayAnalysis {
  const lookbackPeriod = Math.min(21, currentIndex + 1);
  const startIndex = Math.max(0, currentIndex - lookbackPeriod + 1);
  const segment = candles.slice(startIndex, currentIndex + 1);
  
  const haCandles = convertToHeikinAshi(segment);
  const currentPrice = haCandles[haCandles.length - 1].close;
  
  let twentyOneDayHigh = -Infinity;
  let twentyOneDayLow = Infinity;
  let daysSinceHigh = 0;
  
  // Find 21-day high and low using HA prices
  for (let i = 0; i < haCandles.length; i++) {
    const high = haCandles[i].high;
    const low = haCandles[i].low;
    
    if (high > twentyOneDayHigh) {
      twentyOneDayHigh = high;
      daysSinceHigh = haCandles.length - 1 - i;
    }
    
    if (low < twentyOneDayLow) {
      twentyOneDayLow = low;
    }
  }
  
  const priceThreshold = 0.001; // 0.1% threshold for "at high"
  const isAtTwentyOneDayHigh = Math.abs(currentPrice - twentyOneDayHigh) <= (twentyOneDayHigh * priceThreshold);
  const highConfidence = daysSinceHigh <= 2 && isAtTwentyOneDayHigh;
  
  return {
    currentPrice,
    twentyOneDayHigh,
    twentyOneDayLow,
    isAtTwentyOneDayHigh,
    daysSinceHigh,
    highConfidence
  };
}

/**
 * Validate day-count-based filtering for Blackjack signals
 * ADDRESSES AUDIT FINDING: Day-count filtering requirement
 */
function validateDayCountFilter(
  candles: Candle[], 
  currentIndex: number, 
  lastSignalIndex?: number
): { isValid: boolean; daysSinceLastSignal: number; reason: string } {
  const minimumDaysBetweenSignals = 3; // Minimum spacing requirement
  
  if (lastSignalIndex === undefined) {
    return {
      isValid: true,
      daysSinceLastSignal: 0,
      reason: 'First signal'
    };
  }
  
  const daysSinceLastSignal = currentIndex - lastSignalIndex;
  const isValid = daysSinceLastSignal >= minimumDaysBetweenSignals;
  
  return {
    isValid,
    daysSinceLastSignal,
    reason: isValid ? 'Sufficient time spacing' : `Only ${daysSinceLastSignal} days since last signal`
  };
}

/**
 * Generate attention-only signals for Blackjack patterns
 * ADDRESSES AUDIT FINDINGS: Attention-only signals, 21-day high trigger, day-count filtering
 * NOTE: This replaces trade signal emission with watchlist-only attention signals
 */
export function detectBlackjackAttentionSignals(
  candles: Candle[],
  intrinsicScores: number[],
  cumulativeScores: number[]
): BlackjackAttentionSignal[] {
  logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Starting attention-only detection');
  
  if (!candles || candles.length < 21) {
    logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Insufficient data for 21-day analysis');
    return [];
  }
  
  const haCandles = convertToHeikinAshi(candles);
  const attentionSignals: BlackjackAttentionSignal[] = [];
  let lastSignalIndex: number | undefined = undefined;
  
  // Scan for attention-worthy patterns starting after 21-day lookback
  for (let i = 21; i < haCandles.length; i++) {
    const intrinsic = intrinsicScores[i] || 0;
    const cumulative = cumulativeScores[i] || 0;
    
    // Apply Blackjack scoring thresholds for attention signals
    const isLongAttention = cumulative <= -2; // Extreme bearish for contrarian long attention
    const isShortAttention = cumulative >= 3;  // Extreme bullish for contrarian short attention
    
    if (!isLongAttention && !isShortAttention) continue;
    
    // Analyze 21-day high requirement
    const twentyOneDayAnalysis = analyzeTwentyOneDayHigh(candles, i);
    
    // Validate day-count filtering
    const dayCountFilter = validateDayCountFilter(candles, i, lastSignalIndex);
    
    // Only proceed if 21-day high trigger is met
    if (!twentyOneDayAnalysis.isAtTwentyOneDayHigh) {
      logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Skipping - not at 21-day high:', {
        index: i,
        currentPrice: twentyOneDayAnalysis.currentPrice.toFixed(4),
        twentyOneDayHigh: twentyOneDayAnalysis.twentyOneDayHigh.toFixed(4),
        daysSinceHigh: twentyOneDayAnalysis.daysSinceHigh
      });
      continue;
    }
    
    // Only proceed if day-count filter passes
    if (!dayCountFilter.isValid) {
      logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Skipping - day count filter:', {
        index: i,
        reason: dayCountFilter.reason,
        daysSinceLastSignal: dayCountFilter.daysSinceLastSignal
      });
      continue;
    }
    
    // Generate attention signal
    let attentionReason = '';
    let signal: 'WATCH_LONG' | 'WATCH_SHORT';
    
    if (isLongAttention) {
      signal = 'WATCH_LONG';
      attentionReason = `Extreme bearish cumulative (${cumulative}) at 21-day high - contrarian long attention`;
    } else {
      signal = 'WATCH_SHORT';  
      attentionReason = `Extreme bullish cumulative (${cumulative}) at 21-day high - contrarian short attention`;
    }
    
    const attentionSignal: BlackjackAttentionSignal = {
      type: 'ATTENTION_ONLY',
      index: i,
      timestamp: new Date(haCandles[i].datetime),
      price: haCandles[i].close,
      signal,
      twentyOneDayHigh: true, // Always true due to filter above
      daysSinceSignal: dayCountFilter.daysSinceLastSignal,
      intrinsicScore: intrinsic,
      cumulativeScore: cumulative,
      attentionReason,
      isWatchlistOnly: true
    };
    
    attentionSignals.push(attentionSignal);
    lastSignalIndex = i;
    
    logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Attention signal generated:', {
      index: i,
      signal,
      price: attentionSignal.price.toFixed(4),
      intrinsic,
      cumulative,
      twentyOneDayHigh: twentyOneDayAnalysis.twentyOneDayHigh.toFixed(4),
      daysSinceLastSignal: dayCountFilter.daysSinceLastSignal,
      reason: attentionReason
    });
  }
  
  logDebug('DEBUG_PATTERN_DETECT', '[Blackjack Attention] Detection complete:', {
    totalAttentionSignals: attentionSignals.length,
    watchLongSignals: attentionSignals.filter(s => s.signal === 'WATCH_LONG').length,
    watchShortSignals: attentionSignals.filter(s => s.signal === 'WATCH_SHORT').length,
    averageDaysBetween: attentionSignals.length > 1 ? 
      attentionSignals.reduce((sum, s) => sum + s.daysSinceSignal, 0) / attentionSignals.length : 0
  });
  
  return attentionSignals;
}

/**
 * DEPRECATED: Remove trade signal emission for Blackjack
 * This function should be removed from the codebase
 * Blackjack patterns should ONLY generate attention signals, never trade signals
 */
export function detectBlackjackTradeSignals_DEPRECATED() {
  throw new Error('BLACKJACK COMPLIANCE ERROR: Blackjack patterns must NEVER emit trade signals. Use detectBlackjackAttentionSignals() instead.');
}

/**
 * Render attention markers for Blackjack patterns
 * These should be visually distinct from trade signals
 */
export interface BlackjackAttentionMarker {
  index: number;
  type: 'ATTENTION_MARKER';
  label: 'WATCH ↑' | 'WATCH ↓';
  color: 'yellow' | 'orange'; // Attention colors, not trade colors
  style: 'dashed_border'; // Visually distinct from solid trade signals
}

export function createBlackjackAttentionMarkers(
  attentionSignals: BlackjackAttentionSignal[]
): BlackjackAttentionMarker[] {
  return attentionSignals.map(signal => ({
    index: signal.index,
    type: 'ATTENTION_MARKER' as const,
    label: signal.signal === 'WATCH_LONG' ? 'WATCH ↑' : 'WATCH ↓',
    color: signal.signal === 'WATCH_LONG' ? 'yellow' : 'orange',
    style: 'dashed_border' as const
  }));
}
