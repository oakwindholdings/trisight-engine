// src/contexts/FeedbackContext.tsx
// Context managing feedback state
// Uses useFeedback internally
import React, { createContext, useContext, ReactNode } from 'react';
import { PatternFeedback } from '../models/FeedbackTypes';
import useFeedback from '../hooks/useFeedback';
import { usePatternContext } from './PatternContext';

// Define the context type
interface FeedbackContextType {
  submitFeedback: (feedback: PatternFeedback) => Promise<boolean>;
  feedbackHistory: PatternFeedback[];
  pendingFeedback: boolean;
  feedbackError: Error | null;
  hasReceivedFeedback: (patternId: string) => boolean;
  getFeedbackForPattern: (patternId: string) => PatternFeedback | null;
  refreshFeedback: () => Promise<void>;
}

// Create the context with initial values
const initialFeedbackContext: FeedbackContextType = {
  submitFeedback: async () => false,
  feedbackHistory: [],
  pendingFeedback: false,
  feedbackError: null,
  hasReceivedFeedback: () => false,
  getFeedbackForPattern: () => null,
  refreshFeedback: async () => {}
};

export const FeedbackContext = createContext<FeedbackContextType>(initialFeedbackContext);

// Provider component
interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  // Get pattern context to update patterns after feedback
  const { updatePattern } = usePatternContext();
  
  // Initialize feedback hook
  const feedbackHook = useFeedback(updatePattern);
  
  return (
    <FeedbackContext.Provider value={feedbackHook}>
      {children}
    </FeedbackContext.Provider>
  );
};

// Custom hook for using the feedback context
export const useFeedbackContext = () => useContext(FeedbackContext);

export default FeedbackProvider;
