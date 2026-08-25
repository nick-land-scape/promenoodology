-- Editing what you wrote, and taking down what you wrote.
--
-- Deleting was already there for a post and a reply, and the policies for it have
-- been in place since the first migration. Editing was not — a typo in a post was
-- a typo for ever, or a delete and a retype that lost every reply under it.
--
-- Two things this adds.
--
-- **`edited_at`**, and it is the more important half. A post that changes under
-- the people who replied to it is a small deception: somebody answers "yes, bring
-- it on Saturday" and the question above them quietly becomes something else. So
-- an edited thing says it was edited. Not what it said before — this is a club
-- feed, not a wiki — only that it changed, and when.
--
-- **The author of an idea can fix their own wording.** Migration 0042 put a
-- trigger on `ideas` so that only an admin could touch the answer or the state,
-- and it was written a shade too wide: it also stopped the person who wrote the
-- idea from correcting it. The rewrite below lets the author change `words` and
-- nothing else, which was the intention.

alter table public.posts add column if not exists edited_at timestamptz;
alter table public.post_replies add column if not exists edited_at timestamptz;
alter table public.ideas add column if not exists edited_at timestamptz;

comment on column public.posts.edited_at is
  'When it was last changed, or null for something that has never been edited. Shown to everybody: a post that changes under the people who replied to it should say so.';

-- The answer stays the club's; the words go back to whoever wrote them.
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

  -- The club's half. A member may not touch any of it, including on their own
  -- idea — "I have decided my own suggestion is done" is not a thing the club
  -- said.
  if new.state is distinct from old.state
     or new.answer is distinct from old.answer
     or new.answered_by is distinct from old.answered_by
     or new.answered_at is distinct from old.answered_at
     or new.by_person is distinct from old.by_person then
    raise exception 'Only an admin can answer an idea.';
  end if;

  -- And the author's half: their own wording, and taking it down. Anybody else
  -- editing somebody's idea is stopped by the policy rather than by this — the
  -- policy already says the row has to be theirs.
  if new.words is distinct from old.words and old.by_person <> public.me() then
    raise exception 'You can only change your own idea.';
  end if;

  return new;
end;
$$;
