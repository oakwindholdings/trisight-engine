// src/services/PatternLearningEngine.ts
// Learning engine that processes user feedback to improve pattern detection
// Implements feedback buffer, metric calculation, and model updates

import { 
  PatternFeedback, 
  FeedbackMetrics, 
  FeedbackAccuracy, 
  TimingAssessment,
  InvalidityReason 
} from '../models/FeedbackTypes';
import { PatternType } from '../models/PatternTypes';
import { logDebug } from '../utils/debug';

interface FeedbackBuffer {
  patternId: string;
  feedbacks: PatternFeedback[];
  lastProcessed: Date;
}

interface PatternLearningMetrics {
  patternType: PatternType;
  averageAccuracy: number;
  confidenceAdjustment: number;
  timingAdjustment: number;
  validityRate: number;
  sampleSize: number;
}

interface ModelUpdateRequest {
  patternType: PatternType;
  adjustments: {
    confidenceMultiplier: number;
    timingOffsetMs: number;
    enablePattern: boolean;
    customThresholds?: Record<string, number>;
  };
  reason: string;
  metrics: PatternLearningMetrics;
}

export class PatternLearningEngine {
  private feedbackBuffer: Map<string, FeedbackBuffer> = new Map();
  private processingThreshold = 10; // Process after 10 feedbacks
  private minSampleSize = 5; // Minimum feedbacks for meaningful metrics
  private modelVersion = '1.0.0';
  
  constructor() {
    logDebug('learning', 'PatternLearningEngine initialized');
  }
  
  /**
   * Add feedback to the buffer for processing
   */
  public addFeedback(feedback: PatternFeedback): void {
    const buffer = this.feedbackBuffer.get(feedback.patternId) || {
      patternId: feedback.patternId,
      feedbacks: [],
      lastProcessed: new Date()
    };
    
    buffer.feedbacks.push(feedback);
    this.feedbackBuffer.set(feedback.patternId, buffer);
    
    logDebug('learning', 'Feedback added to buffer', {
      patternId: feedback.patternId,
      bufferSize: buffer.feedbacks.length,
      threshold: this.processingThreshold
    });
    
    // Check if we should process this pattern's feedback
    if (buffer.feedbacks.length >= this.processingThreshold) {
      this.processPatternFeedback(feedback.patternId);
    }
  }
  
  /**
   * Process feedback for a specific pattern
   */
  private processPatternFeedback(patternId: string): void {
    const buffer = this.feedbackBuffer.get(patternId);
    if (!buffer || buffer.feedbacks.length < this.minSampleSize) {
      return;
    }
    
    logDebug('learning', 'Processing feedback batch', {
      patternId,
      feedbackCount: buffer.feedbacks.length
    });
    
    // Calculate metrics
    const metrics = this.calculateMetrics(buffer.feedbacks);
    
    // Determine if model update is needed
    const updateRequest = this.evaluateModelUpdate(metrics);
    
    if (updateRequest) {
      this.applyModelUpdate(updateRequest);
    }
    
    // Clear processed feedback
    buffer.feedbacks = [];
    buffer.lastProcessed = new Date();
    this.feedbackBuffer.set(patternId, buffer);
  }
  
  /**
   * Calculate aggregated metrics from feedback
   */
  public calculateAverageAccuracy(feedbacks: PatternFeedback[]): number {
    if (feedbacks.length === 0) return 0;
    
    const sum = feedbacks.reduce((acc, f) => acc + f.accuracy, 0);
    return sum / feedbacks.length;
  }
  
  /**
   * Calculate timing adjustment based on feedback
   */
  public calculateTimingAdjustment(feedbacks: PatternFeedback[]): number {
    const timingScores: Record<TimingAssessment, number> = {
      [TimingAssessment.TOO_EARLY]: -2,
      [TimingAssessment.SLIGHTLY_EARLY]: -1,
      [TimingAssessment.PERFECT]: 0,
      [TimingAssessment.SLIGHTLY_LATE]: 1,
      [TimingAssessment.TOO_LATE]: 2
    };
    
    const weightedSum = feedbacks.reduce((sum, f) => {
      const score = timingScores[f.timing] || 0;
      const weight = f.confidence / 100; // Use confidence as weight
      return sum + (score * weight);
    }, 0);
    
    const totalWeight = feedbacks.reduce((sum, f) => sum + (f.confidence / 100), 0);
    
    // Return adjustment in milliseconds (each unit = 100ms)
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  }
  
  /**
   * Calculate validity rate from feedback
   */
  public calculateValidityRate(feedbacks: PatternFeedback[]): number {
    if (feedbacks.length === 0) return 1;
    
    const validCount = feedbacks.filter(f => f.isValid).length;
    return validCount / feedbacks.length;
  }
  
  /**
   * Calculate new confidence threshold based on feedback
   */
  public calculateNewConfidenceThreshold(
    currentThreshold: number,
    feedbacks: PatternFeedback[]
  ): number {
    const avgAccuracy = this.calculateAverageAccuracy(feedbacks);
    const validityRate = this.calculateValidityRate(feedbacks);
    
    // If accuracy is low or validity is poor, increase threshold
    if (avgAccuracy < FeedbackAccuracy.NEUTRAL || validityRate < 0.5) {
      return Math.min(currentThreshold * 1.1, 0.95); // Cap at 95%
    }
    
    // If accuracy is high and validity is good, decrease threshold
    if (avgAccuracy >= FeedbackAccuracy.ACCURATE && validityRate > 0.8) {
      return Math.max(currentThreshold * 0.9, 0.3); // Floor at 30%
    }
    
    return currentThreshold; // No change
  }
  
