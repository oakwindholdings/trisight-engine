// src/hooks/usePatterns.ts
// Pattern detection integration with adaptive services
// Manages both pattern entities and candle-aligned metric arrays

import { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType, ThrustDirection } from '../models/PatternTypes';
import { PatternEvent } from './usePatternBus';
import { AdaptivePatternDetectionService, PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';
import { BreakoutBoxSettings } from '../components/Patterns/BreakoutBoxSettingsPanel';
import { getIntrinsicScore } from '../patternEngine/blackjack';
import { detectEscalators } from '../patternEngine/escalator';
import { Candle } from '../types';
import { logDebug } from '../utils/debug';
import { PatternFeedback } from '../models/FeedbackTypes';
import { patternLearningEngine } from '../services/PatternLearningEngine';
import { useMarketDataContext } from '../contexts/MarketDataContext';

/**
 * Hook for detecting and managing chart patterns
 */
export function usePatterns(data: CandlestickData[]) {
  // Get current symbol from market data context
  const { symbol: currentSymbol } = useMarketDataContext();
  
  // All detected patterns
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  // Patterns after type filtering - what's shown to the user in the UI
  const [visiblePatterns, setVisiblePatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [selectedPatternForFeedback, setSelectedPatternForFeedbackState] = useState<Pattern | null>(null);
  
  // Wrap setter to debug
  const setSelectedPatternForFeedback = useCallback((pattern: Pattern | null) => {
    console.log('[usePatterns] setSelectedPatternForFeedback called with:', {
      pattern,
      type: pattern?.type,
      id: pattern?.id
    });
    setSelectedPatternForFeedbackState(pattern);
  }, []);
  
  // Debug state updates
  useEffect(() => {
    console.log('[usePatterns] selectedPatternForFeedback state updated:', {
      pattern: selectedPatternForFeedback,
      type: selectedPatternForFeedback?.type,
      id: selectedPatternForFeedback?.id
    });
  }, [selectedPatternForFeedback]);
  const [patternCounts, setPatternCounts] = useState<Record<PatternType, number>>({} as Record<PatternType, number>);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<PatternType | null>(null);
  // Create service instance first so we can access its stored preferences
  const [adaptiveService] = useState(() => new AdaptivePatternDetectionService());
  
  // Pattern bus metrics states
  const [bjCounts, setBjCounts] = useState<number[]>([]);
  // Rolling blackjack scores per candle { timestamp, score }
  const [bjRollingScores, setBjRollingScores] = useState<{ timestamp: number; score: number }[]>([]);
  // Target Blackjack scores per breakout box { stepRef, score }
  const [bjTargetScores, setBjTargetScores] = useState<{ stepRef: string; score: number; qualifiesForGoldmine?: boolean }[]>([]);
  const [stepIndex, setStepIndex] = useState<number[]>([]);
  const [bjIntrinsic, setBjIntrinsic] = useState<number[]>([]);
  const [bjCumulative, setBjCumulative] = useState<number[]>([]);
  const [escalatorDir, setEscalatorDir] = useState<('RISING' | 'FALLING' | null)[]>([]);
  const [escalatorLength, setEscalatorLength] = useState<number[]>([]);
  const [goldmineQual, setGoldmineQual] = useState<boolean[]>([]);
  const [trailStop, setTrailStop] = useState<number[]>([]);
  const [distToStopPct, setDistToStopPct] = useState<number[]>([]);
  const [escalatorSteps, setEscalatorSteps] = useState<PatternEvent[]>([]);
  const [events, setEvents] = useState<PatternEvent[]>([]);  // All pattern events
  const [breakoutBoxes, setBreakoutBoxes] = useState<PatternEvent[]>([]);
  
  // Phase 1: Core Metrics - Step candle count arrays (indexed by candle position)
  const [stepIntrinsicCount, setStepIntrinsicCount] = useState<number[]>([]);
  const [stepBreakoutCount, setStepBreakoutCount] = useState<number[]>([]);
  const [stepContinuanceCount, setStepContinuanceCount] = useState<number[]>([]);
  
  // Rocketman pattern metrics
  const [rocketmanConfidence, setRocketmanConfidence] = useState<number[]>([]);
  const [rocketmanAcceleration, setRocketmanAcceleration] = useState<number[]>([]);
  const [rocketmanDirection, setRocketmanDirection] = useState<('LONG' | 'SHORT')[]>([]);
  
  // Pivot pattern metrics
  const [pivotDirection, setPivotDirection] = useState<('SUPPORT' | 'RESISTANCE' | null)[]>([]);
  const [pivotStrength, setPivotStrength] = useState<number[]>([]);
  const [pivotTouchCount, setPivotTouchCount] = useState<number[]>([]);
  
  // Goldmine Channel pattern metrics
  const [gmcDepthPercent, setGmcDepthPercent] = useState<number[]>([]);
  const [gmcBreakoutStrength, setGmcBreakoutStrength] = useState<number[]>([]);
  const [gmcBaseDuration, setGmcBaseDuration] = useState<number[]>([]);
  
  // Golden Candle pattern metrics
  const [goldenCandleQual, setGoldenCandleQual] = useState<boolean[]>([]);
  const [goldenScore, setGoldenScore] = useState<number[]>([]);
  const [goldenDirection, setGoldenDirection] = useState<('LONG' | 'SHORT' | null)[]>([]);
  const [goldmineForensics, setGoldmineForensics] = useState<boolean[]>([]);
  const [goldmineForensicsNotes, setGoldmineForensicsNotes] = useState<string[]>([]);
  const [goldenNearMisses, setGoldenNearMisses] = useState<boolean[]>([]);
  
  // TriSight Detection Input Refactor Patch v1.3.3: Golden Candle ENTRY/EXIT lifecycle arrays
  const [goldenCandleEntries, setGoldenCandleEntries] = useState<PatternEvent[]>([]);
  const [goldenCandleExits, setGoldenCandleExits] = useState<PatternEvent[]>([]);
  
  // Display settings for patterns
  const [escalatorSettings, setEscalatorSettings] = useState<{ 
    enabled: boolean; 
    showLabels: boolean;
    showBreakoutBoxes: boolean;
    minSteps: number;
    minStepSize: number;
    maxConsolidationVolatility: number;
    basePriceChangeThreshold: number;
    baseVolumeChangeThreshold: number;
    useContextTimeframe: boolean;
    contextTimeframeMultiplier: number;
    minScore: number;
    preferredDirection: ThrustDirection | 'BOTH';
  }>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('escalatorSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        logDebug('DEBUG_CONTEXT_UPDATE', '[usePatterns] Loaded escalator settings from localStorage: ' + JSON.stringify(parsed));
        return parsed;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error loading escalator settings: ' + errorMessage);
    }
    
    // Default values
    return {
      enabled: true,
      showLabels: false,
      showBreakoutBoxes: true,
      minSteps: 3,
      minStepSize: 0.5,
      maxConsolidationVolatility: 1.0,
      basePriceChangeThreshold: 0.01,
      baseVolumeChangeThreshold: 0.05,
      useContextTimeframe: true,
      contextTimeframeMultiplier: 3,
      minScore: 2.0,
      preferredDirection: 'BOTH'
    };
  });
  
  // BreakoutBox independent settings
  const [breakoutBoxSettings, setBreakoutBoxSettings] = useState<BreakoutBoxSettings>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('patternSettings.breakoutbox');
      if (saved) {
        const parsed = JSON.parse(saved);
        logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Loaded breakoutBox settings from localStorage: ' + JSON.stringify(parsed));
        return parsed;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error loading breakoutBox settings: ' + errorMessage);
    }
    
    // Default values
    return {
      enabled: true,
      showBreakoutBoxes: true,
      showLabels: false,
      minStallLength: 3,
      breakoutMultiplier: 0.5,
      stallThreshold: 0.1
    };
  });
  
  // Golden Candle settings with near-miss toggle
  const [goldenCandleSettings, setGoldenCandleSettings] = useState(() => {
    // Default values for v1.3.3 compatibility
    const defaults = {
      enabled: true,
      showLabels: true,
      showForensics: false, // Default to false for forensic overlays
      showNearMiss: false, // Default to false for near-miss highlighting
      showEntryExitLabels: true, // TriSight Detection Input Refactor Patch v1.3.3: Default to showing ENTRY/EXIT labels
      minContinuanceCount: 3,
      minCumulativeScore: 5,
      confidenceThreshold: 0.7,
      intrinsicScoreRequired: 2,
      preferredDirection: 'BOTH' as 'LONG' | 'SHORT' | 'BOTH',
      trailingStopPercent: 2.0, // TriSight Detection Input Refactor Patch v1.3.1: Default 2.0%
      stopLossPercent: 2.0 // TriSight Detection Input Refactor Patch v1.3.2: Default 2.0%
    };
    
    // Try to load from localStorage with migration
    try {
      const saved = localStorage.getItem('patternSettings.goldenCandle');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate existing settings to include new trailingStopPercent, stopLossPercent, and showEntryExitLabels fields
        const migrated = {
          ...defaults,
          ...parsed,
          // Ensure trailingStopPercent is always present (v1.3.1)
          trailingStopPercent: parsed.trailingStopPercent ?? defaults.trailingStopPercent,
          // Ensure stopLossPercent is always present (v1.3.2)
          stopLossPercent: parsed.stopLossPercent ?? defaults.stopLossPercent,
          // Ensure showEntryExitLabels is always present (v1.3.3)
          showEntryExitLabels: parsed.showEntryExitLabels ?? defaults.showEntryExitLabels
        };
        logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Loaded and migrated Golden Candle settings from localStorage: ' + JSON.stringify(migrated));
        return migrated;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error loading Golden Candle settings: ' + errorMessage);
    }
    
    // Return defaults if no localStorage or error
    return defaults;
  });

  // Persist Golden Candle settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('patternSettings.goldenCandle', JSON.stringify(goldenCandleSettings));
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Saved Golden Candle settings to localStorage: ' + JSON.stringify(goldenCandleSettings));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error saving Golden Candle settings: ' + errorMessage);
    }
  }, [goldenCandleSettings]);
  
  // BlackJack settings with localStorage persistence
  const [blackjackSettings, setBlackjackSettings] = useState<{
    enabled: boolean;
    showLabels: boolean;
    lookbackPeriods: number;
    minScore: number;
    showContextTimeframe: boolean;
    contextTimeframeMultiplier: number;
    basePriceChangeThreshold: number;
    baseVolumeChangeThreshold: number;
  }>(() => {
    // Default values
    const defaults = {
      enabled: true,
      showLabels: true,
      lookbackPeriods: 7,
      minScore: 3,
      showContextTimeframe: false,
      contextTimeframeMultiplier: 4,
      basePriceChangeThreshold: 0.1,
      baseVolumeChangeThreshold: 0.5
    };
    
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('blackjackSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Loaded BlackJack settings from localStorage: ' + JSON.stringify(parsed));
        return { ...defaults, ...parsed };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error loading BlackJack settings: ' + errorMessage);
    }
    
    // Return defaults if no localStorage or error
    return defaults;
  });

  // Persist BlackJack settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('blackjackSettings', JSON.stringify(blackjackSettings));
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Saved BlackJack settings to localStorage: ' + JSON.stringify(blackjackSettings));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Error saving BlackJack settings: ' + errorMessage);
    }
  }, [blackjackSettings]);
  
  // Initialize preferences from service (which loads from localStorage)
  const [preferences, setPreferences] = useState<Partial<PatternDetectionPreferences>>(() => {
    // Get current preferences from service (already loaded from localStorage in constructor)
    const servicePrefs = adaptiveService.getPreferences();
    return servicePrefs;
  });
  
  // Convert CandlestickData to Candle format for usePatternBus
  const candles: Candle[] = data.map(d => ({
    datetime: new Date(d.timestamp).toISOString(),  // Convert timestamp to ISO string
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume || 0,
    timestamp: d.timestamp
  }));
  
  // Method to populate pattern arrays based on detected patterns
  const populatePatternArrays = useCallback((candles: CandlestickData[], detectedPatterns: Pattern[]) => {
    // Use detectEscalators from patternEngine to get proper escalator data
    const escalatorRuns = detectEscalators(candles);
    
    // Compute Blackjack intrinsic scores
    const bjIntrinsic = candles.map((candle, i) => {
      if (i === 0) return 0;
      const prevCandle = candles[i - 1];
      return getIntrinsicScore(candle, prevCandle);
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
    escalatorRuns.forEach(escalator => {
      escalator.steps.forEach((step: any) => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < candles.length) {
            stepIndex[i] = i - step.startIndex + 1;
          }
        }
      });
    });
    
    // Create per-candle escalator direction array
    const escalatorDirArray: ('RISING' | 'FALLING' | null)[] = new Array(candles.length).fill(null);
    
    escalatorRuns.forEach(escalator => {
      // Fill in the direction for all candles in this escalator run
      escalator.steps.forEach((step: any) => {
        for (let i = step.startIndex; i <= step.endIndex; i++) {
          if (i < candles.length) {
            const dir = escalator.direction === 'BULLISH' ? 'RISING' : 'FALLING';
            escalatorDirArray[i] = dir;
          }
        }
      });
    });
    
    // Build escalator length array
    const escalatorLength = new Array<number>(candles.length).fill(0);
    
    escalatorRuns.forEach(escalator => {
      for (let i = escalator.startIndex; i <= escalator.endIndex; i++) {
        if (i < candles.length) {
          escalatorLength[i] = i - escalator.startIndex + 1;
        }
      }
    });
    
    // Build goldmine qualifier array
    const goldmineQual = new Array<boolean>(candles.length).fill(false);
    
    // Create per-candle trailStop array
    const trailStopArray = candles.map((candle, idx) => {
      if (idx < 5) return 0;
      const recentHigh = Math.max(...candles.slice(Math.max(0, idx - 5), idx + 1).map(c => c.high));
      return recentHigh * (1 - 0.02); // Example: 2% trailing stop
    });
    
    // Distance to stop as percentage
    const distToStopPctArray = candles.map((candle, idx) => {
      const stop = trailStopArray[idx];
      return stop > 0 ? ((candle.close - stop) / candle.close) * 100 : 0;
    });
    
    // CRITICAL FIX: Batch all state updates to prevent cascading re-renders
    // Use React's unstable_batchedUpdates or setTimeout to batch updates
    // This prevents 15+ individual re-renders and the infinite loop
    setTimeout(() => {
    setBjIntrinsic(bjIntrinsic);
    setBjCumulative(bjCumulative);
    setStepIndex(stepIndex);
    setEscalatorDir(escalatorDirArray);
    setEscalatorLength(escalatorLength);
    setGoldmineQual(goldmineQual);
      setTrailStop(trailStopArray);
      setDistToStopPct(distToStopPctArray);
    }, 0);
  }, []);
  
  // Detect patterns in the provided data
  const detectPatterns = useCallback(async (candleData: CandlestickData[]) => {
    if (candleData.length > 0) {
      const firstTime = new Date(candleData[0].datetime);
      const lastTime = new Date(candleData[candleData.length - 1].datetime);
    }
    
    if (candleData.length === 0) {
      setPatterns([]);
      setVisiblePatterns([]);
      setPatternCounts({} as Record<PatternType, number>);
      return;
    }
    
    // Prevent multiple concurrent detections
    if (isDetecting) {
      return;
    }
    
    try {
      setIsDetecting(true);
      setTimeout(() => {
        if (!data || data.length === 0) {
          setPatterns([]);
          setIsDetecting(false);
          return;
        }
        
        console.time('pattern-detection');
        
        // Filter data to only what is on screen (visible range)
        const candleData = data.map((d: any) => ({
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume || 0,
          timestamp: d.timestamp,
          datetime: new Date(d.timestamp).toISOString()
        }));
        
        // Use the new adaptive pattern detection service
        const detectedPatterns = adaptiveService.detectPatterns(candleData);
        
        console.log('[usePatterns] Raw detected patterns:', {
          total: detectedPatterns.length,
          types: Array.from(new Set(detectedPatterns.map(p => p.type))),
          escalatorCount: detectedPatterns.filter(p => p.type === 'ESCALATOR').length
        });
        
        // Add feedbackEnabled property to all patterns
        const patternsWithFeedback = detectedPatterns.map(pattern => ({
          ...pattern,
          feedbackEnabled: true // Enable feedback for all patterns
        }));
        
        // Calculate pattern counts by type
        const counts = Object.values(PatternType).reduce((acc, type) => {
          acc[type] = patternsWithFeedback.filter(p => p.type === type).length;
          return acc;
        }, {} as Record<PatternType, number>);
        
        // Safely end timer - check if timer exists
        try {
          console.timeEnd('pattern-detection');
        } catch (e) {
          // Timer might not exist, continue silently
        }
        
        // Filter patterns based on enabledPatternTypes preference
        const enabledTypes = preferences.enabledPatternTypes || [];
        console.log('[usePatterns] Filter preferences:', {
          enabledTypes,
          hasEscalator: enabledTypes.includes('ESCALATOR' as any)
        });
        console.log('[usePatterns] Enabled pattern types:', enabledTypes);
        console.log('[usePatterns] Is ESCALATOR in PatternType enum?', 'ESCALATOR' in PatternType);
        console.log('[usePatterns] PatternType.ESCALATOR value:', PatternType.ESCALATOR);
        
        const filteredPatterns = patternsWithFeedback.filter(p => enabledTypes.includes(p.type));
        
        const attributedPatterns = filteredPatterns.map(p => ({
          ...p,
          symbol: currentSymbol || (p as any).symbol || (p as any).ticker?.toUpperCase() || 'UNKNOWN',
          ticker: currentSymbol || (p as any).ticker || 'UNKNOWN',
        }));
        setPatterns(attributedPatterns);
        // Update visible patterns based on active filter
        if (activeFilter) {
          setVisiblePatterns(attributedPatterns.filter(p => p.type === activeFilter));
        } else {
          setVisiblePatterns(attributedPatterns);
        }
        setPatternCounts(counts);
        
        // After detecting patterns, populate the pattern arrays
        populatePatternArrays(candleData, patternsWithFeedback);
        
        setIsDetecting(false);
      }, 0);
    } catch (error) {
      setIsDetecting(false);
    }
  }, [activeFilter, adaptiveService, isDetecting, preferences.enabledPatternTypes, currentSymbol, data]);
  
  // Update a pattern (e.g., after receiving feedback)
  const updatePattern = useCallback((updatedPattern: Pattern) => {
    setPatterns(prevPatterns => 
      prevPatterns.map(p => 
        p.id === updatedPattern.id ? updatedPattern : p
      )
    );
    
    // Also update selected pattern if it's the one being updated
    if (selectedPattern && selectedPattern.id === updatedPattern.id) {
      setSelectedPattern(updatedPattern);
    }
  }, [selectedPattern]);
  
  // Update preferences for pattern detection
  const updatePreferences = useCallback((newPreferences: Partial<PatternDetectionPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      adaptiveService.updatePreferences(updated);
      return updated;
    });
    
    // Immediately re-detect patterns if data is available
    if (data.length > 0) {
      // Use setTimeout to avoid state update conflicts
      setTimeout(() => detectPatterns(data), 0);
    }
  }, [adaptiveService, data, detectPatterns]);
  
  // Filter patterns by type
  const filterPatternsByType = useCallback((type: PatternType | null) => {
    setActiveFilter(type);
    
    if (!type) {
      setVisiblePatterns(patterns);
      return patterns;
    }
    
    const filtered = patterns.filter(p => p.type === type);
    setVisiblePatterns(filtered);
    return filtered;
  }, [patterns]);
  
  // Initialize preferences when the hook mounts
  useEffect(() => {
    adaptiveService.updatePreferences(preferences);
  }, [adaptiveService, preferences]);
  
  // Clear patterns when data changes significantly (e.g., symbol change)
  useEffect(() => {
    logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Data changed, length: ' + data.length);
    
    // If we have no data, clear all patterns
    if (data.length === 0) {
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Clearing patterns due to empty data');
      setPatterns([]);
      setVisiblePatterns([]);
      setSelectedPattern(null);
      setPatternCounts({} as Record<PatternType, number>);
      
      // Clear all pattern arrays
      setBjCounts([]);
      setBjRollingScores([]);
      setBjTargetScores([]);
      setStepIndex([]);
      setBjIntrinsic([]);
      setBjCumulative([]);
      setEscalatorDir([]);
      setEscalatorLength([]);
      setGoldmineQual([]);
      setTrailStop([]);
      setDistToStopPct([]);
      setBjTargetScores([]);
      setEscalatorSteps([]);
      setIsDetecting(false);
    }
  }, [data]); // Only re-run when data changes
  
  // Detect patterns when data changes and is available
  useEffect(() => {
    if (data.length > 0 && !isDetecting) {
      logDebug('DEBUG_PATTERN_DETECT', '[usePatterns] Auto-detecting patterns for new data');
      detectPatterns(data);
    }
  }, [data, detectPatterns, isDetecting]);
  
  // Track last processed escalator steps to prevent re-processing
  const lastProcessedStepsRef = useRef<number>(0);
  
  // Temporary: Convert escalatorSteps to patterns when AdaptiveEscalatorDetector isn't finding them
  useEffect(() => {
    if (escalatorSteps.length > 0 && escalatorSteps.length !== lastProcessedStepsRef.current) {
      lastProcessedStepsRef.current = escalatorSteps.length;
      
      console.log('[usePatterns] Converting escalatorSteps to patterns:', escalatorSteps.length);
      
      // Extract unique ESCALATOR events (not ESCALATOR_STEP)
      const escalatorEvents = escalatorSteps.filter(step => step.type === 'ESCALATOR');
      
      // Convert to Pattern objects
      const escalatorPatterns: Pattern[] = escalatorEvents.map(event => {
        const data = event.data;
        return {
          id: `esc_${data.startIndex}_${data.endIndex}_${event.timestamp}`,
          type: PatternType.ESCALATOR,
          startTime: new Date(event.timestamp),
          endTime: new Date(data.endTime || event.timestamp),
          highPrice: Math.max(...(data.steps || []).map((s: any) => s.ceiling || 0)),
          lowPrice: Math.min(...(data.steps || []).map((s: any) => s.floor || 0)),
          confidence: data.consistency || 0.5,
          hasReceivedFeedback: false,
          direction: data.direction,
          symbol: currentSymbol || 'UNKNOWN',
          ticker: currentSymbol || 'UNKNOWN',
        } as any;
      });
      
      console.log('[usePatterns] Created escalator patterns:', escalatorPatterns.length);
      
      // Only update if we have patterns to add
      if (escalatorPatterns.length > 0) {
        setPatterns(prev => {
          const nonEscalator = prev.filter(p => p.type !== PatternType.ESCALATOR);
          return [...nonEscalator, ...escalatorPatterns];
        });
        setVisiblePatterns(prev => {
          const nonEscalator = prev.filter(p => p.type !== PatternType.ESCALATOR);
          return [...nonEscalator, ...escalatorPatterns];
        });
      }
    }
  }, [escalatorSteps, currentSymbol]);
  
  // Handle feedback submission
  const submitPatternFeedback = useCallback(async (feedback: Partial<PatternFeedback>): Promise<void> => {
    if (!feedback.patternId || !feedback.patternType) {
      throw new Error('Pattern ID and type are required for feedback');
    }
    
    try {
      // Add feedback to learning engine
      const completeFeedback: PatternFeedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...feedback
      } as PatternFeedback;
      
      patternLearningEngine.addFeedback(completeFeedback);
      
      // Optimistically update pattern to show feedback received
      const updatedPattern = patterns.find(p => p.id === feedback.patternId);
      if (updatedPattern) {
        updatePattern({
          ...updatedPattern,
          hasReceivedFeedback: true,
          feedbackCount: (updatedPattern.feedbackCount || 0) + 1,
          latestFeedbackTimestamp: Date.now()
        });
      }
      
      logDebug('feedback', 'Pattern feedback submitted', {
        patternId: feedback.patternId,
        patternType: feedback.patternType,
        accuracy: feedback.accuracy,
        isValid: feedback.isValid
      });
      
      // In a real implementation, this would also send to the backend
      // await submitFeedbackToAPI(completeFeedback);
      
    } catch (error) {
      logDebug('feedback', 'Error submitting pattern feedback', error);
      throw error;
    }
  }, [patterns, updatePattern]);
  
  return {
    // Return the main patterns array for chart rendering to ensure chart functionality works correctly
    patterns,
    // Return visible patterns for UI components that need filtered patterns
    visiblePatterns,
    selectedPattern,
    setSelectedPattern,
    selectedPatternForFeedback,
    setSelectedPatternForFeedback,
    submitPatternFeedback,
    patternCounts,
    isDetecting,
    detectPatterns,
    updatePattern,
    filterPatternsByType,
    activeFilter,
    updatePreferences,
    preferences,
    // Expose service statistics
    getDetectionStatistics: useCallback(() => adaptiveService.getDetectionStatistics(), [adaptiveService]),
    getMarketContext: useCallback(() => adaptiveService.getMarketContext(), [adaptiveService]),
    // Pattern bus metrics
    bjCounts,
    setBjCounts,
    bjRollingScores,
    setBjRollingScores,
    bjTargetScores,
    setBjTargetScores,
    stepIndex,
    setStepIndex,
    bjIntrinsic,
    setBjIntrinsic,
    bjCumulative,
    setBjCumulative,
    escalatorDir,
    setEscalatorDir,
    escalatorLength,
    setEscalatorLength,
    goldmineQual,
    setGoldmineQual,
    trailStop,
    setTrailStop,
    distToStopPct,
    setDistToStopPct,
    escalatorSteps,
    setEscalatorSteps,
    events,
    setEvents,
    breakoutBoxes,
    setBreakoutBoxes,
    escalatorSettings,
    setEscalatorSettings,
    breakoutBoxSettings,
    setBreakoutBoxSettings,
    stepIntrinsicCount,
    setStepIntrinsicCount,
    stepBreakoutCount,
    setStepBreakoutCount,
    stepContinuanceCount,
    setStepContinuanceCount,
    rocketmanConfidence,
    setRocketmanConfidence,
    rocketmanAcceleration,
    setRocketmanAcceleration,
    rocketmanDirection,
    setRocketmanDirection,
    pivotDirection,
    setPivotDirection,
    pivotStrength,
    setPivotStrength,
    pivotTouchCount,
    setPivotTouchCount,
    gmcDepthPercent,
    setGmcDepthPercent,
    gmcBreakoutStrength,
    setGmcBreakoutStrength,
    gmcBaseDuration,
    setGmcBaseDuration,
    goldenCandleQual,
    setGoldenCandleQual,
    goldenScore,
    setGoldenScore,
    goldenDirection,
    setGoldenDirection,
    goldmineForensics,
    setGoldmineForensics,
    goldmineForensicsNotes,
    setGoldmineForensicsNotes,
    goldenNearMisses,
    setGoldenNearMisses,
    goldenCandleSettings,
    setGoldenCandleSettings,
    blackjackSettings,
    setBlackjackSettings,
    
    // TriSight Detection Input Refactor Patch v1.3.3: Golden Candle ENTRY/EXIT arrays
    goldenCandleEntries,
    goldenCandleExits,
    setGoldenCandleEntries,
    setGoldenCandleExits
  };
};

export default usePatterns;
