// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/hooks/usePatternBus.ts
// Central pattern detection and event coordination
// Processes candle data and emits pattern events to the UI

// NOTE: All pattern detection logic is coordinated here: ESCALATOR, BREAKOUT_BOX, etc.

import { useEffect, useRef, useState } from 'react';
import { Candle, EscalatorRun } from '../types';
import { 
  detectEscalators, 
  detectBreakoutBoxes,
  detectGoldmine, 
  getIntrinsicScore,
  computeRollingBlackjackScores,
  computeTargetBlackjackScore 
} from '../patternEngine';
import type { GoldmineSignal } from '../patternEngine';
import { computeEscalatorStop, StopLossEvent } from '../riskEngine/trailingStop';
import { usePatternContext } from '../contexts/PatternContext';
import { logDebug } from '../utils/debug';

export interface Position {
  side: 'LONG' | 'SHORT';
  openIndex: number;
  step: any; // StepBox type
}

// NOTE: Valid PatternEvent types: ESCALATOR, ESCALATOR_STEP, BREAKOUT_BOX, GOLDMINE, etc.
export interface PatternEvent {
  type: 'ESCALATOR' | 'ESCALATOR_STEP' | 'GOLDMINE' | 'STOP_EVENT' | 'BREAKOUT_BOX' | 'BLACKJACK_ROLLING' | 'BLACKJACK_TARGET';
  data: EscalatorRun | GoldmineSignal | StopLossEvent | any; // 'any' for StepBox data
  timestamp: number;
}

export interface PatternBusState {
  events: PatternEvent[];
  activePosition?: Position;
  isPatternDetectionComplete: boolean;
  processedDataHash: string;
}

