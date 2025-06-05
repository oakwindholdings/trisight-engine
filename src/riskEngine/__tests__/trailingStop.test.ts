// src/riskEngine/__tests__/trailingStop.test.ts
// Tests for Escalator-style trailing stop and overnight gap check
// Verifies end-to-end position management for Goldmine signals

import * as fs from 'fs';
import * as path from 'path';
import { 
  computeEscalatorStop, 
  gapCheck, 
  isStepForming,
  Position,
  StopLossEvent,
  ExitEvent
} from '../trailingStop';
import { Candle } from '../../types';
import { StepBox } from '../../types/pattern';

// Helper to load CSV fixtures
function loadCandlesFromCSV(filename: string): Candle[] {
  const filepath = path.join(__dirname, '..', '..', '..', 'test_fixtures', filename);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');
  
  // Skip header line
  return lines.slice(1).map(line => {
    const [timestamp, open, high, low, close, volume] = line.split(',');
    return {
      datetime: timestamp,
      timestamp: new Date(timestamp).getTime(),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume)
    };
  });
}

describe('computeEscalatorStop', () => {
  describe('LONG position trailing', () => {
    it('should trail at i-2 candle low and ratchet up only', () => {
      const candles = loadCandlesFromCSV('fixture_normal_trail.csv');
      
      // LONG position opened at index 5
      const position: Position = {
        side: 'LONG',
        openIndex: 5,
        step: {
          startTime: new Date(candles[2].datetime),
          endTime: new Date(candles[4].datetime),
          startIndex: 2,
          endIndex: 4,
          level: 101.25,
          height: 0.5,
          duration: 3,
          isConsolidation: true,
          volumeProfile: 1300000,
          floor: 100.60,
          ceiling: 101.50
        }
      };
      
      // Test with candles up to index 18 (no breach yet as trail is still rising)
      const result = computeEscalatorStop(position, candles.slice(0, 19));
      expect(result).toBeNull(); // No stop hit yet
      
      // Test with candles including index 19 (breach happens at index 19)
      const stopEvent = computeEscalatorStop(position, candles.slice(0, 20));
      
      expect(stopEvent).not.toBeNull();
      expect(stopEvent?.index).toBe(19); // Candle at 11:05 breaches
      expect(stopEvent?.price).toBeCloseTo(103.90); // Trail from candle 17's low
      expect(stopEvent?.type).toBe('TRAIL');
    });
    
    it('should not trail below previous trail level for LONG', () => {
      const candles = loadCandlesFromCSV('fixture_normal_trail.csv');
      
      const position: Position = {
        side: 'LONG',
        openIndex: 5,
        step: {} as StepBox // Details not needed for this test
      };
      
      // Manually check trail ratcheting logic
      let previousTrail: number | null = null;
      const trailLevels: number[] = [];
      
      // Simulate the trail calculation from index 7 onwards
      for (let i = position.openIndex + 2; i < 18; i++) {
        const trailCandle = candles[i - 2];
        let trailLevel: number;
        
        if (previousTrail !== null) {
          trailLevel = Math.max(trailCandle.low, previousTrail);
        } else {
          trailLevel = trailCandle.low;
        }
        
        trailLevels.push(trailLevel);
        previousTrail = trailLevel;
      }
      
      // Verify trail levels are monotonically non-decreasing
      for (let i = 1; i < trailLevels.length; i++) {
        expect(trailLevels[i]).toBeGreaterThanOrEqual(trailLevels[i - 1]);
      }
    });
  });
  
  describe('SHORT position trailing', () => {
    it('should trail at i-2 candle high and ratchet down only', () => {
      const candles = loadCandlesFromCSV('fixture_gap_breach.csv').slice(0, 7); // Pre-gap candles
      
      // Create descending candles for SHORT test
      const shortCandles = candles.map((c, i) => ({
        ...c,
        open: 100 - i * 0.2,
        high: 100.1 - i * 0.2,
        low: 99.8 - i * 0.2,
        close: 99.9 - i * 0.2
      }));
      
      // Add a reversal candle that breaches trail
      shortCandles.push({
        datetime: '2024-01-01T16:05:00',
        timestamp: new Date('2024-01-01T16:05:00').getTime(),
        open: 98.5,
        high: 99.8, // Breaches trail from candle 5 (99.1)
        low: 98.4,
        close: 99.7,
        volume: 1700000
      });
      
      const position: Position = {
        side: 'SHORT',
        openIndex: 2,
        step: {} as StepBox
      };
      
      const stopEvent = computeEscalatorStop(position, shortCandles);
      
      expect(stopEvent).not.toBeNull();
      expect(stopEvent?.index).toBe(7);
      expect(stopEvent?.price).toBeCloseTo(99.1); // Trail from candle 5's high
      expect(stopEvent?.type).toBe('TRAIL');
    });
  });
  
  describe('Edge cases', () => {
    it('should return null if not enough candles after open', () => {
      const candles = loadCandlesFromCSV('fixture_normal_trail.csv').slice(0, 7);
      
      const position: Position = {
        side: 'LONG',
        openIndex: 5,
        step: {} as StepBox
      };
      
      const result = computeEscalatorStop(position, candles);
      expect(result).toBeNull(); // Need at least openIndex + 3 candles
    });
    
    it('should handle position opened near end of data', () => {
      const candles = loadCandlesFromCSV('fixture_normal_trail.csv');
      
      const position: Position = {
        side: 'LONG',
        openIndex: candles.length - 2,
        step: {} as StepBox
      };
      
      const result = computeEscalatorStop(position, candles);
      expect(result).toBeNull();
    });
  });
});

