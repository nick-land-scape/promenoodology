import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventCard from "@/components/EventCard";
import JsonLd from "@/components/JsonLd";
import WhatsOn from "@/components/WhatsOn";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { breadcrumbs, graph, itemList, pageMetadata, say as pick, type Bilingual } from "@/lib/seo";
import { theDay } from "@/lib/shared";
import { pageIsVisible } from "@/lib/site-pages";
import { byDay, daysOf, placeKey, type Occasion } from "@/lib/occasions";
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

  const today = await theDay();
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

  /* The month, built here rather than in the calendar: one entry per day anything
     is on, carrying the cards for it. Rendered on the server, where the words and
     the language are, and handed over whole — so the month opens the same card the
     list is made of instead of a second drawing of the same evening. */
  const perDay = new Map<string, React.ReactNode[]>();
  for (const occasion of upcoming) {
    for (const day of daysOf(occasion)) {
      perDay.set(day, [
        ...(perDay.get(day) ?? []),
        <EventCard
          key={placeKey(occasion.id, occasion.onDay)}
          event={occasion}
          lang={lang}
          say={say}
        />,
      ]);
    }
  }
  const month = [...perDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, cards]) => ({ date, cards }));

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
      {/* The name of the page, the way of looking at it beside the name, and then
          one or the other: the list of what is coming up, or the month. */}
      <WhatsOn
        title={head.title || "what's on"}
        lang={lang}
        days={month}
        words={{
          asMonth: say("on.asMonth"),
          asList: say("on.backToList"),
          pressOne: say("cal.pressOne"),
          before: say("cal.monthBefore"),
          after: say("cal.monthAfter"),
          close: say("cal.shutTheDay"),
        }}
        intro={
          head.saved ? (
            head.lead ? (
              <p className="page-intro">{head.lead}</p>
            ) : null
          ) : (
            <p className="page-intro">
              What we are putting on next. Everything here is open — come and eat, bring a pot, or
              simply turn up. If you would rather do your own version, the{" "}
              <Link href={at(lang, "/handbook")}>handbook</Link> tells you how.
            </p>
          )
        }
      >
        {groups.length === 0 && been.length === 0 ? (
          <p className="empty">{say("on.nothing")}</p>
        ) : null}

        {groups.map((group) => (
          <section key={group.label} className="events-group">
            <h2 className="story-label">{group.label}</h2>
            <Evenings events={group.events} lang={lang} say={say} />
          </section>
        ))}

        {been.length > 0 ? (
          <section className="events-group events-been">
            <h2 className="story-label">{say("on.been")}</h2>
            <Evenings events={been} lang={lang} say={say} past />
          </section>
        ) : null}
      </WhatsOn>
    </main>
  );
}

function Evenings({
  events,
  lang,
  say,
  past,
}: {
  events: Occasion[];
  lang: "en" | "fr";
  say: Said;
  past?: boolean;
}) {
  return (
    <ul className={past ? "story-list story-list-past" : "story-list"}>
      {events.map((event) => (
        <EventCard
          key={placeKey(event.id, event.onDay)}
          event={event}
          lang={lang}
          say={say}
        />
      ))}
    </ul>
  );
}
