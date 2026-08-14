import AppHeader from "@/components/app/AppHeader";
import BookingForm from "@/components/app/BookingForm";
import { getEvents, shortDate, weekday } from "@/lib/app-data";

export const metadata = { title: "Book" };

export default function BookPage() {
  const events = getEvents().map((event) => ({
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
