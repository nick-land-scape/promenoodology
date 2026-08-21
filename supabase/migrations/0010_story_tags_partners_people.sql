-- Several tags for a story, and who it was made with.
--
-- The identifying tag stays exactly where it is: photographs and quotes find
-- their story through it, so it is a key, not a label. These are labels — the
-- words you would use to describe what a story was about — and they are their
-- own column so that nothing about the archive changes.
alter table public.stories add column if not exists topics text[] not null default '{}';

-- Who was there. Two join tables rather than arrays of names, so that a person
-- who corrects their name corrects it everywhere at once, and a partner deleted
-- takes their rows with them.
create table if not exists public.story_people (
  story_id uuid not null references public.stories(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position int not null default 0,
  primary key (story_id, profile_id)
);

create table if not exists public.story_partners (
  story_id uuid not null references public.stories(id) on delete cascade,
  association_id uuid not null references public.associations(id) on delete cascade,
  position int not null default 0,
  primary key (story_id, association_id)
);

alter table public.story_people enable row level security;
alter table public.story_partners enable row level security;

drop policy if exists "who was there is public" on public.story_people;
create policy "who was there is public" on public.story_people for select using (true);

drop policy if exists "admins say who was there" on public.story_people;
create policy "admins say who was there" on public.story_people for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "partners on a story are public" on public.story_partners;
create policy "partners on a story are public" on public.story_partners for select using (true);

drop policy if exists "admins say which partners" on public.story_partners;
create policy "admins say which partners" on public.story_partners for all
  using (public.is_admin()) with check (public.is_admin());
