-- ================================================================
-- BUNS Analytics Events — Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

create table if not exists public.analytics_events (
  id          uuid        primary key default gen_random_uuid(),
  event_name  text        not null,
  path        text,
  product_id  text,
  cart_total  numeric,
  order_id    text,
  language    text,
  is_pwa      boolean,
  user_id     uuid        references auth.users(id) on delete set null,
  session_id  text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- Indexes for dashboard queries
create index if not exists analytics_events_event_name_idx  on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx  on public.analytics_events (created_at desc);
create index if not exists analytics_events_session_id_idx  on public.analytics_events (session_id);
create index if not exists analytics_events_user_id_idx     on public.analytics_events (user_id);

-- RLS
alter table public.analytics_events enable row level security;

-- Anyone (anon + authenticated) can insert events
create policy "analytics_insert_public"
  on public.analytics_events
  for insert
  with check (true);

-- Only authenticated users can read (admin dashboard uses authenticated session)
create policy "analytics_read_authenticated"
  on public.analytics_events
  for select
  using (auth.role() = 'authenticated');
