// src/models/PatternMetricsTypes.ts
// Comprehensive pattern metrics interfaces for analysis panel display
// Aggregates all available metrics from various sources

import { PatternType, Pattern } from './PatternTypes';
import { FeedbackMetrics } from './FeedbackTypes';
import { DetectionStats } from '../utils/patternDetection/core/BasePatternDetector';

/**
 * Core performance metrics for any pattern
 */
export interface CorePatternMetrics {
  // Detection metrics
  confidence: number; // 0.0 to 1.0
  detectionVersion?: string;
  detectionTimeMs?: number;
  
  // Performance metrics
  successRate?: number; // Percentage
  averageReturn?: number; // Percentage
  averageHoldTime?: number; // Minutes
  medianHoldTime?: number; // Minutes
  maxHoldTime?: number; // Minutes
  minHoldTime?: number; // Minutes
  
  // Risk metrics
  riskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility?: number;
  maxDrawdown?: number; // Percentage
  sharpeRatio?: number;
  
  // Sample size metrics
  sampleCount: number;
  feedbackCount: number;
  validationCount?: number;
}

/**
 * Learning and feedback metrics
 */
export interface LearningPatternMetrics {
  // Feedback aggregation
  averageAccuracy?: number; // 0-5 scale
  averageUserConfidence?: number; // 0-100
  validityRate?: number; // Percentage
  falsePositiveRate?: number; // Percentage
  
  // Timing assessment
  timingDistribution?: {
    tooEarly: number;
    perfect: number;
    tooLate: number;
    wayOff: number;
  };
  
  // Learning progress
  improvementTrend?: number[]; // Historical progression
  modelAdjustmentCount?: number;
  lastModelAdjustment?: Date;
  confidenceAdjustment?: number; // Cumulative adjustment
  
  // Feedback velocity
  feedbackVelocity?: number; // Feedbacks per hour
  lastFeedbackAt?: Date;
}

/**
 * Pattern-specific metrics that vary by pattern type
 */
export interface PatternSpecificMetrics {
  // Escalator-specific
  stepCount?: number;
  averageStepHeight?: number;
  stepConsistency?: number;
  cumulativeScore?: number;
  
  // Blackjack-specific
  intrinsicScores?: number[];
  priceChanges?: number[];
  volumeChanges?: number[];
  
  // Golden Candle-specific
  goldenScore?: number;
  stepIntrinsicCount?: number;
  stepBreakoutCount?: number;
  stepContinuanceCount?: number;
  
  // Pivot-specific
  touchPoints?: number;
  touchStrength?: number;
  priceConsistency?: number;
  strengthScore?: number;
  
  // Goldmine-specific
  channelWidth?: number;
  channelSlope?: number;
  supportLevel?: number;
  resistanceLevel?: number;
  
  // Rocketman-specific
  thrustDirection?: 'BULLISH' | 'BEARISH';
  thrustStrength?: number;
  momentumScore?: number;
}

/**
 * Market context metrics
 */
export interface MarketContextMetrics {
  volatilityLevel?: 'LOW' | 'NORMAL' | 'HIGH';
  trendDirection?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volumeProfile?: 'LOW' | 'NORMAL' | 'HIGH';
  timeOfDay?: 'PREMARKET' | 'OPEN' | 'MIDDAY' | 'CLOSE' | 'AFTERHOURS';
  marketCondition?: string;
}

/**
 * Technical analysis metrics
 */
export interface TechnicalMetrics {
  // Price action
  priceRange?: number; // High - Low
  priceRangePercent?: number; // (High - Low) / Low * 100
  bodySize?: number; // Close - Open
  bodyPercent?: number; // Body size as % of range
  
  // Volume analysis
  volumeRatio?: number; // Current vs average
  volumeTrend?: 'INCREASING' | 'DECREASING' | 'STABLE';
  
  // Momentum indicators
  rsi?: number;
  macd?: number;
  momentum?: number;
  
  // Support/Resistance
  nearestSupport?: number;
  nearestResistance?: number;
  supportDistance?: number; // Percentage
  resistanceDistance?: number; // Percentage
}

/**
 * Comprehensive pattern metrics combining all metric types
 */
export interface ComprehensivePatternMetrics {
  // Pattern identification
  patternId: string;
  patternType: PatternType;
  symbol?: string;
  timeframe?: string;
  
  // Core metrics
  core: CorePatternMetrics;
  
  // Learning metrics
  learning: LearningPatternMetrics;
  
  // Pattern-specific metrics
  specific: PatternSpecificMetrics;
  
  // Market context
  context: MarketContextMetrics;
  
  // Technical analysis
  technical: TechnicalMetrics;
  
  // Metadata
  lastUpdated: Date;
  dataSource: 'LIVE' | 'CACHED' | 'FALLBACK';
  isLoading?: boolean;
  error?: string;
}

/**
 * Metrics display configuration
 */
export interface MetricsDisplayConfig {
  showAdvanced: boolean;
  groupBy: 'category' | 'importance' | 'alphabetical';
  precision: number; // Decimal places for numbers
  showTooltips: boolean;
  showLastUpdated: boolean;
  compactMode: boolean;
}

/**
 * Metric item for display
 */
export interface MetricDisplayItem {
  key: string;
  label: string;
  value: string | number;
  formattedValue: string;
  category: 'core' | 'learning' | 'specific' | 'context' | 'technical';
  importance: 'high' | 'medium' | 'low';
  tooltip?: string;
  isAdvanced?: boolean;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}
