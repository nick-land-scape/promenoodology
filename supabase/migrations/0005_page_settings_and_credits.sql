-- Four things the back of the house needs next.
--
-- Run it the same way as the others: SQL Editor → New query → Run.

-- ------------------------------------------------------- what a page can set

-- Every page already has a row in `pages` carrying whether it is shown and what
-- the menu calls it. This adds the few knobs that belong to a page rather than
-- to its words: how wide the columns of a list are, whether the form at the
-- bottom of the handbook is there at all, what that form is called.
--
-- Deliberately jsonb and deliberately small. What may be set is written down in
-- lib/admin/page-settings.ts, and nothing else is read — so this is a place for
-- a handful of decisions, not a stylesheet with a database behind it.
alter table public.pages
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- The title and the line under it are in `pages` already (title, lead) but only
-- the about page and the handbook were ever reading them. Every page has a row,
-- so give the ones that were carrying an empty title the words their code has
-- been holding, and they can be edited from now on.
update public.pages set
  title = 'stories',
  lead = 'What we did, who was there and what we would do differently. Take any of it and do your own version — the handbook tells you how.'
  where slug = 'stories' and (title = '' or title = 'stories') and lead = '';

update public.pages set
  title = 'the archive',
  lead = 'Photographs and things people said, mixed together and left at the size they came in.'
  where slug = 'resources' and lead = '';

update public.pages set
  title = 'community',
  lead = ''
  where slug = 'community' and title = '';

update public.pages set
  title = 'keep in touch',
  lead = 'A short letter when there is something to come to, and nothing in between. No membership, no fee, and you can ask us to take you off the list at any time.'
  where slug = 'newsletter' and lead = '';

update public.pages set
  title = 'public bank account',
  lead = 'Everything that comes in, one by one, newest first. Some people put their name to it and some would rather not — both are here. We do not show a total: this is not a thermometer, it is a list of people who made something possible.'
  where slug = 'donations' and lead = '';

-- ------------------------------------------------------ who took the photograph

-- `credit` is a name typed by hand, and most of the names typed into it belong
-- to people who have an account here. This ties the two together: the profile is
-- asked first, and the typed name stays as the answer for everybody else — a
-- guest photographer, somebody who never signed in, an archive picture whose
-- author is only a name.
alter table public.photos
  add column if not exists credit_profile_id uuid references public.profiles (id) on delete set null;

create index if not exists photos_credit_profile_idx on public.photos (credit_profile_id);

-- Where a name already matches somebody exactly, tie them together now. Only an
-- unambiguous single match, and the typed name is left alone either way.
update public.photos p
  set credit_profile_id = m.id
  from (
    select lower(name) as name, min(id::text)::uuid as id, count(*) as how_many
    from public.profiles where name <> '' group by lower(name)
  ) m
  where p.credit_profile_id is null
    and m.how_many = 1
    and lower(p.credit) = m.name;

-- ----------------------------------------------------- how a photograph sits

-- The story page lays its photographs on twelve columns, cycling through eight
-- variants: a different width, a different starting column, a different vertical
-- offset. Left null, that automatic cycle decides — which is the right answer
-- almost always, and the reason the page never lines up and never breaks.
--
-- This is for the times it wants saying: a wide one that should stay wide, a
-- portrait that should not be stretched across seven columns. A name, not a
-- column number, so nothing here can put a photograph half off the page.
alter table public.photos
  add column if not exists layout text;

do $$ begin
  alter table public.photos
    add constraint photos_layout_check
    check (layout is null or layout in ('wide', 'narrow', 'left', 'right', 'tall'));
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------------ the hook

-- One line under a story's title, above the place and the date: what the story
-- is, in the words you would use to make somebody read it. The title is what the
-- thing was called; this is why it was worth doing.
--
-- Optional, and left empty it is simply not there — the header closes up rather
-- than leaving a gap where a line should be.
alter table public.stories
  add column if not exists subtitle text;

-- ------------------------------------------------------------- the cover photo

-- Which photograph stands for a story in the list and in a link preview. Left
-- null it is worked out — the first landscape one, or simply the first — which is
-- a decent guess and no more than that: the picture that says "this is what this
-- was" is a judgement, and this is where it gets made.
alter table public.stories
  add column if not exists featured_photo_id uuid references public.photos (id) on delete set null;

-- --------------------------------------------------------------- double opt-in

-- Somebody on the newsletter list has said so once, in a form. Confirmed means
-- they said so twice, the second time from inside their own inbox — which is the
-- only proof that the address is really theirs, and the reason not to write to
-- anybody who has not.
alter table public.newsletter
  add column if not exists token uuid not null default gen_random_uuid(),
  add column if not exists confirmed_at timestamptz;

-- The link in the confirmation email carries the token and nothing else, so it
-- is looked up by it.
create unique index if not exists newsletter_token_idx on public.newsletter (token);

-- Confirming happens before anybody is signed in — that is the whole point of it
-- — so it cannot go through the policies, which only ever let an admin write.
--
-- One function instead, and a narrow one. It takes a token and does exactly one
-- thing: marks that row confirmed. It cannot read an address back, cannot change
-- one, cannot touch another row, and says only whether the token was any good.
--
-- The obvious alternative — an update policy open to everybody — would have let
-- anyone rewrite anyone else's address on the list, which is a mailing list
-- turned into somebody else's inbox.
create or replace function public.confirm_newsletter(t uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  found boolean;
begin
  update public.newsletter
    set confirmed = true,
        confirmed_at = coalesce(confirmed_at, now())
    where token = t
    returning true into found;
  return coalesce(found, false);
end;
$$;

revoke all on function public.confirm_newsletter(uuid) from public;
grant execute on function public.confirm_newsletter(uuid) to anon, authenticated;

-- The two rows that were already on the list said yes once, in a form, before
-- there was a second step to take. They keep that standing rather than being
-- quietly dropped from a list they did join.
update public.newsletter
  set confirmed = true, confirmed_at = created_at
  where confirmed = false and created_at < now() - interval '1 minute';
