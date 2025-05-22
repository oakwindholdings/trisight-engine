// src/utils/learning/FeedbackAggregator.ts
// Aggregates feedback statistics
// Supports learning metrics
import { PatternType } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { AggregatedFeedback } from '../../models/LearningTypes';

/**
 * Utility class to aggregate and analyze pattern feedback for learning insights
 */
export class FeedbackAggregator {
  /**
   * Aggregate feedback entries for a specific pattern type
   */
  public static aggregateByPatternType(
    feedbackEntries: PatternFeedback[],
    patternType: PatternType
  ): AggregatedFeedback {
    // Filter feedback for the specified pattern type
    const relevantFeedback = feedbackEntries.filter(
      fb => fb.originalPatternType === patternType || fb.correctedPatternType === patternType
    );
    
    if (relevantFeedback.length === 0) {
      return this.createEmptyAggregation(patternType);
    }
    
    // Calculate boundary adjustments
    const boundaryAdjustments = this.calculateBoundaryAdjustments(relevantFeedback);
    
    // Calculate confidence distribution
    const confidenceDistribution = this.calculateConfidenceDistribution(relevantFeedback);
    
    // Calculate false positive rate
    const falsePositiveCount = relevantFeedback.filter(fb => fb.falsePositive).length;
    const falsePositiveRate = falsePositiveCount / relevantFeedback.length;
    
    // Calculate type correction distribution
    const typeCorrectionDistribution = this.calculateTypeCorrectionDistribution(relevantFeedback);
    
    return {
      patternType,
      sampleCount: relevantFeedback.length,
      boundaryAdjustments,
      confidenceDistribution,
      falsePositiveRate,
      typeCorrectionDistribution
    };
  }
  
  /**
   * Calculate boundary adjustments from feedback
   */
  private static calculateBoundaryAdjustments(
    feedback: PatternFeedback[]
  ): AggregatedFeedback['boundaryAdjustments'] {
    // Filter feedback with boundary adjustments
    const feedbackWithAdjustments = feedback.filter(
      fb => fb.boundaryAdjustment.correctedStart || fb.boundaryAdjustment.correctedEnd
    );
    
    if (feedbackWithAdjustments.length === 0) {
      return {
        averageStartDelta: 0,
        averageEndDelta: 0,
        distribution: {}
      };
    }
    
    // Calculate start delta
    let totalStartDelta = 0;
    let startAdjustmentCount = 0;
    
    // Calculate end delta
    let totalEndDelta = 0;
    let endAdjustmentCount = 0;
    
    // Track distribution of adjustment sizes
    const distribution: Record<string, number> = {};
    
    for (const fb of feedbackWithAdjustments) {
      if (fb.boundaryAdjustment.correctedStart) {
        const startDelta = fb.boundaryAdjustment.correctedStart.getTime() - 
                          fb.boundaryAdjustment.originalStart.getTime();
        totalStartDelta += startDelta;
        startAdjustmentCount++;
        
        // Bucket start delta
        const startBucket = this.getBoundaryDeltaBucket(startDelta);
        distribution[startBucket] = (distribution[startBucket] || 0) + 1;
      }
      
      if (fb.boundaryAdjustment.correctedEnd) {
        const endDelta = fb.boundaryAdjustment.correctedEnd.getTime() - 
                        fb.boundaryAdjustment.originalEnd.getTime();
        totalEndDelta += endDelta;
        endAdjustmentCount++;
        
        // Bucket end delta
        const endBucket = this.getBoundaryDeltaBucket(endDelta);
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
  private static getBoundaryDeltaBucket(delta: number): string {
    // Convert delta to minutes for more human-readable buckets
    const deltaMinutes = Math.round(delta / (1000 * 60));
    
    if (deltaMinutes === 0) {
      return 'no_change';
    } else if (deltaMinutes > 0) {
      if (deltaMinutes <= 5) return 'expand_small';
      if (deltaMinutes <= 15) return 'expand_medium';
      return 'expand_large';
    } else {
      if (deltaMinutes >= -5) return 'contract_small';
      if (deltaMinutes >= -15) return 'contract_medium';
      return 'contract_large';
    }
  }
  
  /**
   * Calculate confidence distribution from feedback
   */
  private static calculateConfidenceDistribution(
    feedback: PatternFeedback[]
  ): Record<number, number> {
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
  
  /**
   * Calculate type correction distribution from feedback
   */
  private static calculateTypeCorrectionDistribution(
    feedback: PatternFeedback[]
  ): Record<PatternType, number> {
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
   * Create an empty aggregation result for a pattern type
   */
  private static createEmptyAggregation(patternType: PatternType): AggregatedFeedback {
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
   * Calculate improvement metrics based on feedback over time
   */
  public static calculateImprovementMetrics(
    feedbackEntries: PatternFeedback[],
    patternType: PatternType,
    timeInterval: 'day' | 'week' | 'month' = 'week'
  ): { timestamp: number; accuracy: number; confidence: number }[] {
    if (feedbackEntries.length === 0) {
      return [];
    }
    
    // Sort feedback by submission time
    const sortedFeedback = [...feedbackEntries]
      .filter(fb => fb.originalPatternType === patternType)
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
    
    if (sortedFeedback.length === 0) {
      return [];
    }
    
    // Group feedback by time intervals
    const groupedFeedback = this.groupFeedbackByTimeInterval(sortedFeedback, timeInterval);
    
    // Calculate metrics for each interval
    return Object.entries(groupedFeedback).map(([timestamp, feedbackGroup]) => {
      const tsNum = parseInt(timestamp, 10);
      
      // Calculate accuracy (1 - false positive rate)
      const falsePositiveCount = feedbackGroup.filter(fb => fb.falsePositive).length;
      const accuracy = 1 - (falsePositiveCount / feedbackGroup.length);
      
      // Calculate average confidence rating
      const totalConfidence = feedbackGroup.reduce((sum, fb) => sum + fb.confidenceRating, 0);
      const avgConfidence = totalConfidence / feedbackGroup.length / 5; // Normalize to 0-1
      
      return {
        timestamp: tsNum,
        accuracy,
        confidence: avgConfidence
      };
    });
  }
  
  /**
   * Group feedback by time interval
   */
  private static groupFeedbackByTimeInterval(
    feedback: PatternFeedback[],
    interval: 'day' | 'week' | 'month'
  ): Record<string, PatternFeedback[]> {
    const result: Record<string, PatternFeedback[]> = {};
    
    for (const fb of feedback) {
      const timestamp = this.getIntervalTimestamp(fb.submittedAt, interval);
      
      if (!result[timestamp]) {
        result[timestamp] = [];
      }
      
      result[timestamp].push(fb);
    }
    
    return result;
  }
  
  /**
   * Get interval timestamp (start of day/week/month)
   */
  private static getIntervalTimestamp(date: Date, interval: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    
    if (interval === 'day') {
      d.setHours(0, 0, 0, 0);
    } else if (interval === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
    } else if (interval === 'month') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    
    return d.getTime().toString();
  }
}
