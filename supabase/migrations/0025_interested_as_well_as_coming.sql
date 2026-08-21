-- Interested, as well as coming.
--
-- Saying you will be there and marking something to think about are different
-- promises, and the app only had the first. Which means an evening somebody might
-- come to looked exactly like one they had ignored — and the number under it, the
-- one that tells us how many plates to put out, counted nobody's maybe.
--
-- One more state on the row that already exists rather than a second table: it is
-- the same fact about the same person and the same evening, at a different
-- strength. 'interested' is a bookmark; 'asked' is "I am coming"; 'kept' and
-- 'declined' are our answer to that.

alter table public.bookings drop constraint if exists bookings_state_check;

alter table public.bookings
  add constraint bookings_state_check
  check (state in ('interested', 'asked', 'kept', 'declined'));

comment on column public.bookings.state is
  'interested = bookmarked, asked = they say they are coming, kept = we have kept them a place, declined = not this time.';

-- How many are actually coming, which is not the same as how many have marked it.
create index if not exists bookings_by_event_state on public.bookings (event_id, state);
