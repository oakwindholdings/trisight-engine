// src/components/AppProviders.tsx
// Wraps application with context providers
// Supplies market, pattern, feedback and learning contexts
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
