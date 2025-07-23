-- Migration: Add Pattern Feedback System
-- Description: Creates tables and infrastructure for pattern feedback collection and learning

-- Create enum types
CREATE TYPE feedback_accuracy AS ENUM (
  'VERY_INACCURATE',
  'INACCURATE', 
  'NEUTRAL',
  'ACCURATE',
  'VERY_ACCURATE'
);

CREATE TYPE timing_assessment AS ENUM (
  'too_early',
  'slightly_early',
  'perfect',
  'slightly_late',
  'too_late'
);

CREATE TYPE invalidity_reason AS ENUM (
  'false_positive',
  'wrong_pattern_type',
  'poor_boundaries',
  'missing_confirmation',
  'market_context',
  'other'
);

CREATE TYPE consent_type AS ENUM (
  'feedback',
  'analytics',
  'all'
);

-- Create pattern_feedback table
CREATE TABLE pattern_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- Core feedback data
  accuracy INTEGER NOT NULL CHECK (accuracy >= 1 AND accuracy <= 5),
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timing timing_assessment NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  invalidity_reason invalidity_reason,
  
  -- Additional context
  notes TEXT CHECK (char_length(notes) <= 1000),
  suggested_start_time TIMESTAMPTZ,
  suggested_end_time TIMESTAMPTZ,
  suggested_price_high NUMERIC(10,2),
  suggested_price_low NUMERIC(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT NOT NULL,
  viewport_width INTEGER NOT NULL CHECK (viewport_width > 0),
  viewport_height INTEGER NOT NULL CHECK (viewport_height > 0),
  
  -- Privacy
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ NOT NULL,
  data_retention_days INTEGER NOT NULL DEFAULT 90,
  
  -- Constraints
  CONSTRAINT check_invalidity_reason CHECK (
    (is_valid = false AND invalidity_reason IS NOT NULL) OR
    (is_valid = true AND invalidity_reason IS NULL)
  ),
  CONSTRAINT check_suggested_times CHECK (
    suggested_start_time IS NULL OR
    suggested_end_time IS NULL OR
    suggested_start_time < suggested_end_time
  ),
  CONSTRAINT check_suggested_prices CHECK (
    suggested_price_low IS NULL OR
    suggested_price_high IS NULL OR
    suggested_price_low < suggested_price_high
  )
);

-- Create privacy_consent table
CREATE TABLE privacy_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_type consent_type NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Data rights
  allow_data_processing BOOLEAN NOT NULL DEFAULT false,
  allow_model_training BOOLEAN NOT NULL DEFAULT false,
  allow_aggregate_sharing BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pattern_feedback_pattern_id ON pattern_feedback(pattern_id);
CREATE INDEX idx_pattern_feedback_session_id ON pattern_feedback(session_id);
CREATE INDEX idx_pattern_feedback_created_at ON pattern_feedback(created_at);
CREATE INDEX idx_pattern_feedback_pattern_type ON pattern_feedback(pattern_type);
CREATE INDEX idx_privacy_consent_session_id ON privacy_consent(session_id);
CREATE INDEX idx_privacy_consent_expires_at ON privacy_consent(expires_at);

-- Create materialized view for aggregated feedback metrics
CREATE MATERIALIZED VIEW feedback_metrics AS
SELECT 
  pattern_id,
  pattern_type,
  COUNT(*) as total_feedbacks,
  
  -- Aggregated metrics
  AVG(accuracy) as average_accuracy,
  AVG(confidence) as average_confidence,
  AVG(CASE WHEN is_valid THEN 1 ELSE 0 END)::NUMERIC as validity_rate,
  
  -- Timing distribution
  jsonb_object_agg(
    timing_counts.timing::TEXT,
    timing_count
  ) FILTER (WHERE timing_counts.timing IS NOT NULL) as timing_distribution,
  
  -- Invalidity reasons distribution
  jsonb_object_agg(
    reason_counts.invalidity_reason::TEXT,
    reason_count
  ) FILTER (WHERE reason_counts.invalidity_reason IS NOT NULL) as invalidity_reasons,
  
  -- Temporal metrics
  MIN(created_at) as first_feedback_at,
  MAX(created_at) as last_feedback_at,
  COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600, 0) as feedback_velocity,
  
  -- Update timestamp
  NOW() as last_refreshed
