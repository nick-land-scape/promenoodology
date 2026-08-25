import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cite from "@/components/Cite";
import type { Slide, Story } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import Photo from "@/components/Photo";
import QuoteThis from "@/components/QuoteThis";
import StoryBody from "@/components/StoryBody";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { addresses, breadcrumbs, graph, picture, trim, US } from "@/lib/seo";
import { getEvents, getFrench, getNeighbours, getStories, getStory } from "@/lib/source";
import { speaking } from "@/lib/words";

type Params = { params: Promise<{ slug: string; lang: string }> };

// A page may serve a cached copy for a minute before asking the database again.
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
    alternates: addresses(isLang(lang) ? lang : PLAIN, `/stories/${story.slug}`),
    openGraph: {
      title: story.title,
      description,
      type: "article",
      images: story.cover ? [{ url: story.cover.src }] : undefined,
    },
  };
}

/**
 * One story, as a piece of writing about something that happened.
 *
 * An Article rather than a BlogPosting, and the distinction is not pedantry: a
 * blog post is dated and read in order, and these are not — a story is the
 * account of one thing this collective did, and the year it happened in matters
 * far more than the day somebody typed it up.
 *
 * The `about` list is the part a language model will actually use. It is the
 * topics somebody chose in /admin — "cooking in a car park", "a hundred people
 * fed" — and it is the difference between a page that can be found by what it
 * is about and one that can only be found by its name.
 */
function asArticle(story: Story, lang: Lang) {
  const url = siteUrl(at(lang, `/stories/${story.slug}`));

  return {
    "@type": "Article",
    "@id": url,
    url,
    headline: story.title,
    alternativeHeadline: story.subtitle || undefined,
    inLanguage: lang,
    description: trim(story.subtitle || story.lead || story.title),
    image: picture(story.cover?.src) ? [picture(story.cover?.src)] : undefined,
    /* The year, where there is one. `when` is written by hand and may say
       "summer 2024" as easily as a date, so it is only given as a date when it
       reads as one — a made-up day is worse than no day. */
    datePublished: /^\d{4}(-\d{2}(-\d{2})?)?$/.test((story.when ?? "").trim())
      ? story.when
      : undefined,
    contentLocation: story.where ? { "@type": "Place", name: story.where } : undefined,
    about: story.topics.length ? story.topics : undefined,
    author: story.credits.length
      ? story.credits.map((name) => ({ "@type": "Person", name }))
      : { "@id": US },
    publisher: { "@id": US },
    isPartOf: { "@id": siteUrl("/#website") },
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
      <JsonLd
        data={graph(
          asArticle(story, lang),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: say("event.theStories"), path: "/stories" },
            { name: story.title, path: `/stories/${story.slug}` },
          ]),
        )}
      />
      <header className="story-header">
        <p className="crumb">
          <Link href={at(lang, "/stories")}>{say("event.theStories")}</Link>
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
