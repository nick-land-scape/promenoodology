import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FlyerBook from "@/components/FlyerBook";
import JoinToTakePart from "@/components/JoinToTakePart";
import Linked from "@/components/Linked";
import Photo from "@/components/Photo";
import StoryBody from "@/components/StoryBody";
import type { Slide } from "@/lib/content";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
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
    alternates: {
      canonical: at(isLang(lang) ? lang : PLAIN, `/events/${event.slug}`),
      // The same evening in the other language, said to a search engine.
      languages: { en: `/events/${event.slug}`, fr: `/fr/events/${event.slug}` },
    },
    openGraph: {
      title: event.title,
      description,
      images: event.photo ? [{ url: event.photo.src }] : undefined,
    },
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
            {event.flyer ? (
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
          </span>
        </div>
        <h1 className="page-title">{event.title}</h1>
        {event.subtitle ? <p className="story-hook">{event.subtitle}</p> : null}
        <p className="story-meta">
          {[when(event), event.place, event.address].filter(Boolean).join(" · ")}
          {over ? ` · ${say("event.itHasBeen")}` : null}
        </p>
        {event.lead ? (
          <p className="event-lead">
            <Linked>{event.lead}</Linked>
          </p>
        ) : null}
      </header>

      {event.photo ? (
        <figure className="event-cover">
          <Photo
            src={event.photo.src}
            alt=""
            width={event.photo.width}
            height={event.photo.height}
            sizes="(max-width: 767px) 92vw, 60vw"
            priority
          />
        </figure>
      ) : null}

      {/* The programme, where it is more than one afternoon. Days rather than a
          rule: one of them is a Sunday and one of them starts at nine. */}
      {event.days.length > 0 ? (
        <section className="event-days">
          <h2 className="story-label">{say("event.programme")}</h2>
          <ol>
            {event.days.map((day) => (
              <li key={`${day.date}-${day.title}`}>
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
              </li>
            ))}
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
          {/* The flyer itself. Somebody who wants to bring people to this does
              not want to send them a link, they want the thing to print. */}
        </dl>

        {/* What a member could do about this, and what it takes to be one. */}
        {!over ? <JoinToTakePart signUpEmail={event.signUpEmail || undefined} lang={lang} say={say} /> : null}

        {event.note ? (
          <p className="story-text">
            <Linked>{event.note}</Linked>
          </p>
        ) : null}

        {/* Why the two buttons at the top are grey, said once, where somebody
            who has read this far will look for it. */}
        {!over ? <JoinToTakePart signUpEmail={event.signUpEmail || undefined} lang={lang} say={say} /> : null}

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
