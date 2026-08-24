import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FlyerBook from "@/components/FlyerBook";
import AddToCalendar from "@/components/AddToCalendar";
import JoinToTakePart from "@/components/JoinToTakePart";
import JsonLd from "@/components/JsonLd";
import Linked from "@/components/Linked";
import Photo from "@/components/Photo";
import QuoteThis from "@/components/QuoteThis";
import StoryBody from "@/components/StoryBody";
import type { EventPage as Evening, Slide } from "@/lib/content";
import { dateParts } from "@/lib/app-data";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";
import { addresses, breadcrumbs, graph, moment, picture, trim, US } from "@/lib/seo";
import { getEvent, getEvents, getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

type Params = { params: Promise<{ slug: string; lang: string }> };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getEvents()).filter((event) => event.slug).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, lang } = await params;
  const event = await getEvent(slug, isLang(lang) ? lang : PLAIN);
  if (!event) return {};

  const description =
    event.lead || event.subtitle || [event.title, event.place, when(event)].filter(Boolean).join(", ");

  return {
    title: event.title,
    description,
    alternates: addresses(isLang(lang) ? lang : PLAIN, `/events/${event.slug}`),
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.photo ? [{ url: event.photo.src }] : undefined,
    },
  };
}

/**
 * One evening, as a thing with a date on it.
 *
 * This is the block that earns its place more than any other on the site. An
 * evening is exactly the kind of fact a search engine will show as a card and a
 * language model will read out when somebody asks what is on this weekend — but
 * only if the date, the place and the price are given as data rather than left
 * to be read out of a line of prose that says "22 August 2026, la friche, 19:00".
 *
 * Everything in here is already on the page in words. Nothing is invented: an
 * evening with no address gets no location, and an evening nobody has priced
 * gets no offer, because a free evening and an evening whose price has not been
 * decided are not the same thing and guessing turns one into the other.
 */
function asEvent(event: Evening, lang: Lang) {
  const url = siteUrl(at(lang, `/events/${event.slug}`));
  const over = (event.until || event.date) < new Date().toISOString().slice(0, 10);

  /* Where it is. A name and a street where both are known; the name alone is
     still a place, and "la friche de Renens" is more use to a reader than an
     empty field. */
  const place =
    event.place || event.address
      ? {
          "@type": "Place",
          name: event.place || event.address,
          address: event.address || event.place,
        }
      : undefined;

  /* What it costs, where somebody has said. The text is kept as written —
     "gratuit", "£5 on the door" — rather than parsed into a number, because a
     wrong number in an offer is worse than no offer at all. Free is the one
     case worth saying properly, and it is the one anybody searching cares
     about. */
  const free = /^(free|gratuit|libre|prix libre|0)\b/i.test(event.cost.trim());
  const offer = event.cost
    ? {
        "@type": "Offer",
        url,
        name: event.cost,
        ...(free ? { price: 0, priceCurrency: "CHF" } : {}),
        availability: over
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      }
    : undefined;

  return {
    "@type": "Event",
    "@id": url,
    url,
    name: event.title,
    inLanguage: lang,
    description: trim(event.lead || event.subtitle || event.note || event.title),
    startDate: moment(event.date, event.time),
    /* Only where it means something. An evening with no closing time and no
       last day would otherwise end at the minute it started, which reads as an
       event of zero length rather than as one nobody has said the end of. */
    endDate:
      event.until || event.endTime
        ? moment(event.until || event.date, event.endTime)
        : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place,
    image: picture(event.photo?.src) ? [picture(event.photo?.src)] : undefined,
    organizer: { "@id": US },
    isAccessibleForFree: free || undefined,
    offers: offer,
    /* Who else is putting it on. Named rather than described: these are real
       organisations with their own pages, and the link is the useful half. */
    performer: event.partners.length
      ? event.partners.map((partner) => ({
          "@type": "Organization",
          name: partner.name,
          url: partner.url || undefined,
        }))
      : undefined,
    superEvent: event.partOf
      ? { "@type": "Event", name: event.partOf, url: event.partOfUrl || undefined }
      : undefined,
    /* A programme of several days, each one its own evening under this one.
       Somebody looking for "the Saturday" is looking for one of these. */
    subEvent: event.days.length
      ? event.days.map((day) => ({
          "@type": "Event",
          name: day.title || event.title,
          description: day.what || undefined,
          startDate: moment(day.date, day.time),
          endDate: day.endTime ? moment(day.date, day.endTime) : undefined,
          location: place,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
        }))
      : undefined,
  };
}

