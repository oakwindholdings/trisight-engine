// src/hooks/usePatternBus.ts
// Pattern detection event bus that runs detectors and emits events
// Debounced to run only on new candle append

import { useEffect, useRef, useState } from 'react';
import { Candle, EscalatorRun } from '../types';
import { detectEscalators } from '../patternEngine/escalator';
import { detectGoldmine, GoldmineSignal } from '../patternEngine/goldmine';
import { computeEscalatorStop, StopLossEvent } from '../riskEngine/trailingStop';
import { getIntrinsicScore } from '../patternEngine/blackjack';
import { usePatternContext } from '../contexts/PatternContext';

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
  isPatternDetectionComplete: boolean;
  processedDataHash: string;
}

export function usePatternBus(candles: Candle[]): PatternBusState {
  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [activePosition, setActivePosition] = useState<Position | undefined>();
  const [isPatternDetectionComplete, setIsPatternDetectionComplete] = useState(false);
  const [processedDataHash, setProcessedDataHash] = useState<string>('');
  const prevCandleCountRef = useRef(0);
  const prevFirstCandleRef = useRef<Candle | null>(null);
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
  
  console.log('[usePatternBus] Got context setters:', {
    hasSetEscalatorDir: !!setEscalatorDir,
    typeOfSetEscalatorDir: typeof setEscalatorDir
  });

  // Clear pattern arrays on data change
  useEffect(() => {
    if (!candles || candles.length === 0) return;
    
    // Clear all pattern arrays when data changes
    console.log('[PatternBus] Clearing pattern arrays for new data');
    setIsPatternDetectionComplete(false);
    setBjIntrinsic([]);
    setBjCumulative([]);
    setStepIndex([]);
    setEscalatorDir([]);
    setEscalatorLength([]);
    setGoldmineQual([]);
    setTrailStop([]);
    setDistToStopPct([]);
  }, [candles.length, candles[0]?.datetime, candles[candles.length - 1]?.datetime,
      setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, 
      setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct]);

  // Run pattern detection
  useEffect(() => {
    if (!candles || candles.length === 0) {
      console.log('[PatternBus] No candles provided, skipping pattern detection');
      setIsPatternDetectionComplete(false);
      return;
    }
    
    console.log('[PatternBus] Running pattern detection on', candles.length, 'candles');
    console.log('[PatternBus] Data range:', {
      first: candles[0] ? { time: candles[0].datetime, close: candles[0].close } : null,
      last: candles[candles.length - 1] ? { time: candles[candles.length - 1].datetime, close: candles[candles.length - 1].close } : null,
      candleHash: candles[0]?.datetime + '_' + candles[candles.length - 1]?.datetime + '_' + candles.length
    });
    
    // Track if this is the same data as last time
    const currentFirstTime = candles[0]?.datetime;
    const currentLastTime = candles[candles.length - 1]?.datetime;
    
    // Update candle count tracking
    const dataChanged = !prevFirstCandleRef.current || 
                       prevFirstCandleRef.current.datetime !== currentFirstTime ||
                       prevCandleCountRef.current === 0; // First load

    // Debounce - only run when new candles are appended or data changed
    if (candles.length <= prevCandleCountRef.current && !dataChanged) {
      setIsPatternDetectionComplete(true);
      return;
    }
    
    prevCandleCountRef.current = candles.length;
    prevFirstCandleRef.current = candles[0];

    console.log('[PatternBus] Data changed, running pattern detection');
    
    // Log the time range
    if (candles.length > 0) {
      const firstTime = new Date(candles[0].datetime);
      const lastTime = new Date(candles[candles.length - 1].datetime);
      console.log('[PatternBus] Time range:', {
        first: firstTime.toLocaleString(),
        last: lastTime.toLocaleString(),
        firstIdx: 0,
        lastIdx: candles.length - 1
      });
    }

    const newEvents: PatternEvent[] = [];

    // 1. Detect Escalator patterns
    const escalators = detectEscalators(candles);
    console.log('[PatternBus] Detected escalators:', escalators.length);
    
    // Debug: Log sample of candles to verify data
    console.log('[PatternBus] Sample candles for pattern detection:', {
      totalCandles: candles.length,
      firstCandle: { 
        datetime: candles[0]?.datetime, 
        open: candles[0]?.open, 
        close: candles[0]?.close,
        isBullish: candles[0]?.close > candles[0]?.open
      },
      lastCandle: { 
        datetime: candles[candles.length-1]?.datetime, 
        open: candles[candles.length-1]?.open, 
        close: candles[candles.length-1]?.close,
        isBullish: candles[candles.length-1]?.close > candles[candles.length-1]?.open
      },
      sampleMidCandles: candles.slice(Math.floor(candles.length/2) - 2, Math.floor(candles.length/2) + 3).map((c, i) => ({
        index: Math.floor(candles.length/2) - 2 + i,
        datetime: c.datetime,
        open: c.open,
        close: c.close,
        isBullish: c.close > c.open
      }))
    });
    
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
    
    // Create per-candle escalator direction array
    const escalatorDirArray: ('RISING' | 'FALLING' | null)[] = new Array(candles.length).fill(null);
    
    escalators.forEach(escalator => {
      console.log('[PatternBus] Processing escalator:', {
        startIndex: escalator.startIndex,
        endIndex: escalator.endIndex,
        direction: escalator.direction,
        startCandle: candles[escalator.startIndex]?.close,
        endCandle: candles[escalator.endIndex]?.close,
        startDate: candles[escalator.startIndex]?.datetime,
        endDate: candles[escalator.endIndex]?.datetime
      });
      
      // Fill in the direction for all candles in this escalator run
      escalator.steps.forEach(step => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < candles.length) {
            escalatorDirArray[i] = escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING';
          }
        }
      });
    });
    
    console.log('[PatternBus] After escalator detection, nulls remaining:', escalatorDirArray.filter(d => d === null).length);
    
    // DO NOT fill nulls - respect Dick Oleary's strict escalator rules
    // If there's no escalator pattern detected, it should remain null
    // This preserves the integrity of the pattern detection
    
    console.log('[PatternBus] Final escalator direction array sample:', {
      first5: escalatorDirArray.slice(0, 5),
      last5: escalatorDirArray.slice(-5),
      totalNulls: escalatorDirArray.filter(d => d === null).length,
      totalRising: escalatorDirArray.filter(d => d === 'RISING').length,
      totalFalling: escalatorDirArray.filter(d => d === 'FALLING').length
    });
    
    setEscalatorDir(escalatorDirArray);
    
    // Build escalator length array
    const escalatorLength = new Array<number>(candles.length).fill(0);
    
    escalators.forEach(escalator => {
      // Debug log to track escalator detection
      console.log(`Escalator detected: startIndex=${escalator.startIndex}, endIndex=${escalator.endIndex}, direction=${escalator.direction}`);
      
      // Log candle prices at the escalator to verify direction
      if (escalator.startIndex < candles.length && escalator.endIndex < candles.length) {
        const startCandle = candles[escalator.startIndex];
        const endCandle = candles[escalator.endIndex];
        console.log(`[PatternBus] Escalator candles:`, {
          startPrice: startCandle.close,
          endPrice: endCandle.close,
          priceChange: endCandle.close - startCandle.close,
          expectedDirection: endCandle.close > startCandle.close ? 'RISING' : 'FALLING',
          detectedDirection: escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING'
        });
      }
      
      for (let i = escalator.startIndex; i <= escalator.endIndex; i++) {
        if (i < candles.length) {
          escalatorLength[i] = i - escalator.startIndex + 1;
        }
      }
    });
    
    // Debug log the populated escalatorDir array
    console.log('[PatternBus] EscalatorDir array populated:', {
      totalLength: escalatorDirArray.length,
      nonNullCount: escalatorDirArray.filter(d => d !== null).length,
      sample: escalatorDirArray.slice(45, 55).map((dir, i) => `[${i + 45}]: ${dir}`),
      atIndex92: `[92]: ${escalatorDirArray[92]}`,
      nearIndex92: escalatorDirArray.slice(88, 96).map((dir, i) => `[${i + 88}]: ${dir}`)
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
    
    const dataHash = candles[0]?.datetime + '_' + candles[candles.length - 1]?.datetime + '_' + candles.length;
    setProcessedDataHash(dataHash);
    
    setIsPatternDetectionComplete(true);
  }, [candles, events, activePosition, setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct]);

  return { events, activePosition, isPatternDetectionComplete, processedDataHash };
}
