-- promeNOODology — everything the website and the app are made of.
--
-- Run this once, in the Supabase dashboard: SQL Editor → New query → paste →
-- Run. It creates the tables, decides who may read and write what, and makes a
-- bucket for the photographs.
--
-- The rule throughout: the public may read what is published, and only an
-- admin may write. Members can read a little more, and can write only their own
-- posts and bookings.

-- ---------------------------------------------------------------- who is who

-- One row per person who can sign in. `role` decides what they may do.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  country text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  -- Shown on the community page; a member can hide themselves.
  listed boolean not null default true,
  photo_path text,
  colour text,
  joined_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- A new sign-in gets a profile automatically, so nothing has to remember to.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Asked all over the policies below, so it gets its own function.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------------ content

-- The stories. `sections` is the text as it is written: a list of
-- { heading, texts[] }, so the shape of the page stays in the content.
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  -- Ties the photographs and quotes to this story.
  tag text not null unique,
  position integer not null default 99,
  place text,
  happened text,
  made_with text,
  sections jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

-- The photographs. `story_tag` may be null: the archive keeps things that do
-- not belong to any one story.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  width integer not null default 0,
  height integer not null default 0,
  credit text not null default '',
  year text not null default '',
  story_tag text,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  who text not null default '',
  place text not null default '',
  year text not null default '',
  story_tag text,
  text text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- A page whose words are edited but whose layout is fixed: about, handbook.
create table if not exists public.pages (
  slug text primary key,
  title text not null default '',
  lead text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  happens_on date not null,
  starts_at text not null default '',
  title text not null,
  place text not null default '',
  spots integer not null default 0,
  note text not null default '',
  photo_path text,
  -- Off means it is still being planned; nobody outside sees it.
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  published_on date not null default current_date,
  title text not null,
  text text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- The wall. Deliberately no total anywhere: the page is a list of people.
-- `who` empty means the donor would rather stay anonymous.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  given_on date not null default current_date,
  who text not null default '',
  amount text not null default '',
  note text not null default '',
  -- A donor who is also a member gets their face on the wall.
  profile_id uuid references public.profiles (id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- What members write to each other in the app.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  place text not null default '',
  text text not null,
  photo_path text,
  created_at timestamptz not null default now()
);

-- Somebody asking for a place at an event.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  people integer not null default 1,
  bringing text not null default '',
  state text not null default 'asked' check (state in ('asked', 'kept', 'declined')),
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

-- Someone applying for help with their own event, from the handbook page.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  what text not null default '',
  place text not null default '',
  when_roughly text not null default '',
  people text not null default '',
  cost text not null default '',
  about text not null default '',
  contact text not null default '',
  state text not null default 'new' check (state in ('new', 'talking', 'yes', 'no')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------- keeping times right

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stories_touch on public.stories;
create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------- who may do what

alter table public.profiles     enable row level security;
alter table public.stories      enable row level security;
alter table public.photos       enable row level security;
alter table public.quotes       enable row level security;
alter table public.pages        enable row level security;
alter table public.events       enable row level security;
alter table public.news         enable row level security;
alter table public.donations    enable row level security;
alter table public.posts        enable row level security;
alter table public.bookings     enable row level security;
alter table public.applications enable row level security;

-- Everything published is public: the website is a website.
drop policy if exists "anyone reads listed profiles" on public.profiles;
create policy "anyone reads listed profiles" on public.profiles
  for select using (listed or id = auth.uid() or public.is_admin());

drop policy if exists "you edit yourself" on public.profiles;
create policy "you edit yourself" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "admins add profiles" on public.profiles;
create policy "admins add profiles" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "admins remove profiles" on public.profiles;
create policy "admins remove profiles" on public.profiles
  for delete using (public.is_admin());

-- The published-content tables all work the same way.
do $$
declare
  t text;
begin
  foreach t in array array['stories', 'photos', 'quotes', 'events', 'news', 'donations']
  loop
    execute format($f$
      drop policy if exists "anyone reads published" on public.%1$I;
      create policy "anyone reads published" on public.%1$I
        for select using (published or public.is_admin());

      drop policy if exists "admins write" on public.%1$I;
      create policy "admins write" on public.%1$I
        for all using (public.is_admin()) with check (public.is_admin());
    $f$, t);
  end loop;
end;
$$;

drop policy if exists "anyone reads pages" on public.pages;
create policy "anyone reads pages" on public.pages
  for select using (true);

drop policy if exists "admins write pages" on public.pages;
create policy "admins write pages" on public.pages
  for all using (public.is_admin()) with check (public.is_admin());

-- The feed is for members, and you may only speak for yourself.
drop policy if exists "members read posts" on public.posts;
create policy "members read posts" on public.posts
  for select using (auth.uid() is not null);

drop policy if exists "members write their own posts" on public.posts;
create policy "members write their own posts" on public.posts
  for insert with check (author_id = auth.uid());

drop policy if exists "you edit your own posts" on public.posts;
create policy "you edit your own posts" on public.posts
  for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "you delete your own posts" on public.posts;
create policy "you delete your own posts" on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());

-- You can see and make your own bookings; admins see all of them.
drop policy if exists "you read your bookings" on public.bookings;
create policy "you read your bookings" on public.bookings
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "you ask for a place" on public.bookings;
create policy "you ask for a place" on public.bookings
  for insert with check (profile_id = auth.uid());

drop policy if exists "you change your booking" on public.bookings;
create policy "you change your booking" on public.bookings
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "you cancel your booking" on public.bookings;
create policy "you cancel your booking" on public.bookings
  for delete using (profile_id = auth.uid() or public.is_admin());

-- Anybody may apply for help; only we read the applications.
drop policy if exists "anyone applies" on public.applications;
create policy "anyone applies" on public.applications
  for insert with check (true);

drop policy if exists "admins read applications" on public.applications;
create policy "admins read applications" on public.applications
  for select using (public.is_admin());

drop policy if exists "admins change applications" on public.applications;
create policy "admins change applications" on public.applications
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------- photos

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "anyone looks at media" on storage.objects;
create policy "anyone looks at media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins replace media" on storage.objects;
create policy "admins replace media" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- ------------------------------------------------------------------ indexes

create index if not exists photos_story_idx on public.photos (story_tag);
create index if not exists photos_year_idx on public.photos (year);
create index if not exists quotes_story_idx on public.quotes (story_tag);
create index if not exists events_date_idx on public.events (happens_on);
create index if not exists donations_date_idx on public.donations (given_on desc);
create index if not exists posts_date_idx on public.posts (created_at desc);
