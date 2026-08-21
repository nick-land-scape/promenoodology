-- Waving at somebody.
--
-- The people tab had a "say hello" button against every name and it did nothing —
-- which is the smallest possible version of the thing this club is actually for,
-- left as a drawing. A wave is the whole message: no subject, no words, no thread.
-- You waved, they know, they can wave back.
--
-- One wave at a time and no history of how many: waving twice at the same person
-- replaces the first one rather than piling up, so this cannot become a way to
-- pester anybody.

create table if not exists public.waves (
  id uuid primary key default gen_random_uuid(),
  from_profile uuid not null references public.profiles (id) on delete cascade,
  to_profile uuid not null references public.profiles (id) on delete cascade,
  at timestamptz not null default now(),
  -- When they saw it. Null means the bubble in the header is still counting it.
  seen_at timestamptz,
  unique (from_profile, to_profile),
  -- Waving at yourself is not a thing.
  constraint waves_not_yourself check (from_profile <> to_profile)
);

create index if not exists waves_to on public.waves (to_profile, seen_at);

alter table public.waves enable row level security;

-- You see the ones you were sent and the ones you sent. Nobody else's.
drop policy if exists "your own waves" on public.waves;
create policy "your own waves" on public.waves
  for select using (to_profile = public.me() or from_profile = public.me() or public.is_admin());

drop policy if exists "you wave" on public.waves;
create policy "you wave" on public.waves
  for insert with check (from_profile = public.me());

-- Marking one as seen is an update to a wave you were sent; waving again is an
-- update to one you sent. Both are yours to make.
drop policy if exists "you mark yours" on public.waves;
create policy "you mark yours" on public.waves
  for update using (to_profile = public.me() or from_profile = public.me())
  with check (to_profile = public.me() or from_profile = public.me());

drop policy if exists "you take back a wave" on public.waves;
create policy "you take back a wave" on public.waves
  for delete using (from_profile = public.me() or to_profile = public.me());
