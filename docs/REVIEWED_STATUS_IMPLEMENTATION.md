# Pattern Reviewed Status Implementation

This document describes the implementation of the "Reviewed" indicator feature for Pattern Feed Cards in TriSight.

## Overview

The reviewed status feature allows analysts to mark patterns as reviewed after completing their analysis. A visual indicator appears on each pattern feed card showing whether the pattern has been reviewed and by whom.

## Architecture

### Database Schema

The `pattern_feed` table includes reviewed status tracking:

```sql
-- Reviewed status fields
reviewed BOOLEAN NOT NULL DEFAULT false,
reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
reviewed_at TIMESTAMPTZ,

-- Constraint ensures data consistency
CONSTRAINT check_reviewed_consistency CHECK (
  (reviewed = false AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
  (reviewed = true AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
)
```

### TypeScript Interface

The `PatternFeedEntry` interface includes optional reviewed fields:

```typescript
export interface PatternFeedEntry {
  // ... existing fields
  
  // Reviewed status fields
  reviewed?: boolean;
  reviewedBy?: string; // user ID of reviewer
  reviewedAt?: string; // ISO 8601 string
}
```

## Components

### ReviewedIndicator

A reusable component that displays the reviewed status:

```typescript
interface ReviewedIndicatorProps {
  reviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  className?: string;
}
```

**Features:**
- Shows green checkmark when reviewed
- Displays "Pending Review" for unreviewed patterns
- Shows reviewer initials and timestamp when available
- Non-interactive (read-only)
- Responsive design

### Usage in FeedCard

```typescript
<ReviewedIndicator
  reviewed={entry.reviewed}
  reviewedBy={entry.reviewedBy}
  reviewedAt={entry.reviewedAt}
/>
```

## Services

### PatternReviewService

Manages reviewed status operations:

```typescript
// Mark pattern as reviewed
await markPatternAsReviewed(patternId, userId);

// Mark pattern as unreviewed
await markPatternAsUnreviewed(patternId);

// Get review status
const status = await getPatternReviewStatus(patternId);

// Get review statistics
const stats = await getReviewStatistics();
```

### Integration with Feedback Submission

When an analyst submits feedback, the pattern is automatically marked as reviewed:

```typescript
// In submitPatternFeedback()
if (feedback.patternId) {
  await markPatternAsReviewed(feedback.patternId, feedback.userId);
}
```

## Hooks

### usePatternReviewStatus

Hook for managing individual pattern review status:

```typescript
const {
  status,
  loading,
  error,
  markAsReviewed,
  markAsUnreviewed,
  refetch
} = usePatternReviewStatus(patternId);
```

### useReviewStatistics

Hook for getting review statistics:

```typescript
const {
  statistics,
  loading,
  error,
  refetch
} = useReviewStatistics();
```

## Implementation Flow

1. **Pattern Detection**: New patterns are inserted into `pattern_feed` with `reviewed = false`
2. **Feed Display**: FeedCard components show ReviewedIndicator with current status
3. **Analyst Review**: Analyst clicks "Analyze" and completes feedback form
4. **Feedback Submission**: 
   - Feedback is saved to `pattern_feedback` table
   - Pattern is marked as reviewed in `pattern_feed` table
   - Real-time updates propagate to UI
5. **Visual Update**: ReviewedIndicator shows green checkmark with reviewer info

## Multi-Analyst Support (Future)

The current implementation supports multiple reviewers through:

- `reviewed_by` field stores the user ID of the reviewer
- Database constraints ensure data consistency
- UI can be extended to show multiple reviewers

### Future Enhancements

```sql
-- Potential future table for multiple reviewers
CREATE TABLE pattern_reviews (
  id UUID PRIMARY KEY,
  pattern_id UUID REFERENCES pattern_feed(id),
  user_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  review_type TEXT -- 'primary', 'secondary', 'validation'
);
```

## Testing

### Unit Tests

Test the ReviewedIndicator component:

```typescript
describe('ReviewedIndicator', () => {
  it('shows checkmark when reviewed', () => {
    render(<ReviewedIndicator reviewed={true} />);
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
  });

  it('shows pending when not reviewed', () => {
    render(<ReviewedIndicator reviewed={false} />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test the end-to-end flow:

```typescript
describe('Review Status Integration', () => {
  it('marks pattern as reviewed after feedback submission', async () => {
    // Submit feedback
    await submitPatternFeedback(mockFeedback);
    
    // Check pattern is marked as reviewed
    const status = await getPatternReviewStatus(patternId);
    expect(status.reviewed).toBe(true);
  });
});
```

## Migration

Run the migration to add the pattern_feed table with reviewed status:

```bash
# Apply the migration
supabase db push

# Or manually run the migration file
psql -f supabase/migrations/20250126_add_pattern_feed_with_reviewed_status.sql
```

## Usage Examples

See `src/feed/examples/ReviewedIndicatorExample.tsx` for complete usage examples.

## Security Considerations

- Row Level Security (RLS) policies ensure proper access control
- Only authenticated users can update reviewed status
- Anonymous users can read feed entries but not modify review status
- User IDs are properly validated before marking as reviewed

## Performance

- Indexed fields for efficient queries
- Composite indexes for common query patterns
- Non-blocking updates to avoid UI latency
- Optimistic updates for better user experience
