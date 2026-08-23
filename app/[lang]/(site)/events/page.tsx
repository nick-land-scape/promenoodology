import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventsCalendar from "@/components/EventsCalendar";
import JsonLd from "@/components/JsonLd";
import Photo from "@/components/Photo";
import type { ClubEvent } from "@/lib/content";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { breadcrumbs, graph, itemList, pageMetadata, say as pick, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";
import { byDay, type Occasion } from "@/lib/occasions";
import { getEvents, getFrench, getPageHead } from "@/lib/source";
import { speaking, type Said } from "@/lib/words";

const TITLE: Bilingual = { en: "What’s on", fr: "Ce qui se passe" };
const ABOUT: Bilingual = {
  en: "What we are putting on next, and where — open to anybody who turns up.",
  fr: "Ce que nous organisons prochainement, et où — ouvert à quiconque se présente.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("events", lang);

  return pageMetadata({
    lang,
    path: "/events",
    title: head.title || pick(lang, TITLE),
    description: head.lead || pick(lang, ABOUT),
  });
}

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
   * What is on, one card per thing you can turn up to.
   *
   * "Ateliers olfactifs" is one event and five afternoons. As one card it appeared
   * under "later on" in August and stayed there while four of its five days went
   * past — so somebody looking for what is on this Saturday could not see that
   * there was something on this Saturday. Opened out, each afternoon lands in the
   * group it belongs to, keeps its own name, and says which project it is part of.
   * They all still open the one page: see lib/occasions.
   */
  const upcoming = byDay(listed);

  /* When it is on. An occasion is one day or one continuous stretch, so this is
     the day itself — or today, while a stretch is still running. */
  const nextOn = (event: Occasion): string | null => {
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

  const withNext = upcoming
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
  /* And what has been: one card per project rather than per day. Five copies of a
     finished programme is not a record of it, and the story written about it
     afterwards was written about the whole thing. */
  const been = listed
    .filter((event) => !nextOn({ ...event, onDay: null, dayOf: null }))
    .map((event) => ({ ...event, onDay: null, dayOf: null }) as Occasion)
    .reverse();

  // How many days have anything on them at all.
  const marked = new Set(
    listed.flatMap((event) =>
      event.days.length > 0 ? event.days.map((day) => day.date) : [event.date],
    ),
  ).size;

  return (
    <main className="page">
      {/* The evenings that have not happened yet, in the order they will, as a
          list. Only the ones still to come: an ItemList of things that are over
          is a list nobody can act on, and each of them keeps its own Event block
          on its own page for anything that wants the details. */}
      <JsonLd
        data={graph(
          itemList(
            lang,
            withNext
              .filter((one) => one.next)
              .map((one) => `/events/${one.event.slug}`),
          ),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: head.title || pick(lang, TITLE), path: "/events" },
          ]),
        )}
      />
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
  events: Occasion[];
  nextOn: (event: Occasion) => string | null;
  lang: "en" | "fr";
  say: Said;
  past?: boolean;
}) {
  return (
    <ul className={past ? "story-list story-list-past" : "story-list"}>
      {events.map((event) => {
        const next = nextOn(event);
        return (
          <li key={`${event.id}|${event.onDay ?? ""}`} className="story-card">
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
              {/* Which project this afternoon is part of, where it has a name of
                  its own. Without it, five cards with five different names look
                  like five unrelated things rather than one thing five times. */}
              {event.dayOf ? (
                <span className="story-hook">
                  {say("on.partOf")} {event.dayOf}
                </span>
              ) : event.subtitle ? (
                <span className="story-hook">{event.subtitle}</span>
              ) : null}
              <span className="story-meta">
                {[
                  when(event),
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
