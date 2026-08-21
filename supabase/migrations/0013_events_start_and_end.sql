-- An evening that runs past midnight, or over a weekend.
--
-- There was one date and one time, which says when something opens and nothing
-- about when it is over — fine for soup at half six, useless for an assembly
-- across three days, and the app had no way to say "until" at all.
--
-- The end of both is optional, and that is deliberate: most evenings genuinely
-- do not have one, and a field nobody can leave empty is a field everybody
-- fills in badly.
alter table public.events add column if not exists ends_on date;
alter table public.events add column if not exists ends_at text not null default '';

-- Somebody has to be able to see who is coming without opening the database.
create index if not exists bookings_by_event on public.bookings (event_id);
