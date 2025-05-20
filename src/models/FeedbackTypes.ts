import { PatternType } from './PatternTypes';

export interface PatternFeedback {
  patternId: string;
  originalPatternType: PatternType;
  correctedPatternType: PatternType | null; // null if type is correct
  confidenceRating: number; // 1-5 scale
  boundaryAdjustment: {
    originalStart: Date;
    originalEnd: Date;
    correctedStart: Date | null; // null if unchanged
    correctedEnd: Date | null; // null if unchanged
  };
  // Channel adjustments for Goldmine Channel patterns
  channelAdjustment?: {
    originalUpperBoundary: number;
    originalLowerBoundary: number;
    correctedUpperBoundary: number | null; // null if unchanged
    correctedLowerBoundary: number | null; // null if unchanged
  };
  falsePositive: boolean;
  falsePositiveReason?: FalsePositiveReason; // Reason if marked as false positive
  notes: string;
  submittedAt: Date;
  userId: string;
}

export type FalsePositiveReason = 
  | 'NOT_A_PATTERN'
  | 'INSIGNIFICANT_MOVEMENT'
  | 'MARKET_NOISE'
  | 'EXTERNAL_EVENT'
  | 'OTHER';

export interface LearningMetrics {
  accuracyByPatternType: Record<PatternType, number>; // 0.0 to 1.0
  feedbackCountByPatternType: Record<PatternType, number>;
  falsePositiveRate: number; // 0.0 to 1.0
  correctionsByType: {
    from: PatternType;
    to: PatternType;
    count: number;
  }[];
  totalFeedbackCount: number;
  feedbackTrend: {
    date: Date;
    count: number;
  }[];
  topContributors: {
    userId: string;
    feedbackCount: number;
    accuracyRate: number;
  }[];
}

export interface PatternParameters {
  confidenceThreshold: number;
  timeframeWeights: Record<string, number>;
  detectionSensitivity: number;
  minPatternDuration: number;
  maxPatternDuration: number;
  additionalParams: Record<string, any>;
}

export interface LearningModelState {
  version: string;
  lastUpdated: Date;
  patternParameters: Record<PatternType, PatternParameters>;
  feedbackHistory: PatternFeedback[];
  metrics: LearningMetrics;
}
