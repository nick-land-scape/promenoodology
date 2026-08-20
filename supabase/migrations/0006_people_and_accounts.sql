-- People, and accounts, stop being the same thing.
--
-- `profiles` was one row per person who can sign in: its primary key WAS the
-- auth user's id. That made the community page and the list of accounts the same
-- list, which was tidy and wrong — most of the community has never signed in to
-- anything, and the list of names on the wall is older than the idea of accounts.
-- It also meant the only way to put somebody on the community page was to make
-- them an account, and the only way to invite somebody was to already have them.
--
-- So: a row here is a PERSON. `user_id` is the account they sign in with, when
-- they have one, and null when they do not. Everything else follows from that.
--
-- Run it the same way as the others: SQL Editor → New query → Run. It is written
-- to be safe on a database that already has some of this.

-- ------------------------------------------------------ a person, and their key

alter table public.profiles
  add column if not exists user_id uuid unique references auth.users (id) on delete set null,
  -- Where to write to them. For somebody with an account it is the address they
  -- sign in with; for somebody invited and not yet arrived it is the invitation.
  -- It is also the only way the two can be joined up when they do arrive.
  add column if not exists email text,
  -- Whether an admin has overruled the person's own choice about being listed.
  -- Null: up to them. True: shown whatever they said. False: hidden whatever
  -- they said. Three states on purpose — "not overruled" is different from
  -- "overruled to the same answer", and only one of them should survive them
  -- changing their mind.
  add column if not exists listed_by_admin boolean;

-- The rows that exist were keyed on the auth id, so that IS their account.
update public.profiles set user_id = id where user_id is null;

-- Fill in the addresses we already hold for them.
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.user_id and p.email is null;

create unique index if not exists profiles_email_idx on public.profiles (lower(email))
  where email is not null;

-- A person with no account needs an id of their own rather than one borrowed
-- from a login they do not have.
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- ------------------------------------------------- which row is "me", exactly

-- Every policy below used to compare a profile id against auth.uid() and be
-- right by accident. It is not the same number any more, so the question "which
-- row is the person asking?" gets asked once, here.
create or replace function public.me()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

-- Admin is a property of the person, reached through their account.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------ arriving at last

-- Somebody signs in for the first time. If a person is already waiting under
-- that address — invited, or on the community list since before there were
-- accounts — they are joined up rather than duplicated. Otherwise a new person
-- is made, and not listed: being on the community page is a decision, not a
-- consequence of signing in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  waiting uuid;
begin
  select id into waiting
    from public.profiles
    where user_id is null and lower(email) = lower(new.email)
    limit 1;

  if waiting is not null then
    update public.profiles
      set user_id = new.id,
          email = new.email,
          name = case
            when name = '' then coalesce(new.raw_user_meta_data ->> 'name', '')
            else name
          end
      where id = waiting;
  else
    insert into public.profiles (user_id, email, name, country, listed)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'country', ''),
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- who may do what

-- The public sees a person when they said yes and no admin has said otherwise,
-- or when an admin has said yes regardless.
drop policy if exists "anyone reads listed profiles" on public.profiles;
create policy "anyone reads listed profiles" on public.profiles
  for select using (
    coalesce(listed_by_admin, listed)
    or id = public.me()
    or public.is_admin()
  );

drop policy if exists "you edit yourself" on public.profiles;
create policy "you edit yourself" on public.profiles
  for update using (id = public.me() or public.is_admin())
  with check (id = public.me() or public.is_admin());

-- The feed and the bookings hang off a person, not off a login.
drop policy if exists "members write their own posts" on public.posts;
create policy "members write their own posts" on public.posts
  for insert with check (author_id = public.me());

drop policy if exists "you edit your own posts" on public.posts;
create policy "you edit your own posts" on public.posts
  for update using (author_id = public.me() or public.is_admin())
  with check (author_id = public.me() or public.is_admin());

drop policy if exists "you delete your own posts" on public.posts;
create policy "you delete your own posts" on public.posts
  for delete using (author_id = public.me() or public.is_admin());

drop policy if exists "you read your bookings" on public.bookings;
create policy "you read your bookings" on public.bookings
  for select using (profile_id = public.me() or public.is_admin());

drop policy if exists "you ask for a place" on public.bookings;
create policy "you ask for a place" on public.bookings
  for insert with check (profile_id = public.me());

drop policy if exists "you change your booking" on public.bookings;
create policy "you change your booking" on public.bookings
  for update using (profile_id = public.me() or public.is_admin())
  with check (profile_id = public.me() or public.is_admin());

drop policy if exists "you cancel your booking" on public.bookings;
create policy "you cancel your booking" on public.bookings
  for delete using (profile_id = public.me() or public.is_admin());

-- ------------------------------------------------------------------- the wall

-- Donations point at a person; nothing to change but worth an index now that
-- there will be sixty-odd of them rather than four.
create index if not exists profiles_listed_idx on public.profiles (listed, listed_by_admin);
create index if not exists profiles_user_idx on public.profiles (user_id);

-- ------------------------------------------------------------- the partners

-- The people we do this with who are not people: schools, festivals, councils,
-- the association that lent us a kitchen. A name and a logo, because that is how
-- an organisation is recognised, and a link for anybody who wants to know more.
--
-- They sit on the community page alongside the names. Quite how is still being
-- decided, which is why this table says what they are and nothing about where
-- they go.
create table if not exists public.associations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  logo_path text,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists associations_touch on public.associations;
create trigger associations_touch before update on public.associations
  for each row execute function public.touch_updated_at();

alter table public.associations enable row level security;

drop policy if exists "anyone reads published" on public.associations;
create policy "anyone reads published" on public.associations
  for select using (published or public.is_admin());

drop policy if exists "admins write" on public.associations;
create policy "admins write" on public.associations
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists associations_position_idx on public.associations (position);
