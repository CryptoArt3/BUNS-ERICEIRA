create table if not exists public.app_runtime_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_runtime_state enable row level security;

drop policy if exists "Service role can manage runtime state" on public.app_runtime_state;
create policy "Service role can manage runtime state"
on public.app_runtime_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
