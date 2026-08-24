-- Reporting something, and blocking somebody.
--
-- Both stores require this of any app where people can write to each other, and
-- neither is subtle about it. Apple's guideline 1.2 asks for a way to report
-- objectionable content, a way to block abusive users, and a published way to
-- reach the people who can act. Google's user-generated content policy asks for
-- the same in different words. An app with a feed and neither is a rejection
-- waiting to be written, and more to the point: a club where the only thing you
-- can do about somebody is leave is not a club anybody should have to be in.
--
-- Until now a member could take down their own post. That was all.
--
-- Two tables rather than one, because they are two different things. A report is
-- somebody telling the club that something is wrong, and it is the club's to act
-- on. A block is somebody deciding, for themselves, that they are done with
-- another person — nobody has to agree with it, and nobody is told.

-- ------------------------------------------------------------------ reports

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  -- What is being reported. Exactly one of these three is set, and the third is
  -- for reporting a *person* rather than a thing they wrote.
  about_post uuid references public.posts (id) on delete cascade,
  about_reply uuid references public.post_replies (id) on delete cascade,
  about_person uuid references public.profiles (id) on delete cascade,
  -- Who reported it, and null for the one reporter who is not a person: the
  -- screening that reads every post before it appears (lib/app/screening.ts).
  -- Kept for people, because the same member reporting everything is itself
  -- worth seeing.
  by_person uuid references public.profiles (id) on delete cascade,
  -- One of a short list, so the club can see the shape of it at a glance. The
  -- list is the union of what a member can choose from and what the screening
  -- can say, which is why it is longer than either.
  because text not null default 'something else'
    check (because in (
      'abuse', 'not true', 'not theirs', 'nothing to do with us', 'something else',
      'sexual', 'attacking somebody', 'illegal', 'nothing to do with the club'
    )),
  -- And in their own words, which is where the actual information usually is.
  said text not null default '',
  made_at timestamptz not null default now(),
  -- When somebody in the club dealt with it, and who. Null: still waiting.
  settled_at timestamptz,
  settled_by uuid references public.profiles (id) on delete set null,
  -- What was done, for the next person who wonders why a post is gone.
  settled_said text not null default '',
  check (
    (about_post is not null)::int
      + (about_reply is not null)::int
      + (about_person is not null)::int = 1
  )
);

create index if not exists reports_waiting on public.reports (made_at desc) where settled_at is null;
create index if not exists reports_by_post on public.reports (about_post);

alter table public.reports enable row level security;

-- Anybody signed in may report, as themselves and nobody else. The screening's
-- own rows have no member behind them, so they are written through `flag_it` at
-- the foot of this file rather than through this policy.
drop policy if exists "members report things" on public.reports;
create policy "members report things" on public.reports
  for insert with check (by_person = public.me());

-- And then it is the club's. A member cannot read reports — not even their own,
-- and that is deliberate: a list of what you have reported is a list of what you
-- have reported *about*, and the useful half of this table is somebody else's
-- name. The app says "thank you, we will look" and means it.
drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports
  for select using (public.is_admin());

drop policy if exists "admins settle reports" on public.reports;
create policy "admins settle reports" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete reports" on public.reports;
create policy "admins delete reports" on public.reports
  for delete using (public.is_admin());

-- ------------------------------------------------------------------- blocks

create table if not exists public.blocks (
  -- The person doing the blocking, and the person blocked.
  who uuid not null references public.profiles (id) on delete cascade,
  them uuid not null references public.profiles (id) on delete cascade,
  made_at timestamptz not null default now(),
  primary key (who, them),
  -- Blocking yourself is not a thought anybody has had; it is a bug in a form.
  check (who <> them)
);

create index if not exists blocks_by_them on public.blocks (them);

alter table public.blocks enable row level security;

-- Your own blocks, and only ever your own. Reading somebody else's would answer
-- "has this person blocked me", which is exactly the question a block exists to
-- stop being asked.
drop policy if exists "your own blocks" on public.blocks;
create policy "your own blocks" on public.blocks
  for select using (who = public.me());

drop policy if exists "you block people" on public.blocks;
create policy "you block people" on public.blocks
  for insert with check (who = public.me());

drop policy if exists "you unblock people" on public.blocks;
create policy "you unblock people" on public.blocks
  for delete using (who = public.me());

-- ------------------------------------------------ and what a block has to do
--
-- Both ways, and this is the decision worth writing down.
--
-- The gentle reading of a block is "I stop seeing them". The useful one is "we
-- stop seeing each other": somebody blocks a person because that person is a
-- problem, and leaving the problem able to read and reply to everything they
-- write is leaving the problem in the room. So a block hides the feed in both
-- directions.
--
-- Written as a function rather than in every query, because there are three
-- places that read the feed and a rule that lives in three places is a rule that
-- will shortly live in two.
create or replace function public.between_us_blocked(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
     where (who = public.me() and them = other)
        or (who = other and them = public.me())
  );
$$;

grant execute on function public.between_us_blocked(uuid) to authenticated;

-- The feed, with the people either of you has done with left out of it. A view
-- rather than a filter written into the app: the reason to have it in the
-- database is that it cannot then be forgotten by a new screen.
create or replace view public.posts_for_me
with (security_invoker = true)
as
  select p.*
    from public.posts p
   where not public.between_us_blocked(p.author_id);

grant select on public.posts_for_me to authenticated;

create or replace view public.post_replies_for_me
with (security_invoker = true)
as
  select r.*
    from public.post_replies r
   where not public.between_us_blocked(r.author_id);

grant select on public.post_replies_for_me to authenticated;

-- ------------------------------------------------- what the screening writes
--
-- The one reporter that is not a person.
--
-- Every post is read once before it appears (lib/app/screening.ts): nearly
-- everything goes straight up, a few things are refused outright, and the ones
-- with an argument on both sides go up *and* land here for the club's own admins
-- to look at. That middle case is the whole reason this function exists — the
-- policy above only lets a member file a report as themselves, and this row has
-- no member behind it.
--
-- `security definer`, so it writes the row the policy would refuse. What it
-- cannot do is more than that: it takes no author, sets `by_person` to null
-- itself, and cannot be used to file a report in somebody else's name. The worst
-- a member could do by calling it directly is make work for an admin, which is
-- also the worst they could do with the button.
create or replace function public.flag_it(
  post uuid,
  reply uuid,
  because text,
  said text
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.reports (about_post, about_reply, by_person, because, said)
  values (post, reply, null, coalesce(because, 'something else'), coalesce(said, ''));
$$;

grant execute on function public.flag_it(uuid, uuid, text, text) to authenticated;
