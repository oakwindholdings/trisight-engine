// src/utils/learning/LearningProcessor.ts
// Processes pattern feedback to update detection parameters
// Implements adaptive learning for pattern detection
import { PatternType } from '../../models/PatternTypes';
import { PatternFeedback, LegacyPatternFeedback } from '../../models/FeedbackTypes';
import { 
  PatternDetectionParameters,
  GoldmineChannelParameters,
  GoldmineShaftParameters,
  PivotParameters,
  RocketmanParameters,
  EscalatorParameters,
  BlackjackParameters,
  AggregatedFeedback,
  ProcessingResult
} from '../../models/LearningTypes';

/**
 * LearningProcessor class that handles processing feedback and adjusting pattern detection parameters
 */
export class LearningProcessor {
  private detectionParameters: Record<PatternType, PatternDetectionParameters>;
  private feedbackHistory: PatternFeedback[] = [];
  private version: string = '1.0.0';
  
  constructor(initialParameters?: Record<PatternType, PatternDetectionParameters>) {
    this.detectionParameters = initialParameters || this.getDefaultParameters();
  }
  
  /**
   * Process a single feedback entry and adjust parameters accordingly
   */
  public processFeedback(feedback: LegacyPatternFeedback): ProcessingResult {
    // Store feedback for aggregation
    this.feedbackHistory.push(feedback);
    
    // Get current parameters for the pattern type
    const currentParams = this.detectionParameters[feedback.originalPatternType];
    
    // Create a copy of the parameters to modify
    const updatedParams = this.copyParameters(currentParams);
    
    // Impact score starts at 0.5 (neutral)
    let impactScore = 0.5;
    
    // Process based on feedback type
    if (feedback.falsePositive) {
      // If false positive, increase sensitivity threshold to reduce false positives
      updatedParams.minConfidence = Math.min(0.9, updatedParams.minConfidence + 0.05);
      impactScore = 0.7;
    } else {
      // Process boundary adjustments
      if (feedback.boundaryAdjustment.correctedStart || feedback.boundaryAdjustment.correctedEnd) {
        this.processBoundaryAdjustment(updatedParams, feedback);
        impactScore += 0.1;
      }
      
      // Process pattern type corrections
      if (feedback.correctedPatternType && feedback.correctedPatternType !== feedback.originalPatternType) {
        this.processTypeCorrection(updatedParams, feedback);
        impactScore += 0.2;
      }
      
      // Process confidence rating
      this.processConfidenceRating(updatedParams, feedback);
      impactScore += 0.1;
    }
    
    // Update parameters for the pattern type
    this.detectionParameters[feedback.originalPatternType] = updatedParams;
    
    // Return the result
    return {
      impactScore,
      updatedParameters: updatedParams,
    };
  }

  public processBatch(feedbackBatch: PatternFeedback[]): ProcessingResult[] {
    return feedbackBatch.map(fb => this.processFeedback(fb));
  }
  
  /**
   * Process boundary adjustments from feedback
   */
  private processBoundaryAdjustment(
    params: PatternDetectionParameters, 
    feedback: PatternFeedback
  ): void {
    const originalStart = feedback.boundaryAdjustment?.originalStart?.getTime() ?? 0;
    const originalEnd = feedback.boundaryAdjustment?.originalEnd?.getTime() ?? 0;
    
    // Calculate adjustment percentages for start and end
    if (feedback.boundaryAdjustment?.correctedStart) {
      const correctedStart = feedback.boundaryAdjustment.correctedStart.getTime();
      const startDiff = correctedStart - originalStart;
      const startAdjustmentPercentage = Math.abs(startDiff / (originalEnd - originalStart));
      
      if (startAdjustmentPercentage > 0.3) {
        // Large adjustment on start boundary - increase padding
        params.boundaryPadding = Math.min(0.5, params.boundaryPadding * 1.2);
      } else if (startAdjustmentPercentage < 0.05) {
        // Small adjustment, slightly decrease padding
        params.boundaryPadding = Math.max(0.05, params.boundaryPadding * 0.9);
      }
    }

    if (feedback.boundaryAdjustment?.correctedEnd) {
      const correctedEnd = feedback.boundaryAdjustment.correctedEnd.getTime();
      const endDiff = correctedEnd - originalEnd;
      const endAdjustmentPercentage = Math.abs(endDiff / (originalEnd - originalStart));
      
      if (endAdjustmentPercentage > 0.3) {
        // Large adjustment on end boundary - increase padding
        params.boundaryPadding = Math.min(0.5, params.boundaryPadding * 1.2);
      } else if (endAdjustmentPercentage < 0.05) {
        // Small adjustment, slightly decrease padding
        params.boundaryPadding = Math.max(0.05, params.boundaryPadding * 0.9);
      }
    }
  }
  
