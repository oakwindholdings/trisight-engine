// src/models/FeedbackTypes.ts
// Feedback system types and validation schemas
// Handles user feedback on detected patterns

import { z } from 'zod';
import { PatternType } from './PatternTypes';

// Feedback accuracy levels
export enum FeedbackAccuracy {
  VERY_INACCURATE = 1,
  INACCURATE = 2,
  NEUTRAL = 3,
  ACCURATE = 4,
  VERY_ACCURATE = 5
}

// Timing assessment options
export enum TimingAssessment {
  TOO_EARLY = 'too_early',
  SLIGHTLY_EARLY = 'slightly_early',
  PERFECT = 'perfect',
  SLIGHTLY_LATE = 'slightly_late',
  TOO_LATE = 'too_late'
}

// Validity reasons when pattern is invalid
export enum InvalidityReason {
  FALSE_POSITIVE = 'false_positive',
  WRONG_PATTERN_TYPE = 'wrong_pattern_type',
  POOR_BOUNDARIES = 'poor_boundaries',
  MISSING_CONFIRMATION = 'missing_confirmation',
  MARKET_CONTEXT = 'market_context',
  OTHER = 'other'
}

// Main feedback interface
export interface PatternFeedback {
  id: string;
  patternId: string;
  patternType: PatternType;
  userId?: string; // Optional, only if user is authenticated
  sessionId: string; // Anonymous session tracking
  
  // Core feedback data
  accuracy: FeedbackAccuracy;
  confidence: number; // 0-100
  timing: TimingAssessment;
  isValid: boolean;
  invalidityReason?: InvalidityReason;
  
  // Additional context
  notes?: string;
  suggestedAdjustment?: {
    startTime?: Date;
    endTime?: Date;
    priceHigh?: number;
    priceLow?: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  userAgent: string;
  viewport: { width: number; height: number };
  
  // Privacy
  consentGiven: boolean;
  consentTimestamp: Date;
  dataRetentionDays: number;
  
  // Legacy properties for backward compatibility with learning system
  falsePositive?: boolean;
  originalPatternType?: PatternType;
  correctedPatternType?: PatternType | null;
  confidenceRating?: number; // 1-5 rating
  boundaryAdjustment?: {
    originalStart: Date;
    originalEnd: Date;
    correctedStart?: Date;
    correctedEnd?: Date;
  };
}

// Aggregated feedback metrics
export interface FeedbackMetrics {
  patternId: string;
  patternType: PatternType;
  totalFeedbacks: number;
  
  // Aggregated metrics
  averageAccuracy: number;
  averageConfidence: number;
  validityRate: number;
  
  // Timing distribution
  timingDistribution: Record<TimingAssessment, number>;
  
  // Invalidity reasons distribution
  invalidityReasons: Record<InvalidityReason, number>;
  
  // Temporal metrics
  firstFeedbackAt: Date;
  lastFeedbackAt: Date;
  feedbackVelocity: number; // feedbacks per hour
  
  // Learning metrics
  modelAdjustmentCount: number;
  lastModelAdjustment?: Date;
  confidenceAdjustment: number; // cumulative adjustment
}

// Privacy consent interface
export interface PrivacyConsent {
  sessionId: string;
  consentGiven: boolean;
  consentType: 'feedback' | 'analytics' | 'all';
  timestamp: Date;
  ipHash?: string; // Hashed IP for fraud prevention
  expiresAt: Date;
  
  // Data rights
  allowDataProcessing: boolean;
  allowModelTraining: boolean;
  allowAggregateSharing: boolean;
}

// Feedback submission request
export interface FeedbackSubmission {
  feedback: Omit<PatternFeedback, 'id' | 'createdAt' | 'updatedAt'>;
  consent: PrivacyConsent;
}

// Zod validation schemas
export const FeedbackAccuracySchema = z.nativeEnum(FeedbackAccuracy);

export const TimingAssessmentSchema = z.nativeEnum(TimingAssessment);

export const InvalidityReasonSchema = z.nativeEnum(InvalidityReason);

export const PatternFeedbackSchema = z.object({
  id: z.string().uuid(),
  patternId: z.string(),
  patternType: z.nativeEnum(PatternType),
  userId: z.string().optional(),
  sessionId: z.string(),
  
  accuracy: FeedbackAccuracySchema,
  confidence: z.number().min(0).max(100),
  timing: TimingAssessmentSchema,
  isValid: z.boolean(),
  invalidityReason: InvalidityReasonSchema.optional(),
  
  notes: z.string().max(1000).optional(),
  suggestedAdjustment: z.object({
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    priceHigh: z.number().positive().optional(),
    priceLow: z.number().positive().optional(),
  }).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  userAgent: z.string(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  
  consentGiven: z.boolean(),
  consentTimestamp: z.date(),
  dataRetentionDays: z.number().positive(),
});

export const PrivacyConsentSchema = z.object({
  sessionId: z.string(),
  consentGiven: z.boolean(),
  consentType: z.string().refine((val) => ['feedback', 'analytics', 'all'].includes(val), {
    message: "Must be 'feedback', 'analytics', or 'all'"
  }),
  timestamp: z.date(),
  ipHash: z.string().optional(),
  expiresAt: z.date(),
  
  allowDataProcessing: z.boolean(),
  allowModelTraining: z.boolean(),
  allowAggregateSharing: z.boolean(),
});

export const FeedbackSubmissionSchema = z.object({
  feedback: PatternFeedbackSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  consent: PrivacyConsentSchema,
});

// Learning system types
export interface LearningMetrics {
  patternType: PatternType;
  averageAccuracy: number;
  confidenceAdjustment: number;
  timingAdjustment: number;
  validityRate: number;
  sampleSize: number;
}

export interface LearningModelState {
  version: string;
  lastUpdated: Date;
  patternStates: Record<PatternType, {
    enabled: boolean;
    confidenceMultiplier: number;
    timingOffsetMs: number;
    customThresholds?: Record<string, number>;
  }>;
  // Legacy fields for backward compatibility
  patternParameters?: Record<PatternType, any>;
  feedbackHistory?: any[];
  metrics?: any;
}

// Legacy feedback fields for backward compatibility
export interface FalsePositiveReason {
  reason: InvalidityReason;
  details?: string;
}

// Type alias for backward compatibility
export type LegacyPatternFeedback = PatternFeedback;

// Type guards
export const isValidFeedback = (data: unknown): data is PatternFeedback => {
  try {
    PatternFeedbackSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

export const isValidConsent = (data: unknown): data is PrivacyConsent => {
  try {
    PrivacyConsentSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

// Default values factory
export const createDefaultFeedback = (patternId: string, patternType: PatternType): Partial<PatternFeedback> => ({
  patternId,
  patternType,
  accuracy: FeedbackAccuracy.NEUTRAL,
  confidence: 50,
  timing: TimingAssessment.PERFECT,
  isValid: true,
  consentGiven: false,
  dataRetentionDays: 90,
});

export const createDefaultConsent = (sessionId: string): PrivacyConsent => ({
  sessionId,
  consentGiven: false,
  consentType: 'feedback',
  timestamp: new Date(),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  allowDataProcessing: false,
  allowModelTraining: false,
  allowAggregateSharing: false,
});
