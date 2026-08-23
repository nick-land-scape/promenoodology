-- The names of the people you are bringing.
--
-- "Three places" is a number for a cook and nothing for anybody else. Whoever is
-- on the door, whoever is laying the table and whoever is trying to remember who
-- the two strangers at the end were all want the same thing, which is names.
-- Until now an evening for forty was a column of numbers adding up to forty.
--
-- One array on the booking rather than a row per guest, deliberately: a guest is
-- not an account, has no profile and never signs in — they are a fact about
-- somebody else's booking, and a table of them would be a table of orphans the
-- day their host cancels. Deleting the booking takes them with it, which is
-- exactly the right behaviour and comes for free.

alter table public.bookings add column if not exists guests text[] not null default '{}';

comment on column public.bookings.guests is
  'First names of the people this member is bringing, in the order they were typed. Never longer than people - 1.';
