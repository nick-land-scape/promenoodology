import type { Metadata } from "next";
import Archive, { type StoryFilter } from "@/components/Archive";
import { getFilters, getQuotes, getResources } from "@/lib/data";
import { getStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Everything we keep: photographs at whatever size they came in, and the things people said, on one wall.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const resources = getResources();
  const quotes = getQuotes();
  const stories = getStories();

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
