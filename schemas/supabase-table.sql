-- Border of Evidence / Supabase evidence archive schema
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists cube;
create extension if not exists earthdistance;

create table if not exists public.boe_evidence_entries (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  collected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone not null,

  element_id text not null,
  trigger_type text not null check (
    trigger_type in (
      'study',
      'retraction',
      'claim',
      'funding_shift',
      'policy_update',
      'field_report',
      'community_upload',
      'overclaim_correction',
      'dataset',
      'court_ruling',
      'natural_event',
      'sensor_signal',
      'news'
    )
  ),
  evidence_score numeric(3,2) not null check (evidence_score >= 0.00 and evidence_score <= 1.00),
  domains text[] default array[]::text[],

  title text not null,
  summary text not null,
  reason text not null,
  url text unique not null,
  source text not null,

  latitude numeric(9,6),
  longitude numeric(9,6),
  region_name text,
  source_type text default 'web_scraped',
  metrics jsonb default '{}'::jsonb,
  raw jsonb default '{}'::jsonb,
  ingested_by text default 'seraphina_news_v1'
);

create index if not exists idx_boe_evidence_published_at on public.boe_evidence_entries (published_at desc);
create index if not exists idx_boe_evidence_element_id on public.boe_evidence_entries (element_id);
create index if not exists idx_boe_evidence_trigger_type on public.boe_evidence_entries (trigger_type);
create index if not exists idx_boe_evidence_score on public.boe_evidence_entries (evidence_score desc);
create index if not exists idx_boe_evidence_domains on public.boe_evidence_entries using gin (domains);
create index if not exists idx_boe_evidence_raw on public.boe_evidence_entries using gin (raw);

alter table public.boe_evidence_entries enable row level security;

drop policy if exists "Public read access for evidence entries" on public.boe_evidence_entries;
create policy "Public read access for evidence entries"
  on public.boe_evidence_entries
  for select
  using (true);

-- Writes must happen server-side through SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in frontend or Vercel client env.
