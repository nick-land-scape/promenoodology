import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cite from "@/components/Cite";
import type { Slide } from "@/lib/content";
import StoryBody from "@/components/StoryBody";
import { getNeighbours, getStories, getStory } from "@/lib/stories";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return {};

  const description =
    story.lead || [story.title, story.where, story.when].filter(Boolean).join(", ");

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
  const story = getStory(slug);
  if (!story) notFound();

  const { previous, next } = getNeighbours(story.slug);

  const slides: Slide[] = story.photos.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
  }));

  return (
    <main className="page">
      <header className="story-header">
        <p className="crumb">
          <Link href="/stories">stories</Link>
        </p>
        <h1 className="page-title">{story.title}</h1>
        <p className="story-meta">
          {[story.where, story.when, story.with, credit(story.credits)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <StoryBody slides={slides} sections={story.sections} />

      <Cite
        title={story.title}
        year={story.when}
        url={`https://promenoodology.com/stories/${story.slug}`}
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
