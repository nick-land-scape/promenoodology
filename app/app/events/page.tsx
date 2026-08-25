import AppHeader from "@/components/app/AppHeader";
import SignUpForm, { type Joinable } from "@/components/app/SignUpForm";
import { dateParts, whenItIs } from "@/lib/app-data";
import { myBookings, readingIn, requireMember, whoIsBringingWhatForAll } from "@/lib/app/me";
import { byDay, placeKey } from "@/lib/occasions";
import { sharedEvents } from "@/lib/shared";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "What's on" };

/* Nothing here is the same for two people — what you have asked for is on it —
   so it is worked out per request rather than cached for a minute. */
export default async function EventsPage() {
  await requireMember("/app/events");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  const [events0, mine] = await Promise.all([sharedEvents(lang), myBookings()]);
  /* Every event, with a programme opened out into the days it happens on — so a
     Saturday in September sits in the week it belongs to rather than inside a
     month-long block filed under August. See lib/occasions. */
  const all = byDay(events0);

  /* One answer per occasion: a place on a day is a different promise from a place
     on the whole thing, and both are keyed the same way here. */
  const asked = new Map(
    mine.map((booking) => [placeKey(booking.eventId, booking.onDay ?? null), booking]),
  );

  /* What people are bringing, for the ones still to come only: it is a list for
     organising an evening, not a record of one that has happened. */
  const today0 = new Date().toISOString().slice(0, 10);
  const ahead = all.filter((event) => (event.until || event.date) >= today0);
  /* Two queries for the whole list, not two per evening — and the list of names is
     asked for once rather than once per row. See whoIsBringingWhatForAll. */
  const bringing = await whoIsBringingWhatForAll([
    ...new Set(ahead.map((event) => event.id)),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const dressed = (event: (typeof all)[number]): Joinable => {
    const booking = asked.get(placeKey(event.id, event.onDay));
    return {
      ...event,
      /* The day and the month, worked out here rather than in the row.
         The row is a client component, and the helper that splits a date lives in
         a module that reads files — so importing it there pulled node:fs into the
         browser bundle and the build stopped, correctly. */
      ...dateParts(event.date, lang),
      label: whenItIs(event, lang),
      needs: event.needs,
      bringing: bringing.get(event.id) ?? [],
      mine: booking
        ? {
            people: booking.people,
            bringing: booking.bringing,
            guests: booking.guests ?? [],
            state: booking.state,
          }
        : null,
      /* Nothing to choose between any more: each row *is* one of the days, so it
         carries the day it is rather than a list to pick from. */
      onDays: [],
      dayLabels: [],
    };
  };

  const events = all.filter((event) => (event.until || event.date) >= today).map(dressed);

  /* And what has already happened, newest first.
   *
   * It was thrown away, and it should not be: half of what this club is is what
   * it has already done, some of it written up as a story on the website and some
   * of it only ever an evening in here. Nobody can sign up for these, so the
   * screen does not offer to. */
  const past = all
    .filter((event) => (event.until || event.date) < today)
    .map(dressed)
    .reverse();

  return (
    <>
      <AppHeader eyebrow={say("on.eyebrow")} title={say("on.whatToJoin")} />
      <SignUpForm events={events} past={past} />
    </>
  );
}
