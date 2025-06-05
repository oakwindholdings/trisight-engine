// src/hooks/usePatternBus.ts
// Pattern detection event bus that runs detectors and emits events
// Debounced to run only on new candle append

import { useEffect, useRef, useState } from 'react';
import { Candle, EscalatorRun } from '../types';
import { detectEscalators } from '../patternEngine/escalator';
import { detectGoldmine, GoldmineSignal } from '../patternEngine/goldmine';
import { computeEscalatorStop, StopLossEvent } from '../riskEngine/trailingStop';

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
  }, [candles, events, activePosition]);

  return { events, activePosition };
}
