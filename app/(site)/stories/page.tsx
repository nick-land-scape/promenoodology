import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import { pageIsVisible } from "@/lib/site-pages";
import { getPageHead, getStories } from "@/lib/source";

export const metadata: Metadata = {
  title: "Stories",
  description: "The things we have put on together — one story each.",
  alternates: { canonical: "/stories" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function StoriesPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("stories"))) notFound();

  const [stories, head] = await Promise.all([getStories(), getPageHead("stories")]);

  return (
    <main className="page">
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
          own version — the <Link href="/handbook">handbook</Link> tells you how.
        </p>
      )}

      <ul
        className="story-list"
        // How narrow a card may get before the row gives one up, set in /admin.
        style={{ "--card": `${head.settings.columnWidth}px` } as React.CSSProperties}
      >
        {stories.map((story) => (
          <li key={story.slug} className="story-card">
            <Link href={`/stories/${story.slug}`}>
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
