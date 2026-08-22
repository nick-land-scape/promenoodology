import AppHeader from "@/components/app/AppHeader";
import SignUpForm, { type Joinable } from "@/components/app/SignUpForm";
import { whenItIs } from "@/lib/app-data";
import { myBookings, readingIn, requireMember, whoIsBringingWhat } from "@/lib/app/me";
import { sharedEvents } from "@/lib/shared";

export const metadata = { title: "What's on" };

/* Nothing here is the same for two people — what you have asked for is on it —
   so it is worked out per request rather than cached for a minute. */
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  await requireMember("/app/events");
  const lang = await readingIn();

  const [all, mine] = await Promise.all([sharedEvents(lang), myBookings()]);
  const asked = new Map(mine.map((booking) => [booking.eventId, booking]));

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
      label: whenItIs(event),
      needs: event.needs,
      bringing: bringing.get(event.id) ?? [],
      mine: booking
        ? { people: booking.people, bringing: booking.bringing, state: booking.state }
        : null,
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
      <AppHeader eyebrow="what's on" title="what would you like to join?" />
      <SignUpForm events={events} past={past} />
    </>
  );
}
