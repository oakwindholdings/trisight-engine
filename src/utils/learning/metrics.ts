// src/utils/learning/metrics.ts
// Utility functions for learning metrics
// Provides calculations for pattern feedback statistics
import { PatternType } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';
import {
  LearningMetrics,
  PatternDetectionParameters
} from '../../models/LearningTypes';
import { LearningProcessor } from './LearningProcessor';
import { FeedbackAggregator } from './FeedbackAggregator';

export const calculateAverageConfidence = (
  distribution: Record<number, number>
): number => {
  const totalRatings = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (totalRatings === 0) return 0;

  const weightedSum = Object.entries(distribution).reduce(
    (sum, [rating, count]) => sum + parseInt(rating) * count,
    0
  );

  return weightedSum / totalRatings / 5;
};

export const calculateIncorporationRate = (_patternType: PatternType): number => {
  // Placeholder until real incorporation metrics are tracked
  return 0.75;
};

export const calculatePrecision = (feedback: PatternFeedback[]): number => {
  if (feedback.length === 0) return 0;
  const truePositives = feedback.filter(f => !f.falsePositive).length;
  return truePositives / feedback.length;
};

export const calculateRecall = (_feedback: PatternFeedback[]): number => {
  // Recall requires knowledge of missed patterns
  return 0.8;
};

export const calculateF1Score = (
  accuracy: number,
  precision: number,
  recall: number
): number => {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
};

export const getParametersEvolution = (
  processor: LearningProcessor
): LearningMetrics['parametersEvolution'] => {
  const allParams: Record<PatternType, PatternDetectionParameters> =
    {} as Record<PatternType, PatternDetectionParameters>;

  Object.values(PatternType).forEach(patternType => {
    allParams[patternType] = processor.getDetectionParameters(patternType);
  });

  return [
    {
      timestamp: Date.now(),
      parameters: allParams
    }
  ];
};

export const generateLearningMetrics = (
  allFeedback: PatternFeedback[],
  processor: LearningProcessor
): LearningMetrics => {
  const patternTypePerformance: Record<PatternType, {
    detectionCount: number;
    falsePositiveRate: number;
    averageConfidence: number;
    feedbackIncorporationRate: number;
    improvementTrend: number[];
  }> = {} as any;

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

  const totalFeedback = allFeedback.length;
  const falsePositives = allFeedback.filter(f => f.falsePositive).length;
  const accuracy = totalFeedback > 0 ? 1 - falsePositives / totalFeedback : 0;

  return {
    patternTypePerformance,
    accuracyByPatternType: Object.values(PatternType).reduce((acc, type) => {
      const typeFeedback = allFeedback.filter(f => f.originalPatternType === type);
      const fp = typeFeedback.filter(f => f.falsePositive).length;
      acc[type] = typeFeedback.length > 0 ? 1 - fp / typeFeedback.length : 0;
      return acc;
    }, {} as Record<PatternType, number>),
    feedbackCountByPatternType: Object.values(PatternType).reduce((acc, type) => {
      acc[type] = allFeedback.filter(f => f.originalPatternType === type).length;
      return acc;
    }, {} as Record<PatternType, number>),
    correctionsByType: (() => {
      const corrections = allFeedback.filter(
        f => f.correctedPatternType !== null && f.correctedPatternType !== f.originalPatternType
      );
      const correctionMap = new Map<string, { from: PatternType; to: PatternType; count: number }>();
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
      return Array.from(correctionMap.values()).sort((a, b) => b.count - a.count);
    })(),
    topContributors: (() => {
      const userGroups = new Map<string, PatternFeedback[]>();
      allFeedback.forEach(feedback => {
        if (!userGroups.has(feedback.userId)) {
          userGroups.set(feedback.userId, []);
        }
        userGroups.get(feedback.userId)!.push(feedback);
      });
      const contributors = Array.from(userGroups.entries()).map(([userId, feedbacks]) => {
        const feedbackCount = feedbacks.length;
        const accurateCount = feedbacks.filter(f => !f.falsePositive).length;
        const accuracyRate = feedbackCount > 0 ? accurateCount / feedbackCount : 0;
        return { userId, feedbackCount, accuracyRate };
      });
      return contributors.sort((a, b) => b.feedbackCount - a.feedbackCount);
    })(),
    overallPerformance: {
      accuracy,
      precision: calculatePrecision(allFeedback),
      recall: calculateRecall(allFeedback),
      f1Score: calculateF1Score(accuracy, calculatePrecision(allFeedback), calculateRecall(allFeedback))
    },
    parametersEvolution: getParametersEvolution(processor)
  };
};
