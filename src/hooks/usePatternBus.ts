// src/hooks/usePatternBus.ts
// Pattern detection event bus that runs detectors and emits events
// Debounced to run only on new candle append

import { useEffect, useRef, useState } from 'react';
import { Candle, EscalatorRun } from '../types';
import { detectEscalators } from '../patternEngine/escalator';
import { detectGoldmine, GoldmineSignal } from '../patternEngine/goldmine';
import { computeEscalatorStop, StopLossEvent } from '../riskEngine/trailingStop';
import { getIntrinsicScore } from '../patternEngine/blackjack';
import { usePatternContext } from '../context/PatternContext';

export interface Position {
  side: 'LONG' | 'SHORT';
  openIndex: number;
  step: any; // StepBox type
}

export interface PatternEvent {
  type: 'ESCALATOR' | 'GOLDMINE' | 'STOP_EVENT';
  data: EscalatorRun | GoldmineSignal | StopLossEvent;
  timestamp: number;
}

export interface PatternBusState {
  events: PatternEvent[];
  activePosition?: Position;
}

export function usePatternBus(candles: Candle[]): PatternBusState {
  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [activePosition, setActivePosition] = useState<Position | undefined>();
  const prevCandleCountRef = useRef(0);
  const existingGoldmineRef = useRef<GoldmineSignal | undefined>(undefined);

  // Get context setters for pattern metrics
  const { 
    setBjIntrinsic, 
    setBjCumulative, 
    setStepIndex,
    setEscalatorDir,
    setEscalatorLength,
    setGoldmineQual,
    setTrailStop,
    setDistToStopPct
  } = usePatternContext();

  useEffect(() => {
    // Debounce - only run when new candles are appended
    if (candles.length <= prevCandleCountRef.current) {
      return;
    }
    prevCandleCountRef.current = candles.length;

    // Skip if insufficient data
    if (candles.length < 10) {
      return;
    }

    const newEvents: PatternEvent[] = [];

    // 1. Detect Escalator patterns
    const escalators = detectEscalators(candles);
    
    // Compute real Blackjack intrinsic scores
    const bjIntrinsic = candles.map((candle, i) => {
      if (i === 0) return 0;
      const prevCandle = candles[i - 1];
      const prevBodyHigh = Math.max(prevCandle.open, prevCandle.close);
      const prevBodyLow = Math.min(prevCandle.open, prevCandle.close);
      return getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
    });
    
    // Compute cumulative Blackjack scores
    const bjCumulative = bjIntrinsic.reduce<number[]>(
      (arr, val) => {
        arr.push((arr[arr.length - 1] ?? 0) + val);
        return arr;
      }, 
      []
    );
    
    // Compute step indices from detected escalator steps
    const stepIndex = new Array(candles.length).fill(null);
    escalators.forEach(escalator => {
      escalator.steps.forEach(step => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < candles.length) {
            stepIndex[i] = i - step.startIndex + 1;
          }
        }
      });
    });
    
    // Build escalator direction and length arrays
    const escalatorDir = new Array<'RISING' | 'FALLING' | null>(candles.length).fill(null);
    const escalatorLength = new Array<number>(candles.length).fill(0);
    
    escalators.forEach(escalator => {
      for (let i = escalator.startIndex; i <= escalator.endIndex; i++) {
        if (i < candles.length) {
          // Map ThrustDirection (BULLISH/BEARISH) to RISING/FALLING
          escalatorDir[i] = escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING';
          escalatorLength[i] = i - escalator.startIndex + 1;
        }
      }
    });
    
    // Build goldmine qualifier array
    const goldmineQual = new Array<boolean>(candles.length).fill(false);
    
    // Build trailing stop arrays (use 0 as default for no stop)
    const trailStop = new Array<number>(candles.length).fill(0);
    const distToStopPct = new Array<number>(candles.length).fill(0);
    
    // Push arrays into context
    setBjIntrinsic(bjIntrinsic);
    setBjCumulative(bjCumulative);
    setStepIndex(stepIndex);
    setEscalatorDir(escalatorDir);
    setEscalatorLength(escalatorLength);
    setGoldmineQual(goldmineQual);
    setTrailStop(trailStop);
    setDistToStopPct(distToStopPct);

    // Emit new escalator events (only for the latest patterns to avoid duplicates)
    const latestEscalators = escalators.slice(-5); // Keep last 5 escalators active
    latestEscalators.forEach(escalator => {
      // Check if this escalator is already in events
      const exists = events.some(e => 
        e.type === 'ESCALATOR' && 
        (e.data as EscalatorRun).startIndex === escalator.startIndex
      );
      
      if (!exists) {
        newEvents.push({
          type: 'ESCALATOR',
          data: escalator,
          timestamp: Date.now()
        });
      }
    });

    // 2. Detect Goldmine signals on latest escalator
    if (escalators.length > 0 && !existingGoldmineRef.current) {
      const latestEscalator = escalators[escalators.length - 1];
      const latestStep = latestEscalator.steps[latestEscalator.steps.length - 1];
      
      // Check for Goldmine on the latest candles after the step
      const candlesAfterStep = candles.slice(latestStep.endIndex + 1);
      
      if (candlesAfterStep.length > 0) {
        const goldmine = detectGoldmine(
          latestStep,
          candlesAfterStep,
          existingGoldmineRef.current
        );
        
        if (goldmine) {
          existingGoldmineRef.current = goldmine;
          newEvents.push({
            type: 'GOLDMINE',
            data: goldmine,
            timestamp: Date.now()
          });
          
          // Mark goldmine entry in the goldmineQual array
          if (goldmine.entryIndex < candles.length) {
            goldmineQual[goldmine.entryIndex] = true;
          }
          
          // Create position for trailing stop
          setActivePosition({
            side: goldmine.side,
            openIndex: latestStep.endIndex + 1 + goldmine.entryIndex,
            step: latestStep
          });
        }
      }
    }

    // 3. Compute trailing stop if position is active
    if (activePosition) {
      // Track trailing stop for all candles while position is active
      for (let i = activePosition.openIndex; i < candles.length; i++) {
        const partialCandles = candles.slice(0, i + 1);
        const stopEvent = computeEscalatorStop(activePosition, partialCandles);
        
        if (stopEvent && stopEvent.price) {
          trailStop[i] = stopEvent.price;
          // Calculate distance to stop as percentage
          const closePrice = candles[i].close;
          distToStopPct[i] = ((closePrice - stopEvent.price) / closePrice) * 100;
        }
      }
      
      // Check if stop has been hit on the latest candle
      const stopEvent = computeEscalatorStop(activePosition, candles);
      
      if (stopEvent) {
        newEvents.push({
          type: 'STOP_EVENT',
          data: stopEvent,
          timestamp: Date.now()
        });
        
        // Clear position after stop
        setActivePosition(undefined);
        existingGoldmineRef.current = undefined;
      }
    }

    // Update events
    if (newEvents.length > 0) {
      setEvents(prev => [...prev, ...newEvents]);
    }
  }, [candles, events, activePosition, setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct]);

  return { events, activePosition };
}
