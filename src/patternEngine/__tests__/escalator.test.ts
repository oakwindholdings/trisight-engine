// src/patternEngine/__tests__/escalator.test.ts
// Unit tests for escalator pattern detection
// Tests body-only HH+HL / LL+LH sequences

import { detectEscalators } from '../escalator';
import { Candle, EscalatorRun } from '../../types';
import { ThrustDirection } from '../../models/PatternTypes';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to load CSV fixtures
function loadFixture(filename: string): Candle[] {
  const filepath = path.join(__dirname, '..', '..', '..', 'test_fixtures', filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      datetime: values[0],
      timestamp: parseInt(values[1]),
      open: parseFloat(values[2]),
      high: parseFloat(values[3]),
      low: parseFloat(values[4]),
      close: parseFloat(values[5]),
      volume: parseFloat(values[6])
    };
  });
}

describe('detectEscalators', () => {
  describe('with fixture_rising.csv', () => {
    it('should detect one BULLISH run from index 0 to 5', () => {
      const candles = loadFixture('fixture_rising.csv');
      const runs = detectEscalators(candles);

      expect(runs).toHaveLength(1);
      
      const run = runs[0];
      expect(run.startIndex).toBe(0);
      expect(run.endIndex).toBe(5);
      expect(run.direction).toBe(ThrustDirection.BULLISH);
      expect(run.steps).toHaveLength(1); // One continuous step
      expect(run.averageStepHeight).toBeGreaterThan(0);
      expect(run.consistency).toBeGreaterThan(0.8); // Should be very consistent
    });
  });

  describe('with fixture_wickHH.csv', () => {
    it('should continue run despite wick-only higher high', () => {
      const candles = loadFixture('fixture_wickHH.csv');
      const runs = detectEscalators(candles);

      expect(runs).toHaveLength(1);
      
      const run = runs[0];
      expect(run.startIndex).toBe(0);
      expect(run.endIndex).toBe(5); // Should continue through the wick-only HH
      expect(run.direction).toBe(ThrustDirection.BULLISH);
      
      // The 4th candle (index 3) has a wick-only HH
      // Body: open=102.5, close=103.0, so body high=103.0
      // Previous body high was 102.5, so it's still a body HH
    });
  });

  describe('with fixture_short.csv', () => {
    it('should return empty array for data shorter than minLength', () => {
      const candles = loadFixture('fixture_short.csv');
      const runs = detectEscalators(candles, 2); // minLength = 2

      expect(runs).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const runs = detectEscalators([]);
      expect(runs).toHaveLength(0);
    });

    it('should handle null input', () => {
      const runs = detectEscalators(null as any);
      expect(runs).toHaveLength(0);
    });

    it('should respect custom minLength parameter', () => {
      const candles: Candle[] = [
        { datetime: '2024-01-01T09:30:00', timestamp: 1704115800000, open: 100, high: 101, low: 99, close: 100.5, volume: 1000 },
        { datetime: '2024-01-01T09:31:00', timestamp: 1704115860000, open: 100.5, high: 102, low: 100, close: 101.5, volume: 1100 },
        { datetime: '2024-01-01T09:32:00', timestamp: 1704115920000, open: 101.5, high: 103, low: 101, close: 102.5, volume: 1200 }
      ];

      // With default minLength (2), should detect the pattern
      const runs1 = detectEscalators(candles);
      expect(runs1).toHaveLength(1);

      // With minLength = 4, should not detect (only 3 candles)
      const runs2 = detectEscalators(candles, 4);
      expect(runs2).toHaveLength(0);
    });

    it('should respect maxStepBars parameter', () => {
      // Create a long escalator that exceeds maxStepBars
      const candles: Candle[] = [];
      for (let i = 0; i < 10; i++) {
        candles.push({
          datetime: `2024-01-01T09:3${i}:00`,
          timestamp: 1704115800000 + i * 60000,
          open: 100 + i,
          high: 101 + i,
          low: 99 + i,
          close: 100.5 + i,
          volume: 1000 + i * 100
        });
      }

      // With maxStepBars = 5, should stop at 5 bars
      const runs = detectEscalators(candles, 2, 5);
      expect(runs).toHaveLength(2); // Should have 2 runs: 0-4 and 5-9
      expect(runs[0].endIndex - runs[0].startIndex + 1).toBe(5);
    });
  });

  describe('bearish patterns', () => {
    it('should detect BEARISH escalator with LL+LH pattern', () => {
      const candles: Candle[] = [
        { datetime: '2024-01-01T09:30:00', timestamp: 1704115800000, open: 105, high: 106, low: 104, close: 104.5, volume: 1000 },
        { datetime: '2024-01-01T09:31:00', timestamp: 1704115860000, open: 104.5, high: 105, low: 103, close: 103.5, volume: 1100 },
        { datetime: '2024-01-01T09:32:00', timestamp: 1704115920000, open: 103.5, high: 104, low: 102, close: 102.5, volume: 1200 },
        { datetime: '2024-01-01T09:33:00', timestamp: 1704115980000, open: 102.5, high: 103, low: 101, close: 101.5, volume: 1300 }
      ];

      const runs = detectEscalators(candles);
      expect(runs).toHaveLength(1);
      
      const run = runs[0];
      expect(run.direction).toBe(ThrustDirection.BEARISH);
      expect(run.startIndex).toBe(0);
      expect(run.endIndex).toBe(3);
    });
  });

  describe('pattern violations', () => {
    it('should stop run at first body violation', () => {
      const candles: Candle[] = [
        { datetime: '2024-01-01T09:30:00', timestamp: 1704115800000, open: 100, high: 101, low: 99, close: 100.5, volume: 1000 },
        { datetime: '2024-01-01T09:31:00', timestamp: 1704115860000, open: 100.5, high: 102, low: 100, close: 101.5, volume: 1100 },
        { datetime: '2024-01-01T09:32:00', timestamp: 1704115920000, open: 101.5, high: 103, low: 101, close: 102.5, volume: 1200 },
        // Violation: body low goes below previous (open/close both below 101.5)
        { datetime: '2024-01-01T09:33:00', timestamp: 1704115980000, open: 101.0, high: 104, low: 100, close: 101.2, volume: 1300 },
        { datetime: '2024-01-01T09:34:00', timestamp: 1704116040000, open: 103.5, high: 105, low: 103, close: 104.5, volume: 1400 }
      ];

      const runs = detectEscalators(candles);
      
      expect(runs.length).toBeGreaterThanOrEqual(1);
      expect(runs[0].endIndex).toBe(2); // First run should stop before the violation
      
      // If there's a second run, it should start after the violation
      if (runs.length > 1) {
        expect(runs[1].startIndex).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
