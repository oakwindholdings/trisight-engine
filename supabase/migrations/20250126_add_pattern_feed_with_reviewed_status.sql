-- Migration: Add Pattern Feed Table with Reviewed Status
-- Description: Creates pattern_feed table for feed entries and adds reviewed status tracking

-- Create pattern_feed table based on PatternFeedEntry interface
CREATE TABLE pattern_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  sector TEXT,
  pattern_type TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('PATTERN', 'TRADE_ENTRY', 'STOP_EXIT', 'TRADE_BIAS')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  timestamp TIMESTAMPTZ NOT NULL,
  human_summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  render_hints JSONB DEFAULT '{}',
  mcp_version TEXT NOT NULL DEFAULT '0.1.0',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Reviewed status fields
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_reviewed_consistency CHECK (
    (reviewed = false AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (reviewed = true AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_pattern_feed_symbol ON pattern_feed(symbol);
CREATE INDEX idx_pattern_feed_pattern_type ON pattern_feed(pattern_type);
CREATE INDEX idx_pattern_feed_event_type ON pattern_feed(event_type);
CREATE INDEX idx_pattern_feed_timestamp ON pattern_feed(timestamp DESC);
CREATE INDEX idx_pattern_feed_reviewed ON pattern_feed(reviewed);
CREATE INDEX idx_pattern_feed_reviewed_by ON pattern_feed(reviewed_by);
CREATE INDEX idx_pattern_feed_created_at ON pattern_feed(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_pattern_feed_symbol_type ON pattern_feed(symbol, pattern_type);
CREATE INDEX idx_pattern_feed_reviewed_status ON pattern_feed(reviewed, reviewed_by) WHERE reviewed = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pattern_feed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_pattern_feed_updated_at BEFORE UPDATE
  ON pattern_feed FOR EACH ROW EXECUTE FUNCTION update_pattern_feed_updated_at();

-- Row Level Security
ALTER TABLE pattern_feed ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon users to insert feed entries (for pattern detection)
CREATE POLICY "Allow anon to insert pattern feed" ON pattern_feed
  FOR INSERT WITH CHECK (true);

-- Policy: Allow anon users to read feed entries
CREATE POLICY "Allow anon to read pattern feed" ON pattern_feed
  FOR SELECT USING (true);

-- Policy: Allow authenticated users to update reviewed status
CREATE POLICY "Allow authenticated to update reviewed status" ON pattern_feed
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT INSERT, SELECT ON pattern_feed TO anon;
GRANT INSERT, SELECT, UPDATE ON pattern_feed TO authenticated;
