-- The words the site says on its own behalf.
--
-- Everything translated so far is content: what somebody wrote in the back of
-- the house, with its French kept beside it in the same row. This is the other
-- half — "still wanted", "and what has been", "take it as a PDF", "count me in".
-- Nobody typed those into a form; they are in the code, which is exactly why
-- they were the half left in English.
--
-- Each one has a key, an English original that lives in lib/words.ts, and a
-- French that lives here. Two reasons the French is in the database rather than
-- beside the English in the file: it is editorial rather than structural — the
-- difference between "still wanted" and "encore nécessaire" is a judgement
-- somebody should be able to change without a deploy — and it is the only way
-- the back of the house can offer a page for doing it.
--
-- A key with no row here falls back to the French written into the file, and a
-- file with no French for it falls back to the English. Nothing is ever blank.

create table if not exists public.phrases (
  -- Named in lib/words.ts. Not a uuid: the key *is* the identity, and a phrase
  -- whose key changed is a different phrase.
  key text primary key,
  fr text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.phrases enable row level security;

drop policy if exists "anyone reads the words" on public.phrases;
create policy "anyone reads the words" on public.phrases
  for select using (true);

drop policy if exists "admins write the words" on public.phrases;
create policy "admins write the words" on public.phrases
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.phrases is
  'The French of the words the site says itself, by key. The English is in lib/words.ts; an absent row means the French written into the file stands. See migration 0034.';
