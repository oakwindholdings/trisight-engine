// src/utils/signalValidation/TradeSignalValidator.ts
// Validates TradeActionSignal profitability and entry timing quality
// Flags signals that are placed after significant price moves (post-surge/dip)

import { TradeActionSignal, TradeAction } from '../../utils/trading/TradeActionSignal';
import { CandlestickData } from '../../models/ChartTypes';

export interface SignalValidationResult {
  signal: TradeActionSignal;
  isValid: boolean;
  validationFlag: '🟢 VALID' | '🔴 LATE';
  issues: string[];
  metrics: {
    signalTimestamp: Date;
    signalPrice: number;
    candleCloseAtSignal: number;
    threeCandleAverage: number;
    priceChangePercent3Candle: number;
    profitabilityNext5Candles?: number;
    profitabilityNext10Candles?: number;
    candleIndexAtSignal: number;
    duplicateSignalsInZone: number;
  };
}

/**
 * Validates TradeActionSignal placement quality and entry timing
 * Detects post-surge/dip entries and poor entry price timing
 */
export class TradeSignalValidator {
  
  /**
   * Validate a single TradeActionSignal against candlestick data
   * @param signal - TradeActionSignal to validate
   * @param candles - Full candlestick dataset
   * @param allSignals - All signals for duplicate detection
   * @returns SignalValidationResult with timing quality assessment
   */
  static validateSignal(
    signal: TradeActionSignal,
    candles: CandlestickData[],
    allSignals: TradeActionSignal[] = []
  ): SignalValidationResult {
    
    // Find the candle that matches the signal timestamp
    const signalCandleIndex = this.findCandleIndexByTimestamp(signal.timestamp, candles);
    
    if (signalCandleIndex === -1 || signalCandleIndex < 3) {
      return this.createInvalidResult(signal, 'Signal candle not found or insufficient history');
    }
    
    const signalCandle = candles[signalCandleIndex];
    const issues: string[] = [];
    
    // 1. Check for post-surge/dip entry (3-candle hindsight test)
    const priceChange3Candle = this.calculatePriceChange3Candle(candles, signalCandleIndex);
    const isPostSurge = this.checkPostSurgeEntry(signal.action, priceChange3Candle);
    
    if (isPostSurge) {
      issues.push(`${signal.action} signal after ${Math.abs(priceChange3Candle).toFixed(1)}% price move`);
    }
    
    // 2. Check for duplicate signals in zone (5-candle window)
    const duplicatesInZone = this.countDuplicateSignalsInZone(signal, allSignals, 5);
    
    if (duplicatesInZone > 1) {
      issues.push(`${duplicatesInZone} signals within 5-candle zone`);
    }
    
    // 3. Check entry price vs 3-candle average
    const threeCandleAverage = this.calculate3CandleAverage(candles, signalCandleIndex);
    const isPoorEntryPrice = this.checkPoorEntryPrice(signal, threeCandleAverage);
    
    if (isPoorEntryPrice) {
      issues.push(`Entry price worse than 3-candle average`);
    }
    
    // 4. Calculate forward profitability (if sufficient candles exist)
    const profitability5 = this.calculateForwardProfitability(signal, candles, signalCandleIndex, 5);
    const profitability10 = this.calculateForwardProfitability(signal, candles, signalCandleIndex, 10);
    
    // Determine validation result
    const isValid = issues.length === 0;
    const validationFlag: '🟢 VALID' | '🔴 LATE' = isValid ? '🟢 VALID' : '🔴 LATE';
    
    return {
      signal,
      isValid,
      validationFlag,
      issues,
      metrics: {
        signalTimestamp: signal.timestamp,
        signalPrice: signal.price,
        candleCloseAtSignal: signalCandle.close,
        threeCandleAverage,
        priceChangePercent3Candle: priceChange3Candle,
        profitabilityNext5Candles: profitability5,
        profitabilityNext10Candles: profitability10,
        candleIndexAtSignal: signalCandleIndex,
        duplicateSignalsInZone: duplicatesInZone
      }
    };
  }
  
  /**
   * Validate multiple TradeActionSignals in batch
   */
  static validateSignals(
    signals: TradeActionSignal[],
    candles: CandlestickData[]
  ): SignalValidationResult[] {
    return signals.map(signal => this.validateSignal(signal, candles, signals));
  }
  
