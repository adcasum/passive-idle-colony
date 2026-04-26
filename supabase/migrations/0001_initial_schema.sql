-- ============================================================================
-- Passive Idle Colony — Initial schema
-- ============================================================================
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL → New).
-- This is Phase A: cloud-save + analytics + leaderboards via the wallet
-- address as identity. There is no on-chain signature verification yet —
-- a malicious client could in theory claim any wallet address. Phase B
-- adds Sign-In With Solana (SIWS) via Edge Function and tightens RLS.
-- ============================================================================

-- 1. Colonies (cloud-save mirror of local AsyncStorage state).
create table if not exists public.colonies (
  wallet_address text primary key,
  slots jsonb not null default '[]'::jsonb,
  resources jsonb not null default '{"honey":0,"energy":0,"food":0,"water":0}'::jsonb,
  last_claim_at bigint not null default 0,
  total_claimed jsonb not null default '{"honey":0,"energy":0,"food":0,"water":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists colonies_updated_at_idx on public.colonies (updated_at desc);

-- 2. Claim history (one row per claim).
create table if not exists public.claim_history (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references public.colonies(wallet_address) on delete cascade,
  hours numeric not null,
  resources jsonb not null,
  claimed_at timestamptz not null default now()
);

create index if not exists claim_history_wallet_idx on public.claim_history (wallet_address, claimed_at desc);

-- 3. Analytics events.
create table if not exists public.events (
  id bigserial primary key,
  wallet_address text,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_event_idx on public.events (event, created_at desc);
create index if not exists events_wallet_idx on public.events (wallet_address, created_at desc);

-- 4. Leaderboard view: rough "colony power" ranking based on claimed honey.
--
-- security_invoker=on makes the view enforce the *querying* user's RLS policies
-- on `colonies`, not the view creator's. Without this Postgres treats views as
-- SECURITY DEFINER by default, which Supabase's lint flags as critical.
--
-- slot_count counts only non-null slot entries: the colonies.slots column always
-- holds a 9-element array with `null` for empty slots, so a naive
-- jsonb_array_length would always return 9.
drop view if exists public.leaderboard;
create view public.leaderboard
  with (security_invoker = on)
  as
select
  c.wallet_address,
  coalesce((c.total_claimed->>'honey')::numeric, 0) as honey_total,
  coalesce((c.total_claimed->>'energy')::numeric, 0) as energy_total,
  coalesce((c.total_claimed->>'food')::numeric, 0) as food_total,
  coalesce((c.total_claimed->>'water')::numeric, 0) as water_total,
  (
    select count(*)::int
    from jsonb_array_elements(c.slots) elem
    where elem is not null and elem <> 'null'::jsonb
  ) as slot_count,
  c.updated_at
from public.colonies c
order by honey_total desc;

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Phase A policies:
-- - colonies / claim_history: anyone can SELECT (leaderboard relies on this).
--   INSERT/UPDATE/DELETE allowed if the row's wallet_address matches the value
--   the client provides via a request header `x-wallet-address`. This is NOT
--   secure against forgery and is replaced in Phase B by SIWS-issued JWTs.
-- - events: anyone can INSERT, SELECT only own events.

alter table public.colonies enable row level security;
alter table public.claim_history enable row level security;
alter table public.events enable row level security;

-- Helper: read wallet from request header (set by client).
create or replace function public.current_wallet()
returns text
language sql
stable
as $$
  select coalesce(current_setting('request.headers', true)::jsonb->>'x-wallet-address', '');
$$;

-- Colonies
drop policy if exists colonies_select on public.colonies;
create policy colonies_select on public.colonies for select using (true);

drop policy if exists colonies_insert on public.colonies;
create policy colonies_insert on public.colonies for insert
  with check (wallet_address = public.current_wallet() and wallet_address <> '');

drop policy if exists colonies_update on public.colonies;
create policy colonies_update on public.colonies for update
  using (wallet_address = public.current_wallet() and wallet_address <> '')
  with check (wallet_address = public.current_wallet());

drop policy if exists colonies_delete on public.colonies;
create policy colonies_delete on public.colonies for delete
  using (wallet_address = public.current_wallet() and wallet_address <> '');

-- Claim history
drop policy if exists claim_history_select on public.claim_history;
create policy claim_history_select on public.claim_history for select using (true);

drop policy if exists claim_history_insert on public.claim_history;
create policy claim_history_insert on public.claim_history for insert
  with check (wallet_address = public.current_wallet() and wallet_address <> '');

-- Events: anyone can insert (analytics), read only own
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert with check (true);

drop policy if exists events_select on public.events;
create policy events_select on public.events for select
  using (wallet_address = public.current_wallet() and wallet_address <> '');

-- Touch trigger: bump updated_at on colonies update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists colonies_touch on public.colonies;
create trigger colonies_touch
  before update on public.colonies
  for each row execute function public.touch_updated_at();
