// src/contexts/PatternContext.tsx
// Context for detected patterns
// Exposes detection actions
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType } from '../models/PatternTypes';
import usePatterns from '../hooks/usePatterns';
import { useMarketDataContext } from './MarketDataContext';
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
  getMarketContext: () => ({})
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
