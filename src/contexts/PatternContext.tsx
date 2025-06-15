// src/contexts/PatternContext.tsx
// Context for detected patterns
// Exposes detection actions
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType } from '../models/PatternTypes';
import { PatternEvent } from '../hooks/usePatternBus';
import usePatterns from '../hooks/usePatterns';
import { useMarketDataContext } from './MarketDataContext';
import { usePatternBus } from '../hooks/usePatternBus';
import { PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';

// Define the context type
interface PatternContextType {
  patterns: Pattern[];
  visiblePatterns: Pattern[];
  selectedPattern: Pattern | null;
  setSelectedPattern: (pattern: Pattern | null) => void;
  detectPatterns: (data: CandlestickData[]) => void;
  patternCounts: Record<PatternType, number>;
  isDetecting: boolean;
  updatePattern: (updatedPattern: Pattern) => void;
  filterPatternsByType: (type: PatternType | null) => Pattern[];
  activeFilter: PatternType | null;
  // New adaptive pattern detection properties and methods
  updatePreferences: (prefs: Partial<PatternDetectionPreferences>) => void;
  preferences: Partial<PatternDetectionPreferences>;
  getDetectionStatistics: () => any;
  getMarketContext: () => any;
  // Pattern bus metrics for hover and visualization
  bjCounts: number[];
  setBjCounts: (counts: number[]) => void;
  stepIndex: number[];
  setStepIndex: (indices: number[]) => void;
  bjIntrinsic: number[];
  setBjIntrinsic: (values: number[]) => void;
  bjCumulative: number[];
  setBjCumulative: (values: number[]) => void;
  escalatorDir: ('RISING' | 'FALLING' | null)[];
  setEscalatorDir: (values: ('RISING' | 'FALLING' | null)[]) => void;
  escalatorLength: number[];
  setEscalatorLength: (values: number[]) => void;
  goldmineQual: boolean[];
  setGoldmineQual: (values: boolean[]) => void;
  trailStop: number[];
  setTrailStop: (values: number[]) => void;
  distToStopPct: number[];
  setDistToStopPct: (values: number[]) => void;
  escalatorSteps: PatternEvent[];
  setEscalatorSteps: (events: PatternEvent[]) => void;
  events: PatternEvent[];  // All pattern events for visualization
  setEvents: (events: PatternEvent[]) => void;
}

// Create the context with initial values
const initialPatternContext: PatternContextType = {
  patterns: [],
  visiblePatterns: [],
  selectedPattern: null,
  setSelectedPattern: () => {},
  detectPatterns: () => {},
  patternCounts: {} as Record<PatternType, number>,
  isDetecting: false,
  updatePattern: () => {},
  filterPatternsByType: () => [],
  activeFilter: null,
  // Initialize new adaptive pattern detection properties and methods
  updatePreferences: () => {},
  preferences: { minimumConfidence: 0.4, adaptiveThresholds: true },
  getDetectionStatistics: () => ({}),
  getMarketContext: () => ({}),
  bjCounts: [],
  setBjCounts: () => {},
  stepIndex: [],
  setStepIndex: () => {},
  bjIntrinsic: [],
  setBjIntrinsic: () => {},
  bjCumulative: [],
  setBjCumulative: () => {},
  escalatorDir: [],
  setEscalatorDir: () => {},
  escalatorLength: [],
  setEscalatorLength: () => {},
  goldmineQual: [],
  setGoldmineQual: () => {},
  trailStop: [],
  setTrailStop: () => {},
  distToStopPct: [],
  setDistToStopPct: () => {},
  escalatorSteps: [],
  setEscalatorSteps: () => {},
  events: [],  // All pattern events for visualization
  setEvents: () => {}
};

export const PatternContext = createContext<PatternContextType>(initialPatternContext);

// Provider component
interface PatternProviderProps {
  children: ReactNode;
}

export const PatternProvider: React.FC<PatternProviderProps> = ({ children }) => {
  // Get market data from context
  const { data } = useMarketDataContext();
  
  // Initialize pattern detection hooks
  const patternHook = usePatterns(data);
  
  // Use pattern bus to populate arrays and get events
  const { events } = usePatternBus(data);
  
  // Update pattern hook with events
  useEffect(() => {
    patternHook.setEvents(events);
  }, [events, patternHook.setEvents]);
  
  // Log when provider renders
  console.log('[PatternProvider] Rendering with:', {
    dataLength: data.length,
    bjCountsLength: patternHook.bjCounts?.length,
    escalatorDirLength: patternHook.escalatorDir?.length,
    patterns: patternHook.patterns?.length,
    eventsLength: events?.length
  });
  
  // Re-detect patterns when data changes
  useEffect(() => {
    if (data.length > 0) {
      patternHook.detectPatterns(data);
    }
  }, [data, patternHook.detectPatterns]);
  
  return (
    <PatternContext.Provider value={patternHook}>
      {children}
    </PatternContext.Provider>
  );
};

// Custom hook for using the pattern context
export const usePatternContext = () => useContext(PatternContext);

export default PatternProvider;
