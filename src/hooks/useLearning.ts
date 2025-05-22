// src/hooks/useLearning.ts
// Hook for pattern learning logic
// Aggregates feedback and metrics
import { useState, useCallback, useEffect } from 'react';
import { PatternFeedback } from '../models/FeedbackTypes';
import { PatternType } from '../models/PatternTypes';
import { 
  LearningMetrics, 
  PatternDetectionParameters,
  ProcessingResult,
  PatternFeedbackHistory,
  EnhancedPatternFeedback
} from '../models/LearningTypes';
import { LearningProcessor } from '../utils/learning/LearningProcessor';
import { FeedbackAggregator } from '../utils/learning/FeedbackAggregator';
import { FeedbackStorage } from '../utils/learning/FeedbackStorage';

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
      // Calculate metrics for each pattern type
      const patternTypePerformance: Record<PatternType, {
        detectionCount: number;
        falsePositiveRate: number;
        averageConfidence: number;
        feedbackIncorporationRate: number;
        improvementTrend: number[];
      }> = {} as any;

      // Get all stored feedback
      const allFeedback = FeedbackStorage.getAllFeedback();

      // Process metrics for each pattern type
      Object.values(PatternType).forEach(patternType => {
        const aggregated = FeedbackAggregator.aggregateByPatternType(allFeedback, patternType);
        const improvementMetrics = FeedbackAggregator.calculateImprovementMetrics(allFeedback, patternType);

        patternTypePerformance[patternType] = {
          detectionCount: aggregated.sampleCount,
          falsePositiveRate: aggregated.falsePositiveRate,
          averageConfidence: calculateAverageConfidence(aggregated.confidenceDistribution),
          feedbackIncorporationRate: calculateIncorporationRate(patternType),
          improvementTrend: improvementMetrics.map(m => m.accuracy)
        };
      });

      // Calculate overall performance metrics
      const totalFeedback = allFeedback.length;
      const falsePositives = allFeedback.filter(f => f.falsePositive).length;
      const accuracy = totalFeedback > 0 ? 1 - (falsePositives / totalFeedback) : 0;

      // Create metrics object
      const updatedMetrics: LearningMetrics = {
        patternTypePerformance,
        // Add accuracy by pattern type for charts
        accuracyByPatternType: Object.values(PatternType).reduce((acc, type) => {
          const typeFeedback = allFeedback.filter(f => f.originalPatternType === type);
          const falsePositives = typeFeedback.filter(f => f.falsePositive).length;
          acc[type] = typeFeedback.length > 0 ? 1 - (falsePositives / typeFeedback.length) : 0;
          return acc;
        }, {} as Record<PatternType, number>),
        // Add feedback count by pattern type
        feedbackCountByPatternType: Object.values(PatternType).reduce((acc, type) => {
          acc[type] = allFeedback.filter(f => f.originalPatternType === type).length;
          return acc;
        }, {} as Record<PatternType, number>),
        // Calculate pattern corrections
        correctionsByType: (() => {
          // Get all feedback with pattern type corrections
          const corrections = allFeedback.filter(f => 
            f.correctedPatternType !== null && 
            f.correctedPatternType !== f.originalPatternType
          );
          
          // Group corrections by from -> to pattern type
          const correctionMap = new Map<string, {
            from: PatternType;
            to: PatternType;
            count: number;
          }>();
          
          corrections.forEach(feedback => {
            const key = `${feedback.originalPatternType}-${feedback.correctedPatternType}`;
            if (!correctionMap.has(key)) {
              correctionMap.set(key, {
                from: feedback.originalPatternType,
                to: feedback.correctedPatternType as PatternType,
                count: 0
              });
            }
            const item = correctionMap.get(key)!;
            item.count++;
          });
          
          // Convert map to array and sort by count
          return Array.from(correctionMap.values())
            .sort((a, b) => b.count - a.count);
        })(),
        // Calculate top contributors
        topContributors: (() => {
          // Group feedback by userId
          const userGroups = new Map<string, PatternFeedback[]>();
          
          allFeedback.forEach(feedback => {
            if (!userGroups.has(feedback.userId)) {
              userGroups.set(feedback.userId, []);
            }
            userGroups.get(feedback.userId)!.push(feedback);
          });
          
          // Calculate metrics for each user
          const contributors = Array.from(userGroups.entries()).map(([userId, feedbacks]) => {
            const feedbackCount = feedbacks.length;
            const accurateCount = feedbacks.filter(f => !f.falsePositive).length;
            const accuracyRate = feedbackCount > 0 ? accurateCount / feedbackCount : 0;
            
            return {
              userId,
              feedbackCount,
              accuracyRate
            };
          });
          
          // Sort by feedback count (most active contributors first)
          return contributors.sort((a, b) => b.feedbackCount - a.feedbackCount);
        })(),
        overallPerformance: {
          accuracy,
          precision: calculatePrecision(allFeedback),
          recall: calculateRecall(allFeedback),
          f1Score: calculateF1Score(accuracy, calculatePrecision(allFeedback), calculateRecall(allFeedback))
        },
        parametersEvolution: getParametersEvolution()
      };

      setMetrics(updatedMetrics);
    } catch (error) {
      console.error('Error calculating learning metrics:', error);
      setError(error instanceof Error ? error : new Error('Failed to calculate learning metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to calculate average confidence
  const calculateAverageConfidence = (distribution: Record<number, number>): number => {
    const totalRatings = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (totalRatings === 0) return 0;

    const weightedSum = Object.entries(distribution)
      .reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0);

    return weightedSum / totalRatings / 5; // Normalize to 0-1 scale
  };

  // Helper function to calculate feedback incorporation rate
  const calculateIncorporationRate = (patternType: PatternType): number => {
    // This would be calculated based on how many feedback entries resulted in parameter changes
    // For now, we'll use a placeholder implementation
    return 0.75; // 75% incorporation rate as placeholder
  };

  // Helper function to calculate precision
  const calculatePrecision = (feedback: PatternFeedback[]): number => {
    if (feedback.length === 0) return 0;
    const truePositives = feedback.filter(f => !f.falsePositive).length;
    return truePositives / feedback.length;
  };

  // Helper function to calculate recall
  const calculateRecall = (feedback: PatternFeedback[]): number => {
    // Recall is harder to calculate without knowing about missed patterns
    // For now, we'll use a placeholder implementation
    return 0.8; // 80% recall as placeholder
  };

  // Helper function to calculate F1 score
  const calculateF1Score = (accuracy: number, precision: number, recall: number): number => {
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
  };

  // Helper function to get parameters evolution
  const getParametersEvolution = (): LearningMetrics['parametersEvolution'] => {
    // This would be extracted from the feedback history
    // For now, we'll return a placeholder
    const allParams: Record<PatternType, PatternDetectionParameters> = {} as Record<PatternType, PatternDetectionParameters>;
    
    // Get parameters for each pattern type
    Object.values(PatternType).forEach(patternType => {
      allParams[patternType] = learningProcessor.getDetectionParameters(patternType);
    });
    
    return [{
      timestamp: Date.now(),
      parameters: allParams
    }];
  };

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
