// src/utils/patternHydration.ts
// TriSight Pattern Signal Auto-Hydration Patch
// Automatically emit pattern signals to hydrate ConvictionCloud and TargetReportTable

import { CandlestickData } from '../models/ChartTypes';
import { TradeActionBus } from './trading/TradeActionSignal';
import { logDebug } from './debug';
import { throttle } from './gestureThrottle';

// Pattern detector imports - these are the functions that detect patterns and internally emit signals
import { detectGoldenCandle } from '../patternEngine/goldenCandle';
import { detectBlackjackTradeSignals } from '../patternEngine/blackjack';
import { detectEscalatorTradeSignals } from '../patternEngine/escalator';
import { detectGoldmineShaftPatterns } from '../patternEngine/goldmine';
import { detectGoldmineChannelPatterns } from '../patternEngine/goldmineChannel';
import { detectRocketman } from '../patternEngine/rocketman';
import { detectPivots } from '../patternEngine/pivot';

/**
 * Canonical pattern evaluation function that calls all pattern detection functions
 * Each detection function internally calls evaluateXForEntry which emits signals to TradeActionBus
 */
export const evaluateAllPatterns = throttle((candles: CandlestickData[]): void => {
  // 🔒 CRITICAL FIX: Preserve STOP_EXIT signals during chart updates
  // This prevents STOP/LOSS/COVER labels from disappearing after initial render
  const existingSignals = TradeActionBus.getSignals();
  const stopExitSignals = existingSignals.filter(signal => 
    signal.action === 'SELL' || signal.action === 'COVER'
  );
  
  // 🔍 DEBUG: Analyze signal timestamps to identify root cause
  logDebug('DEBUG_PATTERN_DETECT', '[SIGNAL_TIMESTAMP_ANALYSIS] Analyzing STOP_EXIT signal timestamps', {
    totalSignals: stopExitSignals.length,
    signalTimestamps: stopExitSignals.map(s => ({
      pattern: s.pattern,
      action: s.action,
      timestamp: s.timestamp.toISOString(),
      price: s.price.toFixed(4),
      candleIndex: s.candleIndex
    })).slice(0, 10) // Show first 10 for debugging
  });
  
  // Clear existing signals (but we'll restore STOP_EXIT signals)
  TradeActionBus.clear();
  
  logDebug('DEBUG_PATTERN_DETECT', '[PATTERN_HYDRATION] Preserving STOP_EXIT signals during pattern evaluation', { preservedCount: stopExitSignals.length });
  
  // 🔍 ENHANCED DEBUG: Check for identical timestamps in preserved signals
  const uniqueTimestamps = new Set(stopExitSignals.map(s => s.timestamp.getTime()));
  const uniquePrices = new Set(stopExitSignals.map(s => s.price));
  const uniquePatterns = new Set(stopExitSignals.map(s => s.pattern));
  
  logDebug('DEBUG_PATTERN_DETECT', '[SIGNAL_ANALYSIS] Analyzing preserved signal diversity', { totalPreserved: stopExitSignals.length, uniquePatterns: new Set(stopExitSignals.map(s => s.pattern)).size });
  
  try {
    // Golden Candle Detection & Signal Emission
    detectGoldenCandle(candles);
    
    // Blackjack Detection & Signal Emission
    detectBlackjackTradeSignals(candles);
    
    // Escalator Detection & Signal Emission
    detectEscalatorTradeSignals(candles);
    
    // Goldmine Shaft Detection & Signal Emission
    detectGoldmineShaftPatterns(candles);
    
    // Goldmine Channel Detection & Signal Emission
    detectGoldmineChannelPatterns(candles);
    
    // Rocketman Detection & Signal Emission
    detectRocketman(candles);
    
    // Pivot Detection & Signal Emission
    detectPivots(candles);
    
    const emittedSignals = TradeActionBus.getSignals();
    console.debug('[AutoHydration] Patterns evaluated, bus now holds', emittedSignals.length, 'signals');
    
    // Debug: Log signal breakdown by pattern type
    const breakdown = emittedSignals.reduce((acc, signal) => {
      acc[signal.pattern] = (acc[signal.pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.debug('[AutoHydration] Signal breakdown:', breakdown);
    
    // 🔄 RESTORE PRESERVED STOP_EXIT SIGNALS
    // Add back the STOP_EXIT signals that were preserved before pattern evaluation
    stopExitSignals.forEach(signal => {
      TradeActionBus.push(signal);
    });
    
    const finalSignals = TradeActionBus.getSignals();
    logDebug('DEBUG_PATTERN_DETECT', '[PATTERN_HYDRATION] STOP_EXIT signals restored after pattern evaluation', { restoredCount: stopExitSignals.length });
    
  } catch (error) {
    console.error('[AutoHydration] Error during pattern evaluation:', error);
  }
}, 5000); // 5 second throttle
