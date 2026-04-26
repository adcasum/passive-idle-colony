-- ============================================================================
-- Leaderboard view fixes
-- ============================================================================
-- 1. Recreate with security_invoker=on so the view enforces the querying
--    user's RLS on `colonies` (not the creator's). Supabase lint flags
--    SECURITY DEFINER views as critical.
-- 2. Fix slot_count: jsonb_array_length(slots) always returned 9 because
--    colonies.slots is a fixed 9-element array padded with `null` for empty
--    slots. Count only non-null elements.
-- ============================================================================

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
