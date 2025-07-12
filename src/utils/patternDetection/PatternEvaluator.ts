// src/utils/patternDetection/PatternEvaluator.ts
// Canonical pattern detector signal emission pipeline
// Evaluates ALL pattern detectors and emits signals to TradeActionBus

import { CandlestickData } from '../../models/ChartTypes';
import { TradeActionBus } from '../trading/TradeActionSignal';
import { logDebug } from '../debug';

// Pattern detector imports - these are the main detection functions
import { detectGoldenCandle } from '../../patternEngine/goldenCandle';
import { detectBlackjackTradeSignals } from '../../patternEngine/blackjack';
import { detectEscalatorTradeSignals } from '../../patternEngine/escalator';
import { detectGoldmineShaftPatterns } from '../../patternEngine/goldmine';
import { detectGoldmineChannelPatterns } from '../../patternEngine/goldmineChannel';
import { detectRocketman } from '../../patternEngine/rocketman';
import { detectPivots } from '../../patternEngine/pivot';

export interface DetectionSettings {
  enabled: {
    goldenCandle: boolean;
    blackjack: boolean;
    escalator: boolean;
    goldmineShaft: boolean;
    goldmineChannel: boolean;
    rocketman: boolean;
    pivot: boolean;
  };
  thresholds: {
    confidence: number;
    volume: number;
    priceMovement: number;
  };
}

export const defaultDetectionSettings: DetectionSettings = {
  enabled: {
    goldenCandle: true,
    blackjack: true,
    escalator: true,
    goldmineShaft: true,
    goldmineChannel: true,
    rocketman: true,
    pivot: true
  },
  thresholds: {
    confidence: 0.6,
    volume: 1000,
    priceMovement: 0.01
  }
};

/**
 * Canonical pattern evaluation function - the main trigger for signal emission
 * This is the central hub that evaluates ALL pattern detectors and emits signals
 */
export function evaluateAllPatternDetectors(
  candleData: CandlestickData[], 
  settings: DetectionSettings = defaultDetectionSettings
): void {
  if (!candleData || candleData.length === 0) {
    logDebug('PATTERN_EVAL', '[evaluateAllPatternDetectors] No candle data provided');
    return;
  }

  // Clear existing signals to avoid duplicates
  TradeActionBus.clear();
  
  logDebug('PATTERN_EVAL', `[evaluateAllPatternDetectors] Evaluating ${candleData.length} candles across all pattern detectors`);

  try {
    // Golden Candle Detection & Signal Emission
    if (settings.enabled.goldenCandle) {
      detectGoldenCandle(candleData);
    }

    // Blackjack Detection & Signal Emission
    if (settings.enabled.blackjack) {
      detectBlackjackTradeSignals(candleData);
    }

    // Escalator Detection & Signal Emission
    if (settings.enabled.escalator) {
      detectEscalatorTradeSignals(candleData);
    }

    // Goldmine Shaft Detection & Signal Emission
    if (settings.enabled.goldmineShaft) {
      detectGoldmineShaftPatterns(candleData);
    }

    // Goldmine Channel Detection & Signal Emission
    if (settings.enabled.goldmineChannel) {
      detectGoldmineChannelPatterns(candleData);
    }

    // Rocketman Detection & Signal Emission
    if (settings.enabled.rocketman) {
      detectRocketman(candleData);
    }

    // Pivot Detection & Signal Emission
    if (settings.enabled.pivot) {
      detectPivots(candleData);
    }

    const emittedSignals = TradeActionBus.getSignals();
    logDebug('PATTERN_EVAL', `[evaluateAllPatternDetectors] Completed evaluation. ${emittedSignals.length} signals emitted to TradeActionBus`);
    
    // Debug: Log signal breakdown by pattern type
    const signalBreakdown = emittedSignals.reduce((acc, signal) => {
      acc[signal.pattern] = (acc[signal.pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    logDebug('PATTERN_EVAL', '[evaluateAllPatternDetectors] Signal breakdown by pattern:', signalBreakdown);

  } catch (error) {
    console.error('[evaluateAllPatternDetectors] Error during pattern evaluation:', error);
    logDebug('PATTERN_EVAL', '[evaluateAllPatternDetectors] Evaluation failed:', error);
  }
}

/**
 * Convenience function to trigger pattern evaluation from chart components
 */
export function triggerPatternEvaluation(candleData: CandlestickData[]): void {
  evaluateAllPatternDetectors(candleData, defaultDetectionSettings);
}

/**
 * Get current signal count from TradeActionBus
 */
export function getCurrentSignalCount(): number {
  return TradeActionBus.getSignals().length;
}

/**
 * Get signals by pattern type for debugging
 */
export function getSignalsByPattern(): Record<string, number> {
  const signals = TradeActionBus.getSignals();
  return signals.reduce((acc, signal) => {
    acc[signal.pattern] = (acc[signal.pattern] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
