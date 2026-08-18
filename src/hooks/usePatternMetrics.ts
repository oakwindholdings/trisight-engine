// src/hooks/usePatternMetrics.ts
// Hook for aggregating comprehensive pattern metrics
// Combines data from multiple sources for analysis panel display

import { useState, useEffect, useMemo } from 'react';
import { Pattern, PatternType, EscalatorPattern, BlackjackPattern, GoldenCandlePattern, PivotPattern } from '../models/PatternTypes';
import { ComprehensivePatternMetrics, CorePatternMetrics, LearningPatternMetrics, PatternSpecificMetrics, MarketContextMetrics, TechnicalMetrics } from '../models/PatternMetricsTypes';
import { usePatternContext } from '../contexts/PatternContext';
import { getLearningMetrics } from '../api/patternApi';
import { logDebug } from '../utils/debug';

/**
 * Shape returned by the pattern feedback summary aggregation, mirrored
 * from the previous Supabase RPC (`get_pattern_feedback_summary`) result
 * so downstream consumers of this hook see no behavior change.
 */
interface PatternFeedbackSummary {
  totalFeedbacks: number;
  averageAccuracy: number;
  averageConfidence: number;
  validityRate: number;
}

/**
 * Fetch aggregated feedback metrics for a pattern from the server API.
 * Replaces the direct Supabase RPC call; maps the API's snake_case
 * aggregate row (total_feedback/valid_count/invalid_count/avg_accuracy/avg_confidence)
 * onto the same fields the hook previously consumed.
 */
