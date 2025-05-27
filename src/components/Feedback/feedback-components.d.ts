// src/components/Feedback/feedback-components.d.ts
// Type defs for feedback components
// Shared prop interfaces
import React from 'react';
import { PatternType, Pattern } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { PatternFeedbackHistory } from '../../models/LearningTypes';

/**
 * Type definitions for feedback components
 * These are exported types only - no component declarations here
 */

// Pattern Type Selector props
export interface PatternTypeSelectorProps {
  selectedType: PatternType;
  originalType: PatternType;
  onSelect: (type: PatternType) => void;
}

// Confidence Rating props
export interface ConfidenceRatingProps {
  value: number;
  onChange: (value: number) => void;
}

// Boundary Adjuster props
export interface BoundaryAdjusterProps {
  originalStart: Date;
  originalEnd: Date;
  onChange: (start: Date | null, end: Date | null) => void;
}

// Enhanced pattern feedback modal props
export interface EnhancedFeedbackModalProps {
  pattern: Pattern | null;
  feedbackHistory?: PatternFeedbackHistory;
  onClose: () => void;
  onSubmit: (feedback: PatternFeedback) => Promise<void>;
  userId: string;
}
