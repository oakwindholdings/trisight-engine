// src/hooks/usePatterns.ts
// Pattern detection integration with adaptive services
// Manages both pattern entities and candle-aligned metric arrays

import { useState, useEffect, useCallback } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType } from '../models/PatternTypes';
import { PatternEvent } from './usePatternBus';
import { AdaptivePatternDetectionService, PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';
import { getIntrinsicScore } from '../patternEngine/blackjack';
import { detectEscalators } from '../patternEngine/escalator';

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
  
  // Initialize preferences from service (which loads from localStorage)
  const [preferences, setPreferences] = useState<Partial<PatternDetectionPreferences>>(() => {
    // Get current preferences from service (already loaded from localStorage in constructor)
    const servicePrefs = adaptiveService.getPreferences();
    return servicePrefs;
  });
  
  // Method to populate pattern arrays based on detected patterns
  const populatePatternArrays = useCallback((candles: CandlestickData[], detectedPatterns: Pattern[]) => {
    console.log('[usePatterns] Populating pattern arrays for', candles.length, 'candles');
    
    // Use detectEscalators from patternEngine to get proper escalator data
    const escalatorRuns = detectEscalators(candles);
    console.log('[usePatterns] Detected', escalatorRuns.length, 'escalator runs');
    
    // Compute Blackjack intrinsic scores
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
    
    console.log('[usePatterns] Pattern arrays populated:', {
      bjIntrinsicLength: bjIntrinsic.length,
      escalatorDirNonNull: escalatorDirArray.filter(d => d !== null).length,
      escalatorLengthNonZero: escalatorLength.filter(l => l > 0).length
    });
  }, [setBjIntrinsic, setBjCumulative, setStepIndex, setEscalatorDir, setEscalatorLength, setGoldmineQual, setTrailStop, setDistToStopPct]);
  
  // Detect patterns in the provided data
  const detectPatterns = useCallback(async (candleData: CandlestickData[]) => {
    console.log('[usePatterns] detectPatterns called with', candleData.length, 'candles');
    if (candleData.length > 0) {
      const firstTime = new Date(candleData[0].datetime);
      const lastTime = new Date(candleData[candleData.length - 1].datetime);
      console.log('[usePatterns] Data time range:', {
        first: firstTime.toLocaleString(),
        last: lastTime.toLocaleString(),
        firstTimestamp: candleData[0].timestamp,
        lastTimestamp: candleData[candleData.length - 1].timestamp
      });
    }
    
    if (candleData.length === 0) {
      setPatterns([]);
      setVisiblePatterns([]);
      setPatternCounts({} as Record<PatternType, number>);
      return;
    }
    
    // Prevent multiple concurrent detections
    if (isDetecting) {
      console.log('Pattern detection already in progress, skipping request');
      return;
    }
    
    setIsDetecting(true);
    console.log('Detecting patterns with adaptive service...');
    
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
        
        console.log(`Detected ${detectedPatterns.length} patterns with adaptive service`);
        
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
      console.error('Error detecting patterns:', error);
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
    setEvents
  };
};

export default usePatterns;
