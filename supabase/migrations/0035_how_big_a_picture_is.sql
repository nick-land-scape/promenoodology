-- How big a picture is, without having to publish it.
--
-- An evening's cover is chosen from the archive, and the site has to know its
-- shape: a portrait flyer described as landscape is served at a third of its
-- width and drawn upscaled and soft. The shape lives on the photos row — and the
-- photos row is only readable to the public when the photograph is published,
-- which means "it is on the archive wall".
--
-- Those are two different questions and were answered by one flag. A flyer is
-- the public face of a public evening and has no business on the archive wall,
-- and until now the only way to have its shape known was to put it there.
--
-- The bytes are public already: the bucket is. Only the row is not. So this is a
-- view of the two harmless numbers and the path that is already public, readable
-- by anybody, and nothing else about the photograph — not the credit, not the
-- year, not which story it belongs to, not whether it is in the bin.
--
-- It is deliberately not `security_invoker`: the whole point is to answer this
-- one question without the asker having to be allowed to read the table. The
-- alternative was loosening the policy on `photos` itself, which would quietly
-- widen every other read of it.

create or replace view public.photo_sizes as
  select path, width, height
  from public.photos
  where deleted_at is null;

comment on view public.photo_sizes is
  'How big each picture is, for anything that has to lay one out. Public on purpose, and only these three columns — see migration 0035.';

grant select on public.photo_sizes to anon, authenticated;
