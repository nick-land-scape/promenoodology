import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventsCalendar from "@/components/EventsCalendar";
import Photo from "@/components/Photo";
import type { ClubEvent } from "@/lib/content";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN } from "@/lib/lang";
import { pageIsVisible } from "@/lib/site-pages";
import { getEvents, getFrench, getPageHead } from "@/lib/source";
import { speaking, type Said } from "@/lib/words";

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
 * Grouped by how soon it is rather than listed flat, because "is it today" and
 * "is it this week" are the two questions anybody has of a page like this, and a
 * list sorted by date makes you work them out from the dates.
 */
export default async function EventsPage({ params }: { params: Promise<{ lang: string }> }) {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("events"))) notFound();

  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  const [events, head, french] = await Promise.all([
    getEvents(lang),
    getPageHead("events", lang),
    getFrench(),
  ]);
  const say = speaking(lang, french);

  const today = new Date().toISOString().slice(0, 10);
  const listed = events.filter((event) => event.slug);

  /*
   * When an evening is next on.
   *
   * Not when it starts: "Ateliers olfactifs" began in August and is next on this
   * Saturday, and it is the Saturday somebody wants to know about. For anything
   * without a programme it is the day itself, or today while it is still running.
   */
  const nextOn = (event: ClubEvent): string | null => {
    if (event.days.length > 0) {
      return event.days.map((day) => day.date).filter((day) => day >= today).sort()[0] ?? null;
    }
    if (!event.date) return null;
    if (event.date >= today) return event.date;
    return (event.until || event.date) >= today ? today : null;
  };

  const soon = (days: number) => {
    const at = new Date(`${today}T00:00:00Z`);
    at.setUTCDate(at.getUTCDate() + days);
    return at.toISOString().slice(0, 10);
  };
  const inAWeek = soon(7);

  const withNext = listed
    .map((event) => ({ event, next: nextOn(event) }))
    .sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999"));

  const groups = [
    {
      label: say("on.today"),
      events: withNext.filter((one) => one.next === today).map((one) => one.event),
    },
    {
      label: say("on.thisWeek"),
      events: withNext
        .filter((one) => one.next && one.next > today && one.next <= inAWeek)
        .map((one) => one.event),
    },
    {
      label: say("on.later"),
      events: withNext.filter((one) => one.next && one.next > inAWeek).map((one) => one.event),
    },
  ].filter((group) => group.events.length > 0);

  // Newest first: the last thing that happened is the one worth reading about.
  const been = withNext
    .filter((one) => !one.next)
    .map((one) => one.event)
    .reverse();

  // How many days have anything on them at all.
  const marked = new Set(
    listed.flatMap((event) =>
      event.days.length > 0 ? event.days.map((day) => day.date) : [event.date],
    ),
  ).size;

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
          <Link href={at(lang, "/handbook")}>handbook</Link> tells you how.
        </p>
      )}

      {/* The list answers "what is coming up"; the month answers "is anything on
          the weekend I am free". Folded away, because it is the second question
          and the list is the first — see the button inside it. */}
      {marked > 1 ? (
        <EventsCalendar
          events={listed}
          lang={lang}
          words={{
            open: say("on.asMonth"),
            shut: say("on.backToList"),
            pressOne: say("cal.pressOne"),
            nothing: say("cal.nothingThatDay"),
            before: say("cal.monthBefore"),
            after: say("cal.monthAfter"),
          }}
        />
      ) : null}

      {groups.length === 0 && been.length === 0 ? (
        <p className="empty">{say("on.nothing")}</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.label} className="events-group">
          <h2 className="story-label">{group.label}</h2>
          <Evenings events={group.events} nextOn={nextOn} lang={lang} say={say} />
        </section>
      ))}

      {been.length > 0 ? (
        <section className="events-group events-been">
          <h2 className="story-label">{say("on.been")}</h2>
          <Evenings events={been} nextOn={nextOn} lang={lang} say={say} past />
        </section>
      ) : null}
    </main>
  );
}

function Evenings({
  events,
  nextOn,
  lang,
  say,
  past,
}: {
  events: ClubEvent[];
  nextOn: (event: ClubEvent) => string | null;
  lang: "en" | "fr";
  say: Said;
  past?: boolean;
}) {
  return (
    <ul className={past ? "story-list story-list-past" : "story-list"}>
      {events.map((event) => {
        const next = nextOn(event);
        return (
          <li key={event.id} className="story-card">
            <Link href={at(lang, `/events/${event.slug}`)}>
              <span className="story-cover event-cover-card">
                {event.photo ? (
                  <Photo src={event.photo.src} alt="" fill sizes="(max-width: 767px) 45vw, 320px" />
                ) : null}
                {/* The date, on the picture, where a flyer puts it. A card in a
                    row of cards is read as a picture and a name; the day is the
                    thing you are actually scanning for. */}
                <span className="event-stamp">{stamp(event)}</span>
              </span>
              <span className="story-name">{event.title}</span>
              {event.subtitle ? <span className="story-hook">{event.subtitle}</span> : null}
              <span className="story-meta">
                {[
                  // Where an evening runs over days, the day it is next on is
                  // more use than the day it began.
                  next && event.days.length > 1
                    ? `${say("on.nextOn")} ${pretty(next)}`
                    : when(event),
                  event.place,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="story-lead">
                {event.lead ||
                  (event.days.length > 1
                    ? `${event.days.length} ${say("on.days")} ${pretty(event.days[0].date)}`
                    : event.note)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The day, short, for the corner of the picture: "SAT 22 AUG", "22 AUG – 20 SEP". */
function stamp(event: ClubEvent): string {
  if (!event.date) return "";
  const short = (day: string) =>
    new Date(`${day}T00:00:00Z`)
      .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      .toUpperCase();

  if (event.until && event.until !== event.date) {
    return `${short(event.date)} – ${short(event.until)}`;
  }
  const weekday = new Date(`${event.date}T00:00:00Z`)
    .toLocaleDateString("en-GB", { weekday: "short" })
    .toUpperCase();
  return `${weekday} ${short(event.date)}`;
}

/** When it is, in one line: a day, or a stretch of them. */
function when(event: { date: string; until: string; time: string; endTime: string }) {
  if (!event.date) return "";
  if (event.until) return `${pretty(event.date)} – ${pretty(event.until)}`;
  const hours = [event.time, event.endTime].filter(Boolean).join("–");
  return [pretty(event.date), hours].filter(Boolean).join(", ");
}
