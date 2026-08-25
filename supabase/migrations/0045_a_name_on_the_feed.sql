-- Everybody in the club has a name on the club's own feed.
--
-- Posts have been going up signed "somebody". Not a bug in the feed: the names
-- are looked up in `profiles`, and the policy there says a person is readable
-- when they are on the community page, when they are you, or when you are an
-- admin. Anybody who has taken themselves off the community page therefore had no
-- name anywhere — including on the post they had just written, to a room of
-- people who know them.
--
-- Those are two different questions and one flag was answering both. "Do you want
-- to be on the public community page" is about strangers. "May the club see your
-- name on the thing you just wrote to the club" is not a question anybody was
-- asked, and the answer is obviously yes — the alternative is an anonymous feed
-- nobody asked for.
--
-- So: a view of the two harmless columns, for signed-in members only.
--
-- Deliberately *not* `security_invoker`, for the same reason photo_sizes is not
-- (migration 0035): the whole point is to answer this one question without the
-- asker having to be allowed to read the table. The alternative was a policy
-- letting every member select every row of `profiles`, and `authenticated` still
-- has column privileges on all of it — that would have handed every member
-- everybody's email address and telephone number to fix a byline.
--
-- Supabase's linter will report this as a security-definer view, as it does
-- photo_sizes. That is the trade being made, on purpose, and the reason it is
-- safe is the column list: an id, a name, and the path of a portrait that is
-- already public in the bucket. Nothing else.
--
-- `anon` is not granted. The public site has its own answer to "who is in this
-- club", and that one is the community page, which is what `listed` is for.

create or replace view public.club_names as
  select id, name, photo_path
  from public.profiles;

comment on view public.club_names is
  'Who is in the club, by name and portrait, for signed-in members only. Three columns and no more — see migration 0045.';

revoke all on public.club_names from anon;
grant select on public.club_names to authenticated;
