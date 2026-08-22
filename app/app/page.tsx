import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import UpcomingEvents from "@/components/app/UpcomingEvents";
import { dateParts, shortDate, weekday, whenItIs } from "@/lib/app-data";
import { myBookings, readingIn, requireMember } from "@/lib/app/me";
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
  const [all, mine, news, stories, handbook, count] = await Promise.all(
    [
      sharedEvents(lang),
      myBookings(),
      sharedNews(lang),
      sharedStories(lang),
      sharedPage("handbook", lang),
      sharedCount(),
    ],
  );
  /* Coming, not merely marked: the front screen says "you are coming" and that
     should be a promise rather than a bookmark. */
  const asked = new Set(
    mine
      .filter((booking) => booking.state !== "interested")
      .map((booking) => booking.eventId),
  );

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
        eyebrow="welcome"
        title={me.name ? `hello, ${me.name.split(" ")[0]}` : "hello"}
      />

      <UpcomingEvents events={events} places={places} />

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">latest news</h2>
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
                        <em className="row-pinned">kept at the top</em>
                      ) : null}
                    </span>
                    <span className="row-when-said">{shortDate(item.date)}</span>
                  </span>
                  {item.by.length > 0 ? (
                    <span className="row-meta">{said(item.by)}</span>
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
            <h2 className="app-h2">what we have done</h2>
            <Link className="app-more" href="/app/read">
              all {stories.length} ›
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
            <h2 className="app-h2">what that adds up to</h2>
          </div>
          <dl className="tally">
            {count.fed > 0 ? (
              <div>
                <dt>{count.fed.toLocaleString("en-GB")}</dt>
                <dd>plates</dd>
              </div>
            ) : null}
            <div>
              <dt>{count.interventions}</dt>
              <dd>
                {count.interventions === 1 ? "intervention" : "interventions"}
              </dd>
            </div>
            <div>
              <dt>{count.places}</dt>
              <dd>{count.places === 1 ? "place" : "places"}</dd>
            </div>
            {count.countries > 1 ? (
              <div>
                <dt>{count.countries}</dt>
                <dd>countries</dd>
              </div>
            ) : null}
            {count.years > 1 ? (
              <div>
                <dt>{count.years}</dt>
                <dd>years</dd>
              </div>
            ) : null}
          </dl>
          <p className="app-note">
            Public space in Europe is turning generic. This is what a bit of
            nerve and a borrowed kitchen has done about it so far.
          </p>
        </section>
      ) : null}

      {peek ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">the handbook</h2>
            <Link className="app-more" href="/app/read?of=handbook">
              read it ›
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
    </>
  );
}

/** "by Nick", "by Nick and Gabriel", "by Nick, Gabriel and Carla". */
function said(names: string[]): string {
  if (names.length === 1) return `by ${names[0]}`;
  return `by ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
