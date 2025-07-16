// src/utils/types/LegacyHelpers.ts
// Helper functions for legacy feedback system compatibility

import { PatternFeedback, LegacyPatternFeedback } from '../../models/FeedbackTypes';

// Convert new feedback to legacy format
export function toLegacyFeedback(feedback: PatternFeedback): LegacyPatternFeedback {
  return {
    ...feedback,
    submittedAt: feedback.createdAt,
    originalPatternType: feedback.patternType,
    falsePositive: !feedback.isValid,
    confidenceRating: Math.round(feedback.confidence * 5), // Convert 0-1 to 1-5
  } as LegacyPatternFeedback;
}

// Type guard for legacy feedback
export function isLegacyFeedback(feedback: any): feedback is LegacyPatternFeedback {
  return 'originalPatternType' in feedback || 'submittedAt' in feedback;
}

// Safe cast to legacy feedback
export function asLegacyFeedback(feedback: PatternFeedback | LegacyPatternFeedback): LegacyPatternFeedback {
  if (isLegacyFeedback(feedback)) {
    return feedback;
  }
  return toLegacyFeedback(feedback);
} 