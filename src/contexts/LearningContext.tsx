// src/contexts/LearningContext.tsx
// Context exposing learning metrics
// Wraps useLearning hook
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { PatternType } from '../models/PatternTypes';
import { PatternFeedback } from '../models/FeedbackTypes';
import { 
  LearningMetrics, 
  PatternDetectionParameters,
  ProcessingResult,
  PatternFeedbackHistory
} from '../models/LearningTypes';
import { useLearning } from '../hooks/useLearning';
import { useFeedbackContext } from './FeedbackContext';

// Define the context type
interface LearningContextType {
  metrics: LearningMetrics | null;
  loading: boolean;
  error: Error | null;
  isLearningEnabled: boolean;
  refreshMetrics: () => Promise<void>;
  exportModel: () => Promise<boolean>;
  importModel: (file: File) => Promise<boolean>;
  processFeedback: (feedback: PatternFeedback) => Promise<ProcessingResult | null>;
  getPatternParameters: (patternType: PatternType) => PatternDetectionParameters;
  updatePatternParameters: (patternType: PatternType, parameters: Partial<PatternDetectionParameters>) => void;
  toggleLearning: () => void;
  resetLearningParameters: (patternType?: PatternType) => Promise<void>;
  getFeedbackHistory: (patternId: string) => PatternFeedbackHistory | null;
}

// Create the context with initial values
const initialLearningContext: LearningContextType = {
  metrics: null,
  loading: false,
  error: null,
  isLearningEnabled: true,
  refreshMetrics: async () => {},
  exportModel: async () => false,
  importModel: async () => false,
  processFeedback: async () => null,
  getPatternParameters: () => ({ sensitivity: 0.5, minConfidence: 0.6, boundaryPadding: 0.05, typeSpecificParameters: {} }),
  updatePatternParameters: () => {},
  toggleLearning: () => {},
  resetLearningParameters: async () => {},
  getFeedbackHistory: () => null
};

export const LearningContext = createContext<LearningContextType>(initialLearningContext);

// Provider component
interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  // Get feedback history from feedback context
  const { feedbackHistory } = useFeedbackContext();
  
  // Initialize learning hook with feedback history
  const learningHook = useLearning(feedbackHistory);
  
  // Add useEffect for broadcasting:
  useEffect(() => {
    // Broadcast update event
    // Assume event bus: dispatch('parametersUpdated');
  }, [/* params dependency */]);

  // Create enhanced context with additional functions
  const contextValue: LearningContextType = {
    metrics: learningHook.metrics,
    loading: learningHook.loading,
    error: learningHook.error,
    isLearningEnabled: learningHook.isLearningEnabled,
    refreshMetrics: learningHook.refreshMetrics,
    exportModel: learningHook.exportModel,
    importModel: learningHook.importModel,
    processFeedback: learningHook.processFeedback,
    getPatternParameters: learningHook.getPatternParameters,
    updatePatternParameters: learningHook.updatePatternParameters,
    toggleLearning: learningHook.toggleLearning,
    resetLearningParameters: learningHook.resetLearningParameters,
    // Add function to get feedback history for a specific pattern
    getFeedbackHistory: (patternId: string): PatternFeedbackHistory | null => {
      // Use the FeedbackStorage utility to retrieve feedback history
      try {
        const history = require('../utils/learning/FeedbackStorage').FeedbackStorage.getFeedbackHistoryByPatternId(patternId);
        return history;
      } catch (error) {
        console.error('Error getting feedback history:', error);
        return null;
      }
    }
  };
  
  return (
    <LearningContext.Provider value={contextValue}>
      {children}
    </LearningContext.Provider>
  );
};

// Custom hook for using the learning context
export const useLearningContext = () => useContext(LearningContext);

export default LearningProvider;
