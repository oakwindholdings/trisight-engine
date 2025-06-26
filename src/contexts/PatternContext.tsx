// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/contexts/PatternContext.tsx
// Context for detected patterns
// Exposes detection actions
import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType, ThrustDirection } from '../models/PatternTypes';
import { usePatterns } from '../hooks/usePatterns';
import { useMarketDataContext } from './MarketDataContext';
import { usePatternBus, PatternEvent } from '../hooks/usePatternBus';
import { PatternDetectionPreferences } from '../utils/patternDetection/AdaptivePatternDetectionService';
import { BreakoutBoxSettings } from '../components/Patterns/BreakoutBoxSettingsPanel';

// Define the context type
interface PatternContextType {
  // Rolling Blackjack scores (per candle)
  bjRollingScores: { timestamp: number; score: number }[];
  setBjRollingScores: (scores: { timestamp: number; score: number }[]) => void;
  // Target Blackjack scores (per breakout box)
  bjTargetScores: { stepRef: string; score: number; qualifiesForGoldmine?: boolean }[];
  setBjTargetScores: (scores: { stepRef: string; score: number; qualifiesForGoldmine?: boolean }[]) => void;
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
  
  // Phase 1: Core Metrics - Step candle count arrays (indexed by candle position)
  stepIntrinsicCount: number[];
  setStepIntrinsicCount: (values: number[]) => void;
  stepBreakoutCount: number[];
  setStepBreakoutCount: (values: number[]) => void;
  stepContinuanceCount: number[];
  setStepContinuanceCount: (values: number[]) => void;
  
  events: PatternEvent[];  // All pattern events for visualization
  setEvents: (events: PatternEvent[]) => void;
  breakoutBoxes: PatternEvent[];
  setBreakoutBoxes: (boxes: PatternEvent[]) => void;
  // Display settings for patterns
  escalatorSettings: {
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
  };
  setEscalatorSettings: (settings: {
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
  }) => void;
  // BreakoutBox independent settings
  breakoutBoxSettings: BreakoutBoxSettings;
  setBreakoutBoxSettings: (settings: BreakoutBoxSettings) => void;
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
  // Rolling Blackjack scores per candle { timestamp, score }
  bjRollingScores: [],
  // Target Blackjack scores per breakout box { stepRef, score }
  bjTargetScores: [],
  setBjIntrinsic: () => {},
  setBjRollingScores: () => {},
  setBjTargetScores: () => {},
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
  
  // Phase 1: Core Metrics - Step candle count arrays (indexed by candle position)
  stepIntrinsicCount: [],
  setStepIntrinsicCount: () => {},
  stepBreakoutCount: [],
  setStepBreakoutCount: () => {},
  stepContinuanceCount: [],
  setStepContinuanceCount: () => {},
  
  events: [],  // All pattern events for visualization
  setEvents: () => {},
  breakoutBoxes: [],
  setBreakoutBoxes: () => {},
  escalatorSettings: {
    enabled: true,
    showLabels: true,
    showBreakoutBoxes: true,
    minSteps: 0,
    minStepSize: 0,
    maxConsolidationVolatility: 0,
    basePriceChangeThreshold: 0,
    baseVolumeChangeThreshold: 0,
    useContextTimeframe: false,
    contextTimeframeMultiplier: 1,
    minScore: 0,
    preferredDirection: 'BOTH'
  },
  setEscalatorSettings: () => {},
  breakoutBoxSettings: {} as BreakoutBoxSettings,
  setBreakoutBoxSettings: () => {}
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
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => patternHook, [
    patternHook.patterns,
    patternHook.visiblePatterns,
    patternHook.selectedPattern,
    patternHook.setSelectedPattern,
    patternHook.bjCounts,
    patternHook.setBjCounts,
    patternHook.stepIndex,
    patternHook.setStepIndex,
    patternHook.bjIntrinsic,
    patternHook.setBjIntrinsic,
    patternHook.bjCumulative,
    patternHook.setBjCumulative,
    patternHook.bjTargetScores,
    patternHook.setBjTargetScores,
    patternHook.escalatorDir,
    patternHook.setEscalatorDir,
    patternHook.escalatorLength,
    patternHook.setEscalatorLength,
    patternHook.goldmineQual,
    patternHook.setGoldmineQual,
    patternHook.trailStop,
    patternHook.setTrailStop,
    patternHook.distToStopPct,
    patternHook.setDistToStopPct,
    patternHook.escalatorSteps,
    patternHook.setEscalatorSteps,
    patternHook.events,
    patternHook.setEvents,
    patternHook.breakoutBoxes,
    patternHook.setBreakoutBoxes,
    patternHook.escalatorSettings,
    patternHook.setEscalatorSettings,
    patternHook.breakoutBoxSettings,
    patternHook.setBreakoutBoxSettings,
    patternHook.stepIntrinsicCount,
    patternHook.setStepIntrinsicCount,
    patternHook.stepBreakoutCount,
    patternHook.setStepBreakoutCount,
    patternHook.stepContinuanceCount,
    patternHook.setStepContinuanceCount
  ]);
  
  // Log when provider renders
  console.log('[PatternProvider] Rendering with:', {
    dataLength: data.length,
    bjCountsLength: patternHook.bjCounts?.length,
    escalatorDirLength: patternHook.escalatorDir?.length,
    patterns: patternHook.patterns?.length,
    escalatorSettings: patternHook.escalatorSettings
  });
  
  return (
    <PatternContext.Provider value={contextValue}>
      {children}
    </PatternContext.Provider>
  );
};

// Custom hook for using the pattern context
export const usePatternContext = () => useContext(PatternContext);

export default PatternProvider;
