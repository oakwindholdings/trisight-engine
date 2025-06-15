// src/components/AppProviders.tsx
// Root provider component that wraps the entire app with all necessary contexts

import React from 'react';
import { MarketDataProvider } from '../contexts/MarketDataContext';
import { PatternProvider } from '../contexts/PatternContext';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { LearningProvider } from '../contexts/LearningContext';
import { UIStateProvider } from '../contexts/UIStateContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppProviders({ children }: AppProvidersProps) {
  return (
    <UIStateProvider>
      <MarketDataProvider>
        <PatternProvider>
          <FeedbackProvider>
            <LearningProvider>
              {children}
            </LearningProvider>
          </FeedbackProvider>
        </PatternProvider>
      </MarketDataProvider>
    </UIStateProvider>
  );
}

export default AppProviders;
