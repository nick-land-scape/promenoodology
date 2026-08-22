import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import StoryBody from "@/components/StoryBody";
import type { Slide } from "@/lib/content";
import { pretty } from "@/lib/admin/when";
import { getEvent, getEvents } from "@/lib/source";

type Params = { params: Promise<{ slug: string }> };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getEvents()).filter((event) => event.slug).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};

  const description =
    event.lead || event.subtitle || [event.title, event.place, when(event)].filter(Boolean).join(", ");

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
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
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

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
      <header className="story-header">
        <p className="crumb">
          {event.story ? (
            <Link href={`/stories/${event.story.slug}`}>{event.story.title}</Link>
          ) : (
            <Link href="/stories">stories</Link>
          )}
        </p>
        <h1 className="page-title">{event.title}</h1>
        {event.subtitle ? <p className="story-hook">{event.subtitle}</p> : null}
        <p className="story-meta">
          {[when(event), event.place, event.address].filter(Boolean).join(" · ")}
          {over ? " · it has been" : null}
        </p>
        {event.lead ? <p className="event-lead">{event.lead}</p> : null}
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
          <h2 className="story-label">the programme</h2>
          <ol>
            {event.days.map((day) => (
              <li key={`${day.date}-${day.title}`}>
                <p className="event-day-when">
                  {[pretty(day.date), [day.time, day.endTime].filter(Boolean).join("–")]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {day.title ? <h3 className="event-day-name">{day.title}</h3> : null}
                {day.what ? <p className="story-text">{day.what}</p> : null}
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
        <h2 className="story-label">coming</h2>
        <dl>
          <div>
            <dt>when</dt>
            <dd>{when(event) || "still being arranged"}</dd>
          </div>
          {event.place || event.address ? (
            <div>
              <dt>where</dt>
              <dd>{[event.place, event.address].filter(Boolean).join(", ")}</dd>
            </div>
          ) : null}
          {event.cost ? (
            <div>
              <dt>what it costs</dt>
              <dd>{event.cost}</dd>
            </div>
          ) : null}
          {!over ? (
            <div>
              <dt>asking to come</dt>
              <dd>
                {event.signUpEmail ? (
                  <a href={`mailto:${event.signUpEmail}`}>{event.signUpEmail}</a>
                ) : (
                  <>
                    In the members&rsquo; app — <Link href="/app/events">what&rsquo;s on</Link>
                    {event.spots > 0 ? `, ${event.spots} places` : null}
                  </>
                )}
              </dd>
            </div>
          ) : null}
          {event.fed ? (
            <div>
              <dt>how many ate</dt>
              <dd>{event.fed}</dd>
            </div>
          ) : null}
        </dl>

        {event.note ? <p className="story-text">{event.note}</p> : null}

        {/* What is still wanted, and it recruits itself: somebody reading this
            page is exactly the person who owns a pot big enough for forty. */}
        {!over && event.needs.trim() ? (
          <div className="event-wanted">
            <h2 className="story-label">still wanted</h2>
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
              <h2 className="story-label">part of</h2>
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

          {event.partners.length > 0 ? (
            <section>
              <h2 className="story-label">with</h2>
              <p className="story-text">{event.partners.join(", ")}</p>
            </section>
          ) : null}

          {/* What came of it. Several evenings may share one story, which is the
              point: a summer of Saturdays is one thing that happened. */}
          {event.story ? (
            <section>
              <h2 className="story-label">what came of it</h2>
              <p className="story-text">
                <Link href={`/stories/${event.story.slug}`}>{event.story.title}</Link>
              </p>
            </section>
          ) : null}
        </footer>
      ) : null}
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