  /**
   * Calculate comprehensive metrics from feedback batch
   */
  private calculateMetrics(feedbacks: PatternFeedback[]): PatternLearningMetrics {
    const patternType = feedbacks[0].patternType;
    const avgAccuracy = this.calculateAverageAccuracy(feedbacks);
    const validityRate = this.calculateValidityRate(feedbacks);
    const timingAdjustment = this.calculateTimingAdjustment(feedbacks);
    
    // Calculate confidence adjustment based on accuracy
    let confidenceAdjustment = 1.0;
    if (avgAccuracy < FeedbackAccuracy.NEUTRAL) {
      confidenceAdjustment = 0.8; // Reduce confidence by 20%
    } else if (avgAccuracy > FeedbackAccuracy.ACCURATE) {
      confidenceAdjustment = 1.1; // Increase confidence by 10%
    }
    
    return {
      patternType,
      averageAccuracy: avgAccuracy,
      confidenceAdjustment,
      timingAdjustment,
      validityRate,
      sampleSize: feedbacks.length
    };
  }
  
  /**
   * Evaluate if model update is needed based on metrics
   */
  private evaluateModelUpdate(metrics: PatternLearningMetrics): ModelUpdateRequest | null {
    const reasons: string[] = [];
    const adjustments: ModelUpdateRequest['adjustments'] = {
      confidenceMultiplier: 1.0,
      timingOffsetMs: 0,
      enablePattern: true
    };
    
    // Check if pattern should be disabled due to low validity
    if (metrics.validityRate < 0.3) {
      adjustments.enablePattern = false;
      reasons.push(`Low validity rate: ${(metrics.validityRate * 100).toFixed(0)}%`);
    }
    
    // Apply confidence adjustment if significant
    if (Math.abs(metrics.confidenceAdjustment - 1.0) > 0.05) {
      adjustments.confidenceMultiplier = metrics.confidenceAdjustment;
      reasons.push(`Confidence adjustment: ${((metrics.confidenceAdjustment - 1) * 100).toFixed(0)}%`);
    }
    
    // Apply timing adjustment if significant
    if (Math.abs(metrics.timingAdjustment) > 50) {
      adjustments.timingOffsetMs = metrics.timingAdjustment;
      reasons.push(`Timing adjustment: ${metrics.timingAdjustment}ms`);
    }
    
    // Custom adjustments for low accuracy patterns
    if (metrics.averageAccuracy < FeedbackAccuracy.INACCURATE) {
      adjustments.customThresholds = {
        minPatternLength: 5, // Require longer patterns
        minConfidence: 0.7   // Require higher confidence
      };
      reasons.push('Increased thresholds due to low accuracy');
    }
    
    // Only create update request if there are changes
    if (reasons.length > 0) {
      return {
        patternType: metrics.patternType,
        adjustments,
        reason: reasons.join('; '),
        metrics
      };
    }
    
    return null;
  }
  
  /**
   * Apply model update based on learning results
   */
  private applyModelUpdate(request: ModelUpdateRequest): void {
    logDebug('learning', 'Applying model update', {
      patternType: request.patternType,
      adjustments: request.adjustments,
      reason: request.reason
    });
    
    // In a real implementation, this would:
    // 1. Update pattern detection parameters
    // 2. Retrain models if needed
    // 3. Save adjustments to persistent storage
    // 4. Notify detection services of changes
    
    // Emit event for pattern detection service
    window.dispatchEvent(new CustomEvent('patternModelUpdate', {
      detail: {
        patternType: request.patternType,
        adjustments: request.adjustments,
        modelVersion: this.modelVersion,
        timestamp: new Date()
      }
    }));
  }
  
  /**
   * Get learning statistics for monitoring
   */
  public getStatistics(): {
    totalFeedbacks: number;
    patternsInBuffer: number;
    readyToProcess: number;
    modelVersion: string;
  } {
    let totalFeedbacks = 0;
    let readyToProcess = 0;
    
    this.feedbackBuffer.forEach(buffer => {
      totalFeedbacks += buffer.feedbacks.length;
      if (buffer.feedbacks.length >= this.processingThreshold) {
        readyToProcess++;
      }
    });
    
    return {
      totalFeedbacks,
      patternsInBuffer: this.feedbackBuffer.size,
      readyToProcess,
      modelVersion: this.modelVersion
    };
  }
  
  /**
   * Force process all buffered feedback
   */
  public forceProcessAll(): void {
    logDebug('learning', 'Force processing all buffered feedback');
    
    this.feedbackBuffer.forEach((buffer, patternId) => {
      if (buffer.feedbacks.length >= this.minSampleSize) {
        this.processPatternFeedback(patternId);
      }
    });
  }
  
  /**
   * Clear all buffered feedback
   */
  public clearBuffer(): void {
    this.feedbackBuffer.clear();
    logDebug('learning', 'Feedback buffer cleared');
  }
}

// Singleton instance
export const patternLearningEngine = new PatternLearningEngine(); 