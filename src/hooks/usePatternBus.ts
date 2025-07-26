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
  detectRocketman,
  getIntrinsicScore,
  computeRollingBlackjackScores,
  computeTargetBlackjackScore,
  detectStepContinuation, // Phase 4: Continuation Linking
  detectPivots, // Added import for detectPivots
  detectGoldmineChannel // Added import for detectGoldmineChannel
} from '../patternEngine';
import type { GoldmineSignal } from '../patternEngine';
import { StopLossEvent } from '../riskEngine/trailingStop';
import { usePatternContext } from '../contexts/PatternContext';
import { logDebug, logDebugHAAlignmentMismatch } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // HA transformation for pattern detection
import { evaluateStopLoss, getActiveStopLosses } from '../engine/StopLossManager';
import { patternEngineTracker, dataAnalysisLock, LifecycleInstrumentation } from '../utils/signalFidelityPatch';

export interface Position {
  side: 'LONG' | 'SHORT';
  openIndex: number;
  step: any; // StepBox type
}

// NOTE: Valid PatternEvent types: ESCALATOR, ESCALATOR_STEP, BREAKOUT_BOX, GOLDMINE, etc.
export interface PatternEvent {
  type: 'ESCALATOR' | 'ESCALATOR_STEP' | 'GOLDMINE' | 'STOP_EVENT' | 'BREAKOUT_BOX' | 'BLACKJACK_ROLLING' | 'BLACKJACK_TARGET' | 'ROCKETMAN' | 'PIVOT' | 'GOLDMINE_CHANNEL' | 'GOLDEN_CANDLE' | 'GOLDMINE_FORENSICS' | 'GOLDEN_NEAR_MISS'; // Added 'GOLDEN_NEAR_MISS' type
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
    setGoldenNearMisses, // Added setGoldenNearMisses
    escalatorSettings,
    setStepIntrinsicCount,
    setStepBreakoutCount,
    setStepContinuanceCount
  } = usePatternContext();
  
  useEffect(() => {
    if (!candles || candles.length === 0) return;

    // Signal Fidelity Mode: Start data analysis
    dataAnalysisLock.startAnalysis();
    LifecycleInstrumentation.logMilestone("Pattern detection started", {
      candleCount: candles.length,
      timestamp: new Date().toISOString()
    });
    
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
    // Signal Fidelity Mode: Mark ESCALATOR engine as processing
    patternEngineTracker.markEngineProcessing('ESCALATOR');
    
    // Detect escalators using Heikin-Ashi candles
    const escalators = detectEscalators(haCandles);
    logDebug('DEBUG_PATTERN_DETECT', '[usePatternBus] Escalator detection complete:', {
      escalatorCount: escalators?.length || 0,
      escalators: escalators || []
    });

    // Signal Fidelity Mode: Mark ESCALATOR engine as ready
    patternEngineTracker.markEngineReady('ESCALATOR');
    
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

    // Signal Fidelity Mode: Mark BLACKJACK engine as processing
    patternEngineTracker.markEngineProcessing('BLACKJACK');
    
    // Detect Blackjack scores
    const blackjackRollingScores = computeRollingBlackjackScores(haCandles);
    // Note: blackjackTargetScores will be computed per escalator step in Phase 1
    const blackjackTargetScores: number[] = [];

    // Signal Fidelity Mode: Mark BLACKJACK engine as ready
    patternEngineTracker.markEngineReady('BLACKJACK');

    // Emit latest rolling score event for UI consumers
    if (blackjackRollingScores.length > 0) {
      const latestRolling = blackjackRollingScores[blackjackRollingScores.length - 1];
      newEvents.push({
        type: 'BLACKJACK_ROLLING',
        data: latestRolling,
        timestamp: latestRolling.timestamp
      });
    }
    setBjIntrinsic(bjIntrinsic);
    setBjCumulative(bjCumulative);
    setBjRollingScores(blackjackRollingScores);
    
    // Initialize missing variables for validation array
    const newGoldenCandleQual = new Array<boolean>(haCandles.length).fill(false);
    const newGoldenScore = new Array<number>(haCandles.length).fill(0);
    const newGoldenDirection = new Array<'LONG' | 'SHORT' | null>(haCandles.length).fill(null);
    
    const escalatorDirArray: ('RISING' | 'FALLING' | null)[] = new Array(haCandles.length).fill(null);
    const escalatorLength = new Array<number>(haCandles.length).fill(0);
    const goldmineQual = new Array<boolean>(haCandles.length).fill(false);
    const trailStop = new Array<number>(haCandles.length).fill(0);
    const distToStopPct = new Array<number>(haCandles.length).fill(0);
    const stepIndex = new Array(haCandles.length).fill(null);
    
    // Set context with initialized arrays
    setStepIndex(stepIndex);
    setEscalatorLength(escalatorLength);
    setGoldmineQual(goldmineQual);
    setTrailStop(trailStop);
    setDistToStopPct(distToStopPct);
    setGoldenCandleQual(newGoldenCandleQual);
    setGoldenScore(newGoldenScore);
    setGoldenDirection(newGoldenDirection);
    
    // Phase 1: Core Metrics - Populate step metrics arrays
    // Populate step metrics from escalator steps
    // Update context with step metrics
    
    const attributedSteps = escalatorEvents.map(s => ({
      ...s,
      data: {
        ...s.data,
        symbol: (s.data as any).symbol || (s.data as any).ticker?.toUpperCase() || 'UNKNOWN',
        ticker: (s.data as any).ticker || 'UNKNOWN',
      }
    }));
    setEscalatorSteps(attributedSteps);
    setBreakoutBoxes(breakoutBoxEvents);

    // Signal Fidelity Mode: Mark BREAKOUT_BOX engine as processing (already done above)
    // Breakout boxes were already detected earlier - reuse the existing variable
    logDebug('DEBUG_PATTERN_DETECT', '[usePatternBus] BreakoutBox detection already complete:', {
      breakoutBoxCount: breakoutBoxes?.length || 0,
      boxes: breakoutBoxes || []
    });

    // Signal Fidelity Mode: Mark BREAKOUT_BOX engine as ready
    patternEngineTracker.markEngineReady('BREAKOUT_BOX');

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

    // Comprehensive HA alignment validation
    const arraysToValidate = [
      newRocketmanConfidence,
      newRocketmanAcceleration,
      newRocketmanDirection,
      newPivotDirection,
      newPivotStrength,
      newPivotTouchCount,
      newGmcDepthPercent,
      newGmcBreakoutStrength,
      newGmcBaseDuration,
      newGoldenCandleQual,
      newGoldenScore,
      newGoldenDirection,
      escalatorDirArray,
      escalatorLength,
      goldmineQual,
      trailStop,
      distToStopPct,
      stepIndex
    ];

    arraysToValidate.forEach((array, index) => {
      if (array.length !== haCandles.length) {
        logDebugHAAlignmentMismatch(index, `usePatternBus.contextArray[${index}]`, `haCandles.length=${haCandles.length}`, `array.length=${array.length}`);
      }
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

    // Integrate trailing stop loss evaluation
    // 🔍 AUDIT: Trailing evaluation - EVAL STOP tracking
    const activeStopLossCount = getActiveStopLosses().length;
    const currentCandleIndex = candles.length - 1;
    console.log("[EVAL STOP] Candle Index:", currentCandleIndex, "Open Positions:", activeStopLossCount, "Price:", candles[currentCandleIndex]?.close?.toFixed(4) || "N/A");
    
    evaluateStopLoss(candles, currentCandleIndex);

    setEvents(prev => [...prev, ...newEvents]);
    
    const dataHash = candles[0]?.datetime + '_' + candles[candles.length - 1]?.datetime + '_' + candles.length;
    setProcessedDataHash(dataHash);
    
    setIsPatternDetectionComplete(true);
  }, [candles]);

  return { events, activePosition, isPatternDetectionComplete, processedDataHash };
}
