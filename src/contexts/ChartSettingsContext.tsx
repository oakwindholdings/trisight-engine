// src/contexts/ChartSettingsContext.tsx
// Context for chart display settings including candle type selection
// Provides persistent storage for Heikin-Ashi overlay toggle

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CandleType } from '../hooks/useHeikinAshiTransform';
import { logDebug } from '../utils/debug';

// Storage keys for localStorage persistence
const STORAGE_KEYS = {
  CANDLE_TYPE: 'trisight_chart_candle_type',
  SHOW_VOLUME: 'trisight_chart_show_volume',
  SHOW_GRID: 'trisight_chart_show_grid'
} as const;

interface ChartSettings {
  candleType: CandleType;
  showVolume: boolean;
  showGrid: boolean;
}

interface ChartSettingsContextType extends ChartSettings {
  setCandleType: (type: CandleType) => void;
  setShowVolume: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  resetToDefaults: () => void;
  isHeikinAshiMode: boolean;
}

const defaultSettings: ChartSettings = {
  candleType: 'heikin_ashi',
  showVolume: true,
  showGrid: true
};

const ChartSettingsContext = createContext<ChartSettingsContextType | undefined>(undefined);

interface ChartSettingsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for chart settings with localStorage persistence
 */
export function ChartSettingsProvider({ children }: ChartSettingsProviderProps) {
  const [settings, setSettings] = useState<ChartSettings>(() => {
    // Load settings from localStorage on initialization
    try {
      const savedCandleType = localStorage.getItem(STORAGE_KEYS.CANDLE_TYPE) as CandleType;
      const savedShowVolume = localStorage.getItem(STORAGE_KEYS.SHOW_VOLUME);
      const savedShowGrid = localStorage.getItem(STORAGE_KEYS.SHOW_GRID);

      return {
        candleType: savedCandleType || defaultSettings.candleType,
        showVolume: savedShowVolume !== null ? JSON.parse(savedShowVolume) : defaultSettings.showVolume,
        showGrid: savedShowGrid !== null ? JSON.parse(savedShowGrid) : defaultSettings.showGrid
      };
    } catch (error) {
      logDebug('DEBUG_CONTEXT_UPDATE', '[ChartSettingsProvider] Error loading from localStorage:', error);
      return defaultSettings;
    }
  });

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CANDLE_TYPE, settings.candleType);
      localStorage.setItem(STORAGE_KEYS.SHOW_VOLUME, JSON.stringify(settings.showVolume));
      localStorage.setItem(STORAGE_KEYS.SHOW_GRID, JSON.stringify(settings.showGrid));

      logDebug('DEBUG_CONTEXT_UPDATE', '[ChartSettingsProvider] Settings persisted:', settings);
    } catch (error) {
      logDebug('DEBUG_CONTEXT_UPDATE', '[ChartSettingsProvider] Error saving to localStorage:', error);
    }
  }, [settings]);

  const setCandleType = (type: CandleType) => {
    logDebug('DEBUG_UI', '[ChartSettingsProvider] Candle type changed:', { from: settings.candleType, to: type });
    setSettings(prev => ({ ...prev, candleType: type }));
  };

  const setShowVolume = (show: boolean) => {
    logDebug('DEBUG_UI', '[ChartSettingsProvider] Volume display changed:', { from: settings.showVolume, to: show });
    setSettings(prev => ({ ...prev, showVolume: show }));
  };

  const setShowGrid = (show: boolean) => {
    logDebug('DEBUG_UI', '[ChartSettingsProvider] Grid display changed:', { from: settings.showGrid, to: show });
    setSettings(prev => ({ ...prev, showGrid: show }));
  };

  const resetToDefaults = () => {
    logDebug('DEBUG_UI', '[ChartSettingsProvider] Resetting to default settings');
    setSettings(defaultSettings);
  };

  const contextValue: ChartSettingsContextType = {
    ...settings,
    setCandleType,
    setShowVolume,
    setShowGrid,
    resetToDefaults,
    isHeikinAshiMode: settings.candleType === 'heikin_ashi'
  };

  return (
    <ChartSettingsContext.Provider value={contextValue}>
      {children}
    </ChartSettingsContext.Provider>
  );
}

/**
 * Hook to access chart settings context
 * @returns Chart settings context with state and setters
 * @throws Error if used outside of ChartSettingsProvider
 */
export function useChartSettings(): ChartSettingsContextType {
  const context = useContext(ChartSettingsContext);
  
  if (context === undefined) {
    throw new Error('useChartSettings must be used within a ChartSettingsProvider');
  }
  
  return context;
}

/**
 * Hook to get just the candle type for data transformation
 * @returns Current candle type setting
 */
export function useCandleType(): CandleType {
  const { candleType } = useChartSettings();
  return candleType;
}

/**
 * Hook to check if Heikin-Ashi mode is currently active
 * @returns True if Heikin-Ashi mode is enabled
 */
export function useIsHeikinAshiMode(): boolean {
  const { isHeikinAshiMode } = useChartSettings();
  return isHeikinAshiMode;
}
