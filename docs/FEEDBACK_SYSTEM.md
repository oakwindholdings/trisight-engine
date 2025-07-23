# TriSight Pattern Feedback System

## Overview

The Pattern Feedback System enables analysts to provide detailed feedback on detected patterns, which is then used to train and improve the pattern detection models. All feedback is stored in Supabase with proper privacy controls and can be exported for model training.

## Features

### 1. Enhanced Feedback Collection

The feedback modal now includes:

- **Core Feedback Fields**:
  - Accuracy rating (1-5 scale)
  - Confidence percentage (0-100%)
  - Timing assessment (too early, perfect, too late)
  - Pattern validity (true/false)
  - Invalidity reasons (false positive, wrong type, poor boundaries, etc.)

- **Advanced Training Fields**:
  - Suggested time/price corrections
  - Corrected pattern type (if misidentified)
  - Technical analysis comments
  - Market context description
  - Detailed notes

### 2. Supabase Integration

All feedback is persisted to the `pattern_feedback` table with:
- Automatic session tracking
- Privacy consent management
- Data retention policies
- Real-time updates via pattern feed

### 3. Privacy & Consent

- Consent required before submitting feedback
- Granular permissions:
  - Data processing
  - Model training
  - Aggregate sharing
- 90-day default retention
- GDPR-compliant data handling

### 4. Data Export & Analysis

Export capabilities for model training:
- JSON, CSV, or training-specific formats
- Filtering by date, pattern type, accuracy
- Aggregated statistics and metrics
- Automated data cleaning

## Usage

### Submitting Feedback

1. Click "Analyze" on any pattern in the feed sidebar
2. Fill out the feedback form:
   ```typescript
   // Basic feedback
   - Accuracy: How accurate is the detection?
   - Confidence: Your confidence in the assessment
   - Timing: Is the pattern detected at the right time?
   - Valid: Is this a real pattern?
   
   // Advanced feedback (optional)
   - Suggested corrections for start/end times
   - Correct price boundaries
   - Technical indicators that support your view
   - Market conditions affecting the pattern
   ```

3. Submit feedback (requires privacy consent)

### Exporting Training Data

```typescript
import { exportFeedbackData, downloadFeedbackData } from './utils/export/feedbackExporter';

// Export as JSON
const jsonData = await exportFeedbackData({
  startDate: new Date('2025-01-01'),
  patternTypes: [PatternType.ESCALATOR, PatternType.BLACKJACK],
  minAccuracy: 3,
  format: 'json'
});

// Download as CSV
await downloadFeedbackData({
  format: 'csv',
  includeInvalid: true
});

// Get statistics
const stats = await getFeedbackStatistics();
console.log(`Total feedbacks: ${stats.totalFeedbacks}`);
console.log(`Average accuracy: ${stats.averageAccuracy}`);
```

## Database Schema

### pattern_feedback Table

```sql
CREATE TABLE pattern_feedback (
  id UUID PRIMARY KEY,
  pattern_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  
  -- Core feedback
  accuracy INTEGER (1-5),
  confidence NUMERIC (0-100),
  timing timing_assessment,
  is_valid BOOLEAN,
  invalidity_reason invalidity_reason,
  
  -- Corrections
  notes TEXT,
  suggested_start_time TIMESTAMPTZ,
  suggested_end_time TIMESTAMPTZ,
  suggested_price_high NUMERIC,
  suggested_price_low NUMERIC,
  
  -- Metadata
  created_at TIMESTAMPTZ,
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  
  -- Privacy
  consent_given BOOLEAN,
  consent_timestamp TIMESTAMPTZ,
  data_retention_days INTEGER
);
```

### Materialized Views

- `feedback_metrics`: Aggregated metrics per pattern
  - Average accuracy/confidence
  - Validity rates
  - Timing distributions
  - Invalidity reason breakdowns

## Development Workflow

### 1. Collect Feedback
```bash
# Analysts use the UI to provide feedback on patterns
# Data flows: UI → Supabase → pattern_feed (real-time)
```

### 2. Export Training Data
```bash
# Weekly export for model training
npm run export:feedback -- --format=training --min-accuracy=3
```

### 3. Train Models
```python
# Python training pipeline (separate repo)
import pandas as pd
from trisight_ml import PatternTrainer

# Load exported feedback
feedback_df = pd.read_json('pattern_feedback_2025-01-22.json')

# Train improved models
trainer = PatternTrainer()
trainer.fit(feedback_df)
trainer.export_parameters('improved_thresholds.json')
```

### 4. Update Detection Parameters
```typescript
// Import improved parameters back into TriSight
import improvedParams from './ml_output/improved_thresholds.json';

// Update AdaptivePatternDetectionService
adaptiveService.updateParameters(PatternType.ESCALATOR, improvedParams.escalator);
```

## Best Practices

1. **Feedback Quality**:
   - Be specific in technical comments
   - Include market context when relevant
   - Use suggested corrections for boundary issues
   - Mark false positives clearly

2. **Privacy**:
   - Always obtain consent before collecting feedback
   - Respect data retention preferences
   - Anonymize exported data for sharing

3. **Training Cycles**:
   - Export feedback weekly
   - Retrain models monthly
   - A/B test new parameters
   - Monitor accuracy improvements

## API Reference

### submitPatternFeedback
```typescript
async function submitPatternFeedback(
  feedback: Partial<PatternFeedback>
): Promise<void>
```

### getPatternFeedback
```typescript
async function getPatternFeedback(
  patternId: string
): Promise<PatternFeedback[]>
```

### exportFeedbackData
```typescript
async function exportFeedbackData(options: {
  startDate?: Date;
  endDate?: Date;
  patternTypes?: PatternType[];
  minAccuracy?: number;
  includeInvalid?: boolean;
  format?: 'json' | 'csv' | 'training';
}): Promise<string>
```

## Troubleshooting

### Common Issues

1. **Consent Modal Not Showing**:
   - Check localStorage for expired consent
   - Verify `usePrivacyConsent` hook is working

2. **Feedback Not Saving**:
   - Check Supabase connection
   - Verify RLS policies allow inserts
   - Check browser console for errors

3. **Export Failing**:
   - Ensure Supabase client is initialized
   - Check query permissions
   - Verify data retention hasn't expired records

## Future Enhancements

1. **Batch Feedback**: Submit feedback for multiple patterns at once
2. **Feedback Analytics Dashboard**: Visualize feedback trends
3. **Auto-Learning**: Real-time parameter updates based on feedback
4. **Collaborative Feedback**: Team-based pattern validation
5. **Mobile Support**: Optimized feedback forms for mobile devices 