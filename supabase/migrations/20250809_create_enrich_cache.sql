create table if not exists public.report_enrich_cache (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  timeframe text not null,
  section text not null,
  model_source text not null,
  content text not null,
  tokens_used int,
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_enrich_key
  on public.report_enrich_cache (ticker, timeframe, section);

create index if not exists enrich_created_idx
  on public.report_enrich_cache (created_at desc);

