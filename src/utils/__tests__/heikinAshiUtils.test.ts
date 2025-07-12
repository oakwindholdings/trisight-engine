// src/utils/__tests__/heikinAshiUtils.test.ts
// Unit tests for Heikin-Ashi calculation functions
// Verifies correct HA transformation and trend analysis

import {
  calculateHeikinAshiCandle,
  transformToHeikinAshi,
  heikinAshiToCandlestickData,
  isHeikinAshiBullish,
  calculateTrendStrength,
  HeikinAshiCandle
} from '../heikinAshiUtils';
import { CandlestickData } from '../../models/ChartTypes';

// Test data: Simple trending pattern
const mockCandles: CandlestickData[] = [
  {
    datetime: '2024-06-24T09:30:00Z',
    timestamp: 1719222600000,
    open: 100,
    high: 105,
    low: 99,
    close: 104,
    volume: 1000
  },
  {
    datetime: '2024-06-24T09:31:00Z',
    timestamp: 1719222660000,
    open: 104,
    high: 108,
    low: 103,
    close: 107,
    volume: 1200
  },
  {
    datetime: '2024-06-24T09:32:00Z',
    timestamp: 1719222720000,
    open: 107,
    high: 109,
    low: 106,
    close: 108,
    volume: 800
  }
];

