import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import { whenItIs } from "@/lib/app-data";
import { getEvents, getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { myBookings, readingIn, requireMember } from "@/lib/app/me";

export const metadata = { title: "What you said yes to" };
export const dynamic = "force-dynamic";

export default async function ComingPage() {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/account/coming");
  const lang = await readingIn();
  const [mine, events] = await Promise.all([myBookings(), getEvents(lang)]);
  const byId = new Map(events.map((event) => [event.id, event]));

  const yes = mine
    .map((booking) => ({ booking, event: byId.get(booking.eventId) }))
    .filter((pair) => Boolean(pair.event))
    .sort((a, b) => (b.event?.date ?? "").localeCompare(a.event?.date ?? ""));

  return (
    <>
      <AppHeader
        eyebrow={say("acc.youSaidYesTo")}
        title={say("pg.everythingJoined")}
        back="/app/account"
      />
      <ul className="row-list">
        {yes.map(({ booking, event }) => (
          <li key={booking.id}>
            <div className="row">
              <span className="row-body">
                <span className="row-title">{event?.title}</span>
                <span className="row-meta">{event ? whenItIs(event, lang) : ""}</span>
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
