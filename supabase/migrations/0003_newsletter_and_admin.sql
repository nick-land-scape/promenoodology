-- What the back of the house needs, and the newsletter table written down at
-- last.
--
-- Run this the same way as the others: SQL Editor → New query → paste → Run.
-- It is safe on a database that already has some of this: everything is either
-- "if not exists" or dropped and made again.

-- ------------------------------------------------------------- the newsletter

-- app/(site)/newsletter/actions.ts has been writing to this table since the
-- newsletter page went up, and the table was made by hand in the dashboard
-- rather than by a migration — so a fresh copy of the project could not build
-- one. This is that table, written down. The shape is the one
-- lib/supabase/rows.ts already describes.
create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  -- Reserved for a double opt-in later; nothing checks it yet.
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.newsletter enable row level security;

-- The policies made by hand carry different names, so both are cleared first —
-- two permissive policies saying the same thing is only confusing to read.
drop policy if exists "anyone may subscribe" on public.newsletter;
drop policy if exists "anyone joins the list" on public.newsletter;
drop policy if exists "admins read the list" on public.newsletter;
drop policy if exists "admins change the list" on public.newsletter;
drop policy if exists "admins take people off the list" on public.newsletter;

-- Anybody may put their address on the list, and nobody may read it back —
-- which is also why the form cannot check first whether somebody is already on
-- it: the unique index above answers that, as a 23505.
create policy "anyone joins the list" on public.newsletter
  for insert with check (true);

create policy "admins read the list" on public.newsletter
  for select using (public.is_admin());

create policy "admins change the list" on public.newsletter
  for update using (public.is_admin()) with check (public.is_admin());

-- Somebody who asks to come off the list should come off it, not be marked as
-- something.
create policy "admins take people off the list" on public.newsletter
  for delete using (public.is_admin());

create index if not exists newsletter_date_idx on public.newsletter (created_at desc);

-- ------------------------------------------------------------- applications

-- The first migration lets anybody apply and an admin read and change the
-- applications, but never delete one. A request that has been answered and
-- finished with should be clearable from the inbox — it holds somebody's
-- contact details, and keeping those forever is not a kindness.
drop policy if exists "admins remove applications" on public.applications;
create policy "admins remove applications" on public.applications
  for delete using (public.is_admin());

-- ------------------------------------------------------------------- ordering

-- Both lists are ordered by `position`, and the back of the house writes a whole
-- new order in one go. Without an index that is a sort on every read; and two
-- rows sharing a position come back in whatever order the planner feels like.
create index if not exists stories_position_idx on public.stories (position);
create index if not exists photos_position_idx on public.photos (position);
