import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import UpcomingEvents from "@/components/app/UpcomingEvents";
import { dateParts, shortDate, weekday } from "@/lib/app-data";
import { getEvents, getNews } from "@/lib/source";

export const metadata = { title: "Home" };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function AppHome() {
  const events = (await getEvents()).map((event) => ({
    ...event,
    ...dateParts(event.date),
    weekday: weekday(event.date),
  }));
  const places = [...new Set(events.map((event) => event.place))];
  const news = await getNews();

  return (
    <>
      <AppHeader
        eyebrow="welcome"
        title="hello"
        aside={<Link href="/">website ↗</Link>}
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
        <Link className="pill" href="/app/book">
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
