import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cite from "@/components/Cite";
import type { Slide } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import Photo from "@/components/Photo";
import StoryBody from "@/components/StoryBody";
import { getNeighbours, getStories, getStory } from "@/lib/source";

type Params = { params: Promise<{ slug: string }> };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getStories()).map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return {};

  const description =
    story.subtitle ||
    story.lead ||
    [story.title, story.where, story.when].filter(Boolean).join(", ");

  return {
    title: story.title,
    description,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      title: story.title,
      description,
      images: story.cover ? [{ url: story.cover.src }] : undefined,
    },
  };
}

export default async function StoryPage({ params }: Params) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  const { previous, next } = await getNeighbours(story.slug);

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
          <Link href="/stories">stories</Link>
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

      <Cite
        title={story.title}
        year={story.when}
        url={siteUrl(`/stories/${story.slug}`)}
      />

      {previous && next ? (
        <nav className="story-nav" aria-label="Other stories">
          <Link href={`/stories/${previous.slug}`}>← {previous.title}</Link>
          <Link href="/stories">all stories</Link>
          <Link href={`/stories/${next.slug}`}>{next.title} →</Link>
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
