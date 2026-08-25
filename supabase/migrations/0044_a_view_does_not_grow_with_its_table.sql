-- The three views stop saying `*`.
--
-- `select i.*` in a view is not a live wildcard. Postgres expands it once, when
-- the view is created, and writes the resulting column list into the catalogue —
-- so a column added to the table afterwards is invisible to the view for ever.
--
-- Which is exactly what happened. Migration 0043 added `edited_at` to `ideas`,
-- `posts` and `post_replies`; the three views built in 0041 and 0042 were created
-- before it, with `*`, and so do not have it. Asking `ideas_counted` for
-- `edited_at` is an error, and the app answers an error from that read with an
-- empty list — which would have shown every member an empty suggestions tab with
-- nothing anywhere saying why.
--
-- `create or replace view` cannot fix it: replacing a view may append columns at
-- the end but may not reorder them, and expanding `i.*` puts `edited_at` in the
-- middle, before the two counted columns. So each one is dropped and written
-- again, with every column named.
--
-- Named on purpose, and not only because of this. A view that lists its columns
-- is a view that says what it promises; `*` promises whatever the table happens
-- to hold, which for a table with private columns in it is how something private
-- ends up in a public answer.

drop view if exists public.ideas_counted;
drop view if exists public.posts_for_me;
drop view if exists public.post_replies_for_me;

create view public.ideas_counted
with (security_invoker = true)
as
  select
    i.id,
    i.by_person,
    i.words,
    i.made_at,
    i.edited_at,
    i.state,
    i.answer,
    i.answered_by,
    i.answered_at,
    i.deleted_at,
    (select count(*) from public.idea_votes v where v.idea = i.id) as votes,
    exists (
      select 1 from public.idea_votes v
       where v.idea = i.id and v.who = public.me()
    ) as agreed
  from public.ideas i
 where i.deleted_at is null;

grant select on public.ideas_counted to authenticated;

create view public.posts_for_me
with (security_invoker = true)
as
  select
    p.id,
    p.author_id,
    p.place,
    p.text,
    p.photo_path,
    p.photo_paths,
    p.created_at,
    p.edited_at
  from public.posts p
 where not public.between_us_blocked(p.author_id);

grant select on public.posts_for_me to authenticated;

create view public.post_replies_for_me
with (security_invoker = true)
as
  select
    r.id,
    r.post_id,
    r.author_id,
    r.text,
    r.created_at,
    r.edited_at
  from public.post_replies r
 where not public.between_us_blocked(r.author_id);

grant select on public.post_replies_for_me to authenticated;
