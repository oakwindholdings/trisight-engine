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
  detectRocketman,
  getIntrinsicScore,
  computeRollingBlackjackScores,
  computeTargetBlackjackScore,
  detectStepContinuation, // Phase 4: Continuation Linking
  detectPivots, // Added import for detectPivots
  detectGoldmineChannel, // Added import for detectGoldmineChannel
  detectGoldenCandle, // Added import for detectGoldenCandle
  detectGoldenCandleCandidates // Added import for detectGoldenCandleCandidates forensics
} from '../patternEngine';
import type { GoldmineSignal } from '../patternEngine';
import { computeEscalatorStop, StopLossEvent } from '../riskEngine/trailingStop';
import { usePatternContext } from '../contexts/PatternContext';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // HA transformation for pattern detection

export interface Position {
  side: 'LONG' | 'SHORT';
  openIndex: number;
  step: any; // StepBox type
}

// NOTE: Valid PatternEvent types: ESCALATOR, ESCALATOR_STEP, BREAKOUT_BOX, GOLDMINE, etc.
export interface PatternEvent {
  type: 'ESCALATOR' | 'ESCALATOR_STEP' | 'GOLDMINE' | 'STOP_EVENT' | 'BREAKOUT_BOX' | 'BLACKJACK_ROLLING' | 'BLACKJACK_TARGET' | 'ROCKETMAN' | 'PIVOT' | 'GOLDMINE_CHANNEL' | 'GOLDEN_CANDLE' | 'GOLDMINE_FORENSICS'; // Added 'GOLDMINE_FORENSICS' type
  data: EscalatorRun | GoldmineSignal | StopLossEvent | any; // 'any' for StepBox data
  timestamp: number;
  index?: number;
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
    setRocketmanConfidence,
    setRocketmanAcceleration,
    setRocketmanDirection,
    setPivotDirection, // Added setPivotDirection
    setPivotStrength, // Added setPivotStrength
    setPivotTouchCount, // Added setPivotTouchCount
    setGmcDepthPercent, // Added setGmcDepthPercent
    setGmcBreakoutStrength, // Added setGmcBreakoutStrength
    setGmcBaseDuration, // Added setGmcBaseDuration
    setGoldenCandleQual, // Added setGoldenCandleQual
    setGoldenScore, // Added setGoldenScore
    setGoldenDirection, // Added setGoldenDirection
    setGoldmineForensics, // Added setGoldmineForensics
    setGoldmineForensicsNotes, // Added setGoldmineForensicsNotes
    escalatorSettings,
    setStepIntrinsicCount,
    setStepBreakoutCount,
    setStepContinuanceCount
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
    setStepIntrinsicCount([]);
    setStepBreakoutCount([]);
    setStepContinuanceCount([]);
  }, [candles.length, candles[0]?.datetime, candles[candles.length - 1]?.datetime,
      setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, 
      setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct, setEscalatorSteps, setBreakoutBoxes, setBjTargetScores,
      setStepIntrinsicCount, setStepBreakoutCount, setStepContinuanceCount]);

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

    // ──── HEIKIN-ASHI TRANSFORMATION ────────────────────────────────────────
    // Convert OHLC candles to Heikin-Ashi for all pattern detection
    // UI rendering continues to use original OHLC candles for user display
    const haCandles = convertToHeikinAshi(candles);
    
    logDebug('DEBUG_PATTERN_DETECT', '[HA_TRANSFORM] Pattern detection using Heikin-Ashi candles:', {
      originalCandles: candles.length,
      heikinAshiCandles: haCandles.length,
      firstHA: haCandles[0] ? {
        open: haCandles[0].open.toFixed(2),
        close: haCandles[0].close.toFixed(2)
      } : null
    });

    // Detect BreakoutBoxes independently using HA candles
    let breakoutBoxes: any[] = [];
    const targetEvents: PatternEvent[] = [];
    const bjTargets: { stepRef: string; score: number; qualifiesForGoldmine?: boolean }[] = [];
    const breakoutBoxEvents: PatternEvent[] = [];
    
    try {
      breakoutBoxes = detectBreakoutBoxes(haCandles);
    } catch (error) {
      console.error('[usePatternBus] Error in detectBreakoutBoxes:', error);
      console.error('[usePatternBus] Stack trace:', (error as Error).stack);
    }
    
    // Process breakout boxes
    breakoutBoxes.forEach(box => {
      const boxCandles = haCandles.slice(box.startIndex, box.endIndex + 1);
      // Compute Target Blackjack Score for this breakout box
      const tbsScore = computeTargetBlackjackScore(haCandles, box.startIndex, box.endIndex);
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
    const escalators = shouldDetect ? detectEscalators(haCandles) : [];
    
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
        timestamp: haCandles[escalator.startIndex]?.timestamp || Date.now()
      });
      
      // Emit ESCALATOR_STEP events for each step within the escalator
      escalator.steps.forEach((step, stepIndex) => {
        const startTimestamp = haCandles[step.startIndex]?.timestamp || 0;
        const endTimestamp = haCandles[step.endIndex]?.timestamp || 0;
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
            timestamp: haCandles[step.startIndex]?.timestamp || Date.now()
          });
        }
      });
    });
    
    // Add all escalator events to the main events array
    newEvents.push(...escalatorEvents);
    
    // Detect Rocketman patterns
    const rocketmanPatterns = detectRocketman(haCandles);
    rocketmanPatterns.forEach((pattern) => {
      newEvents.push({
        type: 'ROCKETMAN',
        data: pattern,
        timestamp: pattern.peakTime.getTime(),
        index: pattern.peakIndex
      });
    });

    const newRocketmanConfidence = new Array<number>(haCandles.length).fill(0);
    const newRocketmanAcceleration = new Array<number>(haCandles.length).fill(0);
    const newRocketmanDirection = new Array(haCandles.length).fill('LONG');

    rocketmanPatterns.forEach((p) => {
      newRocketmanConfidence[p.peakIndex] = p.confidence;
      newRocketmanAcceleration[p.peakIndex] = p.accelerationRate;
      newRocketmanDirection[p.peakIndex] = p.direction === 'BULLISH' ? 'LONG' : 'SHORT';
    });

    setRocketmanConfidence(newRocketmanConfidence);
    setRocketmanAcceleration(newRocketmanAcceleration);
    setRocketmanDirection(newRocketmanDirection);

    // Detect Pivot patterns
    const pivotPatterns = detectPivots(haCandles);
    pivotPatterns.forEach((pattern) => {
      newEvents.push({
        type: 'PIVOT',
        data: pattern,
        timestamp: pattern.timestamp.getTime(),
        index: pattern.pivotIndex
      });
    });

    const newPivotDirection = new Array<'SUPPORT' | 'RESISTANCE' | null>(haCandles.length).fill(null);
    const newPivotStrength = new Array<number>(haCandles.length).fill(0);
    const newPivotTouchCount = new Array<number>(haCandles.length).fill(0);

    pivotPatterns.forEach((p) => {
      newPivotDirection[p.pivotIndex] = p.pivotType;
      newPivotStrength[p.pivotIndex] = p.strengthScore;
      newPivotTouchCount[p.pivotIndex] = p.touchCount;
    });

    setPivotDirection(newPivotDirection);
    setPivotStrength(newPivotStrength);
    setPivotTouchCount(newPivotTouchCount);

    // Detect Goldmine Channel patterns
    const goldmineChannelPatterns = detectGoldmineChannel(haCandles);
    goldmineChannelPatterns.forEach((pattern) => {
      newEvents.push({
        type: 'GOLDMINE_CHANNEL',
        data: pattern,
        timestamp: pattern.touchPoints[0]?.time.getTime() || new Date().getTime(),
        index: pattern.startIndex
      });
    });

    const newGmcDepthPercent = new Array<number>(haCandles.length).fill(0);
    const newGmcBreakoutStrength = new Array<number>(haCandles.length).fill(0);
    const newGmcBaseDuration = new Array<number>(haCandles.length).fill(0);

    goldmineChannelPatterns.forEach((p) => {
      const depthPercent = (p.channelWidth * 100);
      const baseDuration = p.endIndex - p.startIndex;
      const breakoutStrength = p.confidence;
      
      newGmcDepthPercent[p.startIndex] = depthPercent;
      newGmcBreakoutStrength[p.startIndex] = breakoutStrength;
      newGmcBaseDuration[p.startIndex] = baseDuration;
    });

    setGmcDepthPercent(newGmcDepthPercent);
    setGmcBreakoutStrength(newGmcBreakoutStrength);
    setGmcBaseDuration(newGmcBaseDuration);

    // Calculate blackjack scores first (needed for Golden Candle detection)
    const bjIntrinsic = haCandles.map((candle, idx) => {
      if (idx === 0) return 0; // First candle has no previous reference
      const prevCandle = haCandles[idx - 1];
      return getIntrinsicScore(candle, prevCandle);
    });
    
    const bjCumulative = bjIntrinsic.reduce<number[]>(
      (arr, val) => {
        arr.push((arr[arr.length - 1] ?? 0) + val);
        return arr;
      }, 
      []
    );

    // Detect Golden Candle patterns
    const stepIntrinsicCount = new Array<number>(haCandles.length).fill(0);
    const stepBreakoutCount = new Array<number>(haCandles.length).fill(0);
    const stepContinuanceCount = new Array<number>(haCandles.length).fill(0);
    
    // Populate step metrics from escalator steps
    escalators.forEach(escalator => {
      escalator.steps.forEach(step => {
        // Extract step metrics from StepBox (if they exist)
        const intrinsicCount = step.stepIntrinsicCount || 0;
        const breakoutCount = step.stepBreakoutCount || 0;
        const continuanceCount = step.stepContinuanceCount || intrinsicCount + breakoutCount;
        
        // Apply metrics to all candles within the step range
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < haCandles.length) {
            stepIntrinsicCount[i] = intrinsicCount;
            stepBreakoutCount[i] = breakoutCount;
            stepContinuanceCount[i] = continuanceCount;
          }
        }
        
        logDebug('DEBUG_PATTERN_DETECT', '[usePatternBus] Step metrics populated:', {
          stepRef: `${step.startIndex}-${step.endIndex}`,
          stepIntrinsicCount: intrinsicCount,
          stepBreakoutCount: breakoutCount,
          stepContinuanceCount: continuanceCount,
          range: `${step.startIndex}-${step.endIndex}`
        });
      });
    });
    
    // Update context with step metrics
    setStepIntrinsicCount(stepIntrinsicCount);
    setStepBreakoutCount(stepBreakoutCount);
    setStepContinuanceCount(stepContinuanceCount);

    const goldenCandlePatterns = detectGoldenCandle(
      haCandles,
      stepIntrinsicCount,
      stepBreakoutCount,
      stepContinuanceCount,
      bjIntrinsic,
      bjCumulative
    );
    goldenCandlePatterns.forEach((pattern) => {
      newEvents.push({
        type: 'GOLDEN_CANDLE',
        data: pattern,
        timestamp: pattern.timestamp.getTime(),
        index: pattern.index
      });
    });

    const newGoldenCandleQual = new Array<boolean>(haCandles.length).fill(false);
    const newGoldenScore = new Array<number>(haCandles.length).fill(0);
    const newGoldenDirection = new Array<'LONG' | 'SHORT' | null>(haCandles.length).fill(null);

    goldenCandlePatterns.forEach((p) => {
      newGoldenCandleQual[p.index] = true;
      newGoldenScore[p.index] = p.goldenScore;
      newGoldenDirection[p.index] = p.direction;
    });

    setGoldenCandleQual(newGoldenCandleQual);
    setGoldenScore(newGoldenScore);
    setGoldenDirection(newGoldenDirection);

    const escalatorDirArray: ('RISING' | 'FALLING' | null)[] = new Array(haCandles.length).fill(null);
    
    escalators.forEach(escalator => {
      escalator.steps.forEach((step, stepIndex) => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < haCandles.length) {
            const dir = escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING';
            escalatorDirArray[i] = dir;
          }
        }
      });
    });
    
    setEscalatorDir(escalatorDirArray);
    
    const escalatorLength = new Array<number>(haCandles.length).fill(0);
    
    escalators.forEach(escalator => {
      for (let i = escalator.startIndex; i <= escalator.endIndex; i++) {
        if (i < haCandles.length) {
          escalatorLength[i] = i - escalator.startIndex + 1;
        }
      }
    });
    
    const goldmineQual = new Array<boolean>(haCandles.length).fill(false);
    
    const trailStop = new Array<number>(haCandles.length).fill(0);
    const distToStopPct = new Array<number>(haCandles.length).fill(0);
    
    events.forEach(event => {
      if (event.type === 'GOLDMINE' && event.data) {
        const goldmine = event.data as any;
        if (goldmine.entryIndex < haCandles.length) {
          goldmineQual[goldmine.entryIndex] = true;
        }
      }
    });
    
    escalators.forEach(escalator => {
      escalator.steps.forEach(step => {
        for (let i = step.endIndex + 1; i < haCandles.length; i++) {
          if (i >= 2) {
            const stopPrice = haCandles[i - 2].low;
            trailStop[i] = stopPrice;
            
            const closePrice = haCandles[i].close;
            distToStopPct[i] = ((closePrice - stopPrice) / closePrice) * 100;
          }
        }
      });
    });
    
    // Rolling blackjack scores (window 5 default)
    const bjRollingScores = computeRollingBlackjackScores(haCandles);

    
    const stepIndex = new Array(haCandles.length).fill(null);
    escalators.forEach(escalator => {
      escalator.steps.forEach(step => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < haCandles.length) {
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
    
    // Phase 1: Core Metrics - Populate step metrics arrays
    // Populate step metrics from escalator steps
    // Update context with step metrics
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

    // Phase 4: Continuation Linking - Detect post-breakout escalator continuations
    const continuationEvents: PatternEvent[] = [];
    
    breakoutBoxes.forEach(box => {
      // Find the corresponding step from escalator steps
      if (box.stepRef) {
        // Extract step indices from stepRef (format: "timestamp1-timestamp2")
        const stepRefParts = box.stepRef.split('-');
        if (stepRefParts.length === 2) {
          const startTimestamp = parseInt(stepRefParts[0]);
          const endTimestamp = parseInt(stepRefParts[1]);
          
          // Find the step that matches this timestamp range
          let matchingStep: any = null;
          for (const escalator of (escalators || [])) {
            for (const step of escalator.steps) {
              const stepStartTs = haCandles[step.startIndex]?.timestamp || 0;
              const stepEndTs = haCandles[step.endIndex]?.timestamp || 0;
              
              if (stepStartTs === startTimestamp && stepEndTs === endTimestamp) {
                matchingStep = step;
                break;
              }
            }
            if (matchingStep) break;
          }
          
          // If we found the matching step, check for continuation
          if (matchingStep && box.breakoutIndex !== undefined) {
            logDebug('DEBUG_PATTERN_DETECT', '[Phase 4] Checking continuation for step:', {
              stepRef: box.stepRef,
              breakoutIndex: box.breakoutIndex,
              stepDirection: matchingStep.direction
            });
            
            const continuation = detectStepContinuation(
              matchingStep,
              haCandles,
              box.breakoutIndex,
              2 // Minimum continuation length
            );
            
            if (continuation) {
              logDebug('DEBUG_PATTERN_DETECT', '[Phase 4] Continuation detected:', {
                stepRef: box.stepRef,
                continuationRange: `${continuation.startIndex}-${continuation.endIndex}`,
                direction: continuation.direction,
                originatingStep: continuation.originatingStep
              });
              
              // Emit continuation escalator event
              const continuationEvent: PatternEvent = {
                type: 'ESCALATOR',
                data: {
                  ...continuation,
                  // Mark as continuation
                  isContinuation: true,
                  continuationType: 'POST_STEP_BREAKOUT'
                },
                timestamp: haCandles[continuation.startIndex]?.timestamp || Date.now()
              };
              
              continuationEvents.push(continuationEvent);
              
              // Also emit step events for the continuation steps
              continuation.steps.forEach((contStep: any, stepIndex: number) => {
                const contStepEvent: PatternEvent = {
                  type: 'ESCALATOR_STEP',
                  data: {
                    ...contStep,
                    // Link back to originating step
                    originatingStepRef: box.stepRef,
                    isContinuation: true
                  },
                  timestamp: haCandles[contStep.startIndex]?.timestamp || Date.now()
                };
                
                continuationEvents.push(contStepEvent);
              });
            }
          }
        }
      }
    });
    
    // Add continuation events to main events array
    if (continuationEvents.length > 0) {
      logDebug('DEBUG_PATTERN_DETECT', '[Phase 4] Continuation events generated:', {
        count: continuationEvents.length,
        eventTypes: continuationEvents.map(e => e.type)
      });
      
      newEvents.push(...continuationEvents);
    }

    if (activePosition) {
      for (let i = activePosition.openIndex; i < haCandles.length; i++) {
        const partialCandles = haCandles.slice(0, i + 1);
        const stopEvent = computeEscalatorStop(activePosition, partialCandles);
        
        if (stopEvent && stopEvent.price) {
          trailStop[i] = stopEvent.price;
          const closePrice = haCandles[i].close;
          distToStopPct[i] = ((closePrice - stopEvent.price) / closePrice) * 100;
        }
      }
      
      const stopEvent = computeEscalatorStop(activePosition, haCandles);
      
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

    // Golden Candle Forensics Detection (Debug Mode)
    try {
      // Get required arrays for Golden Candle detection
      const stepIntrinsicCounts = bjRollingScores.map((_, idx) => stepIntrinsicCount[idx] || 0);
      const stepBreakoutCounts = bjRollingScores.map((_, idx) => stepBreakoutCount[idx] || 0);
      const stepContinuanceCounts = bjRollingScores.map((_, idx) => stepContinuanceCount[idx] || 0);
      const bjIntrinsicScores = bjIntrinsic;
      const bjCumulativeScores = bjCumulative;

      // Detect Golden Candle forensic candidates (near-misses)
      const goldenCandidates = detectGoldenCandleCandidates(
        haCandles,
        stepIntrinsicCounts,
        stepBreakoutCounts,
        stepContinuanceCounts,
        bjIntrinsicScores,
        bjCumulativeScores
      );

      // Initialize forensics arrays
      const newForensics = new Array<boolean>(haCandles.length).fill(false);
      const newForensicsNotes = new Array<string>(haCandles.length).fill('-');

      // Emit forensic events for each candidate and populate context arrays
      goldenCandidates.forEach(candidate => {
        const forensicEvent: PatternEvent = {
          type: 'GOLDMINE_FORENSICS',
          data: candidate,
          timestamp: candidate.timestamp.getTime(),
          index: candidate.index
        };
        
        newEvents.push(forensicEvent);
        
        // Populate forensics arrays for UI rendering
        if (candidate.index < haCandles.length) {
          newForensics[candidate.index] = true;
          newForensicsNotes[candidate.index] = candidate.failureReason;
        }
        
        logDebug('DEBUG_PATTERN_DETECT', '[GOLDMINE_FORENSICS] Emitting forensic event:', {
          index: candidate.index,
          failureReason: candidate.failureReason,
          nearMissType: candidate.nearMissType,
          candlePrice: candidate.candlePrice.toFixed(2)
        });
      });

      // Update forensics context arrays
      setGoldmineForensics(newForensics);
      setGoldmineForensicsNotes(newForensicsNotes);

      logDebug('DEBUG_PATTERN_DETECT', '[GOLDMINE_FORENSICS] Forensic detection complete. Generated', goldenCandidates.length, 'forensic events');

    } catch (error) {
      console.error('[usePatternBus] Error in Golden Candle forensics detection:', error);
      console.error('[usePatternBus] Forensics stack trace:', (error as Error).stack);
    }

    setEvents(prev => [...prev, ...newEvents]);
    
    const dataHash = haCandles[0]?.datetime + '_' + haCandles[haCandles.length - 1]?.datetime + '_' + haCandles.length;
    setProcessedDataHash(dataHash);
    
    setIsPatternDetectionComplete(true);
  }, [candles, events, activePosition, setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct, setEscalatorSteps, setBreakoutBoxes, setBjRollingScores, escalatorSettings,
    setStepIntrinsicCount, setStepBreakoutCount, setStepContinuanceCount]);

  return { events, activePosition, isPatternDetectionComplete, processedDataHash };
}
