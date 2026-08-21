import AppHeader from "@/components/app/AppHeader";
import BookingForm, { type Bookable } from "@/components/app/BookingForm";
import { whenItIs } from "@/lib/app-data";
import { myBookings, requireMember } from "@/lib/app/me";
import { getEvents } from "@/lib/source";

export const metadata = { title: "Book" };

/* Nothing here is the same for two people — what you have asked for is on it —
   so it is worked out per request rather than cached for a minute. */
export const dynamic = "force-dynamic";

export default async function BookPage() {
  await requireMember("/app/book");

  const [all, mine] = await Promise.all([getEvents(), myBookings()]);
  const asked = new Map(mine.map((booking) => [booking.eventId, booking]));

  /* Only what is still to come. An evening that has been and gone is a story,
     and it is on the website as one. */
  const today = new Date().toISOString().slice(0, 10);
  const events: Bookable[] = all
    .filter((event) => (event.until || event.date) >= today)
    .map((event) => {
      const booking = asked.get(event.id);
      return {
        ...event,
        label: whenItIs(event),
        mine: booking
          ? { people: booking.people, bringing: booking.bringing, state: booking.state }
          : null,
      };
    });

  return (
    <>
      <AppHeader eyebrow="book" title="what would you like to join?" />
      <BookingForm events={events} />
    </>
  );
}
