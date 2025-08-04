// src/utils/signalValidation/__tests__/TradeSignalValidator.test.ts
// Unit tests for TradeSignalValidator
// Context: Tests trading signal validation logic

import { TradeSignalValidator, SignalValidationResult } from '../TradeSignalValidator';
import { TradeActionSignal, TradeAction, SignalType } from '../../trading/TradeActionSignal';
import { CandlestickData } from '../../../models/ChartTypes';

describe('TradeSignalValidator', () => {
  const mockCandles: CandlestickData[] = [
    { timestamp: new Date('2024-01-01T10:00:00').getTime(), open: 100, high: 102, low: 99, close: 101, volume: 1000 },
    { timestamp: new Date('2024-01-01T10:01:00').getTime(), open: 101, high: 103, low: 100, close: 102, volume: 1100 },
    { timestamp: new Date('2024-01-01T10:02:00').getTime(), open: 102, high: 105, low: 101, close: 104, volume: 1200 },
    { timestamp: new Date('2024-01-01T10:03:00').getTime(), open: 104, high: 108, low: 103, close: 107, volume: 1300 }, // 3% surge
    { timestamp: new Date('2024-01-01T10:04:00').getTime(), open: 107, high: 109, low: 106, close: 108, volume: 1400 },
    { timestamp: new Date('2024-01-01T10:05:00').getTime(), open: 108, high: 110, low: 107, close: 109, volume: 1500 },
    { timestamp: new Date('2024-01-01T10:06:00').getTime(), open: 109, high: 111, low: 108, close: 110, volume: 1600 },
    { timestamp: new Date('2024-01-01T10:07:00').getTime(), open: 110, high: 112, low: 109, close: 111, volume: 1700 },
    { timestamp: new Date('2024-01-01T10:08:00').getTime(), open: 111, high: 113, low: 110, close: 112, volume: 1800 },
    { timestamp: new Date('2024-01-01T10:09:00').getTime(), open: 112, high: 114, low: 111, close: 113, volume: 1900 },
    { timestamp: new Date('2024-01-01T10:10:00').getTime(), open: 113, high: 115, low: 112, close: 114, volume: 2000 },
    { timestamp: new Date('2024-01-01T10:11:00').getTime(), open: 114, high: 116, low: 113, close: 115, volume: 2100 },
    { timestamp: new Date('2024-01-01T10:12:00').getTime(), open: 115, high: 116, low: 110, close: 111, volume: 2200 }, // Drop
    { timestamp: new Date('2024-01-01T10:13:00').getTime(), open: 111, high: 112, low: 108, close: 109, volume: 2300 },
    { timestamp: new Date('2024-01-01T10:14:00').getTime(), open: 109, high: 110, low: 106, close: 107, volume: 2400 } // 3% drop
  ];

  const createMockSignal = (overrides?: Partial<TradeActionSignal>): TradeActionSignal => ({
    action: TradeAction.BUY,
    signalType: SignalType.LONG_ENTRY,
    pattern: 'TEST_PATTERN',
    confidence: 0.8,
    price: 100,
    timestamp: new Date('2024-01-01T10:00:00'),
    reason: 'Test signal',
    candleIndex: 0,
    ...overrides
  });

  describe('validateSignal', () => {
    it('should validate a valid buy signal', () => {
      const signal = createMockSignal({
        timestamp: new Date('2024-01-01T10:00:00'),
        price: 101,
        candleIndex: 0
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(true);
      expect(result.validationFlag).toBe('🟢 VALID');
      expect(result.issues).toHaveLength(0);
    });

    it('should flag buy signal after surge', () => {
      const signal = createMockSignal({
        action: TradeAction.BUY,
        timestamp: new Date('2024-01-01T10:03:00'),
        price: 107,
        candleIndex: 3
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.validationFlag).toBe('🔴 LATE');
      expect(result.issues).toContain('BUY signal after 3.0% price move');
    });

    it('should flag short signal after drop', () => {
      const signal = createMockSignal({
        action: TradeAction.SHORT,
        signalType: SignalType.SHORT_ENTRY,
        timestamp: new Date('2024-01-01T10:14:00'),
        price: 107,
        candleIndex: 14
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.validationFlag).toBe('🔴 LATE');
      expect(result.issues).toContain('SHORT signal after -3.6% price move');
    });

    it('should detect poor entry price for buy signal', () => {
      const signal = createMockSignal({
        action: TradeAction.BUY,
        timestamp: new Date('2024-01-01T10:02:00'),
        price: 106, // Above 3-candle average
        candleIndex: 2
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Entry price worse than 3-candle average');
    });

    it('should detect poor entry price for short signal', () => {
      const signal = createMockSignal({
        action: TradeAction.SHORT,
        signalType: SignalType.SHORT_ENTRY,
        timestamp: new Date('2024-01-01T10:02:00'),
        price: 101, // Below 3-candle average
        candleIndex: 2
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Entry price worse than 3-candle average');
    });

    it('should handle signal with insufficient history', () => {
      const signal = createMockSignal({
        timestamp: new Date('2024-01-01T10:01:00'),
        candleIndex: 1 // Not enough history for 3-candle check
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Signal candle not found or insufficient history');
    });

    it('should handle signal with missing candle', () => {
      const signal = createMockSignal({
        timestamp: new Date('2024-01-01T11:00:00'), // Time not in candles
        candleIndex: -1
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Signal candle not found or insufficient history');
    });

    it('should calculate forward profitability for buy signal', () => {
      const signal = createMockSignal({
        action: TradeAction.BUY,
        timestamp: new Date('2024-01-01T10:00:00'),
        price: 101,
        candleIndex: 0
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.metrics.profitabilityNext5Candles).toBeCloseTo(7.92, 1); // (109-101)/101*100
      expect(result.metrics.profitabilityNext10Candles).toBeCloseTo(12.87, 1); // (115-101)/101*100
    });

    it('should calculate forward profitability for short signal', () => {
      const signal = createMockSignal({
        action: TradeAction.SHORT,
        signalType: SignalType.SHORT_ENTRY,
        timestamp: new Date('2024-01-01T10:10:00'),
        price: 114,
        candleIndex: 10
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.metrics.profitabilityNext5Candles).toBeCloseTo(6.14, 1); // (114-107)/114*100
      expect(result.metrics.profitabilityNext10Candles).toBeUndefined(); // Not enough candles
    });
  });

  describe('validateSignals', () => {
    it('should validate multiple signals in batch', () => {
      const signals = [
        createMockSignal({ 
          timestamp: new Date('2024-01-01T10:00:00'), 
          price: 101,
          candleIndex: 0 
        }),
        createMockSignal({ 
          action: TradeAction.BUY,
          timestamp: new Date('2024-01-01T10:03:00'), 
          price: 107,
          candleIndex: 3 
        }),
        createMockSignal({ 
          action: TradeAction.SHORT,
          signalType: SignalType.SHORT_ENTRY,
          timestamp: new Date('2024-01-01T10:14:00'),
          price: 107,
          candleIndex: 14
        })
      ];

      const results = TradeSignalValidator.validateSignals(signals, mockCandles);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(false);
    });

    it('should detect duplicate signals in zone', () => {
      const signals = [
        createMockSignal({ 
          timestamp: new Date('2024-01-01T10:00:00'),
          candleIndex: 0,
          pattern: 'PATTERN_A'
        }),
        createMockSignal({ 
          timestamp: new Date('2024-01-01T10:01:00'),
          candleIndex: 1,
          pattern: 'PATTERN_A'
        }),
        createMockSignal({ 
          timestamp: new Date('2024-01-01T10:02:00'),
          candleIndex: 2,
          pattern: 'PATTERN_A'
        })
      ];

      const results = TradeSignalValidator.validateSignals(signals, mockCandles);

      // All signals should detect duplicates
      results.forEach(result => {
        expect(result.issues).toContain('3 signals within 5-candle zone');
        expect(result.metrics.duplicateSignalsInZone).toBe(3);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty candle array', () => {
      const signal = createMockSignal();
      const result = TradeSignalValidator.validateSignal(signal, []);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Signal candle not found or insufficient history');
    });

    it('should handle signals with exact timestamp match', () => {
      const signal = createMockSignal({
        timestamp: new Date(mockCandles[5].timestamp),
        candleIndex: 5
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.metrics.candleIndexAtSignal).toBe(5);
      expect(result.metrics.candleCloseAtSignal).toBe(109);
    });

    it('should handle signals with slight timestamp difference', () => {
      // 30 seconds after candle timestamp (within 60s tolerance)
      const signal = createMockSignal({
        timestamp: new Date(mockCandles[5].timestamp + 30000),
        candleIndex: 5
      });

      const result = TradeSignalValidator.validateSignal(signal, mockCandles);

      expect(result.metrics.candleIndexAtSignal).toBe(5);
    });

    it('should handle very small price changes', () => {
      const flatCandles: CandlestickData[] = [
        { timestamp: Date.now() - 180000, open: 100, high: 100.1, low: 99.9, close: 100, volume: 1000 },
        { timestamp: Date.now() - 120000, open: 100, high: 100.1, low: 99.9, close: 100.05, volume: 1000 },
        { timestamp: Date.now() - 60000, open: 100.05, high: 100.15, low: 99.95, close: 100.1, volume: 1000 },
        { timestamp: Date.now(), open: 100.1, high: 100.2, low: 100, close: 100.15, volume: 1000 }
      ];

      const signal = createMockSignal({
        timestamp: new Date(flatCandles[3].timestamp),
        price: 100.15,
        candleIndex: 3
      });

      const result = TradeSignalValidator.validateSignal(signal, flatCandles);

      expect(result.isValid).toBe(true); // Small change doesn't trigger post-surge
      expect(result.metrics.priceChangePercent3Candle).toBeCloseTo(0.15, 2);
    });

    it('should handle exit signals without validation', () => {
      const exitSignal = createMockSignal({
        action: TradeAction.SELL,
        signalType: SignalType.LONG_EXIT,
        timestamp: new Date('2024-01-01T10:05:00'),
        candleIndex: 5
      });

      const result = TradeSignalValidator.validateSignal(exitSignal, mockCandles);

      // Exit signals should still be validated for timing
      expect(result.metrics.candleIndexAtSignal).toBe(5);
      expect(result.metrics.candleCloseAtSignal).toBe(109);
    });
  });
});