describe('heikinAshiUtils', () => {
  describe('calculateHeikinAshiCandle', () => {
    it('should calculate first HA candle correctly (no previous)', () => {
      const result = calculateHeikinAshiCandle(mockCandles[0], null);
      
      expect(result.ha_close).toBe((100 + 105 + 99 + 104) / 4); // 102
      expect(result.ha_open).toBe(100); // Uses current open for first candle
      expect(result.ha_high).toBe(Math.max(105, 100, 102)); // 105
      expect(result.ha_low).toBe(Math.min(99, 100, 102)); // 99
      expect(result.datetime).toBe(mockCandles[0].datetime);
      expect(result.timestamp).toBe(mockCandles[0].timestamp);
      expect(result.volume).toBe(mockCandles[0].volume);
    });

    it('should calculate subsequent HA candle correctly (with previous)', () => {
      const firstHA = calculateHeikinAshiCandle(mockCandles[0], null);
      const secondHA = calculateHeikinAshiCandle(mockCandles[1], firstHA);
      
      expect(secondHA.ha_close).toBe((104 + 108 + 103 + 107) / 4); // 105.5
      expect(secondHA.ha_open).toBe((firstHA.ha_open + firstHA.ha_close) / 2); // (100 + 102) / 2 = 101
      expect(secondHA.ha_high).toBe(Math.max(108, 101, 105.5)); // 108
      expect(secondHA.ha_low).toBe(Math.min(103, 101, 105.5)); // 101
    });
  });

  describe('transformToHeikinAshi', () => {
    it('should handle empty array', () => {
      const result = transformToHeikinAshi([]);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      const result = transformToHeikinAshi(null as any);
      expect(result).toEqual([]);
    });

    it('should transform full array correctly', () => {
      const result = transformToHeikinAshi(mockCandles);
      
      expect(result).toHaveLength(3);
      
      // First candle
      expect(result[0].ha_close).toBe(102);
      expect(result[0].ha_open).toBe(100);
      
      // Second candle uses previous HA values
      expect(result[1].ha_open).toBe((100 + 102) / 2); // 101
      expect(result[1].ha_close).toBe(105.5);
      
      // Third candle continues the chain
      expect(result[2].ha_open).toBe((101 + 105.5) / 2); // 103.25
    });

    it('should preserve timestamps and volume', () => {
      const result = transformToHeikinAshi(mockCandles);
      
      result.forEach((haCandle, index) => {
        expect(haCandle.datetime).toBe(mockCandles[index].datetime);
        expect(haCandle.timestamp).toBe(mockCandles[index].timestamp);
        expect(haCandle.volume).toBe(mockCandles[index].volume);
      });
    });
  });

  describe('heikinAshiToCandlestickData', () => {
    it('should convert HA candle back to CandlestickData format', () => {
      const haCandle: HeikinAshiCandle = {
        datetime: '2024-06-24T09:30:00Z',
        timestamp: 1719222600000,
        ha_open: 100,
        ha_high: 105,
        ha_low: 99,
        ha_close: 102,
        volume: 1000
      };
      
      const result = heikinAshiToCandlestickData(haCandle);
      
      expect(result.open).toBe(haCandle.ha_open);
      expect(result.high).toBe(haCandle.ha_high);
      expect(result.low).toBe(haCandle.ha_low);
      expect(result.close).toBe(haCandle.ha_close);
      expect(result.datetime).toBe(haCandle.datetime);
      expect(result.timestamp).toBe(haCandle.timestamp);
      expect(result.volume).toBe(haCandle.volume);
    });
  });

  describe('isHeikinAshiBullish', () => {
    it('should identify bullish HA candle', () => {
      const bullishCandle: HeikinAshiCandle = {
        datetime: '2024-06-24T09:30:00Z',
        timestamp: 1719222600000,
        ha_open: 100,
        ha_high: 105,
        ha_low: 99,
        ha_close: 102, // close > open
        volume: 1000
      };
      
      expect(isHeikinAshiBullish(bullishCandle)).toBe(true);
    });

    it('should identify bearish HA candle', () => {
      const bearishCandle: HeikinAshiCandle = {
        datetime: '2024-06-24T09:30:00Z',
        timestamp: 1719222600000,
        ha_open: 102,
        ha_high: 105,
        ha_low: 99,
        ha_close: 100, // close < open
        volume: 1000
      };
      
      expect(isHeikinAshiBullish(bearishCandle)).toBe(false);
    });

    it('should handle equal open/close (doji)', () => {
      const dojiCandle: HeikinAshiCandle = {
        datetime: '2024-06-24T09:30:00Z',
        timestamp: 1719222600000,
        ha_open: 101,
        ha_high: 105,
        ha_low: 99,
        ha_close: 101, // close = open
        volume: 1000
      };
      
      expect(isHeikinAshiBullish(dojiCandle)).toBe(true); // >= condition
    });
  });

  describe('calculateTrendStrength', () => {
    it('should return 0 for insufficient data', () => {
      const haCandles = transformToHeikinAshi(mockCandles.slice(0, 2));
      const result = calculateTrendStrength(haCandles, 0, 3);
      
      expect(result).toBe(0);
    });

    it('should calculate bullish trend strength', () => {
      // Create strong bullish trend: all HA candles are bullish
      const bullishCandles: CandlestickData[] = [
        { ...mockCandles[0], open: 100, close: 102 },
        { ...mockCandles[1], open: 102, close: 105 },
        { ...mockCandles[2], open: 105, close: 108 }
      ];
      
      const haCandles = transformToHeikinAshi(bullishCandles);
      const result = calculateTrendStrength(haCandles, 2, 3);
      
      expect(result).toBeGreaterThan(0); // Positive trend strength
    });

    it('should calculate bearish trend strength', () => {
      // Create bearish trend: declining prices
      const bearishCandles: CandlestickData[] = [
        { ...mockCandles[0], open: 108, close: 105 },
        { ...mockCandles[1], open: 105, close: 102 },
        { ...mockCandles[2], open: 102, close: 100 }
      ];
      
      const haCandles = transformToHeikinAshi(bearishCandles);
      const result = calculateTrendStrength(haCandles, 2, 3);
      
      expect(result).toBeLessThan(0); // Negative trend strength
    });

    it('should handle mixed trend (neutral)', () => {
      // Mix of bullish and bearish
      const mixedCandles: CandlestickData[] = [
        { ...mockCandles[0], open: 100, close: 102 }, // bullish
        { ...mockCandles[1], open: 102, close: 100 }, // bearish
        { ...mockCandles[2], open: 100, close: 101 }  // bullish
      ];
      
      const haCandles = transformToHeikinAshi(mixedCandles);
      const result = calculateTrendStrength(haCandles, 2, 3);
      
      // Should be small positive or negative, depending on HA smoothing
      expect(Math.abs(result)).toBeLessThanOrEqual(3);
    });
  });
});
