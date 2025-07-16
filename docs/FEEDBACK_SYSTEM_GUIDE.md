# TriSight Pattern Feedback System Guide

## Overview

The TriSight Pattern Feedback System enables users to provide structured feedback on detected patterns, helping improve detection accuracy through machine learning. This guide covers the feedback workflow, privacy considerations, and learning system integration.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Feedback Workflow](#feedback-workflow)
3. [Privacy & Consent](#privacy--consent)
4. [Learning System](#learning-system)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Enabling Feedback for Patterns

Patterns must be explicitly marked as feedback-enabled during detection:

```typescript
const pattern: PatternSignal = {
  ...basePattern,
  feedbackEnabled: true,
  clickable: true,
  visualMetadata: {
    highlightOnHover: true,
    showConfidenceBar: true
  }
};
```

### User Interface Setup

The feedback system requires three main components:

1. **PatternAnalysisModal** - Main feedback form
2. **ConsentModal** - Privacy consent dialog
3. **PatternContext** - State management

```tsx
import { PatternAnalysisModal } from './components/Feedback/PatternAnalysisModal';
import { ConsentModal } from './components/privacy/ConsentModal';
import { usePatternContext } from './contexts/PatternContext';

function ChartView() {
  const { selectedPatternForFeedback, submitPatternFeedback } = usePatternContext();
  
  return (
    <>
      <InfiniteZoomChart {...props} />
      <PatternAnalysisModal
        pattern={selectedPatternForFeedback}
        isOpen={!!selectedPatternForFeedback}
        onClose={() => setSelectedPatternForFeedback(null)}
        onSubmit={submitPatternFeedback}
      />
    </>
  );
}
```

## Feedback Workflow

### 1. Pattern Selection

Users can click on patterns marked with `feedbackEnabled: true`. The pattern renderer adds visual indicators:

- Subtle hover effects
- Cursor changes to pointer
- Optional confidence bars

### 2. Feedback Form

The feedback modal collects structured data:

#### Accuracy Rating (1-5)
- **1**: Very Inaccurate - Pattern doesn't exist
- **2**: Inaccurate - Poor detection
- **3**: Neutral - Partially correct
- **4**: Accurate - Good detection
- **5**: Very Accurate - Excellent detection

#### Confidence Level (0-100%)
User's confidence in their assessment. Used to weight feedback importance.

#### Timing Assessment
- **Too Early**: Pattern detected before it fully formed
- **Slightly Early**: Minor timing issue
- **Perfect**: Correct timing
- **Slightly Late**: Minor delay
- **Too Late**: Significant delay

#### Validity Check
Boolean flag with reason selection if invalid:
- False Positive
- Wrong Pattern Type
- Poor Boundaries
- Missing Confirmation
- Market Context Issues
- Other

### 3. Submission Flow

```javascript
// Feedback submission process
1. Validate form data
2. Check privacy consent
3. Add session metadata
4. Submit to learning engine
5. Update pattern state
6. Show success message
```

## Privacy & Consent

### Consent Management

The system implements granular consent with three levels:

```typescript
interface PrivacyConsent {
  allowDataProcessing: boolean;    // Required for any feedback
  allowModelTraining: boolean;      // Use data for ML training
  allowAggregateSharing: boolean;   // Share anonymized statistics
}
```

### Data Retention

- Default retention: **90 days**
- Automatic cleanup via cron jobs
- User can request immediate deletion
- No personally identifiable information collected

### Anonymous Sessions

Sessions are tracked using anonymous IDs:

```typescript
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

## Learning System

### Feedback Processing

The `PatternLearningEngine` processes feedback in batches:

```typescript
const engine = new PatternLearningEngine();

// Configuration
engine.processingThreshold = 10;  // Process after 10 feedbacks
engine.minSampleSize = 5;         // Minimum for metrics

// Metrics calculation
const metrics = {
  averageAccuracy: calculateAverageAccuracy(feedbacks),
  timingAdjustment: calculateTimingAdjustment(feedbacks),
  validityRate: calculateValidityRate(feedbacks),
  confidenceAdjustment: calculateConfidenceAdjustment(feedbacks)
};
```

### Model Updates

Based on feedback metrics, the system adjusts:

1. **Confidence Multipliers**
   - Low accuracy (< 3.0): Multiply by 0.8
   - High accuracy (> 4.0): Multiply by 1.1

2. **Timing Offsets**
   - Weighted average of timing feedback
   - Applied as millisecond adjustments

3. **Pattern Enablement**
   - Disabled if validity rate < 30%
   - Re-enabled after improvements

### Feedback Metrics

Access aggregated metrics via the materialized view:

```sql
SELECT 
  pattern_id,
  average_accuracy,
  validity_rate,
  timing_distribution,
  feedback_velocity
FROM feedback_metrics
WHERE pattern_type = 'BLACKJACK';
```

## API Reference

### Hooks

#### usePrivacyConsent()

```typescript
const {
  hasConsent,           // boolean
  consent,              // PrivacyConsent | null
  requestConsent,       // () => Promise<boolean>
  revokeConsent,        // () => void
  showConsentModal,     // boolean
  setShowConsentModal   // (show: boolean) => void
} = usePrivacyConsent();
```

#### usePatterns()

```typescript
const {
  selectedPatternForFeedback,
  setSelectedPatternForFeedback,
  submitPatternFeedback  // (feedback: Partial<PatternFeedback>) => Promise<void>
} = usePatterns(data);
```

### Components

#### PatternAnalysisModal

```typescript
interface Props {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<PatternFeedback>) => Promise<void>;
}
```

#### ConsentModal

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
}
```

### Database Functions

#### get_pattern_feedback_summary(pattern_id)

Returns aggregated feedback metrics for a pattern:

```sql
SELECT * FROM get_pattern_feedback_summary('pattern-123');
```

## Troubleshooting

### Common Issues

#### Patterns Not Clickable

Ensure patterns have:
```typescript
feedbackEnabled: true,
clickable: true
```

#### Consent Modal Not Appearing

Check localStorage for expired consent:
```javascript
localStorage.getItem('trisight_privacy_consent')
```

#### Feedback Not Processing

Verify batch threshold:
```typescript
patternLearningEngine.getStatistics()
// Check: readyToProcess count
```

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', 'feedback,learning,privacy');
```

### Manual Processing

Force process all buffered feedback:
```typescript
patternLearningEngine.forceProcessAll();
```

## Best Practices

1. **Enable feedback selectively** - Only for patterns needing improvement
2. **Monitor metrics regularly** - Check feedback velocity and accuracy trends
3. **Adjust thresholds** - Tune processing batch size based on volume
4. **Test consent flow** - Ensure smooth UX for first-time users
5. **Review invalid patterns** - Focus improvements on high-invalidity patterns

## Security Considerations

- API keys stored using secure storage utility
- No sensitive data in console logs
- Session IDs are anonymous
- All feedback data is sanitized
- RLS policies enforce data isolation

## Future Enhancements

- Real-time feedback visualization
- A/B testing for pattern variations
- Collaborative feedback sessions
- Expert reviewer system
- Automated retraining pipelines 