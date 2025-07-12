// src/framework/tradeActionEmitter.ts
// Centralized trade signal emission framework with unified TradeActionBus
// Handles all pattern detector signal emission with debug logging and validation

import { TradeActionSignal, TradeAction, SignalType } from '../utils/trading/TradeActionSignal';
import { logDebug, isChannelEnabled } from '../utils/debug';
import { TradeSignalValidator, SignalValidationResult } from '../utils/signalValidation/TradeSignalValidator';
import { CandlestickData } from '../models/ChartTypes';

// Global TradeActionBus - single source of truth for all trade signals
// Import the class-based TradeActionBus to unify signal emission/rendering
import { TradeActionBus as UnifiedTradeActionBus } from '../utils/trading/TradeActionSignal';
export const TradeActionBus = UnifiedTradeActionBus;

// Global signal validation results for rendering annotations
export const SignalValidationResults: Map<string, SignalValidationResult> = new Map();

// Global candle data reference for validation (set by chart component)
let globalCandleData: CandlestickData[] = [];

/**
 * Set global candle data for signal validation
 * @param candles - Current candle dataset
 */
export function setGlobalCandleData(candles: CandlestickData[]): void {
  globalCandleData = candles;
}

/**
 * Emit a standardized TradeActionSignal for rendering, logging, and execution
 * @param signal - Complete TradeActionSignal object with all required properties
 */
export function emitTradeSignal(signal: TradeActionSignal): void {
  // Add to global bus
  TradeActionBus.push(signal);
  
  // Validate signal quality if candle data is available
  let validationResult: SignalValidationResult | null = null;
  if (globalCandleData.length > 0) {
    validationResult = TradeSignalValidator.validateSignal(signal, globalCandleData, TradeActionBus.getSignals());
    
    // Store validation result for rendering annotations
    const signalKey = `${signal.pattern}_${signal.timestamp.getTime()}_${signal.price}`;
    SignalValidationResults.set(signalKey, validationResult);
  }
  
  // Debug logging for signal emission validation to console
  console.debug('[TradeActionEmitter] Signal emitted', {
    action: signal.action,
    pattern: signal.pattern,
    price: signal.price,
    timestamp: signal.timestamp,
  });

  // Debug logging for signal emission validation
  console.log(`[TradeActionEmitter] Signal emitted:`, {
    action: signal.action,
    pattern: signal.pattern,
    price: signal.price,
    timestamp: signal.timestamp,
    confidence: signal.confidence,
    busLength: TradeActionBus.getSignals().length
  });
  
  // Use DEBUG_TRADE_SIGNALS channel for UI-controllable debug logging
  if (isChannelEnabled('DEBUG_TRADE_SIGNALS')) {
    const debugData: any = {
      pattern: signal.pattern,
      action: signal.action,
      signalType: signal.signalType,
      price: signal.price.toFixed(4),
      timestamp: signal.timestamp.toISOString(),
      confidence: `${(signal.confidence * 100).toFixed(1)}%`,
      reason: signal.reason,
      busSize: TradeActionBus.getSignals().length
    };
    
    // Add validation results to debug output
    if (validationResult) {
      debugData.validation = {
        flag: validationResult.validationFlag,
        isValid: validationResult.isValid,
        issues: validationResult.issues,
        priceChange3Candle: `${validationResult.metrics.priceChangePercent3Candle.toFixed(1)}%`,
        duplicatesInZone: validationResult.metrics.duplicateSignalsInZone,
        profitability5Candles: validationResult.metrics.profitabilityNext5Candles ? 
          `${validationResult.metrics.profitabilityNext5Candles.toFixed(1)}%` : 'N/A',
        profitability10Candles: validationResult.metrics.profitabilityNext10Candles ? 
          `${validationResult.metrics.profitabilityNext10Candles.toFixed(1)}%` : 'N/A'
      };
    }
    
    logDebug('DEBUG_TRADE_SIGNALS', `[TradeSignal] ${signal.action} signal emitted`, debugData);
  }
}

/**
 * Get validation result for a specific signal
 * @param signal - TradeActionSignal to get validation for
 * @returns SignalValidationResult or null if not found
 */
export function getSignalValidation(signal: TradeActionSignal): SignalValidationResult | null {
  const signalKey = `${signal.pattern}_${signal.timestamp.getTime()}_${signal.price}`;
  return SignalValidationResults.get(signalKey) || null;
}

/**
 * Clear all signals from the trade action bus (for testing/reset)
 */
export function clearTradeActionBus(): void {
  TradeActionBus.clear();
}

/**
 * Get all signals from the trade action bus
 */
export function getTradeActionSignals(): readonly TradeActionSignal[] {
  return TradeActionBus.getSignals();
}