  /**
   * Process pattern type corrections from feedback
   */
  private processTypeCorrection(
    params: PatternDetectionParameters, 
    feedback: PatternFeedback
  ): void {
    // Decrease confidence threshold slightly to be more inclusive
    params.minConfidence = Math.max(0.3, params.minConfidence - 0.05);
    
    // Future enhancement: Analyze pattern characteristics to understand why it was misclassified
  }
  
  /**
   * Process confidence ratings from feedback
   */
  private processConfidenceRating(
    params: PatternDetectionParameters, 
    feedback: PatternFeedback
  ): void {
    // Scale is 1-5, convert to 0-1 scale
    const normalizedRating = (feedback.confidenceRating - 1) / 4;
    
    // If user confidence is higher than current threshold, slightly decrease threshold
    if (normalizedRating < 0.4) {
      params.minConfidence = Math.min(0.9, params.minConfidence + 0.02);
    } 
    // If user confidence is lower than current threshold, slightly increase threshold
    else if (normalizedRating > 0.8) {
      params.minConfidence = Math.max(0.3, params.minConfidence - 0.02);
    }
    
    // Adjust sensitivity based on confidence rating
    if (feedback.confidenceRating <= 2) {
      // Low confidence, decrease sensitivity
      params.sensitivity = Math.max(0.1, params.sensitivity - 0.05);
    } else if (feedback.confidenceRating >= 4) {
      // High confidence, increase sensitivity
      params.sensitivity = Math.min(1.0, params.sensitivity + 0.05);
    }
  }

  private static adjustPatternConfidenceThresholds(
    feedback: PatternFeedback,
    params: PatternDetectionParameters
  ): void {
    // Scale is 1-5, convert to 0-1 scale
    const normalizedRating = ((feedback.confidenceRating ?? 3) - 1) / 4;

    // If user confidence is higher than current threshold, slightly decrease threshold
    if (normalizedRating < 0.4) {
      // Low confidence, increase threshold
      params.minConfidence = Math.min(0.9, params.minConfidence + 0.05);
    } else if (normalizedRating > 0.8) {
      // High confidence, decrease threshold slightly
      params.minConfidence = Math.max(0.3, params.minConfidence - 0.02);
    }

    // Adjust sensitivity based on confidence rating
    const rating = feedback.confidenceRating ?? 3;
    if (rating <= 2) {
      // Low confidence, decrease sensitivity
      params.sensitivity = Math.max(0.1, params.sensitivity - 0.05);
    } else if (rating >= 4) {
      // High confidence, increase sensitivity
      params.sensitivity = Math.min(1.0, params.sensitivity + 0.05);
    }
  }
  
  /**
   * Adjust boundary padding based on user feedback
   */
  private adjustBoundaryPadding(
    currentPadding: number, 
    adjustmentPercentage: number,
    isExpanding: boolean
  ): number {
    // If expanding, increase padding
    if (isExpanding) {
      return Math.min(0.2, currentPadding + (adjustmentPercentage * 0.05));
    } 
    // If contracting, decrease padding
    else {
      return Math.max(0.01, currentPadding - (adjustmentPercentage * 0.05));
    }
  }
  
  /**
   * Get current parameters for a pattern type
   */
  public getDetectionParameters(patternType: PatternType): PatternDetectionParameters {
    return this.detectionParameters[patternType];
  }
  
  /**
   * Update detection parameters for a pattern type
   */
  public updateDetectionParameters(
    patternType: PatternType, 
    parameters: Partial<PatternDetectionParameters>
  ): void {
    this.detectionParameters[patternType] = {
      ...this.detectionParameters[patternType],
      ...parameters
    };
  }
  
  /**
   * Aggregate feedback for a pattern type
   */
  public aggregateFeedback(patternType: PatternType): AggregatedFeedback {
    // Filter feedback for the specified pattern type
    const relevantFeedback = this.feedbackHistory.filter(
      fb => fb.originalPatternType === patternType || fb.correctedPatternType === patternType
    );
    
    // Count total samples
    const sampleCount = relevantFeedback.length;
    
    if (sampleCount === 0) {
      return this.getEmptyAggregatedFeedback(patternType);
    }
    
    // Calculate boundary adjustments
    const boundaryAdjustments = this.calculateBoundaryAdjustments(relevantFeedback);
    
    // Calculate confidence distribution
    const confidenceDistribution = this.calculateConfidenceDistribution(relevantFeedback);
    
    // Calculate false positive rate
    const falsePositiveCount = relevantFeedback.filter(fb => fb.falsePositive).length;
    const falsePositiveRate = falsePositiveCount / sampleCount;
    
    // Calculate type correction distribution
    const typeCorrectionDistribution = this.calculateTypeCorrectionDistribution(relevantFeedback);
    
    return {
      patternType,
      sampleCount,
      boundaryAdjustments,
      confidenceDistribution,
      falsePositiveRate,
      typeCorrectionDistribution
    };
  }
  
