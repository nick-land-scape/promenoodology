-- One note held at the top of the app's front screen, and who wrote it.
--
-- Pinned: one, not several. A list where everything is pinned is a list in a
-- different order, and the point of pinning is that exactly one thing matters
-- more than the date it was written. Held to one in the server action rather
-- than by a unique index — an index would refuse the moment two rows were true,
-- which is a moment that has to exist if rows are written one at a time. The
-- action clears the others first, in the same call, so there is never a second
-- one to refuse.
alter table public.news add column if not exists pinned boolean not null default false;

create index if not exists news_pinned_first on public.news (pinned desc, published_on desc);

-- Authors: an array of profile ids rather than a join table, which is the
-- opposite of the choice made for a story's people, and for a reason. The four
-- list sections all go through one editor that knows how to read and write flat
-- columns; a join here would mean teaching that editor about a shape only one of
-- its four tables has. An array stays a column.
--
-- What that costs is referential integrity: a person deleted leaves their id
-- behind. Names are looked up when the app reads a note, and an id that no
-- longer answers is dropped — so a deleted person disappears from the byline
-- rather than becoming a hole in it.
alter table public.news add column if not exists authors uuid[] not null default '{}';

-- Who an evening is with. Same shape, same reason.
alter table public.events add column if not exists partners uuid[] not null default '{}';
