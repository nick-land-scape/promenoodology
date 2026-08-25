import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Photo from "@/components/Photo";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { breadcrumbs, graph, itemList, pageMetadata, say, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";
import { getPageHead, getStories } from "@/lib/source";

const TITLE: Bilingual = { en: "Stories", fr: "Les récits" };
const ABOUT: Bilingual = {
  en: "The things we have put on together — one story each: what we did, who was there and what we would do differently.",
  fr: "Ce que nous avons organisé ensemble — un récit chacun : ce que nous avons fait, qui était là et ce que nous ferions autrement.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("stories", lang);

  return pageMetadata({
    lang,
    path: "/stories",
    title: head.title || say(lang, TITLE),
    description: head.lead || say(lang, ABOUT),
  });
}

// A page may serve a cached copy for a minute before asking the database again.
export default async function StoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("stories"))) notFound();

  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  const [stories, head] = await Promise.all([getStories(lang), getPageHead("stories", lang)]);

  return (
    <main className="page">
      {/* That this is a list, and what is in it, in the order it is in. */}
      <JsonLd
        data={graph(
          itemList(
            lang,
            stories.map((story) => `/stories/${story.slug}`),
          ),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: head.title || say(lang, TITLE), path: "/stories" },
          ]),
        )}
      />
      <h1 className="page-title">{head.title || "stories"}</h1>

      {/* The words the site shipped with are still here, and still have their
          link in them; the first edit in /admin replaces them with plain text. */}
      {head.saved ? (
        head.lead ? (
          <p className="page-intro">{head.lead}</p>
        ) : null
      ) : (
        <p className="page-intro">
          What we did, who was there and what we would do differently. Take any of it and do your
          own version — the <Link href={at(lang, "/handbook")}>handbook</Link> tells you how.
        </p>
      )}

      <ul
        className="story-list"
        // How narrow a card may get before the row gives one up, set in /admin.
        style={{ "--card": `${head.settings.columnWidth}px` } as React.CSSProperties}
      >
        {stories.map((story) => (
          <li key={story.slug} className="story-card">
            <Link href={at(lang, `/stories/${story.slug}`)}>
              {story.cover ? (
                <span className="story-cover">
                  <Photo src={story.cover.src} alt="" fill sizes="(max-width: 767px) 45vw, 320px" />
                </span>
              ) : null}
              <span className="story-name">{story.title}</span>
              {story.subtitle ? <span className="story-hook">{story.subtitle}</span> : null}
              <span className="story-meta">
                {[
                  story.where,
                  story.when,
                  head.settings.showPhotoCount ? count(story.photos.length) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="story-lead">{story.lead}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function count(total: number) {
  if (total === 0) return null;
  return `${total} photo${total === 1 ? "" : "s"}`;
}
