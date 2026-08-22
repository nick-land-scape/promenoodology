-- An evening that is really five afternoons, and a page of its own to say so.
--
-- The shape this is built from is a real flyer: "Ateliers olfactifs", on the
-- friche des Buissonnets at Versoix, five Saturdays and a Sunday between the
-- 22nd of August and the 20th of September 2026, each with its own name, its own
-- hours and its own paragraph — the whole thing one event with one address, one
-- place, one way of signing up, and one story to be written afterwards.
--
-- What was here could not hold that. An event was a title, one day, one pair of
-- hours and a note; five of them meant five rows repeating the same address, and
-- one of them meant a programme squeezed into a free-text note nobody could read
-- back. So:
--
-- 1. An event gets an address of its own on the site, and the handful of fields
--    every flyer of ours has ever had — who it is with, what it costs, where to
--    write, and what larger thing it is part of.
-- 2. A programme: the days it actually runs, each one a thing with a name.
-- 3. A page, built block by block, exactly as a story's page is built.
--
-- A story still holds many events, and always did — story_id is on the event, so
-- five afternoons can all become the one piece of writing that goes on the
-- website. Nothing about that had to change; it only had to be said.

-- ------------------------------------------------------- 1. an address, and a flyer's worth of fields

alter table public.events add column if not exists slug text;

-- Who it is with, in the line under the name: "avec le collectif promeNOODology".
alter table public.events add column if not exists subtitle text not null default '';
-- The paragraph a flyer opens with, before the programme.
alter table public.events add column if not exists lead text not null default '';
-- The street, where "where" is the name of a place rather than a way of getting
-- to it: "Route de Suisse 112-114".
alter table public.events add column if not exists address text not null default '';
-- "gratuit", "£5 on the door", "bring what you can".
alter table public.events add column if not exists cost text not null default '';
-- Where to write to come. Not everything we do is booked through the app: this
-- one is run with somebody else, and they take the names.
alter table public.events add column if not exists sign_up_email text not null default '';
-- The larger thing it belongs to: "le projet Devenirs buissons, porté par
-- l'association least".
alter table public.events add column if not exists part_of text not null default '';
alter table public.events add column if not exists part_of_url text not null default '';

comment on column public.events.slug is 'Its address on the site. Minted once from the title and never moved, as a story''s is.';
comment on column public.events.part_of is 'The larger project or festival this belongs to, said the way the flyer says it.';

-- An address only means anything if it is the only one of its kind.
create unique index if not exists events_slug on public.events (slug) where slug is not null;

/*
 * Everything that is already here gets one, worked out from its title.
 *
 * Titles repeat — there have been three "soup and a walk" — so a name that is
 * taken picks up the first six characters of the row's own id. Ugly, and only
 * ever seen by whoever had two evenings with one name; new ones are minted from
 * the title by the back of the house and are clean.
 */
do $$
declare
  e record;
  stem text;
  tried text;
begin
  for e in select id, title from public.events where slug is null order by created_at loop
    stem := trim(both '-' from regexp_replace(lower(coalesce(e.title, '')), '[^a-z0-9]+', '-', 'g'));
    if stem = '' then stem := 'evening'; end if;

    tried := stem;
    if exists (select 1 from public.events where slug = tried) then
      tried := stem || '-' || left(e.id::text, 6);
    end if;

    update public.events set slug = tried where id = e.id;
  end loop;
end $$;

-- --------------------------------------------------------------- 2. the programme

/*
 * The days an event actually runs.
 *
 * Not a repeat rule. "Every Saturday until September" is how you would describe
 * these five afternoons and it is not what they are: one is on a Sunday, one
 * starts at nine in the morning, and each has a name and a paragraph of its own.
 * A rule would have to be argued with on every one of them.
 *
 * An event with none of these is an ordinary evening on one day, which is most of
 * them — happens_on and starts_at still say when it is, and nothing here is
 * needed to answer that.
 */
create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  position integer not null default 0,
  happens_on date not null,
  starts_at text not null default '',
  ends_at text not null default '',
  -- "Un paradis silencieux", "La cuisine du buisson".
  title text not null default '',
  -- The sentence under it, as the flyer has one.
  what text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists event_sessions_of on public.event_sessions (event_id, position);
create index if not exists event_sessions_when on public.event_sessions (happens_on);

-- ------------------------------------------------------------------ 3. the page

/*
 * The same table as story_blocks, for the same reason and with the same shape,
 * so that the editor a story's page is built in can be handed an evening
 * without learning anything new.
 */
create table if not exists public.event_blocks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  position integer not null default 0,
  kind text not null check (kind in ('heading', 'text', 'photo', 'space')),
  words text not null default '',
  photo_id uuid references public.photos (id) on delete set null,
  layout text,
  created_at timestamptz not null default now()
);

create index if not exists event_blocks_of on public.event_blocks (event_id, position);

-- ------------------------------------------------------------------- who reads what

alter table public.event_sessions enable row level security;
alter table public.event_blocks   enable row level security;

/*
 * Both belong to an evening and neither has an opinion of its own: what may be
 * read of them is exactly what may be read of the event they are part of. Said
 * once here rather than trusted to the pages that ask.
 */
drop policy if exists "the programme is as public as its evening" on public.event_sessions;
create policy "the programme is as public as its evening" on public.event_sessions
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and ((e.published and e.deleted_at is null) or public.is_admin())
    )
  );

drop policy if exists "admins write the programme" on public.event_sessions;
create policy "admins write the programme" on public.event_sessions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "the page is as public as its evening" on public.event_blocks;
create policy "the page is as public as its evening" on public.event_blocks
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and ((e.published and e.deleted_at is null) or public.is_admin())
    )
  );

drop policy if exists "admins write the page" on public.event_blocks;
create policy "admins write the page" on public.event_blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- who changed what

-- The same record every other table keeps. See 0018.
do $$
declare
  t text;
begin
  foreach t in array array['event_sessions', 'event_blocks'] loop
    execute format('drop trigger if exists note_changes on public.%I', t);
    execute format(
      'create trigger note_changes after insert or update or delete on public.%I
         for each row execute function public.note_the_change()', t);
  end loop;
end $$;
