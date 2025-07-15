// src/components/Feedback/index.ts
// Entry point for feedback components
// Re-exports implementations
// Export feedback components through a single entry point
// This avoids duplicate identifier issues with declaration files

// Re-export components
// Export with a different name to avoid conflict with the type
// Now exporting as BoundaryAdjusterImpl to match the component's name
export { BoundaryAdjuster } from './BoundaryAdjuster';
export { ConfidenceRating } from './ConfidenceRating';
export { PatternTypeSelector } from './PatternTypeSelector';
export { FeedbackModal } from './FeedbackModal';
export { GoldmineChannelAdjuster } from './GoldmineChannelAdjuster';
