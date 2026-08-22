-- Sheets: how to put one of these on, in a kind of place, by yourself.
--
-- This collective's own line is that anybody can do this — un-fancy method,
-- borrowed kit, whatever a square already has. That claim was made in the
-- handbook, on a website, behind a menu, to whoever happened to be reading it.
-- A sheet is the claim made passable: one page per kind of place, with what it
-- takes, what to do in what order, and a photograph of it working, at an address
-- anybody can open with no account and hand on to somebody else.
--
-- Deliberately not stories. A story says what happened once; a sheet says what
-- to do next, which is a different document with a different shape and a much
-- shorter life — it gets corrected every time somebody tries it.

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  -- The address it gets: /do-it-yourself/a-square. Written by hand rather than
  -- generated, because it is the thing people paste into messages and it should
  -- read like a sentence and never change under a link somebody already sent.
  slug text not null unique,
  -- The kind of place. "a square", "a car park", "a courtyard".
  title text not null default '',
  -- One line, in the club's purple, saying what this kind of place gives back.
  hook text not null default '',
  -- A paragraph. Why this kind of place at all, and what to expect of it.
  words text not null default '',
  -- What it takes, one per line. The materials list.
  needs text not null default '',
  -- What to do, in order, one per line.
  steps text not null default '',
  -- One photograph of it working, out of the archive.
  photo_path text,
  -- Roughly how many this feeds, so somebody can judge the size of the thing.
  people_fed integer,
  published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sheets_in_order on public.sheets (position, created_at);

comment on table public.sheets is
  'One page per kind of place: what it takes, what to do, a photograph. Public, no account, made to be handed on.';

alter table public.sheets enable row level security;

-- Anybody at all may read a published one. That is the whole point of it: a
-- sheet behind a login is a sheet nobody can be given.
drop policy if exists "anybody reads a published sheet" on public.sheets;
create policy "anybody reads a published sheet" on public.sheets
  for select using (published = true and deleted_at is null);

drop policy if exists "admins read every sheet" on public.sheets;
create policy "admins read every sheet" on public.sheets
  for select using (public.is_admin());

drop policy if exists "admins write the sheets" on public.sheets;
create policy "admins write the sheets" on public.sheets
  for all using (public.is_admin()) with check (public.is_admin());
