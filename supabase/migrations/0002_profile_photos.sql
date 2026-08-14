-- Members may put a photograph of themselves in the media bucket, and only
-- their own: everything under profiles/<their id>/.
--
-- Run this the same way as the first migration: SQL Editor → New query → Run.

drop policy if exists "members upload their own photo" on storage.objects;
create policy "members upload their own photo" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "members replace their own photo" on storage.objects;
create policy "members replace their own photo" on storage.objects
  for update using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "members remove their own photo" on storage.objects;
create policy "members remove their own photo" on storage.objects
  for delete using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
