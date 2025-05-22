// src/models/LearningTypes.ts
// Learning system data types
// Detection parameters and metrics
import { PatternType } from './PatternTypes';
import { PatternFeedback, FalsePositiveReason } from './FeedbackTypes';

/**
 * Parameters for pattern detection algorithms that can be adjusted by the learning system
 */
export interface PatternDetectionParameters {
  // Common parameters for all pattern types
  sensitivity: number;
  minConfidence: number;
  boundaryPadding: number;
  
  // Type-specific parameters
  typeSpecificParameters: Record<string, any>;
}

/**
 * Type-specific detection parameters
 */
export interface GoldmineChannelParameters {
  minTouchPoints: number;
  channelWidthFactor: number;
  minChannelDuration: number; // in ms
  maxSlopeAngle: number; // in degrees
}

export interface GoldmineShaftParameters {
  minThrustPercentage: number;
  maxRetracementPercentage: number;
  minThrustDuration: number; // in ms
  volumeConfirmationWeight: number;
}

export interface PivotParameters {
  minTouchPoints: number;
  significanceThreshold: number;
  pivotLevelTolerance: number; // percentage
  minTimeBetweenPivots: number; // in ms
}

export interface RocketmanParameters {
  minAccelerationRate: number;
  minIntensity: number;
  curveFitTolerance: number;
  volumeIncreaseThreshold: number;
}

export interface EscalatorParameters {
  minStepCount: number;
  minStepDuration: number; // in ms
  minStepHeight: number; // percentage
  maxConsolidationDeviation: number; // percentage
}

export interface BlackjackParameters {
  minScore: number;
  priceVolumeCorrelationThreshold: number;
  minConsecutiveMatches: number;
  patternCorrelationWeight: number;
}

/**
 * Aggregated feedback metrics for learning
 */
export interface AggregatedFeedback {
  patternType: PatternType;
  sampleCount: number;
  boundaryAdjustments: {
    averageStartDelta: number; // in ms
    averageEndDelta: number; // in ms
    distribution: Record<string, number>; // histogram of adjustment sizes
  };
  confidenceDistribution: Record<number, number>; // key is confidence rating 1-5
  falsePositiveRate: number;
  typeCorrectionDistribution: Record<PatternType, number>;
}

/**
 * Results from processing feedback through the learning system
 */
export interface ProcessingResult {
  impactScore: number; // How much this feedback influenced the model (0-1)
  updatedParameters: PatternDetectionParameters;
  beforeAfterComparison?: PatternDetectionComparison;
}

/**
 * Comparison of pattern detection before and after parameter adjustments
 */
export interface PatternDetectionComparison {
  originalDetections: number;
  newDetections: number;
  removedPatterns: number;
  addedPatterns: number;
  modifiedPatterns: number;
  confidenceChangeAverage: number;
}

/**
 * History of feedback for a specific pattern
 */
export interface PatternFeedbackHistory {
  patternId: string;
  feedbackEntries: PatternFeedback[];
  patternEvolution: {
    version: string;
    parameters: PatternDetectionParameters;
    timestamp: number;
  }[];
}

/**
 * Learning system metrics for visualization and analysis
 */
export interface LearningMetrics {
  patternTypePerformance: Record<PatternType, {
    detectionCount: number;
    falsePositiveRate: number;
    averageConfidence: number;
    feedbackIncorporationRate: number;
    improvementTrend: number[]; // historical progression
  }>;
  accuracyByPatternType: Record<PatternType, number>; // Pattern-specific accuracy metrics for charts
  feedbackCountByPatternType: Record<PatternType, number>; // Count of feedback by pattern type
  correctionsByType: {
    from: PatternType;
    to: PatternType;
    count: number;
  }[]; // Pattern type corrections
  topContributors: {
    userId: string;
    feedbackCount: number;
    accuracyRate: number;
  }[]; // Top contributors to the learning system
  overallPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  parametersEvolution: {
    timestamp: number;
    parameters: Record<PatternType, PatternDetectionParameters>;
  }[];
}

/**
 * Enhanced feedback model with additional fields for learning
 */
export interface EnhancedPatternFeedback extends Omit<PatternFeedback, 'boundaryAdjustment'> {
  // Override and extend boundary adjustment
  boundaryAdjustment: {
    originalStart: Date;
    originalEnd: Date;
    correctedStart: Date | null;
    correctedEnd: Date | null;
    adjustmentReason?: string;
  };
  
  // Additional learning-focused fields
  confidenceRationale?: string;
  falsePositiveReason?: FalsePositiveReason;
  correctionRationale?: string;
  
  // Context data for improved learning
  contextData: {
    marketCondition: string;
    volatilityLevel: number;
    tradingVolume: number;
    timeframe: string;
  };
}
