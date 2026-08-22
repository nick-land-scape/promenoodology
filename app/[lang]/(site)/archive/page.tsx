import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Archive, { type StoryFilter } from "@/components/Archive";
import { getFilters, getPageHead, getQuotes, getResources, getStories } from "@/lib/source";
import { isLang, PLAIN } from "@/lib/lang";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "The archive",
  description:
    "Everything we keep: photographs at whatever size they came in, and the things people said, on one wall.",
  alternates: { canonical: "/archive" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function ResourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("archive"))) notFound();

  const [resources, quotes, stories, head] = await Promise.all([
    getResources(),
    getQuotes(),
    getStories(),
    getPageHead("archive", lang),
  ]);

  const slides = resources.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
    story: item.event,
    year: item.year,
  }));

  // Not filters any more — only so an opened photograph can offer the story it
  // belongs to.
  const storyLinks: StoryFilter[] = stories.map((story) => ({
    tag: story.tag,
    title: story.title,
    slug: story.slug,
  }));

  // Newest first: an archive is read backwards from now, not forwards from
  // whenever it started.
  const years = [
    ...new Set([...getFilters(resources).years, ...quotes.map((quote) => quote.year)]),
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  return (
    <main className="page">
      <h1 className="page-title">{head.title || "the archive"}</h1>
      {head.saved ? (
        head.lead ? <p className="page-intro">{head.lead}</p> : null
      ) : (
        <p className="page-intro">
          Photographs and things people said, mixed together and left at the size they came in.
        </p>
      )}
      <div style={{ "--brick": `${head.settings.columnWidth}px` } as React.CSSProperties}>
        <Archive
          slides={slides}
          quotes={quotes}
          stories={storyLinks}
          years={years}
          // Worked out here so the server and the browser shuffle the same way
          // on the first paint. The page keeps its copy for a minute, so the
          // order changes about that often.
          seed={1 + Math.floor(Math.random() * 100000)}
        />
      </div>
    </main>
  );
}
