# Where it runs, and why it is Dublin

`vercel.json` pins the functions to `dub1`. JSON cannot hold a reason, so it is here.

## The measurement that prompted it

Taken 25 August 2026 from a signed-in session in Switzerland, timing the server's
own answer for each screen:

| | |
|---|---|
| `/events` — public, prepared ahead, served from the edge | 105 ms |
| `/app/enter` — the door: reads the session and nothing else | 434 ms |
| `/app`, `/app/events`, `/app/connect` — a member's own screens | 1.0 – 1.4 s |

`x-vercel-id` read `fra1::iad1::` on every one of them: served through Frankfurt,
**rendered in Washington**, which is Vercel's default and had never been changed.
The database is Supabase in `eu-west-1`, which is Ireland.

So a screen that reads nothing personal still cost 434 ms — that is the Atlantic,
twice, before a single question is asked. And every personal query on top of it
crossed the same ocean again.

## Why Dublin rather than Frankfurt

Frankfurt is the obvious answer for a Swiss club and it is the wrong one. A screen
in this app makes several database queries one after another — who you are, then
what you have said yes to, then who is bringing what — and each one pays the
distance from the function to the database, in turn. What matters is therefore not
how far the phone is from the function but how far the function is from Postgres.

`dub1` is the same AWS region the database is in, so those queries stop being
network calls in any meaningful sense. Frankfurt would leave about 20 ms on each
of them, which on a screen with ten queries is a fifth of a second for nothing.
Against that, a phone in Zürich reaches Dublin about 20 ms slower than Frankfurt —
once, for the whole screen.

The rule, if this ever needs deciding again: **put the compute where the database
is, not where the people are** — unless the pages stop being per-person, in which
case they are prepared ahead and served from the edge anyway, which is what the
public half of this site already does at 105 ms from everywhere.

## What this does not affect

The website. Its pages are worked out at build and handed out by Vercel's edge in
whatever city the reader is nearest — a region for functions has nothing to say
about a file that has already been rendered. Only `/app`, `/admin`, the server
actions and `/api/purge` move.
