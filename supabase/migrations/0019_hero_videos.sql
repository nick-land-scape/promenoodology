-- The film on the front page.
--
-- It was /hero.mp4 in the public folder, which means changing it is a commit and
-- a deploy — the one thing on the site that nobody but a developer could touch.
-- Now it is a list, for two reasons: so it can be swapped without shipping code,
-- and so there can be more than one and the page picks one.
--
-- The list is ordered because it is a list, and the picking is done in the
-- browser: the home page is still built once and cached, and which of the films
-- you get is decided after it arrives.

create table if not exists public.hero_videos (
  id uuid primary key default gen_random_uuid(),
  -- Where the film sits in the bucket. Empty is not a case: a row without a film
  -- is nothing.
  path text not null,
  -- The still shown while the film loads, made from its own first frame. May be
  -- missing: a film without a poster is still a film.
  poster_path text,
  position int not null default 0,
  published boolean not null default true,
  -- What to call it here. Never shown on the site — it is a muted background —
  -- so it exists only so the back of the house has something to say.
  called text not null default '',
  seconds numeric,
  bytes bigint,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists hero_videos_order on public.hero_videos (position);
create index if not exists hero_videos_binned on public.hero_videos (deleted_at) where deleted_at is not null;

alter table public.hero_videos enable row level security;

drop policy if exists "anyone reads published" on public.hero_videos;
create policy "anyone reads published" on public.hero_videos for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "admins write" on public.hero_videos;
create policy "admins write" on public.hero_videos for all
  using (public.is_admin()) with check (public.is_admin());

-- Swapping the film on the front page is exactly the kind of change somebody
-- will want to look up later.
drop trigger if exists note_changes on public.hero_videos;
create trigger note_changes after insert or update or delete on public.hero_videos
  for each row execute function public.note_the_change();
