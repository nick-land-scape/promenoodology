-- Four things at once, because they are one idea: this collective works in
-- specific places, with whatever a place already has, and the record of that is
-- worth keeping properly.
--
-- 1. Where. Every intervention has been somewhere real — Romania, the UK,
--    Switzerland, Austria, Italy, Spain — and the app could only show a list
--    sorted by date, which flattens five years across a continent into "recent".
--    A place needs two numbers to be a pin.
--
-- 2. What is still needed. A kitchen is improvised on site out of what is around,
--    so "we still want a pot big enough for forty" is the most useful sentence
--    anybody can write about an evening, and there was nowhere to write it.
--
-- 3. How many ate. The claim this collective is actually testing is that fun is a
--    currency that brings public space back to life. A number of plates is the
--    evidence, and it was in nobody's records.
--
-- 4. Who somebody is. A name and a country was all a member could say about
--    themselves, which is thin for a group that needs to know who can weld, who
--    has a van, and who speaks Romanian.

-- ------------------------------------------------------------------- 1. where

alter table public.events  add column if not exists lat double precision;
alter table public.events  add column if not exists lng double precision;
alter table public.stories add column if not exists lat double precision;
alter table public.stories add column if not exists lng double precision;

-- Only the ones that have a position are ever asked for.
create index if not exists events_placed  on public.events  (lat, lng) where lat is not null;
create index if not exists stories_placed on public.stories (lat, lng) where lat is not null;

comment on column public.stories.lat is 'Where it happened, for the map. Degrees, WGS84. Null means it is not on the map yet.';

-- --------------------------------------------------- 2. what is still needed

alter table public.events add column if not exists needs text not null default '';

comment on column public.events.needs is 'What is still wanted for this one, one per line: a pot for forty, a table, a van. Shown to members beside what people are bringing.';

-- ------------------------------------------------------------ 3. how many ate

alter table public.events  add column if not exists people_fed integer;
alter table public.stories add column if not exists people_fed integer;

comment on column public.stories.people_fed is 'Roughly how many people ate. The evidence for the whole argument, so a rough number beats none.';

-- ------------------------------------------------------------- 4. who you are

alter table public.profiles add column if not exists city text not null default '';
-- What they do: architecture, cooking, carpentry, photography, whatever it is.
alter table public.profiles add column if not exists does text not null default '';
-- What they can bring to an intervention. The useful one.
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists languages text[] not null default '{}';
alter table public.profiles add column if not exists instagram text not null default '';
/* The day and the month, without the year.
 *
 * A collective wants to know it is somebody's birthday; nobody needs to know how
 * old they are, and a date of birth is the single most useful field in the world
 * to anybody impersonating them. So the year is not asked for and not stored: this
 * is a date in a year nobody is meant to read, and the app only ever shows the day
 * and the month. Optional, always. */
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists birthday_shown boolean not null default false;

/* Two things that are nobody's business but ours, and are never on the community
 * page: what somebody cannot eat, and a number to reach them on the day. Both
 * optional, both only ever read by the person and by an admin — which is what the
 * policy on this table already says.
 *
 * "Cannot eat" can imply a health condition, so it is asked for as free text
 * rather than as a list of conditions, and it is asked for because a shared kitchen
 * has to know. */
alter table public.profiles add column if not exists cannot_eat text not null default '';
alter table public.profiles add column if not exists phone text not null default '';

comment on column public.profiles.cannot_eat is 'Allergies and what they do not eat. Private: shown to the person and to admins, never on the community page.';
comment on column public.profiles.phone is 'Private. For the day of an evening, not for a mailing list.';

-- Somebody has been through the "tell us who you are" screen, whether or not they
-- filled anything in. Without this the app would ask again every time.
alter table public.profiles add column if not exists settled_in boolean not null default false;
