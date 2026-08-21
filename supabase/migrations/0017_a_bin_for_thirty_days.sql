-- A bin, and thirty days in it.
--
-- Every delete in the back of the house was final, and the confirmations said so
-- — "there is no undo" — which is honest and is not the same as good. A story
-- somebody spent an evening on, a photograph nobody else has a copy of: those are
-- the things people delete by accident, and the thirty days are for exactly that
-- afternoon.
--
-- Where it is enforced matters. The *policy* is what keeps a binned thing off the
-- site, not a filter somebody has to remember to write: a row in the bin is not
-- published to anybody, whatever any query forgets. An admin still sees it,
-- because somebody has to be able to look in the bin.

alter table public.stories      add column if not exists deleted_at timestamptz;
alter table public.photos       add column if not exists deleted_at timestamptz;
alter table public.quotes       add column if not exists deleted_at timestamptz;
alter table public.news         add column if not exists deleted_at timestamptz;
alter table public.events       add column if not exists deleted_at timestamptz;
alter table public.donations    add column if not exists deleted_at timestamptz;
alter table public.associations add column if not exists deleted_at timestamptz;

-- Only the binned rows are indexed; the other ten thousand are not worth the
-- pages.
create index if not exists stories_binned on public.stories (deleted_at) where deleted_at is not null;
create index if not exists photos_binned on public.photos (deleted_at) where deleted_at is not null;
create index if not exists quotes_binned on public.quotes (deleted_at) where deleted_at is not null;
create index if not exists news_binned on public.news (deleted_at) where deleted_at is not null;
create index if not exists events_binned on public.events (deleted_at) where deleted_at is not null;
create index if not exists donations_binned on public.donations (deleted_at) where deleted_at is not null;
create index if not exists associations_binned on public.associations (deleted_at) where deleted_at is not null;

-- The public half of every read policy now also asks whether it is in the bin.
drop policy if exists "anyone reads published" on public.stories;
create policy "anyone reads published" on public.stories for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.photos;
create policy "anyone reads published" on public.photos for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.quotes;
create policy "anyone reads published" on public.quotes for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.news;
create policy "anyone reads published" on public.news for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.events;
create policy "anyone reads published" on public.events for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.donations;
create policy "anyone reads published" on public.donations for select
  using ((published and deleted_at is null) or public.is_admin());

drop policy if exists "anyone reads published" on public.associations;
create policy "anyone reads published" on public.associations for select
  using ((published and deleted_at is null) or public.is_admin());
