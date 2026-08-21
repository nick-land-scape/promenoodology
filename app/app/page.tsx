import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import UpcomingEvents from "@/components/app/UpcomingEvents";
import { dateParts, weekday, whenItIs } from "@/lib/app-data";
import { shortDate } from "@/lib/app-data";
import { myBookings, requireMember } from "@/lib/app/me";
import { getEvents, getNews } from "@/lib/source";

export const metadata = { title: "Home" };

/* What you have said yes to is on this screen, so it is yours rather than
   everybody's — no cached minute. */
export const dynamic = "force-dynamic";

export default async function AppHome() {
  const me = await requireMember("/app");
  const [all, mine, news] = await Promise.all([getEvents(), myBookings(), getNews()]);
  const asked = new Set(mine.map((booking) => booking.eventId));

  const today = new Date().toISOString().slice(0, 10);
  const events = all
    .filter((event) => (event.until || event.date) >= today)
    .map((event) => ({
      ...event,
      ...dateParts(event.date),
      weekday: weekday(event.date),
      when: whenItIs(event),
      going: asked.has(event.id),
    }));
  const places = [...new Set(events.map((event) => event.place))].filter(Boolean);

  return (
    <>
      {/* No "website ↗". Inside the app the website is not somewhere to go —
          everything on it that is worth reading is in here, under Read. */}
      <AppHeader
        eyebrow="welcome"
        title={me.name ? `hello, ${me.name.split(" ")[0]}` : "hello"}
      />

      <UpcomingEvents events={events} places={places} />

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">latest news</h2>
        </div>
        <ul className="row-list">
          {news.map((item) => (
            <li key={item.date + item.title}>
              <div className="row">
                <span className="row-body">
                  <span className="row-title">
                    {item.title}
                    {/* The one held at the top says why it is there. */}
                    {item.pinned ? <em className="row-pinned">kept at the top</em> : null}
                  </span>
                  <span className="row-meta">
                    {[shortDate(item.date), item.by.length > 0 ? said(item.by) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <p className="post-text" style={{ paddingTop: 4 }}>
                    {item.text}
                  </p>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="band">
        <h2>Everyone is a member</h2>
        <p>
          There is no list to get on and nothing to pay. Turn up once, cook something, and you are
          part of it.
        </p>
        <Link className="pill" href="/app/events">
          find something to join
        </Link>
      </section>

    </>
  );
}

/** "by Nick", "by Nick and Gabriel", "by Nick, Gabriel and Carla". */
function said(names: string[]): string {
  if (names.length === 1) return `by ${names[0]}`;
  return `by ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
