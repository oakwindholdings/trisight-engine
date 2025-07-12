// src/components/AppProviders.tsx
// Root provider component that wraps the entire app with all necessary contexts

import React from 'react';
import { MarketDataProvider } from '../contexts/MarketDataContext';
import { PatternProvider } from '../contexts/PatternContext';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { LearningProvider } from '../contexts/LearningContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { ChartSettingsProvider } from '../contexts/ChartSettingsContext';
import { SymbolSetProvider } from '../contexts/SymbolSetContext';
import { Timeframe } from '../models/ChartTypes';

// localStorage keys (same as in ContextBar)
const STORAGE_KEYS = {
  TIMEFRAME: 'trisight_navbar_timeframe',
  SYMBOL_INFO: 'trisight_navbar_symbol_info'
};

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppProviders({ children }: AppProvidersProps) {
  // Read persisted values from localStorage
  const getInitialSymbol = (): string => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYMBOL_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.symbol || 'AAPL';
      }
    } catch (e) {
      console.error('Failed to parse saved symbol info:', e);
    }
    return 'AAPL';
  };

  const getInitialTimeframe = (): Timeframe => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMEFRAME);
      if (saved && ['1min', '5min', '15min', '30min', '60min', '1hour', 'daily', 'weekly', 'monthly'].includes(saved)) {
        return saved as Timeframe;
      }
    } catch (e) {
      console.error('Failed to parse saved timeframe:', e);
    }
    return '5min';
  };

  const initialSymbol = getInitialSymbol();
  const initialTimeframe = getInitialTimeframe();

  console.log('[AppProviders] Initializing with persisted values:', {
    symbol: initialSymbol,
    timeframe: initialTimeframe
  });

  return (
    <UIStateProvider>
      <ChartSettingsProvider>
        <MarketDataProvider 
          initialSymbol={initialSymbol}
          initialTimeframe={initialTimeframe}
        >
          <SymbolSetProvider>
            <PatternProvider>
              <FeedbackProvider>
                <LearningProvider>
                  {children}
                </LearningProvider>
              </FeedbackProvider>
            </PatternProvider>
          </SymbolSetProvider>
        </MarketDataProvider>
      </ChartSettingsProvider>
    </UIStateProvider>
  );
}

export default AppProviders;
