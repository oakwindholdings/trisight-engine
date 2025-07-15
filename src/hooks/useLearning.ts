// src/hooks/useLearning.ts
// Hook for pattern learning logic
// Aggregates feedback and metrics
import { useState, useCallback, useEffect } from 'react';
import { PatternFeedback } from '../models/FeedbackTypes';
import { PatternType } from '../models/PatternTypes';
import {
  LearningMetrics,
  PatternDetectionParameters,
  ProcessingResult
} from '../models/LearningTypes';
import { LearningProcessor } from '../utils/learning/LearningProcessor';
import { FeedbackStorage } from '../utils/learning/FeedbackStorage';
import { generateLearningMetrics } from '../utils/learning/metrics';

/**
 * Hook for managing the pattern learning system
 */
/**
 * Custom hook for the Pattern Learning System
 * @param feedbackHistory Array of pattern feedback to process
 * @returns Learning system controls and metrics
 */
export const useLearning = (feedbackHistory: PatternFeedback[]) => {
  // State for tracking learning metrics and status
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLearningEnabled, setIsLearningEnabled] = useState<boolean>(true);
  
  // Initialize the learning processor with stored parameters or defaults
  const [learningProcessor] = useState<LearningProcessor>(() => {
    const storedParameters = FeedbackStorage.getAllParameters();
    return new LearningProcessor(Object.keys(storedParameters).length > 0 ? storedParameters : undefined);
  });

  // Refresh metrics from the learning system
  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allFeedback = FeedbackStorage.getAllFeedback();
      const updatedMetrics = generateLearningMetrics(allFeedback, learningProcessor);
      setMetrics(updatedMetrics);
    } catch (error) {
      console.error('Error calculating learning metrics:', error);
      setError(error instanceof Error ? error : new Error('Failed to calculate learning metrics'));
    } finally {
      setLoading(false);
    }
  }, [learningProcessor]);


  // Export the current learning model
  const handleExportModel = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current parameters
      const parameters: Record<PatternType, PatternDetectionParameters> = {} as Record<PatternType, PatternDetectionParameters>;
      Object.values(PatternType).forEach(patternType => {
        parameters[patternType] = learningProcessor.getDetectionParameters(patternType);
      });

      // Get all feedback
      const allFeedback = FeedbackStorage.getAllFeedback();

      // Create model export
      const model = {
        version: '1.0.0',
        timestamp: Date.now(),
        parameters,
        feedbackCount: allFeedback.length,
        metrics: metrics
      };

      // Create a download link for the model
      const modelJson = JSON.stringify(model, null, 2);
      const blob = new Blob([modelJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create and click a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `trisight_learning_model_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting learning model:', error);
      setError(error instanceof Error ? error : new Error('Failed to export learning model'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [metrics, learningProcessor]);

  // Import a learning model
  const handleImportModel = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Read the file
      const fileContent = await file.text();
      const model = JSON.parse(fileContent);

      // Validate model structure
      if (!model.parameters || !model.version) {
        throw new Error('Invalid model file format');
      }

      // Update parameters for each pattern type
      Object.entries(model.parameters).forEach(([patternType, parameters]) => {
        learningProcessor.updateDetectionParameters(patternType as PatternType, parameters as PatternDetectionParameters);
        // Also save to storage
        FeedbackStorage.saveParameters(patternType as PatternType, parameters as PatternDetectionParameters);
      });

      // Refresh metrics
      await refreshMetrics();

      return true;
    } catch (error) {
      console.error('Error importing learning model:', error);
      setError(error instanceof Error ? error : new Error('Failed to import learning model'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshMetrics, learningProcessor]);

  // Process new feedback and update the learning model
  const processFeedback = useCallback(async (feedback: PatternFeedback): Promise<ProcessingResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Only process if learning is enabled
      if (!isLearningEnabled) {
        return null;
      }

      // Snapshot current params
      const snapshot = JSON.parse(JSON.stringify(learningProcessor.getDetectionParameters(feedback.originalPatternType)));

      // Save feedback to storage
      FeedbackStorage.saveFeedback(feedback);

      // Process feedback with learning processor
      const result = learningProcessor.processFeedback(feedback);

      // Save updated parameters
      FeedbackStorage.saveParameters(feedback.originalPatternType, result.updatedParameters);

      // Refresh metrics
      await refreshMetrics();

      return result;
    } catch (error) {
      console.error('Error processing feedback:', error);
      setError(error instanceof Error ? error : new Error('Failed to process feedback'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshMetrics, isLearningEnabled, learningProcessor]);

  // Get pattern parameters
  const getPatternParameters = useCallback((patternType: PatternType): PatternDetectionParameters => {
    return learningProcessor.getDetectionParameters(patternType);
  }, [learningProcessor]);

  // Update pattern parameters
  const updatePatternParameters = useCallback((patternType: PatternType, parameters: Partial<PatternDetectionParameters>): void => {
    // Get current parameters
    const currentParams = learningProcessor.getDetectionParameters(patternType);

    // Merge with new parameters
    const updatedParams = {
      ...currentParams,
      ...parameters
    };

    // Update in processor
    learningProcessor.updateDetectionParameters(patternType, updatedParams);

    // Save to storage
    FeedbackStorage.saveParameters(patternType, updatedParams);

    // Refresh metrics
    refreshMetrics();
  }, [learningProcessor, refreshMetrics]);

  // Toggle learning enabled/disabled
  const toggleLearning = useCallback(() => {
    setIsLearningEnabled(prev => !prev);
  }, []);

  // Reset learning parameters for a pattern type
  const resetLearningParameters = useCallback(async (patternType?: PatternType) => {
    setLoading(true);

    try {
      // Create a new processor with default parameters
      const newProcessor = new LearningProcessor();

      if (patternType) {
        // Reset only the specified pattern type
        const defaultParams = newProcessor.getDetectionParameters(patternType);
        learningProcessor.updateDetectionParameters(patternType, defaultParams);
        FeedbackStorage.saveParameters(patternType, defaultParams);
      } else {
        // Reset all pattern types
        Object.values(PatternType).forEach(type => {
          const defaultParams = newProcessor.getDetectionParameters(type);
          learningProcessor.updateDetectionParameters(type, defaultParams);
          FeedbackStorage.saveParameters(type, defaultParams);
        });
      }

      await refreshMetrics();
    } catch (error) {
      console.error('Error resetting learning parameters:', error);
      setError(error instanceof Error ? error : new Error('Failed to reset learning parameters'));
    } finally {
      setLoading(false);
    }
  }, [learningProcessor, refreshMetrics]);

  // Load metrics on initial render
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // Process new feedback when feedbackHistory changes
  useEffect(() => {
    // Only process if there is feedback and it's not already processed
    if (feedbackHistory && feedbackHistory.length > 0) {
      try {
        const lastFeedback = feedbackHistory[feedbackHistory.length - 1];
        
        // Ensure submittedAt is a valid Date object
        if (!(lastFeedback.submittedAt instanceof Date)) {
          // Try to convert string to Date if needed
          if (typeof lastFeedback.submittedAt === 'string') {
            lastFeedback.submittedAt = new Date(lastFeedback.submittedAt);
          } else {
            console.error('Invalid submittedAt date format in feedback:', lastFeedback);
            return; // Skip processing this feedback
          }
        }
      
        // Check if this feedback is not already in storage to avoid duplicates
        const storedFeedback = FeedbackStorage.getFeedbackByPatternId(lastFeedback.patternId);
        const isAlreadyProcessed = storedFeedback.some(fb => {
          // Ensure stored feedback dates are also Date objects
          const storedDate = fb.submittedAt instanceof Date ? 
            fb.submittedAt : 
            new Date(fb.submittedAt);
            
          return storedDate.getTime() === lastFeedback.submittedAt.getTime();
        });
        
        if (!isAlreadyProcessed) {
          processFeedback(lastFeedback);
        }
      } catch (error) {
        console.error('Error processing feedback:', error);
      }
    }
  }, [feedbackHistory, processFeedback]);
  
  // Load metrics on initial render
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

/**
 * Interface defining the return type of the useLearning hook
 */
interface LearningHookResult {
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
}

  // Return all hook properties and methods with proper typing
  const result: LearningHookResult = {
    metrics,
    loading,
    error,
    isLearningEnabled,
    refreshMetrics,
    exportModel: handleExportModel,
    importModel: handleImportModel,
    processFeedback,
    getPatternParameters,
    updatePatternParameters,
    toggleLearning,
    resetLearningParameters
  };

  return result;
};

export default useLearning;
