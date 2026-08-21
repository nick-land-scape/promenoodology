-- Somebody telling us something: a bug, an idea, or a word.
--
-- The app had no way to say anything back to us except an email address in a
-- list of links, which is where feedback goes to die: by the time somebody has
-- opened their mail app and worked out what to write, the thing they noticed is
-- gone. This is one field and a button, from inside the app, with the screen they
-- were on and what they were holding written down beside it — because "it does
-- not work on my phone" is only useful when we know which phone.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- Who, where it is known. Kept when they leave: a bug report is about the app,
  -- not about them, so it outlives the account and stops pointing at anybody.
  from_profile uuid references public.profiles (id) on delete set null,
  kind text not null default 'note' check (kind in ('bug', 'idea', 'note')),
  text text not null,
  -- The screen they were on, and what they were holding.
  about text not null default '',
  agent text not null default '',
  state text not null default 'new' check (state in ('new', 'seen', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists feedback_lately on public.feedback (state, created_at desc);

alter table public.feedback enable row level security;

-- Anybody signed in may say something; only we may read it. Deliberately not
-- readable by its author afterwards: it is a note to us, not a thread, and
-- pretending otherwise would promise a reply this table cannot give.
drop policy if exists "members say something" on public.feedback;
create policy "members say something" on public.feedback
  for insert with check (auth.uid() is not null);

drop policy if exists "admins read the feedback" on public.feedback;
create policy "admins read the feedback" on public.feedback
  for select using (public.is_admin());

drop policy if exists "admins tidy the feedback" on public.feedback;
create policy "admins tidy the feedback" on public.feedback
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete the feedback" on public.feedback;
create policy "admins delete the feedback" on public.feedback
  for delete using (public.is_admin());
