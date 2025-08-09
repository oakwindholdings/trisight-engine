// src/components/AppProviders.tsx
// Root provider component that wraps the entire app with all necessary contexts

import React from 'react';
import { MarketDataProvider } from '../contexts/MarketDataContext';
import { PatternProvider } from '../contexts/PatternContext';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { LearningProvider } from '../contexts/LearningContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { UserInterestProvider } from '../contexts/UserInterestContext';
import { FeedProvider } from '../feed/contexts/FeedContext';
import { PatternFeedBridge } from '../feed/components/PatternFeedBridge';
// PatternFeed ingest will be mounted via internal bridge component to ensure correct provider order.
import { ChartSettingsProvider } from '../contexts/ChartSettingsContext';
import { SymbolSetProvider } from '../contexts/SymbolSetContext';
import { Timeframe } from '../models/ChartTypes';
import { logDebug } from '../utils/debug';

// localStorage keys (same as in ContextBar)
const STORAGE_KEYS = {
  TIMEFRAME: 'trisight_navbar_timeframe',
  SYMBOL_INFO: 'trisight_navbar_symbol_info'
};

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppProviders({ children }: AppProvidersProps) {
  const ENABLE_PATTERN_FEED = process.env.REACT_APP_ENABLE_PATTERN_FEED !== 'false';
  // Read persisted values from localStorage
  // Rule: LockTicker — never default to AAPL; prefer last saved symbol or empty
  const getInitialSymbol = (): string => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYMBOL_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.symbol || '').toUpperCase();
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logDebug('DEBUG_CONTEXT_UPDATE', 'Failed to parse saved symbol info: ' + errorMessage);
    }
    return '';
  };

  const getInitialTimeframe = (): Timeframe => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMEFRAME);
      if (saved && ['1min', '5min', '15min', '30min', '60min', '1hour', 'daily', 'weekly', 'monthly'].includes(saved)) {
        return saved as Timeframe;
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logDebug('DEBUG_CONTEXT_UPDATE', 'Failed to parse saved timeframe: ' + errorMessage);
    }
    return '5min';
  };

  const initialSymbol = getInitialSymbol();
  // Set global fallback symbol for feed emitter on app init
  if (typeof window !== 'undefined') {
    (window as any).trisightSymbol = initialSymbol;
  }
  const initialTimeframe = getInitialTimeframe();

  logDebug('DEBUG_CONTEXT_UPDATE', '[AppProviders] Initializing with persisted values: symbol=' + initialSymbol + ', timeframe=' + initialTimeframe);

  return (
    <FeedProvider>
    <UserInterestProvider>
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
                    {ENABLE_PATTERN_FEED && <PatternFeedBridge />}
                </LearningProvider>
              </FeedbackProvider>
            </PatternProvider>
          </SymbolSetProvider>
        </MarketDataProvider>
      </ChartSettingsProvider>
    </UIStateProvider>
    </UserInterestProvider>
    </FeedProvider>
  );
}

export default AppProviders;