  /**
   * Calculate boundary adjustments from feedback
   */
  private calculateBoundaryAdjustments(feedback: PatternFeedback[]): AggregatedFeedback['boundaryAdjustments'] {
    // Filter feedback with boundary adjustments
    const feedbackWithAdjustments = feedback.filter(
      fb => fb.boundaryAdjustment && (fb.boundaryAdjustment.correctedStart || fb.boundaryAdjustment.correctedEnd)
    );
    
    if (feedbackWithAdjustments.length === 0) {
      return {
        averageStartDelta: 0,
        averageEndDelta: 0,
        distribution: {}
      };
    }
    
    let totalStartDelta = 0;
    let totalEndDelta = 0;
    let startAdjustmentCount = 0;
    let endAdjustmentCount = 0;
    const distribution: Record<string, number> = {};

    for (const fb of feedbackWithAdjustments) {
      if (fb.boundaryAdjustment?.correctedStart) {
        const startDelta = fb.boundaryAdjustment.correctedStart.getTime() -
                          fb.boundaryAdjustment.originalStart.getTime();
        totalStartDelta += startDelta;
        startAdjustmentCount++;

        // Bucket start delta
        const startBucket = this.getBoundaryDeltaBucket(startDelta, fb.boundaryAdjustment.originalEnd.getTime() - fb.boundaryAdjustment.originalStart.getTime());
        distribution[startBucket] = (distribution[startBucket] || 0) + 1;
      }

      if (fb.boundaryAdjustment?.correctedEnd) {
        const endDelta = fb.boundaryAdjustment.correctedEnd.getTime() -
                        fb.boundaryAdjustment.originalEnd.getTime();
        totalEndDelta += endDelta;
        endAdjustmentCount++;

        // Bucket end delta
        const endBucket = this.getBoundaryDeltaBucket(endDelta, fb.boundaryAdjustment.originalEnd.getTime() - fb.boundaryAdjustment.originalStart.getTime());
        distribution[endBucket] = (distribution[endBucket] || 0) + 1;
      }
    }
    
    return {
      averageStartDelta: startAdjustmentCount > 0 ? totalStartDelta / startAdjustmentCount : 0,
      averageEndDelta: endAdjustmentCount > 0 ? totalEndDelta / endAdjustmentCount : 0,
      distribution
    };
  }
  
  /**
   * Get bucket name for boundary delta
   */
  private getBoundaryDeltaBucket(delta: number, totalDuration: number): string {
    // Convert delta to minutes for more human-readable buckets
    const deltaPercentage = Math.abs(delta / totalDuration) * 100;
    
    if (deltaPercentage === 0) {
      return 'No change';
    } else if (delta > 0) {
      if (deltaPercentage > 20) return 'Large expansion (> 20%)';
      if (deltaPercentage > 5) return 'Small expansion (5-20%)';
      return 'No change';
    } else {
      if (deltaPercentage > 20) return 'Large reduction (> 20%)';
      if (deltaPercentage > 5) return 'Small reduction (5-20%)';
      return 'No change';
    }
  }
  
  /**
   * Calculate confidence distribution from feedback
   */
  private calculateConfidenceDistribution(feedback: PatternFeedback[]): Record<number, number> {
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    for (const fb of feedback) {
      distribution[fb.confidenceRating] = (distribution[fb.confidenceRating] || 0) + 1;
    }
    
    return distribution;
  }

