import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import { pretty } from "@/lib/admin/when";
import { pageIsVisible } from "@/lib/site-pages";
import { getEvents, getPageHead } from "@/lib/source";

export const metadata: Metadata = {
  title: "What's on",
  description: "What we are putting on next, and where — open to anybody who turns up.",
  alternates: { canonical: "/events" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

/**
 * What is on, on the website.
 *
 * The members' app has had this for a while and it is the wrong place for it to
 * live alone: an evening behind a sign-in is an evening only the people already
 * coming can hear about. The point of putting something on in a public place is
 * that strangers come.
 *
 * So the same evenings, in the open, in the order anybody would want them —
 * what is still to come first, and underneath, what has been. The asking to come
 * stays where the names are, which is the app or somebody else's inbox.
 */
export default async function EventsPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("events"))) notFound();

  const [events, head] = await Promise.all([getEvents(), getPageHead("events")]);

  const today = new Date().toISOString().slice(0, 10);
  const listed = events.filter((event) => event.slug);
  const coming = listed.filter((event) => (event.until || event.date) >= today);
  const been = listed.filter((event) => (event.until || event.date) < today).reverse();

  return (
    <main className="page">
      <h1 className="page-title">{head.title || "what's on"}</h1>

      {head.saved ? (
        head.lead ? (
          <p className="page-intro">{head.lead}</p>
        ) : null
      ) : (
        <p className="page-intro">
          What we are putting on next. Everything here is open — come and eat, bring a pot, or
          simply turn up. If you would rather do your own version, the{" "}
          <Link href="/handbook">handbook</Link> tells you how.
        </p>
      )}

      {coming.length === 0 && been.length === 0 ? (
        <p className="empty">Nothing is on just now. There will be.</p>
      ) : null}

      {coming.length > 0 ? <Evenings events={coming} /> : null}

      {been.length > 0 ? (
        <section className="events-been">
          <h2 className="story-label">and what has been</h2>
          <Evenings events={been} past />
        </section>
      ) : null}
    </main>
  );
}

function Evenings({
  events,
  past,
}: {
  events: Awaited<ReturnType<typeof getEvents>>;
  past?: boolean;
}) {
  return (
    <ul className={past ? "story-list story-list-past" : "story-list"}>
      {events.map((event) => (
        <li key={event.id} className="story-card">
          <Link href={`/events/${event.slug}`}>
            {event.photo ? (
              <span className="story-cover">
                <Photo src={event.photo.src} alt="" fill sizes="(max-width: 767px) 45vw, 320px" />
              </span>
            ) : null}
            <span className="story-name">{event.title}</span>
            {event.subtitle ? <span className="story-hook">{event.subtitle}</span> : null}
            <span className="story-meta">
              {[when(event), event.place].filter(Boolean).join(" · ")}
            </span>
            <span className="story-lead">
              {/* The paragraph it opens with, or failing that the shape of the
                  thing: five afternoons is a fact worth knowing from a list. */}
              {event.lead ||
                (event.days.length > 1
                  ? `${event.days.length} days, from ${pretty(event.days[0].date)}`
                  : event.note)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** When it is, in one line: a day, or a stretch of them. */
function when(event: { date: string; until: string; time: string; endTime: string }) {
  if (!event.date) return "";
  if (event.until) return `${pretty(event.date)} – ${pretty(event.until)}`;
  const hours = [event.time, event.endTime].filter(Boolean).join("–");
  return [pretty(event.date), hours].filter(Boolean).join(", ");
}
