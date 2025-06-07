// src/hooks/usePatterns.ts
// Detects patterns in candle data
// Uses adaptive detection service
import { useState, useEffect, useCallback } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType } from '../models/PatternTypes';
// Import the new adaptive pattern detection service instead of the old PatternDetector
import { AdaptivePatternDetectionService, PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';

/**
 * Hook for detecting and managing patterns in market data
 */
export const usePatterns = (data: CandlestickData[]) => {
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
  
  // Initialize preferences from service (which loads from localStorage)
  const [preferences, setPreferences] = useState<Partial<PatternDetectionPreferences>>(() => {
    // Get current preferences from service (already loaded from localStorage in constructor)
    const servicePrefs = adaptiveService.getPreferences();
    return servicePrefs;
  });
  
  // Detect patterns in the provided data
  const detectPatterns = useCallback(async (candleData: CandlestickData[]) => {
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
        setIsDetecting(false);
      }, 0);
    } catch (error) {
      console.error('Error detecting patterns:', error);
      setIsDetecting(false);
    }
  }, [activeFilter, adaptiveService, isDetecting, preferences.enabledPatternTypes]);
  
  // Detect patterns when data changes
  useEffect(() => {
    if (data.length > 0) {
      detectPatterns(data);
    }
  }, [data, detectPatterns]);
  
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
    setDistToStopPct
  };
};

export default usePatterns;
