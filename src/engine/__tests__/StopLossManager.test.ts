// src/engine/__tests__/StopLossManager.test.ts
// Unit tests for StopLossManager
// Context: Tests stop loss management functionality

import {
  registerStopLoss,
  evaluateStopLoss,
  getActiveStopLosses,
  removeStopLoss,
  clearAllStopLosses,
  getCurrentTrailingStop
} from '../StopLossManager';
import { Candle } from '../../types/pattern';
import * as tradeActionEmitter from '../../framework/tradeActionEmitter';
import * as patternFeedSignal from '../../framework/emitPatternFeedSignal';

// Mock the emitter functions
jest.mock('../../framework/tradeActionEmitter');
jest.mock('../../framework/emitPatternFeedSignal');
jest.mock('../../utils/audit/StopExitTraceAnalyzer', () => ({
  stopExitTraceAnalyzer: {
    recordEmission: jest.fn()
  }
}));
jest.mock('../../utils/debug');

describe('StopLossManager', () => {
  const mockCandles: Candle[] = [
    {
      datetime: '2024-01-01T10:00:00',
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1000000,
      timestamp: new Date('2024-01-01T10:00:00').getTime()
    },
    {
      datetime: '2024-01-01T10:01:00',
      open: 103,
      high: 106,
      low: 102,
      close: 104,
      volume: 1100000,
      timestamp: new Date('2024-01-01T10:01:00').getTime()
    },
    {
      datetime: '2024-01-01T10:02:00',
      open: 104,
      high: 107,
      low: 103,
      close: 105,
      volume: 1200000,
      timestamp: new Date('2024-01-01T10:02:00').getTime()
    },
    {
      datetime: '2024-01-01T10:03:00',
      open: 105,
      high: 106,
      low: 97, // Drop below trailing stop
      close: 98,
      volume: 1300000,
      timestamp: new Date('2024-01-01T10:03:00').getTime()
    },
    {
      datetime: '2024-01-01T10:04:00',
      open: 98,
      high: 110, // Rise above trailing stop
      low: 97,
      close: 109,
      volume: 1400000,
      timestamp: new Date('2024-01-01T10:04:00').getTime()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearAllStopLosses();
  });

  describe('registerStopLoss', () => {
    it('should register a new stop loss', () => {
      registerStopLoss(
        'position-1',
        'LONG',
        0,
        2, // trail by 2 candles
        100,
        'GOLDMINE_CHANNEL',
        0.8
      );

      const activeStops = getActiveStopLosses();
      expect(activeStops).toHaveLength(1);
      expect(activeStops[0]).toMatchObject({
        positionId: 'position-1',
        type: 'LONG',
        entryCandleIndex: 0,
        trailingIndex: 2,
        entryPrice: 100,
        pattern: 'GOLDMINE_CHANNEL',
        confidence: 0.8,
        triggered: false
      });
    });

    it('should register multiple stop losses', () => {
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'PATTERN_A', 0.8);
      registerStopLoss('pos-2', 'SHORT', 1, 3, 105, 'PATTERN_B', 0.9);

      const activeStops = getActiveStopLosses();
      expect(activeStops).toHaveLength(2);
    });
  });

  describe('evaluateStopLoss', () => {
    it('should trigger LONG stop loss when price drops below trailing low', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      // Register a LONG position at candle 0
      registerStopLoss('long-pos', 'LONG', 0, 2, 100, 'TEST_PATTERN', 0.8);

      // At candle 3, price drops below candle 1's low (102)
      evaluateStopLoss(mockCandles, 3);

      expect(mockEmitTradeSignal).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SELL',
          signalType: 'LONG_EXIT',
          pattern: 'STOPLOSS_long-pos',
          confidence: 1.0,
          price: 98, // Current close price
          riskLevel: 'HIGH'
        })
      );

      const activeStops = getActiveStopLosses();
      expect(activeStops[0].triggered).toBe(true);
    });

    it('should trigger SHORT stop loss when price rises above trailing high', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      // Register a SHORT position at candle 1
      registerStopLoss('short-pos', 'SHORT', 1, 2, 104, 'TEST_PATTERN', 0.7);

      // At candle 4, price rises above candle 2's high (107)
      evaluateStopLoss(mockCandles, 4);

      expect(mockEmitTradeSignal).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COVER',
          signalType: 'SHORT_EXIT',
          pattern: 'STOPLOSS_short-pos',
          confidence: 1.0,
          price: 109, // Current close price
          riskLevel: 'HIGH'
        })
      );
    });

    it('should not trigger stop loss when insufficient candles', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      registerStopLoss('pos-1', 'LONG', 0, 3, 100, 'TEST', 0.8);

      // Only evaluating at candle 2, but need 3 candles to trail
      evaluateStopLoss(mockCandles, 2);

      expect(mockEmitTradeSignal).not.toHaveBeenCalled();
    });

    it('should not trigger already triggered stop losses', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);

      // First evaluation triggers
      evaluateStopLoss(mockCandles, 3);
      expect(mockEmitTradeSignal).toHaveBeenCalledTimes(1);

      // Second evaluation should not trigger again
      mockEmitTradeSignal.mockClear();
      evaluateStopLoss(mockCandles, 4);
      expect(mockEmitTradeSignal).not.toHaveBeenCalled();
    });

    it('should handle empty stop loss array', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      evaluateStopLoss(mockCandles, 3);
      
      expect(mockEmitTradeSignal).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentTrailingStop', () => {
    it('should return current trailing stop for LONG position', () => {
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);

      // At candle 3, trailing stop is candle 1's low (102)
      const stop = getCurrentTrailingStop('pos-1', mockCandles, 3);
      expect(stop).toBe(102);
    });

    it('should return current trailing stop for SHORT position', () => {
      registerStopLoss('pos-1', 'SHORT', 0, 2, 100, 'TEST', 0.8);

      // At candle 3, trailing stop is candle 1's high (106)
      const stop = getCurrentTrailingStop('pos-1', mockCandles, 3);
      expect(stop).toBe(106);
    });

    it('should return null for non-existent position', () => {
      const stop = getCurrentTrailingStop('non-existent', mockCandles, 3);
      expect(stop).toBeNull();
    });

    it('should return null for triggered position', () => {
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);
      
      // Trigger the stop
      evaluateStopLoss(mockCandles, 3);
      
      const stop = getCurrentTrailingStop('pos-1', mockCandles, 4);
      expect(stop).toBeNull();
    });

    it('should return null when insufficient candles', () => {
      registerStopLoss('pos-1', 'LONG', 0, 5, 100, 'TEST', 0.8);
      
      const stop = getCurrentTrailingStop('pos-1', mockCandles, 3);
      expect(stop).toBeNull();
    });
  });

  describe('removeStopLoss', () => {
    it('should remove specific stop loss', () => {
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);
      registerStopLoss('pos-2', 'SHORT', 1, 3, 105, 'TEST', 0.9);

      const removed = removeStopLoss('pos-1');
      
      expect(removed).toBe(true);
      expect(getActiveStopLosses()).toHaveLength(1);
      expect(getActiveStopLosses()[0].positionId).toBe('pos-2');
    });

    it('should return false when removing non-existent stop loss', () => {
      const removed = removeStopLoss('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clearAllStopLosses', () => {
    it('should clear all stop losses', () => {
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);
      registerStopLoss('pos-2', 'SHORT', 1, 3, 105, 'TEST', 0.9);
      registerStopLoss('pos-3', 'LONG', 2, 2, 110, 'TEST', 0.7);

      clearAllStopLosses();
      
      expect(getActiveStopLosses()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle missing candle data gracefully', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);
      
      // Evaluate with incomplete candle array
      evaluateStopLoss([mockCandles[0]], 3);
      
      expect(mockEmitTradeSignal).not.toHaveBeenCalled();
    });

    it('should handle candles with undefined values', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      const badCandles = [
        ...mockCandles.slice(0, 3),
        { ...mockCandles[3], close: undefined as any, low: undefined as any }
      ];
      
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'TEST', 0.8);
      evaluateStopLoss(badCandles, 3);
      
      expect(mockEmitTradeSignal).not.toHaveBeenCalled();
    });

    it('should handle multiple positions evaluating simultaneously', () => {
      const mockEmitTradeSignal = jest.mocked(tradeActionEmitter.emitTradeSignal);
      
      // Register multiple positions
      registerStopLoss('pos-1', 'LONG', 0, 2, 100, 'PATTERN_A', 0.8);
      registerStopLoss('pos-2', 'LONG', 1, 1, 103, 'PATTERN_B', 0.9);
      registerStopLoss('pos-3', 'SHORT', 0, 3, 100, 'PATTERN_C', 0.7);
      
      // Evaluate at candle 3
      evaluateStopLoss(mockCandles, 3);
      
      // pos-1 and pos-2 should trigger (LONG positions with price drop)
      expect(mockEmitTradeSignal).toHaveBeenCalledTimes(2);
      
      const activeStops = getActiveStopLosses();
      expect(activeStops[0].triggered).toBe(true); // pos-1
      expect(activeStops[1].triggered).toBe(true); // pos-2
      expect(activeStops[2].triggered).toBe(false); // pos-3 (SHORT, not triggered)
    });
  });
});