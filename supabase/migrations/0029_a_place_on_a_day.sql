-- A place on a day, rather than a place at a season.
--
-- There are three kinds of evening in this club and until now the booking table
-- knew about one:
--
--   1. one day, sometimes with an hour on it — a dinner.
--   2. a stretch of days, all of them — a week somewhere.
--   3. a stretch of days with a programme inside it: "Ateliers olfactifs" runs
--      from the 22nd of August to the 20th of September and happens on four
--      Saturdays and a Sunday, each with its own name.
--
-- For the first two, coming means coming. For the third it does not: nobody comes
-- to thirty days, and "count me in" against the whole of it is a promise nobody
-- means and a number the cook cannot use. So a booking can now name the day it is
-- for, and somebody can take a place on the two Saturdays that suit them.
--
-- Null means the whole thing, which is the honest encoding: the first two kinds
-- have no day to name. And the uniqueness has to be told that explicitly —
-- Postgres treats nulls as distinct by default, so without NULLS NOT DISTINCT a
-- member could book "the whole event" as many times as they pressed the button.

alter table public.bookings add column if not exists on_day date;

comment on column public.bookings.on_day is
  'The day this place is for, where the evening has a programme of days. Null means the whole thing.';

-- The old constraint said one booking per person per event. Now it is one per
-- person per event per day, with "the whole event" counting as a day of its own.
alter table public.bookings drop constraint if exists bookings_event_id_profile_id_key;

create unique index if not exists bookings_one_each
  on public.bookings (event_id, profile_id, on_day) nulls not distinct;
