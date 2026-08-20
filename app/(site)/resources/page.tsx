import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Archive, { type StoryFilter } from "@/components/Archive";
import { getFilters, getQuotes, getResources, getStories } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Everything we keep: photographs at whatever size they came in, and the things people said, on one wall.",
  alternates: { canonical: "/resources" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function ResourcesPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("resources"))) notFound();

  const [resources, quotes, stories] = await Promise.all([
    getResources(),
    getQuotes(),
    getStories(),
  ]);

  const slides = resources.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
    story: item.event,
    year: item.year,
  }));

  // Only offer a filter for stories that actually have something in the archive.
  const kept = new Set([
    ...resources.map((item) => item.event),
    ...quotes.map((quote) => quote.story),
  ]);
  const storyFilters: StoryFilter[] = stories
    .filter((story) => kept.has(story.tag))
    .map((story) => ({ tag: story.tag, title: story.title, slug: story.slug }));

  const years = [
    ...new Set([...getFilters(resources).years, ...quotes.map((quote) => quote.year)]),
  ]
    .filter(Boolean)
    .sort();

  return (
    <main className="page">
      <h1 className="page-title">the archive</h1>
      <p className="page-intro">
        Photographs and things people said, mixed together and left at the size they came in.
      </p>
      <Archive slides={slides} quotes={quotes} stories={storyFilters} years={years} />
    </main>
  );
}
