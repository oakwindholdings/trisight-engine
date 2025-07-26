// src/utils/learning/metrics.ts
// Metrics calculation utilities for learning system
// Processes feedback to generate performance metrics

import { PatternFeedback } from '../../models/FeedbackTypes';
import { PatternType } from '../../models/PatternTypes';
import { LearningMetrics, PatternDetectionParameters } from '../../models/LearningTypes';
import { LearningProcessor } from './LearningProcessor';



export const calculateAverageConfidence = (
  feedback: PatternFeedback[],
  patternType?: PatternType
): number => {
  const relevantFeedback = patternType
    ? feedback.filter(f => f.patternType === patternType)
    : feedback;
  
  if (relevantFeedback.length === 0) return 0;
  
  const sum = relevantFeedback.reduce((acc, f) => acc + f.confidence, 0);
  return sum / relevantFeedback.length;
};

export const calculateIncorporationRate = (
  feedback: PatternFeedback[],
  processor: LearningProcessor
): number => {
  // For now, return a mock value
  // TODO: Implement actual incorporation rate calculation
  return 0.75;
};

export const calculatePrecision = (feedback: PatternFeedback[]): number => {
  if (feedback.length === 0) return 0;
  const truePositives = feedback.filter(f => {
    if (f.falsePositive !== undefined) {
      return !f.falsePositive;
    }
    return f.isValid;
  }).length;
  return truePositives / feedback.length;
};

export const calculateRecall = (
  feedback: PatternFeedback[],
  patternType?: PatternType
): number => {
  // For now, return a mock value
  // TODO: Implement actual recall calculation
  return 0.68;
};

export const calculateF1Score = (precision: number, recall: number): number => {
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
};

export const getParametersEvolution = (
  processor: LearningProcessor,
  patternType: PatternType
): Array<{ timestamp: Date; parameters: PatternDetectionParameters }> => {
  // For now, return a mock evolution
  // TODO: Implement actual parameter evolution tracking
  return [];
};

export const generateLearningMetrics = (
  allFeedback: PatternFeedback[],
  processor: LearningProcessor
): LearningMetrics => {
  // Calculate performance metrics for each pattern type
  const patternTypePerformance = Object.values(PatternType).reduce((acc, type) => {
    const typeFeedback = allFeedback.filter(f => f.patternType === type);
    const precision = calculatePrecision(typeFeedback);
    const recall = calculateRecall(typeFeedback, type);
    
    acc[type] = {
      precision,
      recall,
      f1Score: calculateF1Score(precision, recall),
      feedbackCount: typeFeedback.length,
      averageConfidence: calculateAverageConfidence(typeFeedback),
      incorporationRate: calculateIncorporationRate(typeFeedback, processor),
      lastUpdated: typeFeedback.length > 0 
        ? new Date(Math.max(...typeFeedback.map(f => f.updatedAt.getTime())))
        : undefined,
      parametersEvolution: getParametersEvolution(processor, type),
      learningTrend: 'improving' // Mock for now
    };
    
    return acc;
  }, {} as Record<PatternType, any>);

  const totalFeedback = allFeedback.length;
  const falsePositives = allFeedback.filter(f => {
    if (f.falsePositive !== undefined) {
      return f.falsePositive;
    }
    return !f.isValid;
  }).length;
  const accuracy = totalFeedback > 0 ? 1 - falsePositives / totalFeedback : 0;

  return {
    patternTypePerformance,
    accuracyByPatternType: Object.values(PatternType).reduce((acc, type) => {
      const typeFeedback = allFeedback.filter(f => {
        if (f.originalPatternType !== undefined) {
          return f.originalPatternType === type;
        }
        return f.patternType === type;
      });
      const fp = typeFeedback.filter(f => {
        if (f.falsePositive !== undefined) {
          return f.falsePositive;
        }
        return !f.isValid;
      }).length;
      acc[type] = typeFeedback.length > 0 ? 1 - fp / typeFeedback.length : 0;
      return acc;
    }, {} as Record<PatternType, number>),
    feedbackCountByPatternType: Object.values(PatternType).reduce((acc, type) => {
      acc[type] = allFeedback.filter(f => {
        if (f.originalPatternType !== undefined) {
          return f.originalPatternType === type;
        }
        return f.patternType === type;
      }).length;
      return acc;
    }, {} as Record<PatternType, number>),
    correctionsByType: (() => {
      const corrections = allFeedback.filter(f => {
        return f.correctedPatternType !== undefined && 
               f.correctedPatternType !== null && 
               f.correctedPatternType !== f.originalPatternType;
      });
      const correctionMap = new Map<string, { from: PatternType; to: PatternType; count: number }>();
      corrections.forEach(feedback => {
        if (feedback.originalPatternType && feedback.correctedPatternType) {
          const key = `${feedback.originalPatternType}-${feedback.correctedPatternType}`;
          if (!correctionMap.has(key)) {
            correctionMap.set(key, {
              from: feedback.originalPatternType,
              to: feedback.correctedPatternType as PatternType,
              count: 0
            });
          }
          correctionMap.get(key)!.count++;
        }
      });
      return Array.from(correctionMap.values());
    })(),
    topContributors: (() => {
      const userGroups = new Map<string, PatternFeedback[]>();
      allFeedback.forEach(feedback => {
        const userId = feedback.userId || 'anonymous';
        if (!userGroups.has(userId)) {
          userGroups.set(userId, []);
        }
        userGroups.get(userId)!.push(feedback);
      });
      const contributors = Array.from(userGroups.entries()).map(([userId, feedbacks]) => {
        const feedbackCount = feedbacks.length;
        const accurateCount = feedbacks.filter(f => {
          if (f.falsePositive !== undefined) {
            return !f.falsePositive;
          }
          return f.isValid;
        }).length;
        const accuracyRate = feedbackCount > 0 ? accurateCount / feedbackCount : 0;
        return { userId, feedbackCount, accuracyRate };
      });
      return contributors.sort((a, b) => b.feedbackCount - a.feedbackCount);
    })(),
    overallPerformance: {
      accuracy,
      precision: calculatePrecision(allFeedback),
      recall: calculateRecall(allFeedback),
      f1Score: calculateF1Score(calculatePrecision(allFeedback), calculateRecall(allFeedback))
    },
          parametersEvolution: [] // TODO: Implement parameters evolution tracking
  };
};
