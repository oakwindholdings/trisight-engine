// src/components/Feedback/index.ts
// Entry point for feedback components
// Re-exports implementations
// Export feedback components through a single entry point
// This avoids duplicate identifier issues with declaration files

// Re-export components
// Export with a different name to avoid conflict with the type
// Now exporting as BoundaryAdjusterImpl to match the component's name
export { default as BoundaryAdjusterImpl } from './BoundaryAdjuster';
export { default as ConfidenceRating } from './ConfidenceRating';
export { default as PatternTypeSelector } from './PatternTypeSelector';
export { default as EnhancedFeedbackModal } from './EnhancedFeedbackModal';

// Re-export types from the declarations
export type { 
  BoundaryAdjusterProps,
  ConfidenceRatingProps,
  PatternTypeSelectorProps,
  EnhancedFeedbackModalProps
} from './feedback-components';
