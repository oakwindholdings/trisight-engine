-- Migration: Enhanced Pattern Feedback System
-- Supports comprehensive feedback for all TriSight patterns and signals

-- Drop existing pattern_feedback table if it exists
DROP TABLE IF EXISTS pattern_feedback CASCADE;

-- Create enhanced pattern_feedback table
CREATE TABLE pattern_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Pattern identification
  pattern_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  
  -- Temporal data
  pattern_start_time TIMESTAMPTZ,
  pattern_end_time TIMESTAMPTZ,
  feedback_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- User/session tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- Core feedback data
  is_valid BOOLEAN,
  accuracy NUMERIC(3,2) CHECK (accuracy >= 0 AND accuracy <= 1),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Timing assessment
  timing_assessment TEXT CHECK (timing_assessment IN ('EARLY', 'ON_TIME', 'LATE', 'MISSED')),
  
  -- Pattern-specific feedback fields
  -- Escalator
  step_issues TEXT[],
  is_valid_step BOOLEAN,
  step_boundary_issues TEXT[],
  step_notes TEXT,
  
  -- Blackjack
  score_accuracy NUMERIC(3,2),
  is_actionable BOOLEAN,
  context_factors TEXT[],
  context_notes TEXT,
  score_reasonable BOOLEAN,
  score_notes TEXT,
  qualification_correct BOOLEAN,
  target_accuracy NUMERIC(3,2),
  qualification_notes TEXT,
  
  -- Goldmine Channel
  channel_quality NUMERIC(3,2),
  is_valid_channel BOOLEAN,
  channel_issues TEXT[],
  breakout_timing TEXT,
  channel_analysis TEXT,
  
  -- Goldmine Shaft
  shaft_quality NUMERIC(3,2),
  is_valid_shaft BOOLEAN,
  fib_accuracy TEXT[],
  entry_timing TEXT,
  retrace_analysis TEXT,
  
  -- Goldmine Forensics
  forensic_insights TEXT[],
  forensic_notes TEXT,
  
  -- Golden Candle
  golden_quality NUMERIC(3,2),
  is_true_golden BOOLEAN,
  golden_timing TEXT,
  breakout_characteristics TEXT[],
  golden_analysis TEXT,
  should_qualify BOOLEAN,
  criteria_adjustment TEXT[],
  near_miss_analysis TEXT,
  
  -- Rocketman
  acceleration_quality NUMERIC(3,2),
  is_valid_rocket BOOLEAN,
  peak_timing TEXT,
  rocket_type TEXT[],
  acceleration_analysis TEXT,
  
  -- Pivot
  pivot_strength NUMERIC(3,2),
  is_valid_pivot BOOLEAN,
  touch_quality TEXT[],
  pivot_timing TEXT,
  pivot_analysis TEXT,
  
  -- Breakout Box
  box_quality NUMERIC(3,2),
  is_valid_breakout BOOLEAN,
  breakout_type TEXT[],
  box_analysis TEXT,
  
  -- CMC (Conviction Mass Cloud)
  cloud_significance NUMERIC(3,2),
  is_actionable_cloud BOOLEAN,
  cloud_interpretation TEXT[],
  cloud_analysis TEXT,
  
  -- Trade signals
  is_good_entry BOOLEAN,
  entry_quality TEXT[],
  risk_reward_rating NUMERIC(3,2),
  trade_notes TEXT,
  is_appropriate_stop BOOLEAN,
  stop_type TEXT[],
  exit_analysis TEXT,
  agree_with_bias BOOLEAN,
  bias_strength NUMERIC(3,2),
  bias_context TEXT,
  
  -- Labels and zones
  is_label_correct BOOLEAN,
  label_notes TEXT,
  is_valid_zone BOOLEAN,
  zone_characteristics TEXT[],
  zone_notes TEXT,
  
  -- System events
  event_handled_well BOOLEAN,
  system_notes TEXT,
  
  -- General notes field
  notes TEXT,
  
  -- Metadata
  pattern_metadata JSONB,
  ui_metadata JSONB,
  
  -- Privacy and consent
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  
  -- Indexes for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pattern_feedback_pattern_id ON pattern_feedback(pattern_id);
CREATE INDEX idx_pattern_feedback_pattern_type ON pattern_feedback(pattern_type);
CREATE INDEX idx_pattern_feedback_symbol ON pattern_feedback(symbol);
CREATE INDEX idx_pattern_feedback_user_id ON pattern_feedback(user_id);
CREATE INDEX idx_pattern_feedback_session_id ON pattern_feedback(session_id);
CREATE INDEX idx_pattern_feedback_created_at ON pattern_feedback(created_at DESC);
CREATE INDEX idx_pattern_feedback_pattern_timestamp ON pattern_feedback(pattern_start_time, pattern_end_time);

-- Create composite indexes for common queries
CREATE INDEX idx_pattern_feedback_symbol_type ON pattern_feedback(symbol, pattern_type);
CREATE INDEX idx_pattern_feedback_valid_patterns ON pattern_feedback(is_valid, pattern_type) WHERE is_valid IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_pattern_feedback_updated_at BEFORE UPDATE
  ON pattern_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for feedback analytics
CREATE OR REPLACE VIEW pattern_feedback_analytics AS
SELECT 
  pattern_type,
  symbol,
  COUNT(*) as feedback_count,
  AVG(accuracy) as avg_accuracy,
  AVG(confidence) as avg_confidence,
  COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_count,
  COUNT(CASE WHEN is_valid = false THEN 1 END) as invalid_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE_TRUNC('day', feedback_timestamp) as feedback_date
FROM pattern_feedback
GROUP BY pattern_type, symbol, DATE_TRUNC('day', feedback_timestamp);

-- Create view for pattern performance metrics
CREATE OR REPLACE VIEW pattern_performance_metrics AS
SELECT 
  pf.pattern_type,
  pf.symbol,
  COUNT(*) as total_feedback,
  AVG(CASE 
    WHEN pf.is_valid = true THEN 1 
    WHEN pf.is_valid = false THEN 0 
    ELSE NULL 
  END) as validity_rate,
  AVG(pf.accuracy) as avg_accuracy,
  AVG(pf.confidence) as avg_confidence,
  AVG(pf.risk_reward_rating) as avg_risk_reward,
  COUNT(CASE WHEN pf.timing_assessment = 'ON_TIME' THEN 1 END)::FLOAT / 
    NULLIF(COUNT(CASE WHEN pf.timing_assessment IS NOT NULL THEN 1 END), 0) as timing_accuracy
FROM pattern_feedback pf
WHERE pf.created_at >= NOW() - INTERVAL '30 days'
GROUP BY pf.pattern_type, pf.symbol;

-- Row Level Security
ALTER TABLE pattern_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON pattern_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON pattern_feedback
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update their own feedback" ON pattern_feedback
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy: Anonymous users can insert feedback with session_id
CREATE POLICY "Anonymous users can insert feedback" ON pattern_feedback
  FOR INSERT WITH CHECK (
    user_id IS NULL AND session_id IS NOT NULL
  );

-- Policy: Anonymous users can view their session feedback
CREATE POLICY "Anonymous users can view session feedback" ON pattern_feedback
  FOR SELECT USING (
    user_id IS NULL
  );

-- Grant permissions to authenticated and anonymous users
GRANT INSERT, SELECT, UPDATE ON pattern_feedback TO authenticated;
GRANT INSERT, SELECT ON pattern_feedback TO anon;
GRANT SELECT ON pattern_feedback_analytics TO authenticated, anon;
GRANT SELECT ON pattern_performance_metrics TO authenticated, anon; 