import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Archive, { type StoryFilter } from "@/components/Archive";
import { getFilters, getPageHead, getQuotes, getResources, getStories } from "@/lib/source";
import { isLang, PLAIN, type Lang } from "@/lib/lang";
import { pageMetadata, say, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";

const TITLE: Bilingual = { en: "The archive", fr: "L’archive" };
const ABOUT: Bilingual = {
  en: "Everything we keep: photographs at whatever size they came in, and the things people said, on one wall.",
  fr: "Tout ce que nous gardons : les photographies dans la taille où elles nous sont arrivées, et ce que les gens ont dit, sur un même mur.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("archive", lang);

  return pageMetadata({
    lang,
    path: "/archive",
    title: head.title || say(lang, TITLE),
    description: head.lead || say(lang, ABOUT),
  });
}

/**
 * One number, from everything on the wall.
 *
 * The wall is shuffled, and a shuffle needs a number to start from. It used to
 * be Math.random(), which meant a different wall every minute and — since Next
 * started working pages out before anybody asks for them — a page that could not
 * be worked out at all: a random number is the one thing a prepared page may not
 * contain, because the copy handed to the browser and the copy hydrating it
 * would disagree.
 *
 * So the number comes from the contents. Same photographs, same order; a new
 * photograph or a new line, and the whole wall deals itself again.
 */
function theOrderOf(photographs: string[], lines: string[]): number {
  let n = 7;
  for (const key of [...photographs, ...lines]) {
    for (let i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) & 0x7fffffff;
  }
  return 1 + (n % 100000);
}

// A page may serve a cached copy for a minute before asking the database again.
export default async function ResourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("archive"))) notFound();

  const [resources, quotes, stories, head] = await Promise.all([
    getResources(),
    getQuotes(),
    // The filters along the top are the stories' own names, so they are read in
    // the language the page is being read in.
    getStories(lang),
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
          // Worked out from what is on the wall rather than from chance, so the
          // server and the browser shuffle the same way on the first paint —
          // and so this page can be worked out ahead of anybody asking for it,
          // which a random number would prevent. The order is settled until a
          // photograph or a line is added, and changes when one is.
          seed={theOrderOf(slides.map((one) => one.key), quotes.map((one) => one.id))}
        />
      </div>
    </main>
  );
}
