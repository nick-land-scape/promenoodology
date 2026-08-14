import AppHeader from "@/components/app/AppHeader";
import BookingForm from "@/components/app/BookingForm";
import { shortDate, weekday } from "@/lib/app-data";
import { getEvents } from "@/lib/source";

export const metadata = { title: "Book" };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function BookPage() {
  const events = (await getEvents()).map((event) => ({
    ...event,
    label: `${weekday(event.date)} ${shortDate(event.date)}, ${event.time} · ${event.place}`,
  }));

  return (
    <>
      <AppHeader eyebrow="book" title="what would you like to join?" />
      <BookingForm events={events} />
    </>
  );
}
