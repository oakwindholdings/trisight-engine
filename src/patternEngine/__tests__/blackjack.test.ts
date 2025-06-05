// src/patternEngine/__tests__/blackjack.test.ts
// Unit tests for Blackjack scoring functions
// Tests intrinsic scoring and cumulative calculations

import { getIntrinsicScore, calcStepBlackjack, getBlackjackSignal } from '../blackjack';
import { Candle } from '../../types/pattern';
import { BJ_GOLD_THRESHOLD_LONG, BJ_GOLD_THRESHOLD_SHORT } from '../../constants/pattern';
import * as fs from 'fs';
import * as path from 'path';

describe('Blackjack Scoring', () => {
  // Helper to load CSV fixture
  function loadFixture(filename: string): Candle[] {
    const filePath = path.join(__dirname, '../../../test_fixtures', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
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
        volume: parseInt(values[6])
      };
    });
  }

  describe('getIntrinsicScore', () => {
    it('should return +1 for green breakout bar', () => {
      const candle: Candle = {
        datetime: '2024-01-01T09:30:00',
        timestamp: 1704115800000,
        open: 100,
        high: 102,
        low: 99,
        close: 101.5,
        volume: 1000
      };
      const prevBodyHigh = 100.5;
      const prevBodyLow = 99.5;
      
      const score = getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
      expect(score).toBe(1); // close > open AND close > prevBodyHigh
    });

    it('should return -1 for red reversal bar', () => {
      const candle: Candle = {
        datetime: '2024-01-01T09:30:00',
        timestamp: 1704115800000,
        open: 102,
        high: 103,
        low: 100,
        close: 100.5,
        volume: 1000
      };
      const prevBodyHigh = 101.5;
      const prevBodyLow = 101;
      
      const score = getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
      expect(score).toBe(-1); // close < open AND close < prevBodyLow
    });

    it('should return 0 for inside bar', () => {
      const candle: Candle = {
        datetime: '2024-01-01T09:30:00',
        timestamp: 1704115800000,
        open: 101,
        high: 101.5,
        low: 100.5,
        close: 101,
        volume: 1000
      };
      const prevBodyHigh = 102;
      const prevBodyLow = 100;
      
      const score = getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
      expect(score).toBe(0); // Neither breakout nor breakdown
    });

    it('should return 0 for doji', () => {
      const candle: Candle = {
        datetime: '2024-01-01T09:30:00',
        timestamp: 1704115800000,
        open: 101,
        high: 102,
        low: 100,
        close: 101, // Same as open
        volume: 1000
      };
      const prevBodyHigh = 100.5;
      const prevBodyLow = 99.5;
      
      const score = getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
      expect(score).toBe(0); // close = open
    });
  });

  describe('calcStepBlackjack', () => {
    it('should sum two bullish candles to +2', () => {
      const candles = loadFixture('fixture_blackjack.csv');
      const greenCandle1 = candles[0]; // open: 100, close: 101.5
      const greenCandle2 = { ...candles[0], datetime: '2024-01-01T09:35:00', open: 101.5, close: 102.5 };
      
      const result = calcStepBlackjack([greenCandle1, greenCandle2]);
      
      expect(result.intrinsicScore).toBe(1); // Second candle's intrinsic
      expect(result.cumulativeScore).toBe(2); // Sum of both intrinsics
      expect(result.signal).toBe('LONG'); // Meets threshold
    });

    it('should sum two bearish candles to -2', () => {
      const candles = loadFixture('fixture_blackjack.csv');
      const redCandle1 = candles[1]; // open: 102, close: 100.5
      const redCandle2 = { ...candles[1], datetime: '2024-01-01T09:35:00', open: 100.5, close: 99.5 };
      
      const result = calcStepBlackjack([redCandle1, redCandle2]);
      
      expect(result.intrinsicScore).toBe(-1); // Second candle's intrinsic
      expect(result.cumulativeScore).toBe(-2); // Sum of both intrinsics
      expect(result.signal).toBe('SHORT'); // Meets threshold
    });

    it('should handle mixed signals (bullish + bearish = 0)', () => {
      const candles = loadFixture('fixture_blackjack.csv');
      const greenCandle = candles[0]; // open: 100, close: 101.5, intrinsic +1
      // Create a true bearish candle that breaks below greenCandle's body
      const redCandle = { 
        ...candles[1], 
        open: 101,
        close: 99.5, // Below greenCandle's body low (100)
        low: 99
      };
      
      const result = calcStepBlackjack([greenCandle, redCandle]);
      
      expect(result.intrinsicScore).toBe(-1); // Second candle's intrinsic
      expect(result.cumulativeScore).toBe(0); // +1 + -1 = 0
      expect(result.signal).toBe('NEUTRAL');
    });

    it('should use second candle intrinsic for reported intrinsic score', () => {
      const candles = loadFixture('fixture_blackjack.csv');
      const neutralCandle = candles[2]; // intrinsic 0
      const greenCandle = candles[0]; // intrinsic +1
      
      const result = calcStepBlackjack([neutralCandle, greenCandle]);
      
      expect(result.intrinsicScore).toBe(1); // Second candle's intrinsic
      expect(result.cumulativeScore).toBe(1); // 0 + 1 = 1
      expect(result.signal).toBe('NEUTRAL'); // Below threshold
    });

    it('should return neutral for insufficient candles', () => {
      const candles = loadFixture('fixture_blackjack.csv');
      const result = calcStepBlackjack([candles[0]]); // Only one candle
      
      expect(result.intrinsicScore).toBe(0);
      expect(result.cumulativeScore).toBe(0);
      expect(result.signal).toBe('NEUTRAL');
    });

    it('should handle empty input', () => {
      const result = calcStepBlackjack([]);
      
      expect(result.intrinsicScore).toBe(0);
      expect(result.cumulativeScore).toBe(0);
      expect(result.signal).toBe('NEUTRAL');
    });
  });

  describe('getBlackjackSignal', () => {
    it('should return LONG when cumulative >= threshold', () => {
      expect(getBlackjackSignal(BJ_GOLD_THRESHOLD_LONG)).toBe('LONG');
      expect(getBlackjackSignal(BJ_GOLD_THRESHOLD_LONG + 1)).toBe('LONG');
    });

    it('should return SHORT when cumulative <= threshold', () => {
      expect(getBlackjackSignal(BJ_GOLD_THRESHOLD_SHORT)).toBe('SHORT');
      expect(getBlackjackSignal(BJ_GOLD_THRESHOLD_SHORT - 1)).toBe('SHORT');
    });

    it('should return NEUTRAL when between thresholds', () => {
      expect(getBlackjackSignal(0)).toBe('NEUTRAL');
      expect(getBlackjackSignal(1)).toBe('NEUTRAL');
      expect(getBlackjackSignal(-1)).toBe('NEUTRAL');
    });
  });

  describe('threshold verification', () => {
    it('should verify threshold values match constants', () => {
      // Verify the thresholds are as expected
      expect(BJ_GOLD_THRESHOLD_LONG).toBe(2);
      expect(BJ_GOLD_THRESHOLD_SHORT).toBe(-2);
    });

    it('should correctly identify signal thresholds', () => {
      // Test edge cases around thresholds
      expect(getBlackjackSignal(1.99)).toBe('NEUTRAL');
      expect(getBlackjackSignal(2)).toBe('LONG');
      expect(getBlackjackSignal(-1.99)).toBe('NEUTRAL');
      expect(getBlackjackSignal(-2)).toBe('SHORT');
    });
  });
});
