-- 課題9: Brain Knowledge detail modal displays a creation date, which
-- public.ideas never had a column for. Additive + backward compatible —
-- `default now()` backfills existing seeded rows at migration time and
-- keeps every existing insert (seed script, complete_workflow RPC) working
-- unchanged with no explicit value required.
alter table public.ideas
  add column created_at timestamptz not null default now();
