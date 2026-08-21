-- The feed, for real.
--
-- Everything on it was read out of a CSV file: the posts, the names on them, the
-- number of likes, the number of replies. Nothing could be written from the app
-- and nothing on the screen had ever been near the database.
--
-- Three things this needs that were not there. More than one picture on a post,
-- because an evening is not one photograph. Somewhere for replies to live, since
-- a reply button that counts a number in a spreadsheet is worse than no reply
-- button. And no likes at all — that was asked for and it is the right call: a
-- like is a number that makes people watch a number.

alter table public.posts add column if not exists photo_paths text[] not null default '{}';

-- Kept: the first picture of the old shape is the first of the new one.
update public.posts
   set photo_paths = array[photo_path]
 where photo_path is not null and photo_path <> '' and cardinality(photo_paths) = 0;

create table if not exists public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists post_replies_by_post on public.post_replies (post_id, created_at);

alter table public.post_replies enable row level security;

-- The same rule the posts themselves have: signed in to read, your own to write.
drop policy if exists "members read replies" on public.post_replies;
create policy "members read replies" on public.post_replies
  for select using (auth.uid() is not null);

drop policy if exists "members write their own replies" on public.post_replies;
create policy "members write their own replies" on public.post_replies
  for insert with check (author_id = public.me());

drop policy if exists "you edit your own replies" on public.post_replies;
create policy "you edit your own replies" on public.post_replies
  for update using (author_id = public.me() or public.is_admin())
  with check (author_id = public.me() or public.is_admin());

drop policy if exists "you delete your own replies" on public.post_replies;
create policy "you delete your own replies" on public.post_replies
  for delete using (author_id = public.me() or public.is_admin());

-- Who changed what, on both.
drop trigger if exists note_changes on public.post_replies;
create trigger note_changes after insert or update or delete on public.post_replies
  for each row execute function public.note_the_change();

-- Creating the trigger above hands EXECUTE back out; taken away again. See 0021.
revoke execute on function public.note_the_change() from anon, authenticated;

-- A member may put pictures of their own in the bucket under posts/<their login>/,
-- the same shape as their portrait: their own folder, and nobody else's.
drop policy if exists "members upload their own post pictures" on storage.objects;
create policy "members upload their own post pictures" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'posts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "members remove their own post pictures" on storage.objects;
create policy "members remove their own post pictures" on storage.objects
  for delete using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'posts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
