-- db/schema.sql
-- TriSight engine schema for Railway Postgres — reconstructed from application code evidence
-- (the predecessor's hosted-DB DDL was never committed; 14 tables existed only in Supabase).
-- Idempotent: applied by the server at boot. Plain Postgres — no auth schema, no RLS, no pg_cron;
-- access control is the server's single trusted role + application-layer admin key.

CREATE TABLE IF NOT EXISTS ohlcv_data (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open DOUBLE PRECISION,
  high DOUBLE PRECISION,
  low DOUBLE PRECISION,
  close DOUBLE PRECISION,
  volume DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symbol, interval, timestamp)
);
CREATE INDEX IF NOT EXISTS idx_ohlcv_symbol_interval_ts ON ohlcv_data (symbol, interval, timestamp);

CREATE TABLE IF NOT EXISTS api_cache_status (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  first_timestamp TIMESTAMPTZ,
  last_timestamp TIMESTAMPTZ,
  last_fetch_at TIMESTAMPTZ,
  fetch_count INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symbol, interval)
);

CREATE TABLE IF NOT EXISTS pattern_cache (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT,
  pattern_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_symbol ON pattern_cache (symbol);

-- Enhanced feedback shape (migration 20250116, auth-FK stripped: user_id is a bare uuid)
CREATE TABLE IF NOT EXISTS pattern_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id TEXT,
  pattern_type TEXT,
  symbol TEXT,
  pattern_start_time TIMESTAMPTZ,
  pattern_end_time TIMESTAMPTZ,
  feedback_timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  session_id TEXT,
  is_valid BOOLEAN,
  accuracy NUMERIC(3,2),
  confidence NUMERIC(3,2),
  timing_assessment TEXT,
  step_issues TEXT[],
  channel_quality TEXT,
  shaft_quality TEXT,
  golden_quality TEXT,
  pivot_strength TEXT,
  box_quality TEXT,
  cloud_significance TEXT,
  risk_reward_rating TEXT,
  invalidity_reason TEXT,
  notes TEXT,
  pattern_metadata JSONB,
  ui_metadata JSONB,
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pattern_feedback_pattern ON pattern_feedback (pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_feedback_symbol ON pattern_feedback (symbol);
CREATE INDEX IF NOT EXISTS idx_pattern_feedback_session ON pattern_feedback (session_id);

CREATE TABLE IF NOT EXISTS pattern_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  sector TEXT,
  pattern_type TEXT,
  event_type TEXT CHECK (event_type IN ('PATTERN','TRADE_ENTRY','STOP_EXIT','TRADE_BIAS')),
  confidence NUMERIC(3,2),
  timestamp TIMESTAMPTZ DEFAULT now(),
  human_summary TEXT,
  metadata JSONB,
  render_hints JSONB,
  mcp_version TEXT DEFAULT '0.1.0',
  user_id UUID,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pattern_feed_created ON pattern_feed (created_at DESC);

CREATE TABLE IF NOT EXISTS privacy_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  consent_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  expires_at TIMESTAMPTZ,
  allow_data_processing BOOLEAN DEFAULT false,
  allow_model_training BOOLEAN DEFAULT false,
  allow_aggregate_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_enrich_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  section TEXT NOT NULL,
  model_source TEXT,
  content TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticker, timeframe, section)
);

-- input_review_feedback: Dick's per-element review responses (append-only; the latest
-- row per (strategy, element_id) is the current answer, priors stay for audit)
CREATE TABLE IF NOT EXISTS input_review_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy TEXT NOT NULL,
  element_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'correction')),
  correction_text TEXT,
  guidance_text TEXT,
  reviewer TEXT NOT NULL DEFAULT 'Dick O''Leary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_irf_strategy_element ON input_review_feedback (strategy, element_id, created_at DESC);

-- input_review_dialog: threaded per-element Q&A between the study (assay) and the
-- strategy owner. Append-only. `kind`: question | answer | evidence | note.
CREATE TABLE IF NOT EXISTS input_review_dialog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy TEXT NOT NULL,
  element_id TEXT NOT NULL,
  question_id TEXT,                -- groups an answer to the question it answers
  author TEXT NOT NULL CHECK (author IN ('assay', 'owner')),
  kind TEXT NOT NULL CHECK (kind IN ('question', 'answer', 'evidence', 'note')),
  body TEXT NOT NULL,
  evidence_json JSONB,             -- inline excerpts: [{source, quote, url?}]
  options_json JSONB,              -- structured answer choices, when the question defines them
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ird_thread ON input_review_dialog (strategy, element_id, created_at);

-- report_metadata: audit trail rows written by the enhanced-report orchestrator
CREATE TABLE IF NOT EXISTS report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL,
  symbol TEXT,
  report_type TEXT,
  timeframe TEXT,
  confidence NUMERIC,
  price_target NUMERIC,
  generated_at TIMESTAMPTZ,
  config TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reports: the FULL column set the handlers actually use (the committed migration had 6 columns;
-- the code uses ~20 — reconstructed from generate/status/cancel/download/list handlers).
-- file_bytes replaces the storage bucket: report artifacts live in Postgres, durable without a volume.
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT,
  symbol TEXT,
  title TEXT,
  template TEXT,
  author TEXT,
  format TEXT,
  timeframe TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  error TEXT,
  path TEXT,
  filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,
  download_url TEXT,
  file_bytes BYTEA,
  data JSONB,
  slides JSONB,
  company_data JSONB,
  metadata JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at DESC);

CREATE TABLE IF NOT EXISTS report_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT,
  name TEXT,
  description TEXT,
  provider TEXT,
  model TEXT,
  prompt TEXT,
  variables JSONB,
  enabled BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  format TEXT,
  enabled BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
  section_key TEXT,
  title TEXT,
  position INTEGER,
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_variables_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT,
  name TEXT,
  description TEXT,
  example TEXT,
  enabled BOOLEAN DEFAULT true,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- the one RPC the app calls
CREATE OR REPLACE FUNCTION get_pattern_feedback_summary(p_pattern_id TEXT)
RETURNS TABLE (
  total_feedback BIGINT,
  valid_count BIGINT,
  invalid_count BIGINT,
  avg_accuracy NUMERIC,
  avg_confidence NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    count(*) AS total_feedback,
    count(*) FILTER (WHERE is_valid IS TRUE) AS valid_count,
    count(*) FILTER (WHERE is_valid IS FALSE) AS invalid_count,
    avg(accuracy) AS avg_accuracy,
    avg(confidence) AS avg_confidence
  FROM pattern_feedback
  WHERE pattern_id = p_pattern_id;
$$;