export function usePatternBus(candles: Candle[]): PatternBusState {
  const prevCandleCountRef = useRef(0);
  const prevFirstCandleRef = useRef<Candle | null>(null);
  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [activePosition, setActivePosition] = useState<Position | undefined>();
  const [isPatternDetectionComplete, setIsPatternDetectionComplete] = useState(false);
  const [processedDataHash, setProcessedDataHash] = useState<string>('');
  const existingGoldmineRef = useRef<GoldmineSignal | undefined>(undefined);

  const { 
    setBjIntrinsic, 
    setBjCumulative,
    setBjRollingScores, 
    setBjTargetScores, 
    setStepIndex,
    setEscalatorDir,
    setEscalatorLength,
    setGoldmineQual,
    setTrailStop,
    setDistToStopPct,
    setEscalatorSteps,
    setBreakoutBoxes,
    escalatorSettings
  } = usePatternContext();
  
  useEffect(() => {
    if (!candles || candles.length === 0) return;
    
    setIsPatternDetectionComplete(false);
    setBjIntrinsic([]);
    setBjCumulative([]);
    setBjRollingScores([]);
    setBjTargetScores([]);
    setStepIndex([]);
    setEscalatorDir([]);
    setEscalatorLength([]);
    setGoldmineQual([]);
    setTrailStop([]);
    setDistToStopPct([]);
    setEscalatorSteps([]);
    setBreakoutBoxes([]);
  }, [candles.length, candles[0]?.datetime, candles[candles.length - 1]?.datetime,
      setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, 
      setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct, setEscalatorSteps, setBreakoutBoxes, setBjTargetScores]);

  useEffect(() => {
    if (!candles || candles.length === 0) {
      setIsPatternDetectionComplete(false);
      return;
    }
    
    const currentFirstTime = candles[0]?.datetime;
    const currentLastTime = candles[candles.length - 1]?.datetime;
    
    const dataChanged = !prevFirstCandleRef.current || 
                       prevFirstCandleRef.current.datetime !== currentFirstTime ||
                       prevCandleCountRef.current === 0; // First load

    if (candles.length <= prevCandleCountRef.current && !dataChanged) {
      setIsPatternDetectionComplete(true);
      return;
    }
    
    prevCandleCountRef.current = candles.length;
    prevFirstCandleRef.current = candles[0];

    const newEvents: PatternEvent[] = [];

    // Detect BreakoutBoxes independently
    let breakoutBoxes: any[] = [];
    const targetEvents: PatternEvent[] = [];
    const bjTargets: { stepRef: string; score: number; qualifiesForGoldmine?: boolean }[] = [];
    const breakoutBoxEvents: PatternEvent[] = [];
    
    try {
      breakoutBoxes = detectBreakoutBoxes(candles);
    } catch (error) {
      console.error('[usePatternBus] Error in detectBreakoutBoxes:', error);
      console.error('[usePatternBus] Stack trace:', (error as Error).stack);
    }
    
    // Process breakout boxes
    breakoutBoxes.forEach(box => {
      const boxCandles = candles.slice(box.startIndex, box.endIndex + 1);
      // Compute Target Blackjack Score for this breakout box
      const tbsScore = computeTargetBlackjackScore(candles, box.startIndex, box.endIndex);
      bjTargets.push({ stepRef: box.stepRef, score: tbsScore, qualifiesForGoldmine: box.qualifiesForGoldmine });
      targetEvents.push({
        type: 'BLACKJACK_TARGET',
        data: { stepRef: box.stepRef, score: tbsScore, qualifiesForGoldmine: box.qualifiesForGoldmine },
        timestamp: Date.now()
      });
      
      // DIAGNOSTIC: Log qualification status before event creation
      logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [usePatternBus] Creating event for box:', {
        stepRef: box.stepRef,
        qualifiesForGoldmine: box.qualifiesForGoldmine,
        blackjackScore: box.blackjackScore,
        hasQualificationField: 'qualifiesForGoldmine' in box
      });
      
      const event: PatternEvent = {
        type: 'BREAKOUT_BOX',
        data: {
          ...box,
          candles: boxCandles, // Add candles array for renderer
          // Add additional fields expected by renderer
          high: box.ceiling,
          low: box.floor,
          boxType: box.direction === 'RISING' ? 'consolidation' : 'compression', // Renamed from 'type' to avoid collision
          // Include Blackjack scoring metadata
          blackjackScore: box.blackjackScore,
          blackjackComponents: box.blackjackComponents,
          qualifiesForGoldmine: box.qualifiesForGoldmine
        },
        timestamp: Date.now()
      };
      
      // DIAGNOSTIC: Verify event data after creation
      logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [usePatternBus] Event created with data:', {
        stepRef: event.data.stepRef,
        qualifiesForGoldmine: event.data.qualifiesForGoldmine,
        dataKeys: Object.keys(event.data)
      });
      
      breakoutBoxEvents.push(event);
    });
    
    // DIAGNOSTIC: Summary of qualified events
    const qualifiedEvents = breakoutBoxEvents.filter(e => e.data.qualifiesForGoldmine === true);
    logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] [usePatternBus] Event emission summary:', {
      totalEvents: breakoutBoxEvents.length,
      qualifiedEvents: qualifiedEvents.length,
      qualifiedStepRefs: qualifiedEvents.map(e => e.data.stepRef)
    });
    
    // Add breakout box events to the main events array
    newEvents.push(...breakoutBoxEvents);
    newEvents.push(...targetEvents);

    // Update context with Target Blackjack Scores for rendering
    setBjTargetScores(bjTargets);

    // Detect escalators using pattern engine - only if enabled
    const shouldDetect = escalatorSettings?.enabled === true;
    const escalators = shouldDetect ? detectEscalators(candles) : [];
    
    logDebug('DEBUG_PATTERN_DETECT', '[usePatternBus] Escalator detection:', {
      escalatorSettings,
      enabled: escalatorSettings?.enabled,
      shouldDetect,
      escalatorsDetected: escalators.length
    });
    
    // Process escalators and emit events
    const escalatorEvents: PatternEvent[] = [];
    
    // Emit ESCALATOR events for each escalator run
    escalators.forEach(escalator => {
      escalatorEvents.push({
        type: 'ESCALATOR',
        data: escalator,
        timestamp: candles[escalator.startIndex]?.timestamp || Date.now()
      });
      
      // Emit ESCALATOR_STEP events for each step within the escalator
      escalator.steps.forEach((step, stepIndex) => {
        const startTimestamp = candles[step.startIndex]?.timestamp || 0;
        const endTimestamp = candles[step.endIndex]?.timestamp || 0;
        const stepRef = `${startTimestamp}-${endTimestamp}`;
        
        const existingEvent = escalatorEvents.find(event => event.type === 'ESCALATOR_STEP' && event.data.stepRef === stepRef);
        if (!existingEvent) {
          escalatorEvents.push({
            type: 'ESCALATOR_STEP',
            data: {
              stepRef,
              direction: escalator.direction === 'BULLISH' ? 'UP' : 'DOWN',
              floor: step.floor,
              ceiling: step.ceiling,
              height: step.ceiling - step.floor,
              startIndex: step.startIndex,
              endIndex: step.endIndex,
              startTime: step.startTime,
              endTime: step.endTime
            },
            timestamp: candles[step.startIndex]?.timestamp || Date.now()
          });
        }
      });
    });
    
    // Add all escalator events to the main events array
    newEvents.push(...escalatorEvents);
    
    const escalatorDirArray: ('RISING' | 'FALLING' | null)[] = new Array(candles.length).fill(null);
    
    escalators.forEach(escalator => {
      escalator.steps.forEach((step, stepIndex) => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < candles.length) {
            const dir = escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING';
            escalatorDirArray[i] = dir;
          }
        }
      });
    });
    
    setEscalatorDir(escalatorDirArray);
    
    const escalatorLength = new Array<number>(candles.length).fill(0);
    
    escalators.forEach(escalator => {
      for (let i = escalator.startIndex; i <= escalator.endIndex; i++) {
        if (i < candles.length) {
          escalatorLength[i] = i - escalator.startIndex + 1;
        }
      }
    });
    
    const goldmineQual = new Array<boolean>(candles.length).fill(false);
    
    const trailStop = new Array<number>(candles.length).fill(0);
    const distToStopPct = new Array<number>(candles.length).fill(0);
    
    events.forEach(event => {
      if (event.type === 'GOLDMINE' && event.data) {
        const goldmine = event.data as any;
        if (goldmine.entryIndex < candles.length) {
          goldmineQual[goldmine.entryIndex] = true;
        }
      }
    });
    
    escalators.forEach(escalator => {
      escalator.steps.forEach(step => {
        for (let i = step.endIndex + 1; i < candles.length; i++) {
          if (i >= 2) {
            const stopPrice = candles[i - 2].low;
            trailStop[i] = stopPrice;
            
            const closePrice = candles[i].close;
            distToStopPct[i] = ((closePrice - stopPrice) / closePrice) * 100;
          }
        }
      });
    });
    
    const bjIntrinsic = candles.map((candle, i) => {
      if (i === 0) return 0;
      const prevCandle = candles[i - 1];
      const prevBodyHigh = Math.max(prevCandle.open, prevCandle.close);
      const prevBodyLow = Math.min(prevCandle.open, prevCandle.close);
      return getIntrinsicScore(candle, prevBodyHigh, prevBodyLow);
    });
    
    const bjCumulative = bjIntrinsic.reduce<number[]>(
      (arr, val) => {
        arr.push((arr[arr.length - 1] ?? 0) + val);
        return arr;
      }, 
      []
    );

    // Rolling blackjack scores (window 5 default)
    const bjRollingScores = computeRollingBlackjackScores(candles);

    
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
    
    setBjIntrinsic(bjIntrinsic);
    setBjCumulative(bjCumulative);
    setBjRollingScores(bjRollingScores);
    // Emit latest rolling score event for UI consumers
    if (bjRollingScores.length > 0) {
      const latestRolling = bjRollingScores[bjRollingScores.length - 1];
      newEvents.push({
        type: 'BLACKJACK_ROLLING',
        data: latestRolling,
        timestamp: latestRolling.timestamp
      });
    }
    setStepIndex(stepIndex);
    setEscalatorLength(escalatorLength);
    setGoldmineQual(goldmineQual);
    setTrailStop(trailStop);
    setDistToStopPct(distToStopPct);
    setEscalatorSteps(escalatorEvents);
    setBreakoutBoxes(breakoutBoxEvents);

    // Update breakout boxes in context
    if (breakoutBoxEvents.length > 0) {
      logDebug('DEBUG_PATTERN_DETECT', '[DIAGNOSTIC] usePatternBus setting breakoutBoxes in context:', {
        count: breakoutBoxEvents.length,
        firstFive: breakoutBoxEvents.slice(0, 5).map(e => ({
          stepRef: e.data.stepRef,
          indices: `${e.data.startIndex}-${e.data.endIndex}`
        }))
      });
    }

    logDebug('DEBUG_PATTERN_DETECT', '[usePatternBus] Context update:', {
      breakoutBoxEventsLength: breakoutBoxEvents.length,
      sampleStepRefs: breakoutBoxEvents.slice(0, 3).map(e => e.data.stepRef)
    });

    if (escalators.length > 0 && !existingGoldmineRef.current) {
      const latestEscalator = escalators[escalators.length - 1];
      const latestStep = latestEscalator.steps[latestEscalator.steps.length - 1];
      
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
        }
      }
    }

    if (activePosition) {
      for (let i = activePosition.openIndex; i < candles.length; i++) {
        const partialCandles = candles.slice(0, i + 1);
        const stopEvent = computeEscalatorStop(activePosition, partialCandles);
        
        if (stopEvent && stopEvent.price) {
          trailStop[i] = stopEvent.price;
          const closePrice = candles[i].close;
          distToStopPct[i] = ((closePrice - stopEvent.price) / closePrice) * 100;
        }
      }
      
      const stopEvent = computeEscalatorStop(activePosition, candles);
      
      if (stopEvent) {
        newEvents.push({
          type: 'STOP_EVENT',
          data: stopEvent,
          timestamp: Date.now()
        });
        
        setActivePosition(undefined);
        existingGoldmineRef.current = undefined;
      }
    }

    setEvents(prev => [...prev, ...newEvents]);
    
    const dataHash = candles[0]?.datetime + '_' + candles[candles.length - 1]?.datetime + '_' + candles.length;
    setProcessedDataHash(dataHash);
    
    setIsPatternDetectionComplete(true);
  }, [candles, events, activePosition, setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct, setEscalatorSteps, setBreakoutBoxes, setBjRollingScores, escalatorSettings]);

  return { events, activePosition, isPatternDetectionComplete, processedDataHash };
}
