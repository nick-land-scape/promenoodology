-- The site's pages could not be edited at all, and nothing said so.
--
-- Migration 0018 put a trigger on eleven tables that writes down who changed
-- what: it takes the row's id and files a line under it. Every one of those
-- tables is keyed on a uuid called id — except `pages`, which is keyed on its
-- slug, because a page *is* its address and always has been.
--
-- So every write to `pages` came back as `record "new" has no field "id"`. Not
-- a broken record of a change: a refused change. The heading of a page, the line
-- under it, whether it is in the menu, whether it is on the site at all — none
-- of it could be saved, and the error said nothing anybody could act on.
--
-- The fix is not to stop keeping the record. It is to give the row the one thing
-- the record needs. `slug` stays the key and stays the address; `id` is a name
-- the log can write down, and nothing else ever has to know it is there.

alter table public.pages add column if not exists id uuid not null default gen_random_uuid();

comment on column public.pages.id is
  'Not the key — slug is. This is a stable name for the changes log, which files every edit under a uuid. See migration 0030.';

-- Two rows with one name would file two pages'' changes in one place.
create unique index if not exists pages_id on public.pages (id);
