import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import UpcomingEvents from "@/components/app/UpcomingEvents";
import { dateParts, getEvents, getNews, shortDate, weekday } from "@/lib/app-data";

export const metadata = { title: "Home" };

export default function AppHome() {
  const events = getEvents().map((event) => ({
    ...event,
    ...dateParts(event.date),
    weekday: weekday(event.date),
  }));
  const places = [...new Set(events.map((event) => event.place))];
  const news = getNews();

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
                  <span className="row-title">{item.title}</span>
                  <span className="row-meta">{shortDate(item.date)}</span>
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
