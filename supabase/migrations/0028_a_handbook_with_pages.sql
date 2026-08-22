-- The handbook, as a book with pages in it.
--
-- It was one long column of words: a page row with a list of blocks, headings
-- numbered 01, 02, 03 by the page that drew them. That is a perfectly good web
-- page and it is not what this thing is. The handbook is the one piece of
-- writing here that is *given* to somebody — how to put on something like ours
-- in your own street — and a scroll two thousand words long is the least
-- rememberable shape that writing could have taken.
--
-- So the words get pages of their own: a leaf at a time, in an order, each one
-- written and looked at by itself. The book on the site turns them; the back of
-- the house edits one at a time.
--
-- The page row stays exactly where it is. It still holds the handbook's title,
-- the line under it, and the settings for the form at the foot — none of which
-- belong to any single leaf.

create table if not exists public.handbook_pages (
  id uuid primary key default gen_random_uuid(),
  -- Where it falls in the book. Dragged in the back of the house.
  position integer not null default 0,
  -- What this leaf is called. Empty is allowed: a page that carries on from the
  -- one before it should not be made to invent a heading.
  title text not null default '',
  /*
   * The words, in blocks, exactly as the page row keeps them: [{kind, text}].
   * The same two kinds — a heading and a paragraph — because that is what this
   * writing is made of and a handbook that could hold anything would need a
   * designer for every page of it.
   */
  blocks jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists handbook_pages_order on public.handbook_pages (position);
create index if not exists handbook_pages_binned on public.handbook_pages (deleted_at)
  where deleted_at is not null;

alter table public.handbook_pages enable row level security;

drop policy if exists "anyone reads the handbook" on public.handbook_pages;
create policy "anyone reads the handbook" on public.handbook_pages
  for select using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "admins write the handbook" on public.handbook_pages;
create policy "admins write the handbook" on public.handbook_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------- the handbook as it stands

/*
 * The words that are already there become the first pages, split at the
 * headings.
 *
 * A heading starts a leaf and the paragraphs under it belong to it, which is how
 * the handbook was written in the first place — the numbering it does on the
 * page is exactly that structure, drawn rather than stored. Anything before the
 * first heading is a page of its own, because it is the opening and it should
 * not be swallowed by whatever heading happens to follow it.
 *
 * Only if there is nothing here yet: this runs once and must not be able to run
 * twice into a doubled book.
 */
-- What a leaf is called: its own heading, where it opens with one. The opening
-- page has no heading and is not made to invent one.
create or replace function public.leaf_title(leaf jsonb) returns text
  language sql immutable as $$
  select case
    when leaf -> 0 ->> 'kind' = 'heading' then coalesce(leaf -> 0 ->> 'text', '')
    else ''
  end;
$$;

do $$
declare
  words jsonb;
  block jsonb;
  leaf jsonb := '[]'::jsonb;
  at integer := 0;
begin
  if exists (select 1 from public.handbook_pages) then return; end if;

  select blocks into words from public.pages where slug = 'handbook';
  if words is null then return; end if;

  for block in select * from jsonb_array_elements(words) loop
    if block ->> 'kind' = 'heading' and jsonb_array_length(leaf) > 0 then
      at := at + 1;
      insert into public.handbook_pages (position, title, blocks)
      values (at, public.leaf_title(leaf), leaf);
      leaf := '[]'::jsonb;
    end if;
    leaf := leaf || jsonb_build_array(block);
  end loop;

  if jsonb_array_length(leaf) > 0 then
    at := at + 1;
    insert into public.handbook_pages (position, title, blocks)
    values (at, public.leaf_title(leaf), leaf);
  end if;
end $$;

-- The same record every other table keeps. See 0018.
drop trigger if exists note_changes on public.handbook_pages;
create trigger note_changes after insert or update or delete on public.handbook_pages
  for each row execute function public.note_the_change();

-- It was only ever for the one insert above.
drop function if exists public.leaf_title(jsonb);