FROM pattern_feedback
LEFT JOIN LATERAL (
  SELECT timing, COUNT(*) as timing_count
  FROM pattern_feedback pf2
  WHERE pf2.pattern_id = pattern_feedback.pattern_id
  GROUP BY timing
) timing_counts ON true
LEFT JOIN LATERAL (
  SELECT invalidity_reason, COUNT(*) as reason_count
  FROM pattern_feedback pf3
  WHERE pf3.pattern_id = pattern_feedback.pattern_id
  AND invalidity_reason IS NOT NULL
  GROUP BY invalidity_reason
) reason_counts ON true
WHERE consent_given = true
GROUP BY pattern_id, pattern_type;

-- Create index on materialized view
CREATE INDEX idx_feedback_metrics_pattern_id ON feedback_metrics(pattern_id);
CREATE INDEX idx_feedback_metrics_validity_rate ON feedback_metrics(validity_rate);

-- Row Level Security (RLS) policies
ALTER TABLE pattern_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consent ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON pattern_feedback
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND session_id IS NOT NULL) OR
    (auth.uid() = user_id)
  );

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON pattern_feedback
  FOR SELECT
  USING (
    (auth.uid() IS NULL AND session_id = current_setting('app.session_id', true)) OR
    (auth.uid() = user_id)
  );

-- Policy: Anonymous users can manage their consent
CREATE POLICY "Users can manage own consent" ON privacy_consent
  FOR ALL
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- Policy: System can read aggregated metrics (public)
GRANT SELECT ON feedback_metrics TO public;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_feedback_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY feedback_metrics;
END;
$$;

-- Create function to clean up expired consents
CREATE OR REPLACE FUNCTION cleanup_expired_consents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM privacy_consent
  WHERE expires_at < NOW();
  
  -- Also delete feedback from expired sessions
  DELETE FROM pattern_feedback
  WHERE session_id IN (
    SELECT session_id 
    FROM privacy_consent 
    WHERE expires_at < NOW()
  );
END;
$$;

-- Create function to enforce data retention
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM pattern_feedback
  WHERE created_at < NOW() - INTERVAL '1 day' * data_retention_days;
END;
$$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pattern_feedback_updated_at
  BEFORE UPDATE ON pattern_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_privacy_consent_updated_at
  BEFORE UPDATE ON privacy_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Install pg_cron extension if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly refresh of materialized view
SELECT cron.schedule(
  'refresh-feedback-metrics',
  '0 * * * *', -- Every hour
  'SELECT refresh_feedback_metrics();'
);

-- Schedule daily cleanup of expired data
SELECT cron.schedule(
  'cleanup-expired-consents',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_expired_consents();'
);

-- Schedule daily enforcement of data retention
SELECT cron.schedule(
  'enforce-data-retention',
  '0 3 * * *', -- Daily at 3 AM
  'SELECT enforce_data_retention();'
);

-- Create function to get pattern feedback summary
CREATE OR REPLACE FUNCTION get_pattern_feedback_summary(p_pattern_id TEXT)
RETURNS TABLE (
  total_feedbacks BIGINT,
  average_accuracy NUMERIC,
  average_confidence NUMERIC,
  validity_rate NUMERIC,
  most_common_timing TEXT,
  feedback_trend TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_recent_accuracy NUMERIC;
  v_older_accuracy NUMERIC;
BEGIN
  -- Get recent vs older accuracy to determine trend
  SELECT AVG(accuracy) INTO v_recent_accuracy
  FROM pattern_feedback
  WHERE pattern_id = p_pattern_id
  AND created_at > NOW() - INTERVAL '7 days'
  AND consent_given = true;
  
  SELECT AVG(accuracy) INTO v_older_accuracy
  FROM pattern_feedback
  WHERE pattern_id = p_pattern_id
  AND created_at <= NOW() - INTERVAL '7 days'
  AND created_at > NOW() - INTERVAL '30 days'
  AND consent_given = true;
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    AVG(accuracy),
    AVG(confidence),
    AVG(CASE WHEN is_valid THEN 1 ELSE 0 END)::NUMERIC,
    mode() WITHIN GROUP (ORDER BY timing)::TEXT,
    CASE
      WHEN v_recent_accuracy IS NULL OR v_older_accuracy IS NULL THEN 'insufficient_data'
      WHEN v_recent_accuracy > v_older_accuracy + 0.1 THEN 'improving'
      WHEN v_recent_accuracy < v_older_accuracy - 0.1 THEN 'declining'
      ELSE 'stable'
    END
  FROM pattern_feedback
  WHERE pattern_id = p_pattern_id
  AND consent_given = true;
END;
$$;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_pattern_feedback_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_pattern_feedback_summary TO anon; 