-- The flyer, as a file somebody can take away.
--
-- An evening's page says everything the flyer says, and that is not the same as
-- having the flyer: the thing that gets printed, pinned to a noticeboard in a
-- launderette and handed to somebody at a market is a PDF. It is also the one
-- artefact of an evening that is designed rather than typed, and there is
-- nowhere on the site to put it.
--
-- A path in the media bucket, like a photograph. Not a photograph: it is a
-- document, it never wants shrinking to webp, and it belongs to one evening
-- rather than to the archive.

alter table public.events add column if not exists flyer_path text;

comment on column public.events.flyer_path is
  'The flyer as a file in the media bucket, for taking away and putting up. Null where there is not one.';