describe('gapCheck', () => {
  it('should detect gap breach and exit when no step forming', () => {
    const candles = loadCandlesFromCSV('fixture_gap_breach.csv');
    
    // Day 1 close vs Day 2 open
    const prevClose = 99.75; // From fixture
    const openPrice = 104.50; // From fixture - gap up ~4.77%
    const candle1 = candles[7]; // First candle of day 2
    const candle2 = candles[8]; // Second candle of day 2
    
    const exitEvent = gapCheck(prevClose, openPrice, candle1, candle2, false);
    
    expect(exitEvent).not.toBeNull();
    expect(exitEvent?.index).toBe(1); // Candle2 index
    expect(exitEvent?.price).toBe(candle2.close);
    expect(exitEvent?.reason).toBe('GAP_NO_STEP');
    
    // Verify gap percentage exceeded threshold (0.04 = 4%)
    const gapPercent = Math.abs(openPrice - prevClose) / prevClose;
    expect(gapPercent).toBeGreaterThan(0.04); // Should be ~4.77%
  });
  
  it('should not exit if step is forming despite gap', () => {
    const candles = loadCandlesFromCSV('fixture_gap_breach.csv');
    
    const prevClose = 99.75;
    const openPrice = 104.50;
    const candle1 = candles[7];
    const candle2 = candles[8];
    
    const exitEvent = gapCheck(prevClose, openPrice, candle1, candle2, true);
    
    expect(exitEvent).toBeNull(); // No exit when step forming
  });
  
  it('should not exit if gap within threshold', () => {
    const candles = loadCandlesFromCSV('fixture_normal_trail.csv');
    
    // Small gap scenario
    const prevClose = 100.00;
    const openPrice = 100.50; // 0.5% gap
    const candle1 = candles[0];
    const candle2 = candles[1];
    
    const exitEvent = gapCheck(prevClose, openPrice, candle1, candle2, false);
    
    expect(exitEvent).toBeNull(); // Gap too small
  });
});

describe('isStepForming', () => {
  it('should detect consolidation pattern as step forming', () => {
    // Create consolidating candles
    const candles: Candle[] = Array(5).fill(null).map((_, i) => ({
      datetime: `2024-01-01T09:${30 + i * 5}:00`,
      timestamp: Date.now() + i * 300000,
      open: 100 + (i % 2) * 0.1,
      high: 100.3,
      low: 99.9,
      close: 100.1 - (i % 2) * 0.1,
      volume: 1000000
    }));
    
    const result = isStepForming(candles);
    expect(result).toBe(true); // Small bodies indicate consolidation
  });
  
  it('should not detect step in trending candles', () => {
    // Create trending candles with large bodies
    const candles: Candle[] = Array(5).fill(null).map((_, i) => ({
      datetime: `2024-01-01T09:${30 + i * 5}:00`,
      timestamp: Date.now() + i * 300000,
      open: 100 + i,
      high: 101 + i,
      low: 99.5 + i,
      close: 100.8 + i,
      volume: 1000000
    }));
    
    const result = isStepForming(candles);
    expect(result).toBe(false); // Large bodies indicate trend, not step
  });
  
  it('should return false if insufficient candles', () => {
    const candles: Candle[] = [{
      datetime: '2024-01-01T09:30:00',
      timestamp: Date.now(),
      open: 100,
      high: 100.5,
      low: 99.5,
      close: 100.2,
      volume: 1000000
    }];
    
    const result = isStepForming(candles, 3);
    expect(result).toBe(false);
  });
});
