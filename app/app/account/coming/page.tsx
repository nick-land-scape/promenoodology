import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import { whenItIs } from "@/lib/app-data";
import { myBookings, requireMember } from "@/lib/app/me";
import { getEvents } from "@/lib/source";

export const metadata = { title: "What you said yes to" };
export const dynamic = "force-dynamic";

export default async function ComingPage() {
  await requireMember("/app/account/coming");
  const [mine, events] = await Promise.all([myBookings(), getEvents()]);
  const byId = new Map(events.map((event) => [event.id, event]));

  const yes = mine
    .map((booking) => ({ booking, event: byId.get(booking.eventId) }))
    .filter((pair) => Boolean(pair.event))
    .sort((a, b) => (b.event?.date ?? "").localeCompare(a.event?.date ?? ""));

  return (
    <>
      <AppHeader eyebrow="you said yes to" title="everything you joined" back="/app/account" />
      <ul className="row-list">
        {yes.map(({ booking, event }) => (
          <li key={booking.id}>
            <div className="row">
              <span className="row-body">
                <span className="row-title">{event?.title}</span>
                <span className="row-meta">{event ? whenItIs(event) : ""}</span>
                <span className="row-yes">
                  {booking.people} {booking.people === 1 ? "place" : "places"}
                  {booking.bringing ? ` · bringing ${booking.bringing}` : ""}
                </span>
              </span>
              {event?.photo ? (
                <span className="row-thumb">
                  <Photo src={event.photo.src} alt="" fill sizes="58px" />
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
