# Pattern Feedback System Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables
- [ ] `REACT_APP_SUPABASE_URL` - Supabase project URL
- [ ] `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `REACT_APP_TWELVE_DATA_API_KEY` - TwelveData API key (move to server-side)
- [ ] `DATABASE_URL` - PostgreSQL connection string

### Database Setup
- [ ] Run migration: `supabase db push`
- [ ] Verify tables created:
  - [ ] `pattern_feedback`
  - [ ] `privacy_consent`
  - [ ] `feedback_metrics` (materialized view)
- [ ] Test RLS policies:
  ```sql
  -- Test anonymous user can insert feedback
  SET LOCAL app.session_id = 'test-session';
  INSERT INTO pattern_feedback (...) VALUES (...);
  ```
- [ ] Verify cron jobs installed:
  ```sql
  SELECT * FROM cron.job;
  ```

### Security Audit
- [ ] Remove all `console.log` statements with sensitive data
- [ ] Verify API keys not exposed in client code
- [ ] Test secure storage encryption
- [ ] Validate all user inputs are sanitized
- [ ] Check Content Security Policy headers

### Feature Flags
```typescript
// Enable/disable features for gradual rollout
const FEATURE_FLAGS = {
  FEEDBACK_ENABLED: process.env.REACT_APP_FEEDBACK_ENABLED === 'true',
  LEARNING_ENGINE_ENABLED: process.env.REACT_APP_LEARNING_ENABLED === 'true',
  CONSENT_REQUIRED: process.env.REACT_APP_CONSENT_REQUIRED === 'true'
};
```

## Deployment Steps

### 1. Database Migration
```bash
# Run migrations
supabase db push

# Verify migration
supabase db diff

# Test materialized view refresh
psql $DATABASE_URL -c "SELECT refresh_feedback_metrics();"
```

### 2. Build & Test
```bash
# Install dependencies
npm ci

# Run tests
npm test -- --coverage

# Build production bundle
npm run build

# Analyze bundle size
npm run analyze
```

### 3. Environment Configuration
```bash
# Production .env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_FEEDBACK_ENABLED=true
REACT_APP_LEARNING_ENABLED=true
REACT_APP_CONSENT_REQUIRED=true
```

### 4. Deploy Application
```bash
# Deploy to Netlify
netlify deploy --prod

# Or deploy to Vercel
vercel --prod

# Or custom deployment
rsync -avz --delete build/ user@server:/var/www/trisight/
```

### 5. Post-Deployment Verification

#### Functionality Tests
- [ ] Pattern click opens feedback modal
- [ ] Consent modal appears for new users
- [ ] Feedback submission succeeds
- [ ] Success message displays
- [ ] Pattern shows feedback indicator

#### Privacy Tests
- [ ] Consent persists across sessions
- [ ] Revoke consent works
- [ ] Data retention policy enforced
- [ ] Anonymous sessions tracked

#### Learning System Tests
- [ ] Feedback added to buffer
- [ ] Batch processing triggers at threshold
- [ ] Model update events fire
- [ ] Statistics endpoint returns data

## Monitoring Setup

### Application Monitoring
```javascript
// Add to index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Remove sensitive data
    delete event.request?.cookies;
    delete event.extra?.apiKey;
    return event;
  }
});
```

### Database Monitoring
```sql
-- Monitor feedback velocity
CREATE OR REPLACE VIEW feedback_monitoring AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as feedback_count,
  AVG(accuracy) as avg_accuracy,
  AVG(CASE WHEN is_valid THEN 1 ELSE 0 END) as validity_rate
FROM pattern_feedback
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;

-- Alert on low validity patterns
CREATE OR REPLACE FUNCTION alert_low_validity_patterns()
RETURNS TABLE(pattern_id TEXT, validity_rate NUMERIC)
LANGUAGE sql
AS $$
  SELECT pattern_id, validity_rate
  FROM feedback_metrics
  WHERE validity_rate < 0.3
  AND total_feedbacks >= 10;
$$;
```

### Performance Metrics
- [ ] Page load time < 3s
- [ ] Feedback submission < 500ms
- [ ] Chart render < 100ms
- [ ] Memory usage stable
- [ ] No memory leaks

## Rollback Plan

### Quick Disable
```typescript
// Emergency feature flag override
localStorage.setItem('DISABLE_FEEDBACK_SYSTEM', 'true');
```

### Database Rollback
```sql
-- Disable feedback collection
ALTER TABLE pattern_feedback DISABLE ROW LEVEL SECURITY;

-- Drop cron jobs
SELECT cron.unschedule('refresh-feedback-metrics');
SELECT cron.unschedule('cleanup-expired-consents');
SELECT cron.unschedule('enforce-data-retention');
```

### Full Rollback
```bash
# Revert to previous version
git checkout tags/pre-feedback-release
npm ci
npm run build
npm run deploy
```

## Launch Communication

### User Notification
```typescript
// Add to App.tsx
const FeedbackLaunchBanner = () => (
  <div className="launch-banner">
    <h3>New: Pattern Feedback System</h3>
    <p>Help improve pattern detection by providing feedback!</p>
    <button onClick={() => setShowFeedbackGuide(true)}>Learn More</button>
  </div>
);
```

### Documentation Updates
- [ ] Update user guide
- [ ] Add feedback tutorial
- [ ] Create video walkthrough
- [ ] Update API documentation
- [ ] Publish release notes

## Success Metrics

### Week 1
- [ ] 100+ feedback submissions
- [ ] 50+ unique users
- [ ] < 5% error rate
- [ ] 80%+ consent rate

### Month 1
- [ ] 1000+ feedback submissions
- [ ] 200+ unique users
- [ ] 10+ patterns improved
- [ ] 5% accuracy improvement

### Ongoing
- [ ] Weekly feedback velocity report
- [ ] Monthly accuracy trend analysis
- [ ] Quarterly model performance review
- [ ] User satisfaction survey

## Support Preparation

### Common Issues & Solutions

1. **"Feedback not saving"**
   - Check browser console for errors
   - Verify consent is granted
   - Check network requests

2. **"Can't click patterns"**
   - Ensure pattern has `feedbackEnabled: true`
   - Check for overlapping UI elements
   - Verify pointer-events CSS

3. **"Consent keeps asking"**
   - Clear localStorage
   - Check cookie settings
   - Verify domain configuration

### Debug Commands
```javascript
// Check feedback stats
patternLearningEngine.getStatistics()

// Force process feedback
patternLearningEngine.forceProcessAll()

// Clear all feedback
patternLearningEngine.clearBuffer()

// Check consent status
localStorage.getItem('trisight_privacy_consent')
```

## Go/No-Go Criteria

### Go Criteria
- [ ] All tests passing (>90% coverage)
- [ ] No critical security issues
- [ ] Database migrations successful
- [ ] Performance benchmarks met
- [ ] Rollback plan tested

### No-Go Criteria
- [ ] Failed security audit
- [ ] Database migration errors
- [ ] Performance regression >20%
- [ ] Critical bugs in feedback flow
- [ ] Legal/compliance issues

## Sign-off

- [ ] Engineering Lead: ___________________ Date: _______
- [ ] Product Manager: ___________________ Date: _______
- [ ] Security Team: ____________________ Date: _______
- [ ] Legal/Compliance: _________________ Date: _______ 