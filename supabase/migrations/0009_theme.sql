-- The typefaces and the colours the whole site is drawn with.
--
-- One row, for ever: this is not a list of themes to choose between, it is the
-- single answer to "what is this site made of". A primary key that can only hold
-- true is the plainest way to say that in a table — there is no second row to
-- insert and nothing to pick from.
--
-- Every column defaults to the empty string, which means "whatever the
-- stylesheet already says". So this table existing changes nothing until
-- somebody changes something, and clearing a field puts the designed value back
-- rather than leaving a blank.

create table if not exists public.theme (
  id boolean primary key default true check (id),

  -- What is read, and what is a label. Full CSS font stacks.
  serif text not null default '',
  sans text not null default '',

  -- The paper and what is printed on it.
  ink text not null default '',
  paper text not null default '',

  -- The three accents.
  purple text not null default '',
  blue text not null default '',
  pink text not null default '',

  updated_at timestamptz not null default now()
);

insert into public.theme (id) values (true) on conflict (id) do nothing;

alter table public.theme enable row level security;

-- Everybody reads it: it is the look of a public website.
drop policy if exists "the look is public" on public.theme;
create policy "the look is public"
  on public.theme for select
  using (true);

-- Only an admin changes it, and only the row that is already there.
drop policy if exists "admins set the look" on public.theme;
create policy "admins set the look"
  on public.theme for update
  using (public.is_admin())
  with check (public.is_admin());
