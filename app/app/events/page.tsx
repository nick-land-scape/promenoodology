import AppHeader from "@/components/app/AppHeader";
import SignUpForm, { type Joinable } from "@/components/app/SignUpForm";
import { dateParts, whenItIs } from "@/lib/app-data";
import { myBookings, readingIn, requireMember, whoIsBringingWhat } from "@/lib/app/me";
import { sharedEvents } from "@/lib/shared";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

export const metadata = { title: "What's on" };

/* Nothing here is the same for two people — what you have asked for is on it —
   so it is worked out per request rather than cached for a minute. */
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireMember("/app/events");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  const [all, mine] = await Promise.all([sharedEvents(lang), myBookings()]);
  /* A place on the whole thing, and the days somebody has taken where the evening
     has a programme in it. Two maps, because they are two different promises: one
     is "I am coming", the other is "I am coming on the sixth and the twentieth". */
  const asked = new Map(
    mine.filter((booking) => !booking.onDay).map((booking) => [booking.eventId, booking]),
  );
  const onDays = new Map<string, string[]>();
  for (const booking of mine) {
    if (!booking.onDay) continue;
    onDays.set(booking.eventId, [...(onDays.get(booking.eventId) ?? []), booking.onDay]);
  }

  /* What people are bringing, for the ones still to come only: it is a list for
     organising an evening, not a record of one that has happened. */
  const today0 = new Date().toISOString().slice(0, 10);
  const ahead = all.filter((event) => (event.until || event.date) >= today0);
  const bringing = new Map(
    await Promise.all(
      ahead.map(async (event) => [event.id, await whoIsBringingWhat(event.id)] as const),
    ),
  );

  const today = new Date().toISOString().slice(0, 10);
  const dressed = (event: (typeof all)[number]): Joinable => {
    const booking = asked.get(event.id);
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
      /* The days already taken, and how each day says itself — worked out here for
         the same reason the date parts are: the row cannot read files. */
      onDays: onDays.get(event.id) ?? [],
      dayLabels: event.days.map((one) => ({
        date: one.date,
        title: one.title,
        time: one.time,
        label: `${dateParts(one.date, lang).day} ${dateParts(one.date, lang).month}${
          one.time ? ` · ${one.time}` : ""
        }`,
      })),
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
