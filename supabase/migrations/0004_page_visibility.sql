-- Whether a page is on the site at all, and where it sits in the menu.
--
-- Until now `pages` held only the two pages whose words are edited — about and
-- the handbook. This turns it into the list of the site's pages: one row each,
-- whether or not it has words in it, carrying whether it is shown and what it is
-- called in the menu. A page that is turned off is not in the menu, not in the
-- sitemap, and not at its own address either.
--
-- Run it the same way as the others: SQL Editor → New query → paste → Run.

alter table public.pages
  add column if not exists visible boolean not null default true,
  -- What the menu calls it. Null means it is not in the menu at all.
  add column if not exists nav_label text,
  -- 'main' is the four bold links, 'more' the quieter ones underneath.
  add column if not exists nav_group text not null default 'none',
  add column if not exists nav_position integer not null default 0;

do $$ begin
  alter table public.pages
    add constraint pages_nav_group_check check (nav_group in ('main', 'more', 'none'));
exception
  when duplicate_object then null;
end $$;

-- The two rows that already exist keep their words; they only need saying where
-- they go in the menu. `nav_group = 'none'` is the default the column was just
-- added with, so this fills them in once and never overrules a later decision.
update public.pages
  set nav_label = 'ABOUT US', nav_group = 'main', nav_position = 4
  where slug = 'about' and nav_group = 'none';

update public.pages
  set nav_label = 'handbook', nav_group = 'more', nav_position = 5
  where slug = 'handbook' and nav_group = 'none';

-- The rest of the site's pages. They have no words of their own — they are made
-- of stories, photographs, quotes and people — but they can still be turned off.
insert into public.pages (slug, title, nav_label, nav_group, nav_position, visible)
values
  ('stories',    'stories',            'STORIES',   'main', 1, true),
  ('resources',  'the archive',        'RESOURCES', 'main', 2, true),
  ('community',  'community',          'COMMUNITY', 'main', 3, true),
  -- The newsletter is not in a menu group: the last line of the menu is the
  -- session link, which already reads "newsletter" until somebody signs in.
  ('newsletter', 'keep in touch',      null,        'none', 6, true),
  -- Not in the menu today either: only people given the address find it.
  ('donations',  'public bank account', null,       'none', 7, true)
on conflict (slug) do nothing;

create index if not exists pages_nav_idx on public.pages (nav_group, nav_position);
