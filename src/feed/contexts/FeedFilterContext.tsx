// src/feed/contexts/FeedFilterContext.tsx
// Global filter state management for Pattern Feed
// Provides performant filtering with memoization for 10,000+ items

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { PatternType } from '../../models/PatternTypes';
import { EnhancedPatternFeedFilters, TimeWindow, ChartInterval } from '../types/PatternFeedTypes';

// Predefined time windows
export const TIME_WINDOWS: TimeWindow[] = [
  { label: 'All Time', value: 'all', minutes: 0 },
  { label: 'Last 5 minutes', value: '5m', minutes: 5 },
  { label: 'Last 15 minutes', value: '15m', minutes: 15 },
  { label: 'Last 30 minutes', value: '30m', minutes: 30 },
  { label: 'Last hour', value: '1h', minutes: 60 },
  { label: 'Last 4 hours', value: '4h', minutes: 240 },
  { label: 'Last 24 hours', value: '24h', minutes: 1440 },
];

// Chart intervals
export const CHART_INTERVALS: ChartInterval[] = [
  { label: 'All Intervals', value: 'all' },
  { label: '1 minute', value: '1m' },
  { label: '5 minutes', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '4 hours', value: '4h' },
  { label: '1 day', value: '1d' },
];

// Pattern type options with counts
export interface PatternTypeOption {
  type: PatternType | 'all';
  label: string;
  count: number;
}

interface FeedFilterContextValue {
  // Current filter state
  filters: EnhancedPatternFeedFilters;
  
  // Filter setters
  setPatternType: (type: string) => void;
  setTimeWindow: (window: string) => void;
  setInterval: (interval: string) => void;
  setSymbol: (symbol: string) => void;
  setSector: (sector: string) => void;
  setConfidenceRange: (min?: number, max?: number) => void;
  
  // Bulk operations
  clearAllFilters: () => void;
  setFilters: (filters: Partial<EnhancedPatternFeedFilters>) => void;
  
  // Filter options with counts
  patternTypeOptions: PatternTypeOption[];
  updatePatternTypeCounts: (counts: Record<string, number>) => void;
  
  // Active filter indicators
  hasActiveFilters: boolean;
  activeFilterCount: number;
  
  // Filter presets
  applyPreset: (preset: string) => void;
  savePreset: (name: string, filters: EnhancedPatternFeedFilters) => void;
  savedPresets: Record<string, EnhancedPatternFeedFilters>;
}

const FeedFilterContext = createContext<FeedFilterContextValue>({
  filters: {},
  setPatternType: () => {},
  setTimeWindow: () => {},
  setInterval: () => {},
  setSymbol: () => {},
  setSector: () => {},
  setConfidenceRange: () => {},
  clearAllFilters: () => {},
  setFilters: () => {},
  patternTypeOptions: [],
  updatePatternTypeCounts: () => {},
  hasActiveFilters: false,
  activeFilterCount: 0,
  applyPreset: () => {},
  savePreset: () => {},
  savedPresets: {},
});

export const FeedFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<EnhancedPatternFeedFilters>({});
  const [patternTypeCounts, setPatternTypeCounts] = useState<Record<string, number>>({});
  const [savedPresets, setSavedPresets] = useState<Record<string, EnhancedPatternFeedFilters>>({});

  // Memoized pattern type options with counts
  const patternTypeOptions = useMemo((): PatternTypeOption[] => {
    const allCount = Object.values(patternTypeCounts).reduce((sum, count) => sum + count, 0);
    const options: PatternTypeOption[] = [
      { type: 'all', label: 'All Patterns', count: allCount }
    ];
    
    Object.values(PatternType).forEach(type => {
      options.push({
        type,
        label: type.replace(/_/g, ' '),
        count: patternTypeCounts[type] || 0
      });
    });
    
    return options;
  }, [patternTypeCounts]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== '' && value !== 'all'
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.patternType && filters.patternType !== 'all') count++;
    if (filters.timeWindow && filters.timeWindow !== 'all') count++;
    if (filters.interval && filters.interval !== 'all') count++;
    if (filters.symbol) count++;
    if (filters.sector) count++;
    if (filters.confidence?.min !== undefined || filters.confidence?.max !== undefined) count++;
    return count;
  }, [filters]);

  // Filter setters
  const setPatternType = useCallback((type: string) => {
    setFiltersState(prev => ({ ...prev, patternType: type === 'all' ? undefined : type }));
  }, []);

  const setTimeWindow = useCallback((window: string) => {
    setFiltersState(prev => ({ ...prev, timeWindow: window === 'all' ? undefined : window }));
  }, []);

  const setInterval = useCallback((interval: string) => {
    setFiltersState(prev => ({ ...prev, interval: interval === 'all' ? undefined : interval }));
  }, []);

  const setSymbol = useCallback((symbol: string) => {
    setFiltersState(prev => ({ ...prev, symbol: symbol || undefined }));
  }, []);

  const setSector = useCallback((sector: string) => {
    setFiltersState(prev => ({ ...prev, sector: sector || undefined }));
  }, []);

  const setConfidenceRange = useCallback((min?: number, max?: number) => {
    setFiltersState(prev => ({
      ...prev,
      confidence: (min !== undefined || max !== undefined) ? { min, max } : undefined
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const setFilters = useCallback((newFilters: Partial<EnhancedPatternFeedFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updatePatternTypeCounts = useCallback((counts: Record<string, number>) => {
    setPatternTypeCounts(counts);
  }, []);

  const applyPreset = useCallback((preset: string) => {
    if (savedPresets[preset]) {
      setFiltersState(savedPresets[preset]);
    }
  }, [savedPresets]);

  const savePreset = useCallback((name: string, presetFilters: EnhancedPatternFeedFilters) => {
    setSavedPresets(prev => ({ ...prev, [name]: presetFilters }));
  }, []);

  const contextValue: FeedFilterContextValue = {
    filters,
    setPatternType,
    setTimeWindow,
    setInterval,
    setSymbol,
    setSector,
    setConfidenceRange,
    clearAllFilters,
    setFilters,
    patternTypeOptions,
    updatePatternTypeCounts,
    hasActiveFilters,
    activeFilterCount,
    applyPreset,
    savePreset,
    savedPresets,
  };

  return (
    <FeedFilterContext.Provider value={contextValue}>
      {children}
    </FeedFilterContext.Provider>
  );
};

export const useFeedFilter = () => useContext(FeedFilterContext);
