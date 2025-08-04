// src/utils/__tests__/candleTransform.test.ts
// Unit tests for candleTransform utility
// Context: Tests candle data transformation functions

import { 
  transformCandleData,
  calculateCandleMetrics,
  normalizeCandleData,
  detectCandlePatterns,
  getCandleColor,
  isBullishCandle
} from '../candleTransform';
import { CandleData } from '../../types/trading';

describe('candleTransform', () => {
  const mockCandle: CandleData = {
    time: new Date('2024-01-01T10:00:00').getTime(),
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000000
  };

  const mockBearishCandle: CandleData = {
    time: new Date('2024-01-01T11:00:00').getTime(),
    open: 105,
    high: 108,
    low: 98,
    close: 100,
    volume: 800000
  };

  describe('transformCandleData', () => {
    it('should transform raw candle data to normalized format', () => {
      const rawData = {
        t: 1704103200000,
        o: 100,
        h: 110,
        l: 95,
        c: 105,
        v: 1000000
      };

      const result = transformCandleData(rawData);

      expect(result).toEqual({
        time: 1704103200000,
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000000
      });
    });

    it('should handle missing volume data', () => {
      const rawData = {
        t: 1704103200000,
        o: 100,
        h: 110,
        l: 95,
        c: 105
      };

      const result = transformCandleData(rawData);

      expect(result.volume).toBe(0);
    });

    it('should handle array of candles', () => {
      const rawData = [
        { t: 1, o: 100, h: 110, l: 95, c: 105, v: 1000 },
        { t: 2, o: 105, h: 115, l: 100, c: 110, v: 2000 }
      ];

      const result = transformCandleData(rawData);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].time).toBe(1);
      expect(result[1].close).toBe(110);
    });
  });

  describe('calculateCandleMetrics', () => {
    it('should calculate candle metrics correctly', () => {
      const metrics = calculateCandleMetrics(mockCandle);

      expect(metrics.body).toBe(5); // close - open
      expect(metrics.upperWick).toBe(5); // high - max(open, close)
      expect(metrics.lowerWick).toBe(5); // min(open, close) - low
      expect(metrics.range).toBe(15); // high - low
      expect(metrics.changePercent).toBeCloseTo(5, 1); // ((close - open) / open) * 100
    });

    it('should handle bearish candles', () => {
      const metrics = calculateCandleMetrics(mockBearishCandle);

      expect(metrics.body).toBe(-5); // close - open (negative for bearish)
      expect(metrics.upperWick).toBe(3); // high - open
      expect(metrics.lowerWick).toBe(2); // close - low
      expect(metrics.changePercent).toBeCloseTo(-4.76, 1);
    });

    it('should handle doji candles', () => {
      const dojiCandle: CandleData = {
        ...mockCandle,
        open: 100,
        close: 100
      };

      const metrics = calculateCandleMetrics(dojiCandle);

      expect(metrics.body).toBe(0);
      expect(metrics.isDoji).toBe(true);
    });
  });

  describe('normalizeCandleData', () => {
    it('should normalize candle data to 0-1 range', () => {
      const candles = [
        { ...mockCandle, high: 120, low: 80 },
        { ...mockBearishCandle, high: 110, low: 90 }
      ];

      const normalized = normalizeCandleData(candles);

      expect(normalized).toHaveLength(2);
      // Check that all values are between 0 and 1
      normalized.forEach(candle => {
        expect(candle.open).toBeGreaterThanOrEqual(0);
        expect(candle.open).toBeLessThanOrEqual(1);
        expect(candle.high).toBeGreaterThanOrEqual(0);
        expect(candle.high).toBeLessThanOrEqual(1);
        expect(candle.low).toBeGreaterThanOrEqual(0);
        expect(candle.low).toBeLessThanOrEqual(1);
        expect(candle.close).toBeGreaterThanOrEqual(0);
        expect(candle.close).toBeLessThanOrEqual(1);
      });
    });

    it('should handle single candle', () => {
      const normalized = normalizeCandleData([mockCandle]);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].high).toBe(1); // Highest value
      expect(normalized[0].low).toBe(0); // Lowest value
    });

    it('should preserve time and volume', () => {
      const normalized = normalizeCandleData([mockCandle]);

      expect(normalized[0].time).toBe(mockCandle.time);
      expect(normalized[0].volume).toBe(mockCandle.volume);
    });
  });

  describe('detectCandlePatterns', () => {
    it('should detect hammer pattern', () => {
      const hammerCandle: CandleData = {
        time: Date.now(),
        open: 100,
        high: 101,
        low: 90,
        close: 99,
        volume: 1000
      };

      const patterns = detectCandlePatterns(hammerCandle);

      expect(patterns).toContain('hammer');
    });

    it('should detect shooting star pattern', () => {
      const shootingStarCandle: CandleData = {
        time: Date.now(),
        open: 100,
        high: 110,
        low: 99,
        close: 101,
        volume: 1000
      };

      const patterns = detectCandlePatterns(shootingStarCandle);

      expect(patterns).toContain('shooting_star');
    });

    it('should detect doji pattern', () => {
      const dojiCandle: CandleData = {
        time: Date.now(),
        open: 100,
        high: 102,
        low: 98,
        close: 100.1,
        volume: 1000
      };

      const patterns = detectCandlePatterns(dojiCandle);

      expect(patterns).toContain('doji');
    });

    it('should detect engulfing pattern with previous candle', () => {
      const prevCandle: CandleData = {
        time: Date.now() - 60000,
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 1000
      };

      const engulfingCandle: CandleData = {
        time: Date.now(),
        open: 102,
        high: 105,
        low: 98,
        close: 98,
        volume: 2000
      };

      const patterns = detectCandlePatterns(engulfingCandle, prevCandle);

      expect(patterns).toContain('bearish_engulfing');
    });

    it('should return empty array for no patterns', () => {
      const normalCandle: CandleData = {
        time: Date.now(),
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 1000
      };

      const patterns = detectCandlePatterns(normalCandle);

      expect(patterns).toEqual([]);
    });
  });

  describe('getCandleColor', () => {
    it('should return green for bullish candle', () => {
      const color = getCandleColor(mockCandle);
      expect(color).toBe('green');
    });

    it('should return red for bearish candle', () => {
      const color = getCandleColor(mockBearishCandle);
      expect(color).toBe('red');
    });

    it('should return gray for doji candle', () => {
      const dojiCandle: CandleData = {
        ...mockCandle,
        open: 100,
        close: 100
      };

      const color = getCandleColor(dojiCandle);
      expect(color).toBe('gray');
    });
  });

  describe('isBullishCandle', () => {
    it('should return true for bullish candle', () => {
      expect(isBullishCandle(mockCandle)).toBe(true);
    });

    it('should return false for bearish candle', () => {
      expect(isBullishCandle(mockBearishCandle)).toBe(false);
    });

    it('should return false for doji candle', () => {
      const dojiCandle: CandleData = {
        ...mockCandle,
        open: 100,
        close: 100
      };

      expect(isBullishCandle(dojiCandle)).toBe(false);
    });
  });
});