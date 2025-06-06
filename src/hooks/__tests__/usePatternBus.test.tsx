// src/hooks/__tests__/usePatternBus.test.tsx
// Unit tests for usePatternBus hook
// Tests pattern detection and event emission

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { usePatternBus } from '../usePatternBus';
import { Candle } from '../../types';
import { PatternProvider } from '../../context/PatternContext';

describe('usePatternBus Hook', () => {
  const generateCandles = (count: number, basePrice: number = 100): Candle[] => {
    const baseTime = new Date('2025-01-15T09:30:00').getTime();
    return Array.from({ length: count }, (_, i) => ({
      datetime: new Date(baseTime + i * 60000).toISOString(),
      timestamp: baseTime + i * 60000,
      open: basePrice + Math.random() * 2,
      high: basePrice + 2 + Math.random(),
      low: basePrice - 1 + Math.random(),
      close: basePrice + Math.random() * 2,
      volume: 100000 + Math.random() * 50000,
    }));
  };

  const generateEscalatorCandles = (): Candle[] => {
    const baseTime = new Date('2025-01-15T09:30:00').getTime();
    const candles: Candle[] = [];
    
    // Create rising escalator pattern
    for (let i = 0; i < 20; i++) {
      const time = baseTime + i * 60000;
      let open = 100;
      let close = 100;
      let high = 100;
      let low = 100;
      
      if (i >= 5 && i <= 10) {
        // Rising steps
        open = 100 + (i - 5) * 0.5;
        close = open + 0.3;
        high = close + 0.1;
        low = open - 0.1;
      } else if (i === 11) {
        // Breakout candle for Goldmine
        open = 103;
        close = 102.5;
        high = 103.2;
        low = 102.3; // Breaks below floor
      } else if (i === 12) {
        // Confirmation candle
        open = 102.5;
        close = 102;
        high = 102.6;
        low = 101.8;
      }
      
      candles.push({
        datetime: new Date(time).toISOString(),
        timestamp: time,
        open,
        high,
        low,
        close,
        volume: 100000,
      });
    }
    
    return candles;
  };

  it('initializes with empty events and no position', () => {
    const { result } = renderHook(() => usePatternBus([]), {
      wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
    });
    
    expect(result.current.events).toEqual([]);
    expect(result.current.activePosition).toBeNull();
  });

  it('detects escalator patterns and emits events', async () => {
    const candles = generateEscalatorCandles();
    const { result, rerender } = renderHook(
      ({ data }) => usePatternBus(data),
      {
        initialProps: { data: candles.slice(0, 10) },
        wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
      }
    );

    // Add more candles to trigger detection
    act(() => {
      rerender({ data: candles.slice(0, 15) });
    });

    // Wait for debounced detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    // Should have detected escalator pattern
    const escalatorEvents = result.current.events.filter(e => e.type === 'ESCALATOR');
    expect(escalatorEvents.length).toBeGreaterThan(0);
  });

  it('detects goldmine signals after escalator', async () => {
    const candles = generateEscalatorCandles();
    const { result } = renderHook(() => usePatternBus(candles), {
      wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
    });

    // Wait for detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    // Should have both escalator and goldmine events
    const escalatorEvents = result.current.events.filter(e => e.type === 'ESCALATOR');
    const goldmineEvents = result.current.events.filter(e => e.type === 'GOLDMINE');
    
    expect(escalatorEvents.length).toBeGreaterThan(0);
    expect(goldmineEvents.length).toBe(1); // One-and-done rule
  });

  it('creates position and emits stop events on goldmine signal', async () => {
    const candles = generateEscalatorCandles();
    const { result } = renderHook(() => usePatternBus(candles), {
      wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
    });

    // Wait for detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    // Should have active position
    expect(result.current.activePosition).not.toBeNull();
    
    // Should have stop event
    const stopEvents = result.current.events.filter(e => e.type === 'STOP_EVENT');
    expect(stopEvents.length).toBeGreaterThan(0);
  });

  it('limits escalator events to latest 5', async () => {
    // Generate many candles with multiple patterns
    const candles: Candle[] = [];
    const baseTime = new Date('2025-01-15T09:30:00').getTime();
    
    // Create 10 separate escalator patterns
    for (let pattern = 0; pattern < 10; pattern++) {
      for (let i = 0; i < 10; i++) {
        const offset = pattern * 15 + i;
        const time = baseTime + offset * 60000;
        
        if (i >= 2 && i <= 7) {
          // Rising pattern
          const open = 100 + i * 0.5;
          candles.push({
            datetime: new Date(time).toISOString(),
            timestamp: time,
            open,
            high: open + 0.6,
            low: open - 0.1,
            close: open + 0.5,
            volume: 100000,
          });
        } else {
          // Normal candle
          candles.push({
            datetime: new Date(time).toISOString(),
            timestamp: time,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 100000,
          });
        }
      }
    }

    const { result } = renderHook(() => usePatternBus(candles), {
      wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
    });

    // Wait for detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    // Should only keep latest 5 escalator events
    const escalatorEvents = result.current.events.filter(e => e.type === 'ESCALATOR');
    expect(escalatorEvents.length).toBeLessThanOrEqual(5);
  });

  it('respects one-and-done rule for goldmine signals', async () => {
    const candles = generateEscalatorCandles();
    const { result, rerender } = renderHook(
      ({ data }) => usePatternBus(data),
      {
        initialProps: { data: candles },
        wrapper: ({ children }) => <PatternProvider>{children}</PatternProvider>,
      }
    );

    // Wait for initial detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    const initialGoldmineCount = result.current.events.filter(e => e.type === 'GOLDMINE').length;
    expect(initialGoldmineCount).toBe(1);

    // Add more candles that could trigger another goldmine
    const moreCandles = [...candles, ...generateCandles(10, 95)];
    
    act(() => {
      rerender({ data: moreCandles });
    });

    // Wait for potential new detection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 550));
    });

    // Should still only have one goldmine signal
    const finalGoldmineCount = result.current.events.filter(e => e.type === 'GOLDMINE').length;
    expect(finalGoldmineCount).toBe(1);
  });
});
