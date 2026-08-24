import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import StoryBody from "@/components/StoryBody";
import type { Slide } from "@/lib/content";
import AppHeader from "@/components/app/AppHeader";
import { getFrench, getStory } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug, await readingIn());
  return { title: story?.title ?? "Story" };
}

/**
 * One story, in the app.
 *
 * The same story the website tells, and told the same way: the words in the
 * sections they were written in, with the photographs *between* them, each at the
 * shape it was taken in.
 *
 * It used to be all of the words and then a three-across grid of squares. Two
 * things were wrong with that. A square is a crop, and a crop of somebody's
 * photograph is a decision made by a stylesheet — a panorama of a table of forty
 * people became a square of the middle four. And a story read as an essay with a
 * contact sheet stapled to the back, when a story is the pictures and the words
 * saying what was happening in them.
 *
 * So it is the website's own weave, which already collapses to a single column of
 * full-width pictures on a phone — the same component, the same order, the same
 * lightbox, and the order somebody arranged in /admin is honoured here too rather
 * than only on the website.
 */
export default async function AppStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/read");
  const lang = await readingIn();
  const { slug } = await params;
  const story = await getStory(slug, lang);
  if (!story) notFound();

  const slides: Slide[] = story.photos.map((item) => ({
    key: item.file,
    photo: item.photo,
    caption: [item.credit, item.year].filter(Boolean).join(", "),
    layout: item.layout,
  }));

  return (
    <>
      <AppHeader eyebrow={say("pg.aStory")} title={story.title} back="/app/read" />

      {story.cover ? (
        <div className="post-photo" style={{ marginTop: 0 }}>
          <Photo src={story.cover.src} alt="" fill sizes="(max-width: 560px) 100vw, 560px" priority />
        </div>
      ) : null}

      <div className="app-book">
        {story.subtitle ? <p className="app-book-lead">{story.subtitle}</p> : null}
        {[story.where, story.when, story.with].filter(Boolean).length > 0 ? (
          <p className="row-meta">
            {[story.where, story.when, story.with].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      {/* The words and the photographs, woven. Sized for a phone by the app's own
          rules over .app-story; everything else about it — which photograph goes
          where, what opens the lightbox, the order it was arranged in — is the
          website's page, so the two cannot drift apart. */}
      <div className="app-story">
        <StoryBody slides={slides} sections={story.sections} built={story.blocks} />
      </div>

      {story.credits.length > 0 ? (
        <p className="app-note" style={{ padding: "14px var(--gutter)" }}>
          Photographs by {story.credits.join(", ")}.
        </p>
      ) : null}


    </>
  );
}
