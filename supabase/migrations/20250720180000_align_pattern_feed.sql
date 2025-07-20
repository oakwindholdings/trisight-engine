-- 2025-07-20 18:00 UTC – Align pattern_feed table with MCP spec
-- Adds missing columns and adjusts data types for unified TriSight feed ingestion
-- NOTE: This migration is idempotent; it checks existence before altering.

-- Create table if it does not exist
create table if not exists public.pattern_feed (
  id uuid primary key,
  symbol text not null,
  patternType text not null,
  eventType text not null default 'PATTERN',
  confidence numeric,
  timestamp timestamptz not null,
  humanSummary text,
  metadata jsonb,
  mcpVersion text default '0.1.0'
);

-- Ensure every required column exists (Postgres 11+ syntax)
alter table public.pattern_feed
  add column if not exists symbol text;
alter table public.pattern_feed
  add column if not exists patternType text;
alter table public.pattern_feed
  add column if not exists eventType text;
alter table public.pattern_feed
  add column if not exists confidence numeric;
alter table public.pattern_feed
  add column if not exists timestamp timestamptz;
alter table public.pattern_feed
  add column if not exists humanSummary text;
alter table public.pattern_feed
  add column if not exists metadata jsonb;
alter table public.pattern_feed
  add column if not exists mcpVersion text;

-- Open RLS for now (TODO secure later)
alter table public.pattern_feed disable row level security;