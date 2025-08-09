create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  timeframe text not null,
  path text not null,                         -- storage path or URL
  metadata jsonb,                             -- optional details for later
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_ticker on public.reports(ticker);

