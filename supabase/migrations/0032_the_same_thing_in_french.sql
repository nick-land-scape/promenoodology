-- The same thing, in French.
--
-- This collective works in Romania, the UK, Switzerland, Austria, Italy and
-- Spain, and the summer's programme is on a friche outside Geneva with a flyer
-- written in French. The site has been English throughout, which for a thing
-- whose whole argument is that a place belongs to the people already in it is
-- the wrong way round.
--
-- One column per table rather than one column per field. `fr` holds whatever has
-- been said in French, keyed by the column it is the French of:
--
--   { "title": "Ateliers olfactifs",
--     "lead": "Des expériences co-construites…" }
--
-- Three reasons it is shaped that way. A new translatable field is a key rather
-- than a migration. A field nobody has translated is *absent* rather than empty,
-- so the English can be shown in its place without having to guess whether an
-- empty string means "not yet" or "deliberately blank". And every existing query
-- keeps working untouched: `select *` picks the column up, and anything that
-- does not know about it carries on reading the English exactly as before.
--
-- What it is not: a general translation system. Two languages, named out loud,
-- because that is what is needed. A third would be a third column and a day's
-- work, and that is a better trade than a table of language codes nobody can
-- read a query out of.

alter table public.stories        add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.pages          add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.events         add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.event_sessions add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.event_blocks   add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.story_blocks   add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.handbook_pages add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.news           add column if not exists fr jsonb not null default '{}'::jsonb;
alter table public.sheets         add column if not exists fr jsonb not null default '{}'::jsonb;

comment on column public.events.fr is
  'The French of this row, keyed by the column it translates: {"title": "…", "lead": "…"}. A key that is not there has not been translated, and the English stands in its place. See migration 0032.';

comment on column public.stories.fr is
  'The French of this row, keyed by the column it translates. Absent means untranslated, not blank. See migration 0032.';
