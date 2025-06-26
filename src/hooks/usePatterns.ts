// src/hooks/usePatterns.ts
// Pattern detection integration with adaptive services
// Manages both pattern entities and candle-aligned metric arrays

import { useState, useEffect, useCallback } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType, ThrustDirection } from '../models/PatternTypes';
import { PatternEvent } from './usePatternBus';
import { AdaptivePatternDetectionService, PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';
import { BreakoutBoxSettings } from '../components/Patterns/BreakoutBoxSettingsPanel';
import { getIntrinsicScore } from '../patternEngine/blackjack';
import { detectEscalators } from '../patternEngine/escalator';
import { Candle } from '../types';

/**
 * Hook for detecting and managing chart patterns
 */
export function usePatterns(data: CandlestickData[]) {
  // All detected patterns
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  // Patterns after type filtering - what's shown to the user in the UI
  const [visiblePatterns, setVisiblePatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
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
        console.log('[usePatterns] Loaded escalator settings from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('[usePatterns] Error loading escalator settings:', error);
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
        console.log('[usePatterns] Loaded breakoutBox settings from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('[usePatterns] Error loading breakoutBox settings:', error);
    }
    
    // Default values
    return {
      enabled: true,
      showBreakoutBoxes: true,
      minStallLength: 3,
      breakoutMultiplier: 0.5,
      stallThreshold: 0.1
    };
  });
  
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
    
    escalatorRuns.forEach(escalator => {
      // Fill in the direction for all candles in this escalator run
      escalator.steps.forEach((step) => {
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
    
    // Build trailing stop arrays (use 0 as default for no stop)
    const trailStop = new Array<number>(candles.length).fill(0);
    const distToStopPct = new Array<number>(candles.length).fill(0);
    
    // TODO: Populate goldmine and trailing stop arrays based on actual positions
    
    // Set all the arrays into context
    setBjIntrinsic(bjIntrinsic);
    setBjCumulative(bjCumulative);
    setStepIndex(stepIndex);
    setEscalatorDir(escalatorDirArray);
    setEscalatorLength(escalatorLength);
    setGoldmineQual(goldmineQual);
    setTrailStop(trailStop);
    setDistToStopPct(distToStopPct);
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
    
    setIsDetecting(true);
    
    // Safely handle timer - check if there's already a timer running
    try {
      console.time('pattern-detection');
    } catch (e) {
      // Timer might already exist, continue silently
    }
    
    try {
      // Use setTimeout to avoid blocking the UI for large datasets
      setTimeout(() => {
        // Use the new adaptive pattern detection service
        const detectedPatterns = adaptiveService.detectPatterns(candleData);
        
        // Calculate pattern counts by type
        const counts = Object.values(PatternType).reduce((acc, type) => {
          acc[type] = detectedPatterns.filter(p => p.type === type).length;
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
        const filteredPatterns = detectedPatterns.filter(p => enabledTypes.includes(p.type));
        
        setPatterns(filteredPatterns);
        // Update visible patterns based on active filter
        if (activeFilter) {
          setVisiblePatterns(filteredPatterns.filter(p => p.type === activeFilter));
        } else {
          setVisiblePatterns(filteredPatterns);
        }
        setPatternCounts(counts);
        
        // After detecting patterns, populate the pattern arrays
        populatePatternArrays(candleData, detectedPatterns);
        
        setIsDetecting(false);
      }, 0);
    } catch (error) {
      setIsDetecting(false);
    }
  }, [activeFilter, adaptiveService, isDetecting, preferences.enabledPatternTypes, populatePatternArrays]);
  
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
    console.log('[usePatterns] Data changed, length:', data.length);
    
    // If we have no data, clear all patterns
    if (data.length === 0) {
      console.log('[usePatterns] Clearing patterns due to empty data');
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
      console.log('[usePatterns] Auto-detecting patterns for new data');
      detectPatterns(data);
    }
  }, [data, detectPatterns, isDetecting]);
  
  return {
    // Return the main patterns array for chart rendering to ensure chart functionality works correctly
    patterns,
    // Return visible patterns for UI components that need filtered patterns
    visiblePatterns,
    selectedPattern,
    setSelectedPattern,
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
    setStepContinuanceCount
  };
};

export default usePatterns;