/**
 * One evening, at an address anybody can open.
 *
 * The members' app has always had these, behind a sign-in, as a row you tap to
 * sign up. That is the right place to *come* to something and the wrong place to
 * hear about it: a flyer goes on a wall, and the thing a wall wants is a link
 * that opens for anybody.
 *
 * So this is the flyer. Everything on it — the days, the place, what it costs,
 * who it is with — and underneath, where somebody has written one, the page. The
 * asking to come stays in the app, where the names are.
 */
export default async function EventPage({ params }: Params) {
  const { slug, lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const [event, french] = await Promise.all([getEvent(slug, lang), getFrench()]);
  if (!event) notFound();

  // What the page says on its own behalf, in whichever language it is being
  // read in. See lib/words.
  const say = speaking(lang, french);

  const slides: Slide[] = event.blocks
    .filter((block) => block.kind === "photo")
    .map((block) => {
      const photo = block as Extract<typeof block, { kind: "photo" }>;
      return {
        key: photo.photo.src,
        photo: photo.photo,
        caption: photo.caption,
        layout: photo.layout,
      };
    });

  const over = (event.until || event.date) < new Date().toISOString().slice(0, 10);

  return (
    <main className="page">
      <JsonLd
        data={graph(
          asEvent(event, lang),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: say("event.allEvents"), path: "/events" },
            { name: event.title, path: `/events/${event.slug}` },
          ]),
        )}
      />
      {/*
       * The top of the evening, and it stays there.
       *
       * Everything you can *do* about this evening is up here now — look through
       * the flyer, say you are coming, keep it on your list — because on a page
       * this long they were at the foot, five screens past the point where
       * somebody decides. It sticks so that the decision is never off screen.
       */}
      <header className="story-header event-top">
        <div className="event-top-row">
          {/* The way back, and it goes to the list this came from rather than to
              wherever the browser happened to be. Top left, where a back is. */}
          <p className="crumb">
            <Link href={at(lang, "/events")} className="event-back">
              ← {say("event.allEvents")}
            </Link>
          </p>

          <span className="event-top-does">
            {/* The flyer's own button is on the photograph now, in its corner —
                where a flyer is. It stays up here only when there is no
                photograph for it to sit on. */}
            {event.flyer && !event.photo ? (
              <FlyerBook
                src={event.flyer}
                title={event.title}
                words={{
                  open: say("event.lookThrough"),
                  take: say("event.takeAsPdf"),
                  before: say("book.pageBefore"),
                  after: say("book.nextPage"),
                }}
              />
            ) : null}
            {!over ? <JoinToTakePart signUpEmail={event.signUpEmail || undefined} lang={lang} say={say} tight /> : null}
            {/* After the bookmark: the two that are about *you and this evening*
                come first, and putting a date in your own calendar is the thing you
                do once you have decided. */}
            {!over ? <AddToCalendar event={event} say={say} tight /> : null}
          </span>
        </div>

        {/* Said in the bar, so it is still there five screens down: the two greyed
            controls above raise a question, and this is its answer. */}
        {over ? null : <p className="event-top-open">{say("part.openToAll")}</p>}
      </header>

      {/*
       * What the evening is called, and when and where — under the bar rather
       * than in it.
       *
       * The bar stays on screen the whole way down the page, and everything kept
       * in it is kept there for ever: a title, a hook and a line of dates read
       * once and then permanently eating the top of the page. What has to stay
       * is the way back and the things you can press. The rest is the opening of
       * the page, and it opens the way a flyer does — the name, the line under
       * it, the dates, the paragraph, the picture.
       */}
      <div className="event-said">
        <h1 className="page-title">{event.title}</h1>
        {event.subtitle ? <p className="story-hook">{event.subtitle}</p> : null}
        <p className="story-meta">
          {[when(event), event.place, event.address].filter(Boolean).join(" · ")}
          {over ? ` · ${say("event.itHasBeen")}` : null}
        </p>
      </div>

      {event.lead ? (
        <p className="event-lead">
          <Linked>{event.lead}</Linked>
        </p>
      ) : null}

      {event.photo ? (
        <figure className="event-cover">
          {/* Named rather than left empty: this is the photograph of the thing
              the page is about, not decoration, and an empty alt tells a screen
              reader and an image search exactly as much as no photograph. */}
          <Photo
            src={event.photo.src}
            alt={event.title}
            width={event.photo.width}
            height={event.photo.height}
            sizes="(max-width: 767px) 92vw, 60vw"
            priority
          />

          {/* In the corner of the picture, because that is what it is a picture
              of: the flyer for this evening. It was in the bar at the top beside
              two other things to press, which made three controls competing for a
              line and none of them the obvious one. */}
          {event.flyer ? (
            <span className="event-cover-flyer">
              <FlyerBook
                src={event.flyer}
                title={event.title}
                words={{
                  open: say("event.lookThrough"),
                  take: say("event.takeAsPdf"),
                  before: say("book.pageBefore"),
                  after: say("book.nextPage"),
                }}
              />
            </span>
          ) : null}
        </figure>
      ) : null}

      {/* The programme, where it is more than one afternoon. Days rather than a
          rule: one of them is a Sunday and one of them starts at nine. */}
      {event.days.length > 0 ? (
        <section className="event-days">
          <h2 className="story-label">{say("event.programme")}</h2>
          <ol>
            {event.days.map((day) => {
              const when = dateParts(day.date, lang);
              return (
                <li key={`${day.date}-${day.title}`}>
                  {/* The day as a stamp on the left, the way the app's rows say it:
                      a list of five afternoons is scanned by date, and a date set as
                      a line of small capitals above the name is read after it rather
                      than before. */}
                  <span className="event-day-date" aria-hidden="true">
                    <b>{when.day}</b>
                    <i>{when.month}</i>
                  </span>

                  <span className="event-day-said">
                    <p className="event-day-when">
                      {[pretty(day.date), [day.time, day.endTime].filter(Boolean).join("–")]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {day.title ? <h3 className="event-day-name">{day.title}</h3> : null}
                    {day.what ? (
                      <p className="story-text">
                        <Linked>{day.what}</Linked>
                      </p>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {/* Whatever somebody wrote at length, in the order they put it. Empty for
          most evenings, and an empty page here is simply nothing. */}
      {event.blocks.length > 0 ? (
        <StoryBody slides={slides} sections={[]} built={event.blocks} />
      ) : null}

      <section className="event-practical">
        <h2 className="story-label">{say("event.coming")}</h2>
        {/* Straight under the heading that answers "how do I come to this": the day
            and the place are here, and the thing anybody does with a day and a
            place is put it in whatever keeps track of their Saturdays. */}
        <AddToCalendar event={event} say={say} />
        <dl>
          <div>
            <dt>{say("event.when")}</dt>
            <dd>{when(event) || say("event.stillArranged")}</dd>
          </div>
          {event.place || event.address ? (
            <div>
              <dt>{say("event.where")}</dt>
              <dd>{[event.place, event.address].filter(Boolean).join(", ")}</dd>
            </div>
          ) : null}
          {event.cost ? (
            <div>
              <dt>{say("event.cost")}</dt>
              <dd>{event.cost}</dd>
            </div>
          ) : null}
          {!over ? (
            <div>
              <dt>{say("event.howToCome")}</dt>
              <dd>
                {event.signUpEmail ? (
                  <a href={`mailto:${event.signUpEmail}`}>{event.signUpEmail}</a>
                ) : (
                  <>
                    {say("event.inTheApp")}{" "}
                    <Link href="/app/events">{say("event.whatsOn")}</Link>
                    {event.spots > 0 ? `, ${event.spots} ${say("event.places")}` : null}
                  </>
                )}
              </dd>
            </div>
          ) : null}
          {event.fed ? (
            <div>
              <dt>{say("event.howManyAte")}</dt>
              <dd>{event.fed}</dd>
            </div>
          ) : null}
        </dl>

        {event.note ? (
          <p className="story-text">
            <Linked>{event.note}</Linked>
          </p>
        ) : null}

        {/* Why the two buttons at the top are grey, said once, where somebody
            who has read this far will look for it. The buttons themselves stay
            in the header — a second pair of the same two here would read as a
            page assembled twice. */}
        {!over ? (
          <JoinToTakePart
            signUpEmail={event.signUpEmail || undefined}
            lang={lang}
            say={say}
            wordsOnly
          />
        ) : null}

        {/* What is still wanted, and it recruits itself: somebody reading this
            page is exactly the person who owns a pot big enough for forty. */}
        {!over && event.needs.trim() ? (
          <div className="event-wanted">
            <h2 className="story-label">{say("event.stillWanted")}</h2>
            <ul>
              {event.needs
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>

      {event.partOf || event.partners.length > 0 || event.story ? (
        <footer className="story-credits">
          {event.partOf ? (
            <section>
              <h2 className="story-label">{say("event.partOf")}</h2>
              <p className="story-text">
                {event.partOfUrl ? (
                  <a href={event.partOfUrl} target="_blank" rel="noopener noreferrer">
                    {event.partOf}
                  </a>
                ) : (
                  event.partOf
                )}
              </p>
            </section>
          ) : null}

          {/* The same row of marks a story ends with. An organisation is
              recognised by its logo and read as a name only when it has not got
              one, which is why the name is the fallback rather than the label. */}
          {event.partners.length > 0 ? (
            <section>
              <h2 className="story-label">{say("event.with")}</h2>
              <ul className="story-partners">
                {event.partners.map((partner) => (
                  <li key={partner.name}>
                    {partner.url ? (
                      <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        {partner.logo ? (
                          <Photo src={partner.logo} alt={partner.name} width={300} height={200} sizes="130px" />
                        ) : (
                          partner.name
                        )}
                      </a>
                    ) : partner.logo ? (
                      <Photo src={partner.logo} alt={partner.name} width={300} height={200} sizes="130px" />
                    ) : (
                      partner.name
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* What came of it. Several evenings may share one story, which is the
              point: a summer of Saturdays is one thing that happened. */}
          {event.story ? (
            <section>
              <h2 className="story-label">{say("event.whatCameOfIt")}</h2>
              <p className="story-text">
                <Link href={at(lang, `/stories/${event.story.slug}`)}>{event.story.title}</Link>
              </p>
            </section>
          ) : null}
        </footer>
      ) : null}

      {/* The same offer as on a story: the moment somebody marks a passage is the
          moment to hand them the reference for it. */}
      <QuoteThis title={event.title} url={siteUrl(at(lang, `/events/${event.slug}`))} />

      {/* Where somebody who has just read about one evening actually wants to go
          next: everything else we have done, and the photographs of it. */}
      <nav className="event-onward" aria-label="The rest of the site">
        <Link href={at(lang, "/events")}>← {say("event.allEvents")}</Link>
        <Link href={at(lang, "/stories")}>{say("event.theStories")}</Link>
        <Link href={at(lang, "/archive")}>{say("event.theArchive")}</Link>
      </nav>
    </main>
  );
}

/** When it is, in one line: a day, or a stretch of them. */
function when(event: { date: string; until: string; time: string; endTime: string }) {
  if (!event.date) return "";
  const days = event.until ? `${pretty(event.date)} – ${pretty(event.until)}` : pretty(event.date);
  const hours = [event.time, event.endTime].filter(Boolean).join("–");
  // Hours belong to a single day; over a stretch they belong to each of the days.
  return event.until ? days : [days, hours].filter(Boolean).join(", ");
}
