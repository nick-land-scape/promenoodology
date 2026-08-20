import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Photo from "@/components/Photo";
import { getStories } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

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

  const stories = await getStories();

  return (
    <main className="page">
      <h1 className="page-title">stories</h1>
      <p className="page-intro">
        What we did, who was there and what we would do differently. Take any of it and do your own
        version — the <Link href="/handbook">handbook</Link> tells you how.
      </p>

      <ul className="story-list">
        {stories.map((story) => (
          <li key={story.slug} className="story-card">
            <Link href={`/stories/${story.slug}`}>
              {story.cover ? (
                <span className="story-cover">
                  <Photo src={story.cover.src} alt="" fill sizes="(max-width: 767px) 45vw, 320px" />
                </span>
              ) : null}
              <span className="story-name">{story.title}</span>
              <span className="story-meta">
                {[story.where, story.when, count(story.photos.length)].filter(Boolean).join(" · ")}
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