  private static analyzeConfidenceDistribution(feedback: PatternFeedback[]): Record<number, number> {
    const distribution: Record<number, number> = {};

    for (const fb of feedback) {
      const rating = fb.confidenceRating ?? 3; // Default to neutral
      if (rating) {
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    }

    return distribution;
  }
  
  /**
   * Calculate type correction distribution from feedback
   */
  private calculateTypeCorrectionDistribution(feedback: PatternFeedback[]): Record<PatternType, number> {
    const distribution: Partial<Record<PatternType, number>> = {};
    
    // Initialize all pattern types with 0
    Object.values(PatternType).forEach(type => {
      distribution[type] = 0;
    });
    
    // Count corrections to each pattern type
    for (const fb of feedback) {
      if (fb.correctedPatternType && fb.correctedPatternType !== fb.originalPatternType) {
        distribution[fb.correctedPatternType] = (distribution[fb.correctedPatternType] || 0) + 1;
      }
    }
    
    return distribution as Record<PatternType, number>;
  }
  
  /**
   * Get empty aggregated feedback structure
   */
  private getEmptyAggregatedFeedback(patternType: PatternType): AggregatedFeedback {
    const emptyConfidenceDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    const emptyTypeCorrectionDistribution: Partial<Record<PatternType, number>> = {};
    
    // Initialize all pattern types with 0
    Object.values(PatternType).forEach(type => {
      emptyTypeCorrectionDistribution[type] = 0;
    });
    
    return {
      patternType,
      sampleCount: 0,
      boundaryAdjustments: {
        averageStartDelta: 0,
        averageEndDelta: 0,
        distribution: {}
      },
      confidenceDistribution: emptyConfidenceDistribution,
      falsePositiveRate: 0,
      typeCorrectionDistribution: emptyTypeCorrectionDistribution as Record<PatternType, number>
    };
  }
  
  /**
   * Create a deep copy of parameters
   */
  private copyParameters(params: PatternDetectionParameters): PatternDetectionParameters {
    return JSON.parse(JSON.stringify(params));
  }
  
  /**
   * Get default parameters for all pattern types
   */
  private getDefaultParameters(): Record<PatternType, PatternDetectionParameters> {
    return {
      [PatternType.GOLDMINE_CHANNEL]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultGoldmineChannelParameters()
      },
      [PatternType.GOLDMINE_SHAFT]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultGoldmineShaftParameters()
      },
      [PatternType.PIVOT]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultPivotParameters()
      },
      [PatternType.ROCKETMAN]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultRocketmanParameters()
      },
      [PatternType.ESCALATOR]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultEscalatorParameters()
      },
      [PatternType.BLACKJACK]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultBlackjackParameters()
      },
      [PatternType.BREAKOUTBOX]: {
        sensitivity: 0.5,
        minConfidence: 0.6,
        boundaryPadding: 0.05,
        typeSpecificParameters: this.getDefaultBreakoutBoxParameters()
      },
      [PatternType.GOLDEN_CANDLE]: {
        sensitivity: 0.5,
        minConfidence: 0.7,
        boundaryPadding: 0.02,
        typeSpecificParameters: {} // Golden Candle uses internal Blackjack parameters
      }
    };
  }
  
  /**
   * Get default GoldmineChannel parameters
   */
  private getDefaultGoldmineChannelParameters(): GoldmineChannelParameters {
    return {
      minTouchPoints: 3,
      channelWidthFactor: 0.05,
      minChannelDuration: 15 * 60 * 1000, // 15 minutes
      maxSlopeAngle: 30
    };
  }
  
  /**
   * Get default GoldmineShaft parameters
   */
  private getDefaultGoldmineShaftParameters(): GoldmineShaftParameters {
    return {
      minThrustPercentage: 0.02,
      maxRetracementPercentage: 0.5,
      minThrustDuration: 5 * 60 * 1000, // 5 minutes
      volumeConfirmationWeight: 0.3
    };
  }
  
  /**
   * Get default Pivot parameters
   */
  private getDefaultPivotParameters(): PivotParameters {
    return {
      minTouchPoints: 2,
      significanceThreshold: 0.01,
      pivotLevelTolerance: 0.005,
      minTimeBetweenPivots: 10 * 60 * 1000 // 10 minutes
    };
  }
  
  /**
   * Get default Rocketman parameters
   */
  private getDefaultRocketmanParameters(): RocketmanParameters {
    return {
      minAccelerationRate: 0.1,
      minIntensity: 0.4,
      curveFitTolerance: 0.03,
      volumeIncreaseThreshold: 0.5
    };
  }
  
  /**
   * Get default Escalator parameters
   */
  private getDefaultEscalatorParameters(): EscalatorParameters {
    return {
      minStepCount: 2,
      minStepDuration: 5 * 60 * 1000, // 5 minutes
      minStepHeight: 0.01,
      maxConsolidationDeviation: 0.005
    };
  }
  
  /**
   * Get default Blackjack parameters
   */
  private getDefaultBlackjackParameters(): BlackjackParameters {
    return {
      minScore: 12,
      priceVolumeCorrelationThreshold: 0.7,
      minConsecutiveMatches: 3,
      patternCorrelationWeight: 0.5
    };
  }
  
  /**
   * Get default BreakoutBox parameters
   */
  private getDefaultBreakoutBoxParameters(): {
    minStallLength: number;
    breakoutMultiplier: number;
    stallThreshold: number;
  } {
    return {
      minStallLength: 3,        // Default: 3 candles minimum stall length
      breakoutMultiplier: 0.5,  // Default: 0.5 breakout multiplier
      stallThreshold: 0.1       // Default: 0.1 (10%) stall threshold
    };
  }
}