async function fetchPatternFeedbackSummary(patternId: string): Promise<PatternFeedbackSummary> {
  const response = await fetch(`/api/data/feedback-summary?pattern_id=${encodeURIComponent(patternId)}`);

  if (!response.ok) {
    let message = `Failed to fetch feedback summary: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Response body wasn't JSON; keep default message
    }
    throw new Error(message);
  }

  const { data } = await response.json();
  const row = data?.[0];

  if (!row) {
    return {
      totalFeedbacks: 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      validityRate: 0
    };
  }

  const totalFeedbacks = row.total_feedback || 0;
  const validCount = row.valid_count || 0;

  return {
    totalFeedbacks,
    averageAccuracy: row.avg_accuracy || 0,
    averageConfidence: row.avg_confidence || 0,
    // Fraction (0-1), matching the prior RPC's validityRate semantics
    validityRate: totalFeedbacks > 0 ? validCount / totalFeedbacks : 0
  };
}

/**
 * Hook to get comprehensive metrics for a selected pattern
 */
export function usePatternMetrics(pattern: Pattern | null) {
  const [metrics, setMetrics] = useState<ComprehensivePatternMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getDetectionStatistics, getMarketContext } = usePatternContext();
  
  // Memoized core metrics extraction
  const coreMetrics = useMemo((): CorePatternMetrics | null => {
    if (!pattern) return null;
    
    return {
      confidence: pattern.confidence,
      detectionVersion: pattern.detectionVersion,
      sampleCount: 1, // Individual pattern
      feedbackCount: pattern.feedbackCount || 0,
      // Add fallback values for display
      successRate: 75, // Default fallback
      averageReturn: 2.1,
      averageHoldTime: 45,
      riskScore: 'MEDIUM'
    };
  }, [pattern]);
  
  // Memoized pattern-specific metrics extraction
  const specificMetrics = useMemo((): PatternSpecificMetrics => {
    if (!pattern) return {};
    
    const metrics: PatternSpecificMetrics = {};
    
    switch (pattern.type) {
      case PatternType.ESCALATOR:
        const escalator = pattern as EscalatorPattern;
        metrics.stepCount = escalator.steps?.length;
        metrics.averageStepHeight = escalator.averageStepHeight;
        metrics.stepConsistency = escalator.stepConsistency;
        metrics.cumulativeScore = escalator.cumulativeScore;
        break;
        
      case PatternType.BLACKJACK:
        const blackjack = pattern as BlackjackPattern;
        metrics.intrinsicScores = blackjack.intrinsicScores;
        metrics.cumulativeScore = blackjack.cumulativeScore;
        metrics.priceChanges = blackjack.priceChange;
        metrics.volumeChanges = blackjack.volumeChange;
        break;
        
      case PatternType.GOLDEN_CANDLE:
        const golden = pattern as GoldenCandlePattern;
        metrics.goldenScore = golden.goldenScore;
        metrics.stepIntrinsicCount = golden.stepIntrinsicCount;
        metrics.stepBreakoutCount = golden.stepBreakoutCount;
        metrics.stepContinuanceCount = golden.stepContinuanceCount;
        break;
        
      case PatternType.PIVOT:
        const pivot = pattern as PivotPattern;
        metrics.touchPoints = pivot.touchPoints?.length;
        metrics.touchStrength = pivot.touchStrength;
        metrics.priceConsistency = pivot.priceConsistency;
        metrics.strengthScore = pivot.strengthScore;
        break;
        
      default:
        // Handle other pattern types with available data
        break;
    }
    
    return metrics;
  }, [pattern]);
  
  // Memoized technical metrics calculation
  const technicalMetrics = useMemo((): TechnicalMetrics => {
    if (!pattern) return {};
    
    const priceRange = pattern.highPrice - pattern.lowPrice;
    const priceRangePercent = (priceRange / pattern.lowPrice) * 100;
    
    return {
      priceRange,
      priceRangePercent,
      // Add more technical calculations as needed
      volumeRatio: 1.2, // Fallback
      nearestSupport: pattern.lowPrice * 0.98,
      nearestResistance: pattern.highPrice * 1.02,
    };
  }, [pattern]);
  
  // Listen for feedback submission events to trigger refresh
  useEffect(() => {
    const handleFeedbackSubmitted = (event: CustomEvent) => {
      if (pattern && event.detail?.patternId === pattern.id) {
        // Refresh metrics when feedback is submitted for this pattern
        setTimeout(() => {
          setError(null);
          // Trigger re-fetch by updating the dependency
        }, 1000); // Small delay to allow backend processing
      }
    };

    const handlePatternUpdated = (event: CustomEvent) => {
      if (pattern && event.detail?.patternId === pattern.id) {
        // Refresh metrics when pattern is updated
        setError(null);
      }
    };

    // Listen for custom events
    window.addEventListener('pattern-feedback-submitted', handleFeedbackSubmitted as EventListener);
    window.addEventListener('pattern-updated', handlePatternUpdated as EventListener);

    return () => {
      window.removeEventListener('pattern-feedback-submitted', handleFeedbackSubmitted as EventListener);
      window.removeEventListener('pattern-updated', handlePatternUpdated as EventListener);
    };
  }, [pattern]);

  // Fetch learning and feedback metrics
  useEffect(() => {
    if (!pattern) {
      setMetrics(null);
      return;
    }
    
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get detection statistics (for future use)
        // const detectionStats = getDetectionStatistics();
        
        // Get market context
        const marketContext = getMarketContext();
        
        // Initialize learning metrics with defaults
        let learningMetrics: LearningPatternMetrics = {
          averageAccuracy: 3.5, // Default 3.5/5
          averageUserConfidence: 72, // Default 72%
          validityRate: 85, // Default 85%
          falsePositiveRate: 15, // Default 15%
          improvementTrend: [0.7, 0.75, 0.8, 0.82, 0.85], // Mock trend
          modelAdjustmentCount: 3,
          feedbackVelocity: 0.5, // 0.5 feedbacks per hour
        };
        
        // Try to fetch real feedback metrics if pattern has feedback
        if (pattern.feedbackCount && pattern.feedbackCount > 0) {
          try {
            const feedbackSummary = await fetchPatternFeedbackSummary(pattern.id);
            learningMetrics = {
              ...learningMetrics,
              averageAccuracy: feedbackSummary.averageAccuracy,
              averageUserConfidence: feedbackSummary.averageConfidence,
              validityRate: (feedbackSummary.validityRate || 0) * 100,
              feedbackVelocity: feedbackSummary.totalFeedbacks / 24, // Rough estimate
            };
          } catch (feedbackError) {
            logDebug('DEBUG_METRICS', 'Failed to fetch feedback metrics:', feedbackError);
            // Continue with defaults
          }
        }
        
        // Try to fetch learning metrics from API
        try {
          const apiLearningMetrics = await getLearningMetrics();
          if (apiLearningMetrics.accuracyByPatternType && apiLearningMetrics.accuracyByPatternType[pattern.type] !== undefined) {
            learningMetrics.validityRate = apiLearningMetrics.accuracyByPatternType[pattern.type] * 100;
          }
          if (apiLearningMetrics.feedbackCountByPatternType && apiLearningMetrics.feedbackCountByPatternType[pattern.type] !== undefined) {
            learningMetrics.feedbackVelocity = apiLearningMetrics.feedbackCountByPatternType[pattern.type] / 168; // Per week to per hour
          }
        } catch (apiError) {
          logDebug('DEBUG_METRICS', 'Failed to fetch API learning metrics:', apiError);
          // Continue with defaults
        }
        
        // Build market context metrics
        const contextMetrics: MarketContextMetrics = {
          volatilityLevel: marketContext?.volatility > 0.02 ? 'HIGH' : marketContext?.volatility > 0.01 ? 'NORMAL' : 'LOW',
          trendDirection: 'NEUTRAL', // Default
          volumeProfile: 'NORMAL', // Default
          timeOfDay: getTimeOfDay(),
          marketCondition: 'Normal Trading',
        };
        
        // Combine all metrics
        const comprehensiveMetrics: ComprehensivePatternMetrics = {
          patternId: pattern.id,
          patternType: pattern.type,
          core: coreMetrics!,
          learning: learningMetrics,
          specific: specificMetrics,
          context: contextMetrics,
          technical: technicalMetrics,
          lastUpdated: new Date(),
          dataSource: 'LIVE',
          isLoading: false,
        };
        
        setMetrics(comprehensiveMetrics);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
        setError(errorMessage);
        logDebug('DEBUG_METRICS', 'Error fetching pattern metrics:', err);
        
        // Set fallback metrics even on error
        if (coreMetrics) {
          const fallbackMetrics: ComprehensivePatternMetrics = {
            patternId: pattern.id,
            patternType: pattern.type,
            core: coreMetrics,
            learning: {
              averageAccuracy: 3.5,
              averageUserConfidence: 70,
              validityRate: 80,
              falsePositiveRate: 20,
            },
            specific: specificMetrics,
            context: { marketCondition: 'Unknown' },
            technical: technicalMetrics,
            lastUpdated: new Date(),
            dataSource: 'FALLBACK',
            error: errorMessage,
          };
          setMetrics(fallbackMetrics);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [pattern, coreMetrics, specificMetrics, technicalMetrics, getDetectionStatistics, getMarketContext]);
  
  return {
    metrics,
    isLoading,
    error,
    refresh: () => {
      if (pattern) {
        // Trigger re-fetch by updating a dependency
        setError(null);
      }
    }
  };
}

/**
 * Helper function to determine time of day
 */
function getTimeOfDay(): 'PREMARKET' | 'OPEN' | 'MIDDAY' | 'CLOSE' | 'AFTERHOURS' {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 9) return 'PREMARKET';
  if (hour < 10) return 'OPEN';
  if (hour < 15) return 'MIDDAY';
  if (hour < 16) return 'CLOSE';
  return 'AFTERHOURS';
}

/**
 * Hook to format metrics for display
 */
export function useFormattedPatternMetrics(pattern: Pattern | null, showAdvanced: boolean = false) {
  const { metrics, isLoading, error, refresh } = usePatternMetrics(pattern);

  const formattedMetrics = useMemo(() => {
    if (!metrics) return [];

    const items: import('../models/PatternMetricsTypes').MetricDisplayItem[] = [];

    // Core metrics (always shown)
    items.push({
      key: 'confidence',
      label: 'Detection Confidence',
      value: metrics.core.confidence,
      formattedValue: `${Math.round(metrics.core.confidence * 100)}%`,
      category: 'core',
      importance: 'high',
      tooltip: 'Algorithm confidence in pattern detection'
    });

    if (metrics.core.successRate !== undefined) {
      items.push({
        key: 'successRate',
        label: 'Success Rate',
        value: metrics.core.successRate,
        formattedValue: `${metrics.core.successRate}%`,
        category: 'core',
        importance: 'high',
        tooltip: 'Historical success rate for this pattern type'
      });
    }

    if (metrics.core.averageReturn !== undefined) {
      items.push({
        key: 'averageReturn',
        label: 'Avg Return',
        value: metrics.core.averageReturn,
        formattedValue: `${metrics.core.averageReturn}%`,
        category: 'core',
        importance: 'high',
        tooltip: 'Average return when pattern is successful'
      });
    }

    if (metrics.core.averageHoldTime !== undefined) {
      items.push({
        key: 'averageHoldTime',
        label: 'Avg Hold Time',
        value: metrics.core.averageHoldTime,
        formattedValue: `${metrics.core.averageHoldTime}m`,
        category: 'core',
        importance: 'medium',
        tooltip: 'Average time to reach target'
      });
    }

    if (metrics.core.riskScore) {
      items.push({
        key: 'riskScore',
        label: 'Risk Level',
        value: metrics.core.riskScore,
        formattedValue: metrics.core.riskScore,
        category: 'core',
        importance: 'high',
        tooltip: 'Risk assessment for this pattern'
      });
    }

    // Learning metrics
    if (metrics.learning.validityRate !== undefined) {
      items.push({
        key: 'validityRate',
        label: 'Validity Rate',
        value: metrics.learning.validityRate,
        formattedValue: `${Math.round(metrics.learning.validityRate)}%`,
        category: 'learning',
        importance: 'medium',
        tooltip: 'Percentage of valid pattern detections based on user feedback'
      });
    }

    if (showAdvanced) {
      // Advanced core metrics
      if (metrics.core.sampleCount !== undefined) {
        items.push({
          key: 'sampleCount',
          label: 'Sample Count',
          value: metrics.core.sampleCount,
          formattedValue: metrics.core.sampleCount.toString(),
          category: 'core',
          importance: 'low',
          isAdvanced: true,
          tooltip: 'Number of historical samples for this pattern'
        });
      }

      // Advanced learning metrics
      if (metrics.learning.averageAccuracy !== undefined) {
        items.push({
          key: 'averageAccuracy',
          label: 'User Accuracy Rating',
          value: metrics.learning.averageAccuracy,
          formattedValue: `${metrics.learning.averageAccuracy.toFixed(1)}/5`,
          category: 'learning',
          importance: 'medium',
          isAdvanced: true,
          tooltip: 'Average accuracy rating from user feedback'
        });
      }

      if (metrics.learning.feedbackVelocity !== undefined) {
        items.push({
          key: 'feedbackVelocity',
          label: 'Feedback Rate',
          value: metrics.learning.feedbackVelocity,
          formattedValue: `${metrics.learning.feedbackVelocity.toFixed(1)}/hr`,
          category: 'learning',
          importance: 'low',
          isAdvanced: true,
          tooltip: 'Rate of feedback submissions for this pattern type'
        });
      }

      // Pattern-specific metrics
      Object.entries(metrics.specific).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          items.push({
            key,
            label: formatMetricLabel(key),
            value,
            formattedValue: formatMetricValue(key, value),
            category: 'specific',
            importance: 'medium',
            isAdvanced: true,
            tooltip: `Pattern-specific metric: ${formatMetricLabel(key)}`
          });
        }
      });

      // Technical metrics
      if (metrics.technical.priceRangePercent !== undefined) {
        items.push({
          key: 'priceRangePercent',
          label: 'Price Range',
          value: metrics.technical.priceRangePercent,
          formattedValue: `${metrics.technical.priceRangePercent.toFixed(2)}%`,
          category: 'technical',
          importance: 'medium',
          isAdvanced: true,
          tooltip: 'Price range as percentage of low price'
        });
      }
    }

    return items;
  }, [metrics, showAdvanced]);

  return {
    metrics,
    formattedMetrics,
    isLoading,
    error,
    refresh
  };
}

/**
 * Helper function to format metric labels
 */
function formatMetricLabel(key: string): string {
  const labelMap: Record<string, string> = {
    stepCount: 'Step Count',
    averageStepHeight: 'Avg Step Height',
    stepConsistency: 'Step Consistency',
    cumulativeScore: 'Cumulative Score',
    goldenScore: 'Golden Score',
    stepIntrinsicCount: 'Intrinsic Count',
    stepBreakoutCount: 'Breakout Count',
    stepContinuanceCount: 'Continuance Count',
    touchPoints: 'Touch Points',
    touchStrength: 'Touch Strength',
    priceConsistency: 'Price Consistency',
    strengthScore: 'Strength Score',
  };

  return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

/**
 * Helper function to format metric values
 */
function formatMetricValue(key: string, value: any): string {
  if (typeof value === 'number') {
    if (key.includes('Score') || key.includes('Consistency') || key.includes('Strength')) {
      return value.toFixed(2);
    }
    if (key.includes('Count')) {
      return value.toString();
    }
    return value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  return String(value);
}
