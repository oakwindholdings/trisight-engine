// src/components/AppProviders.tsx
// Wrapper for global context providers
// Encapsulates TriSight contexts
import React from 'react';
import { MarketDataProvider } from '../contexts/MarketDataContext';
import { PatternProvider } from '../contexts/PatternContext';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { LearningProvider } from '../contexts/LearningContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <MarketDataProvider>
    <PatternProvider>
      <FeedbackProvider>
        <LearningProvider>{children}</LearningProvider>
      </FeedbackProvider>
    </PatternProvider>
  </MarketDataProvider>
);

export default AppProviders;
