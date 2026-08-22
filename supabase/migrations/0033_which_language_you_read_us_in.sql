-- Which language somebody reads us in, kept with their account.
--
-- The website already remembers a choice in a cookie, which is right for a
-- visitor and thin for a member: a cookie is one browser, and somebody who
-- chose French on their phone opens the site on a laptop and is asked to choose
-- again. A member has an account, and this is exactly the sort of thing an
-- account is for.
--
-- Deliberately not `languages`, which is already on this table and means
-- something else entirely: what somebody *speaks*, for the community page and
-- for knowing who can talk to whom on the night. This is the language the site
-- and the app are read in, which is one language and is nobody's business but
-- the reader's.
--
-- Null means nobody has said, and the site goes on guessing — the browser, then
-- where the request comes from. See proxy.ts.

alter table public.profiles add column if not exists reads_in text;

alter table public.profiles drop constraint if exists profiles_reads_in_known;
alter table public.profiles add constraint profiles_reads_in_known
  check (reads_in is null or reads_in in ('en', 'fr'));

comment on column public.profiles.reads_in is
  'The language this member reads the site and the app in: en, fr, or null for "nobody has said". Not `languages`, which is what they speak. See migration 0033.';