  /**
   * Find candle index by timestamp (with tolerance for slight time differences)
   */
  private static findCandleIndexByTimestamp(timestamp: Date, candles: CandlestickData[]): number {
    const targetTime = timestamp.getTime();
    
    for (let i = 0; i < candles.length; i++) {
      const candleTime = candles[i].timestamp;
      // Allow 60-second tolerance for timestamp matching
      if (Math.abs(candleTime - targetTime) <= 60000) {
        return i;
      }
    }
    
    return -1; // Not found
  }
  
  /**
   * Calculate 3-candle price change percentage
   */
  private static calculatePriceChange3Candle(candles: CandlestickData[], currentIndex: number): number {
    if (currentIndex < 3) return 0;
    
    const currentPrice = candles[currentIndex].close;
    const threeBack = candles[currentIndex - 3].close;
    
    return ((currentPrice - threeBack) / threeBack) * 100;
  }
  
  /**
   * Check if signal is post-surge/dip entry
   */
  private static checkPostSurgeEntry(action: TradeAction, priceChange3Candle: number): boolean {
    const threshold = 2.0; // 2% threshold
    
    if (action === TradeAction.BUY && priceChange3Candle >= threshold) {
      return true; // BUY after 2%+ surge
    }
    
    if (action === TradeAction.SHORT && priceChange3Candle <= -threshold) {
      return true; // SHORT after 2%+ drop
    }
    
    return false;
  }
  
  /**
   * Count duplicate signals within specified candle window
   */
  private static countDuplicateSignalsInZone(
    targetSignal: TradeActionSignal,
    allSignals: TradeActionSignal[],
    windowSize: number
  ): number {
    const targetTime = targetSignal.timestamp.getTime();
    const candleDuration = 60000; // Assume 1-minute candles
    const windowMs = windowSize * candleDuration;
    
    return allSignals.filter(signal => {
      const signalTime = signal.timestamp.getTime();
      const timeDiff = Math.abs(signalTime - targetTime);
      
      return (
        signal.action === targetSignal.action &&
        signal.pattern === targetSignal.pattern &&
        timeDiff <= windowMs
      );
    }).length;
  }
  
  /**
   * Calculate 3-candle average close price
   */
  private static calculate3CandleAverage(candles: CandlestickData[], currentIndex: number): number {
    if (currentIndex < 2) return candles[currentIndex].close;
    
    const sum = candles[currentIndex - 2].close + 
                candles[currentIndex - 1].close + 
                candles[currentIndex].close;
                
    return sum / 3;
  }
  
  /**
   * Check if entry price is poor compared to recent average
   */
  private static checkPoorEntryPrice(signal: TradeActionSignal, threeCandleAverage: number): boolean {
    const priceDiff = Math.abs(signal.price - threeCandleAverage) / threeCandleAverage;
    const threshold = 0.01; // 1% threshold
    
    // For BUY signals, poor entry = significantly above average
    if (signal.action === TradeAction.BUY && signal.price > threeCandleAverage * (1 + threshold)) {
      return true;
    }
    
    // For SHORT signals, poor entry = significantly below average  
    if (signal.action === TradeAction.SHORT && signal.price < threeCandleAverage * (1 - threshold)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate forward profitability from signal point
   */
  private static calculateForwardProfitability(
    signal: TradeActionSignal,
    candles: CandlestickData[],
    signalIndex: number,
    lookAheadCandles: number
  ): number | undefined {
    
    const endIndex = signalIndex + lookAheadCandles;
    if (endIndex >= candles.length) return undefined;
    
    const entryPrice = signal.price;
    const exitPrice = candles[endIndex].close;
    
    if (signal.action === TradeAction.BUY) {
      return ((exitPrice - entryPrice) / entryPrice) * 100;
    } else {
      return ((entryPrice - exitPrice) / entryPrice) * 100;
    }
  }
  
  /**
   * Create invalid result for error cases
   */
  private static createInvalidResult(signal: TradeActionSignal, reason: string): SignalValidationResult {
    return {
      signal,
      isValid: false,
      validationFlag: '🔴 LATE',
      issues: [reason],
      metrics: {
        signalTimestamp: signal.timestamp,
        signalPrice: signal.price,
        candleCloseAtSignal: 0,
        threeCandleAverage: 0,
        priceChangePercent3Candle: 0,
        candleIndexAtSignal: -1,
        duplicateSignalsInZone: 0
      }
    };
  }
}

export default TradeSignalValidator;
