-- The private half of a person stops being public.
--
-- Checked against the live database on 24 August 2026, with nothing but the
-- publishable key that ships in every browser: `select=*` on profiles returned
-- every column of all sixty-six people. Including email. Including phone, what
-- somebody cannot eat, their birthday, the id of their login.
--
-- The code has always treated those as private — "Private: the person and admins
-- only" is written above the field in the app, and the admin form says the same —
-- but a comment is not a permission. Row level security was doing its job: the
-- rows it lets through are the right rows. It has nothing to say about columns,
-- and nobody had said anything about columns.
--
-- Postgres can. `grant select (a, b, c)` is per column, and PostgREST honours it:
-- ask for a column that has not been granted and the answer is a refusal rather
-- than a row with a gap in it.
--
-- What the website actually reads with that key, every occurrence, is: id, name,
-- country, photo_path, colour, listed, listed_by_admin. The list below is that
-- plus the fields somebody writes about themselves *for* the community page —
-- their town, what they do, what they can bring, what they speak, their Instagram.
-- Everything else is theirs.
--
-- One consequence worth writing down: after this, a column added to profiles in
-- the future is private until somebody names it here. That is the right way round.

revoke select on public.profiles from anon;

grant select (
  id,
  name,
  country,
  city,
  does,
  skills,
  languages,
  colour,
  photo_path,
  member_no,
  joined_on,
  listed,
  listed_by_admin,
  instagram,
  birthday_shown,
  created_at
) on public.profiles to anon;

-- What is deliberately *not* in that list: email, phone, cannot_eat, birthday,
-- user_id, role, reads_in, settled_in.
--
-- And what this does not fix, said plainly rather than left to be discovered:
-- `authenticated` still has the whole table. A member who is signed in can ask the
-- API for everybody's email, which is a smaller hole than the open internet having
-- it and is still a hole. Closing it properly means a view with the public columns
-- for the lists, and profiles itself readable only by its own person and by
-- admins — a bigger change, touching every screen that lists people, and worth
-- doing on its own rather than inside this one.
