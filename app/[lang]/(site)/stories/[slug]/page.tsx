import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cite from "@/components/Cite";
import type { Slide } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import Photo from "@/components/Photo";
import QuoteThis from "@/components/QuoteThis";
import StoryBody from "@/components/StoryBody";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { getEvents, getFrench, getNeighbours, getStories, getStory } from "@/lib/source";
import { speaking } from "@/lib/words";

type Params = { params: Promise<{ slug: string; lang: string }> };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getStories()).map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, lang } = await params;
  const story = await getStory(slug, isLang(lang) ? lang : PLAIN);
  if (!story) return {};

  const description =
    story.subtitle ||
    story.lead ||
    [story.title, story.where, story.when].filter(Boolean).join(", ");

  return {
    title: story.title,
    description,
    alternates: {
      canonical: at(isLang(lang) ? lang : PLAIN, `/stories/${story.slug}`),
      languages: { en: `/stories/${story.slug}`, fr: `/fr/stories/${story.slug}` },
    },
    openGraph: {
      title: story.title,
      description,
      images: story.cover ? [{ url: story.cover.src }] : undefined,
    },
  };
}

export default async function StoryPage({ params }: Params) {
  const { slug, lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const story = await getStory(slug, lang);
  if (!story) notFound();

  const { previous, next } = await getNeighbours(story.slug, lang);

  /* The evenings this is the story of.
   *
   * More than one, often: a summer of Saturdays on the same piece of ground is
   * five afternoons and one thing that happened, and the writing about it is the
   * one thing. Each of them keeps its own page — what it was called, who came,
   * what was still wanted that week — and this is the way back to them. */
  const say = speaking(lang, await getFrench());

  const evenings = (await getEvents(lang))
    .filter((event) => event.story?.slug === story.slug && event.slug)
    .sort((a, b) => a.date.localeCompare(b.date));

  const slides: Slide[] = story.photos.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
    layout: item.layout,
  }));

  return (
    <main className="page">
      <header className="story-header">
        <p className="crumb">
          <Link href={at(lang, "/stories")}>stories</Link>
        </p>
        <h1 className="page-title">{story.title}</h1>
        {story.subtitle ? <p className="story-hook">{story.subtitle}</p> : null}
        <p className="story-meta">
          {[story.where, story.when, story.with, credit(story.credits)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <StoryBody slides={slides} sections={story.sections} built={story.blocks} />

      {/* Who did it, at the foot, where the credits of anything belong. */}
      {story.who.length > 0 || story.partners.length > 0 ? (
        <footer className="story-credits">
          {story.who.length > 0 ? (
            <section>
              <h2 className="story-label">who was there</h2>
              <ul className="story-who">
                {story.who.map((person) => (
                  <li key={person.name}>
                    {person.photo ? (
                      <Photo src={person.photo} alt="" width={160} height={200} sizes="60px" />
                    ) : null}
                    <span>{person.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {story.partners.length > 0 ? (
            <section>
              <h2 className="story-label">made with</h2>
              <ul className="story-partners">
                {story.partners.map((partner) => (
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
        </footer>
      ) : null}

      {evenings.length > 0 ? (
        <section className="story-evenings">
          <h2 className="story-label">
            {evenings.length === 1
              ? say("story.eveningItCameFrom")
              : say("story.eveningsItCameFrom")}
          </h2>
          <ul>
            {evenings.map((evening) => (
              <li key={evening.id}>
                <Link href={at(lang, `/events/${evening.slug}`)}>{evening.title}</Link>
                <span>
                  {[
                    evening.until
                      ? `${pretty(evening.date)} – ${pretty(evening.until)}`
                      : pretty(evening.date),
                    evening.place,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Cite
        title={story.title}
        year={story.when}
        url={siteUrl(`/stories/${story.slug}`)}
      />

      {/* Offered the moment anybody copies a passage, rather than on a page they
          would have to come back to. */}
      <QuoteThis
        title={story.title}
        year={story.when}
        url={siteUrl(`/stories/${story.slug}`)}
      />

      {previous && next ? (
        <nav className="story-nav" aria-label="Other stories">
          <Link href={at(lang, `/stories/${previous.slug}`)}>← {previous.title}</Link>
          <Link href={at(lang, "/stories")}>all stories</Link>
          <Link href={at(lang, `/stories/${next.slug}`)}>{next.title} →</Link>
        </nav>
      ) : null}
    </main>
  );
}

function credit(credits: string[]) {
  if (credits.length === 0) return null;
  if (credits.length === 1) return `photos by ${credits[0]}`;
  return `photos by ${credits.slice(0, -1).join(", ")} and ${credits[credits.length - 1]}`;
}
