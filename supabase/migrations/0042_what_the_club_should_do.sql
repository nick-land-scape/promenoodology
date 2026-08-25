-- What the club should do next, according to the club.
--
-- Somebody has an idea at an evening — a cookbook, a bigger oven, a Sunday walk
-- in the Jura — and it lasts as long as the conversation. This is where it goes
-- instead: a sentence anybody can write, and anybody else can agree with.
--
-- Three decisions worth writing down, because each of them is a thing this
-- deliberately is not.
--
-- **Up only.** There is no way to vote an idea down. A club of sixty people is
-- not a parliament and does not need a mechanism for telling somebody their idea
-- is bad — that is what silence is for. Downvoting turns a suggestion box into a
-- place people are careful in, and the one thing this has to be is a place
-- somebody will write in.
--
-- **Nobody comments except the club.** Members write ideas and agree with them;
-- the only replies are the club's own answer, and there is exactly one per idea.
-- A thread under every suggestion is a second feed to look after, and the useful
-- half of a suggestion box is not the discussion, it is the answer.
--
-- **An answer is a state, not a mood.** Open, doing, done, or not now — and "not
-- now" is a real answer that has to be sayable, because a suggestion box where
-- nothing is ever refused is a suggestion box nobody believes.

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  by_person uuid not null references public.profiles (id) on delete cascade,
  -- One field. A title and a body would be a form; this is a sentence.
  words text not null check (length(btrim(words)) between 3 and 1000),
  made_at timestamptz not null default now(),

  -- What the club said about it. Only an admin may touch these three.
  state text not null default 'open'
    check (state in ('open', 'doing', 'done', 'not now')),
  answer text not null default '',
  answered_by uuid references public.profiles (id) on delete set null,
  answered_at timestamptz,

  -- Taken down rather than deleted, so a vote count does not vanish mid-argument.
  deleted_at timestamptz
);

create index if not exists ideas_alive on public.ideas (made_at desc) where deleted_at is null;

alter table public.ideas enable row level security;

drop policy if exists "members read ideas" on public.ideas;
create policy "members read ideas" on public.ideas
  for select using (auth.uid() is not null);

drop policy if exists "members write ideas" on public.ideas;
create policy "members write ideas" on public.ideas
  for insert with check (by_person = public.me());

-- Your own, to take down; and an admin's, to answer. Two policies rather than one
-- because they are two different permissions that happen to be the same verb —
-- and because a member editing `state` would be a member marking their own idea
-- done. The trigger below is what actually stops that.
drop policy if exists "you take down your own idea" on public.ideas;
create policy "you take down your own idea" on public.ideas
  for update using (by_person = public.me() or public.is_admin())
  with check (by_person = public.me() or public.is_admin());

drop policy if exists "admins delete ideas" on public.ideas;
create policy "admins delete ideas" on public.ideas
  for delete using (public.is_admin());

-- The club's answer is the club's.
--
-- RLS is row-level: the policy above lets somebody update their own row, and
-- nothing in it can say "except these three columns". So this does — the same
-- shape as you_edit_yourself_not_your_rank, which stops a member making
-- themselves an admin.
create or replace function public.only_the_club_answers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.state is distinct from old.state
     or new.answer is distinct from old.answer
     or new.answered_by is distinct from old.answered_by
     or new.answered_at is distinct from old.answered_at
     or new.words is distinct from old.words
     or new.by_person is distinct from old.by_person then
    raise exception 'Only an admin can answer an idea.';
  end if;

  return new;
end;
$$;

drop trigger if exists ideas_only_the_club_answers on public.ideas;
create trigger ideas_only_the_club_answers
  before update on public.ideas
  for each row execute function public.only_the_club_answers();

-- ------------------------------------------------------------------- agreeing

create table if not exists public.idea_votes (
  idea uuid not null references public.ideas (id) on delete cascade,
  who uuid not null references public.profiles (id) on delete cascade,
  made_at timestamptz not null default now(),
  -- The whole of "up only": a row is agreement, no row is nothing. There is no
  -- column here that could hold a minus one.
  primary key (idea, who)
);

create index if not exists idea_votes_by_idea on public.idea_votes (idea);

alter table public.idea_votes enable row level security;

-- Everybody signed in can see who agreed, because a count nobody can check is a
-- number the club is asked to take on trust.
drop policy if exists "members read votes" on public.idea_votes;
create policy "members read votes" on public.idea_votes
  for select using (auth.uid() is not null);

drop policy if exists "you agree yourself" on public.idea_votes;
create policy "you agree yourself" on public.idea_votes
  for insert with check (who = public.me());

drop policy if exists "you change your mind" on public.idea_votes;
create policy "you change your mind" on public.idea_votes
  for delete using (who = public.me());

-- ------------------------------------------------------- the list, as it reads
--
-- The count and whether you are in it, in one read. Doing it in the app would be
-- one query for the ideas and another for every vote in the club, and then the
-- arithmetic — which is a thing databases are for.
create or replace view public.ideas_counted
with (security_invoker = true)
as
  select
    i.*,
    (select count(*) from public.idea_votes v where v.idea = i.id) as votes,
    exists (
      select 1 from public.idea_votes v
       where v.idea = i.id and v.who = public.me()
    ) as agreed
  from public.ideas i
 where i.deleted_at is null;

grant select on public.ideas_counted to authenticated;
