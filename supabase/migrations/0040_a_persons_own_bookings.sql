-- The one index the app asks for on every screen and did not have.
--
-- `myBookings()` is called by the front screen, by what's on, by an evening's own
-- page and by the account screen — four times a visit, at least — and it asks the
-- same question every time: which of these bookings are mine. That is a filter on
-- profile_id, and there was no index on profile_id.
--
-- What existed was `bookings (event_id)`, `bookings (event_id, state)` and the
-- uniqueness on `(event_id, profile_id, on_day)`. All three lead with the event, so
-- none of them can answer "everything belonging to this person" — a composite index
-- is only useful from its first column inwards. So every one of those four asks was
-- a scan of the whole table.
--
-- It is a small table today. It is a table that only ever grows, one row per person
-- per evening for ever, and the query is on the hottest path in the app.

create index if not exists bookings_by_person on public.bookings (profile_id);
