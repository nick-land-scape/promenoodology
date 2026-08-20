-- Two things the community import made possible, and one it made obvious.
--
-- Already applied to the live project. Kept here because a migration is the only
-- honest record of how the database got the shape it has.

-- ------------------------------------------------------------------ the archive

-- The page moved from /resources to /archive in the code, and the menu is read
-- from this table — so the menu went on pointing at the old address. It worked,
-- through the redirect in next.config.ts, which is exactly why it was easy to
-- miss: the page opened. What did not work was the submenu, which is keyed on the
-- address, so the archive's filters had nowhere to appear.
update public.pages
  set slug = 'archive',
      nav_label = 'ARCHIVE'
  where slug = 'resources';

-- ------------------------------------------------------------- who took it

-- Most of the names typed under the photographs belong to somebody who now has a
-- row of their own. Tying them together means correcting your own name on your
-- profile corrects it under every photograph you took, rather than in
-- ninety-three places.
--
-- Migration 0005 ran this rule once already, when there were four people in the
-- table and nothing to match. This is the same rule against sixty-five.
--
-- Both rules insist on exactly one candidate. A credit that could be two people
-- is left as a typed name, because guessing which of them it is would be worse
-- than admitting we do not know.

-- Exactly as typed.
update public.photos p
  set credit_profile_id = m.id
  from (
    select lower(name) as key, min(id::text)::uuid as id, count(*) as how_many
    from public.profiles where name <> '' group by lower(name)
  ) m
  where p.credit_profile_id is null
    and p.credit <> ''
    and m.how_many = 1
    and lower(p.credit) = m.key;

-- Ignoring the spaces, which is how "Juliette Demetz" under a photograph and
-- "Juliette de Metz" in the community turn out to be one person. A surname
-- written with or without its space is the same surname; nothing else about the
-- name is allowed to differ.
update public.photos p
  set credit_profile_id = m.id
  from (
    select lower(replace(name, ' ', '')) as key, min(id::text)::uuid as id, count(*) as how_many
    from public.profiles where name <> '' group by lower(replace(name, ' ', ''))
  ) m
  where p.credit_profile_id is null
    and p.credit <> ''
    and m.how_many = 1
    and lower(replace(p.credit, ' ', '')) = m.key;

-- Ninety-three of ninety-six after this. The three that are left — Lara Ipolito
-- and Vivien Graute — are not on the community list, so their names stay typed,
-- which is what the typed field is for.

-- --------------------------------------------------------------- one name mended

-- The community spreadsheet holds this name as UTF-8 read back as Latin-1, and
-- the first import copied it faithfully. scripts/import-community.mjs mends it on
-- the way in now; this is the row that arrived before it did, renamed so the next
-- run matches it rather than adding a second Viktorie.
update public.profiles
  set name = 'Viktorie Majoberová'
  where name = 'Viktorie MajoberovÃ¡';
