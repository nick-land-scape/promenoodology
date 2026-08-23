import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import UpcomingEvents from "@/components/app/UpcomingEvents";
import { dateParts, shortDate, weekday, whenItIs } from "@/lib/app-data";
import { myBookings, readingIn, requireMember } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking, type Said } from "@/lib/words";
import {
  sharedCount,
  sharedEvents,
  sharedNews,
  sharedPage,
  sharedStories,
} from "@/lib/shared";

export const metadata = { title: "Home" };

/* What you have said yes to is on this screen, so it is yours rather than
   everybody's — no cached minute. */
export const dynamic = "force-dynamic";

/** How many of each thing a front screen can hold without becoming a list. */
const FEW = { stories: 2, news: 3 };

export default async function AppHome() {
  const me = await requireMember("/app");
  // Their own language: their account first, then whatever the browser was told
  // to remember by the website's switcher. See lib/app/me.
  const lang = await readingIn();
  // What this screen says on its own behalf, in that language.
  const say = speaking(lang, await getFrench());
  const [all, mine, news, stories, handbook, count] = await Promise.all([
    sharedEvents(lang),
    myBookings(),
    sharedNews(lang),
    sharedStories(lang),
    sharedPage("handbook", lang),
    sharedCount(),
  ]);
  /* Coming, not merely marked: the front screen says "you are coming" and that
     should be a promise rather than a bookmark. */
  const asked = new Set(
    mine
      .filter((booking) => booking.state !== "interested")
      .map((booking) => booking.eventId),
  );

  /* What was said about each evening, and on which days — the front screen's rows
     can now be pressed, so they need to know what they are showing the state of. */
  const wholeThing = new Map(
    mine.filter((booking) => !booking.onDay).map((booking) => [booking.eventId, booking]),
  );
  const onDays = new Map<string, string[]>();
  for (const booking of mine) {
    if (!booking.onDay) continue;
    onDays.set(booking.eventId, [...(onDays.get(booking.eventId) ?? []), booking.onDay]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const events = all
    .filter((event) => (event.until || event.date) >= today)
    .map((event) => ({
      ...event,
      ...dateParts(event.date, lang),
      weekday: weekday(event.date, lang),
      when: whenItIs(event, lang),
      going: asked.has(event.id),
      mine: (() => {
        const booking = wholeThing.get(event.id);
        return booking
          ? {
              people: booking.people,
              bringing: booking.bringing,
              guests: booking.guests ?? [],
              state: booking.state,
            }
          : null;
      })(),
      onDays: onDays.get(event.id) ?? [],
      dayLabels: event.days.map((one) => ({
        date: one.date,
        title: one.title,
        time: one.time,
        label: `${dateParts(one.date, lang).day} ${dateParts(one.date, lang).month}${
          one.time ? ` · ${one.time}` : ""
        }`,
      })),
    }));
  const places = [...new Set(events.map((event) => event.place))].filter(
    Boolean,
  );

  /* The first heading of the handbook and the paragraph under it — enough to see
     what kind of thing it is, and not enough to be reading it here. */
  const blocks = handbook?.blocks ?? [];
  const firstHeading = blocks.findIndex((block) => block.kind === "heading");
  const peek =
    firstHeading >= 0
      ? {
          heading: blocks[firstHeading].text,
          text:
            blocks
              .slice(firstHeading + 1)
              .find((block) => block.kind !== "heading")?.text ?? "",
        }
      : null;

  return (
    <>
      {/* No "website ↗". Inside the app the website is not somewhere to go —
          everything on it that is worth reading is in here, under Read. */}
      <AppHeader
        eyebrow={say("home.welcome")}
        title={
          me.name
            ? say("home.helloName").replace("{name}", me.name.split(" ")[0])
            : say("home.hello")
        }
      />

      <UpcomingEvents events={events} places={places} />

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("home.latestNews")}</h2>
        </div>
        <ul className="row-list">
          {news.slice(0, FEW.news).map((item) => (
            <li key={item.date + item.title}>
              <div className="row">
                <span className="row-body">
                  {/* The date beside the headline rather than under it: a note is
                      three lines long, and a line of its own for six characters
                      pushed the words that matter further down every one. */}
                  <span className="row-titled">
                    <span className="row-title">
                      {item.title}
                      {/* The one held at the top says why it is there. */}
                      {item.pinned ? (
                        <em className="row-pinned">{say("home.keptAtTop")}</em>
                      ) : null}
                    </span>
                    <span className="row-when-said">
                      {shortDate(item.date, lang)}
                    </span>
                  </span>
                  {item.by.length > 0 ? (
                    <span className="row-meta">{said(item.by, say)}</span>
                  ) : null}
                  <p className="post-text" style={{ paddingTop: 4 }}>
                    {item.text}
                  </p>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Three ways into what has already happened. A front screen should offer
          the club as it is *and* the club as it has been — the reading was buried
          a tab away, and a tab nobody opens is a tab nobody knows about. */}
      {stories.length > 0 ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("home.whatWeHaveDone")}</h2>
            <Link className="app-more" href="/app/read">
              {say("home.allOfThem").replace("{n}", String(stories.length))}
            </Link>
          </div>
          <ul className="peek-stories">
            {stories.slice(0, FEW.stories).map((story) => (
              <li key={story.slug}>
                <Link href={`/app/read/${story.slug}`}>
                  {story.cover ? (
                    <span className="peek-cover">
                      <Photo src={story.cover.src} alt="" fill sizes="46vw" />
                    </span>
                  ) : null}
                  <span className="peek-title">{story.title}</span>
                  <span className="row-meta">
                    {[story.where, story.when].filter(Boolean).join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {peek ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("home.theHandbook")}</h2>
            <Link className="app-more" href="/app/read?of=handbook">
              {say("home.readIt")}
            </Link>
          </div>
          <Link className="peek-book" href="/app/read?of=handbook">
            <span className="peek-book-no" aria-hidden="true">
              01
            </span>
            <span>
              <strong>{peek.heading}</strong>
              <span className="peek-book-text">{peek.text}</span>
            </span>
          </Link>
        </section>
      ) : null}
      {/*
       * The figures this collective is actually testing.
       *
       * Not engagement — plates, places, countries, years. The claim is that fun is
       * a currency capable of bringing public space back to life, and these are the
       * only numbers that speak to it. Counted from what is recorded rather than
       * typed into a banner, so they cannot flatter anybody: a story with nobody
       * counted adds nothing to the plates.
       */}
      {count.interventions > 0 ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("home.addsUpTo")}</h2>
          </div>
          <dl className="tally">
            {count.fed > 0 ? (
              <div>
                {/* Grouped the way the language groups them: 1 200 in French,
                    1,200 in English. */}
                <dt>{count.fed.toLocaleString(lang === "fr" ? "fr-CH" : "en-GB")}</dt>
                <dd>{say("home.plates")}</dd>
              </div>
            ) : null}
            <div>
              <dt>{count.interventions}</dt>
              <dd>
                {say(count.interventions === 1 ? "home.intervention" : "home.interventions")}
              </dd>
            </div>
            <div>
              <dt>{count.places}</dt>
              <dd>{say(count.places === 1 ? "home.place" : "home.places")}</dd>
            </div>
            {count.countries > 1 ? (
              <div>
                <dt>{count.countries}</dt>
                <dd>{say("home.countries")}</dd>
              </div>
            ) : null}
            {count.years > 1 ? (
              <div>
                <dt>{count.years}</dt>
                <dd>{say("home.years")}</dd>
              </div>
            ) : null}
          </dl>
          <p className="app-note">{say("home.whatItIsFor")}</p>
        </section>
      ) : null}
    </>
  );
}

/** "by Nick", "by Nick and Gabriel", "by Nick, Gabriel and Carla". */
function said(names: string[], say: Said): string {
  const written =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} ${say("by.and")} ${names[names.length - 1]}`;
  return say("by.one").replace("{names}", written);
}
