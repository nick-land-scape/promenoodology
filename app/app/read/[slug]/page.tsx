import { notFound } from "next/navigation";
import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import { requireMember } from "@/lib/app/me";
import { getStory } from "@/lib/source";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  return { title: story?.title ?? "Story" };
}

/**
 * One story, in the app.
 *
 * The same story the website tells, set for a phone: the cover, the words in the
 * sections they were written in, and the photographs underneath. The website's
 * own page is a piece of design with the photographs woven through the text; this
 * is the reading version of it, and it links out to the other one for anybody who
 * wants to see it laid out properly.
 */
export default async function AppStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireMember("/app/read");
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <>
      <AppHeader eyebrow="a story" title={story.title} back="/app/read" />

      {story.cover ? (
        <div className="post-photo" style={{ marginTop: 0 }}>
          <Photo src={story.cover.src} alt="" fill sizes="(max-width: 560px) 100vw, 560px" priority />
        </div>
      ) : null}

      <div className="app-book">
        {story.subtitle ? <p className="app-book-lead">{story.subtitle}</p> : null}
        {[story.where, story.when, story.with].filter(Boolean).length > 0 ? (
          <p className="row-meta" style={{ paddingBottom: 8 }}>
            {[story.where, story.when, story.with].filter(Boolean).join(" · ")}
          </p>
        ) : null}

        {story.sections.map((section, index) => (
          <div key={index}>
            {section.heading ? <h2>{section.heading}</h2> : null}
            {section.texts.map((text, which) => (
              <p key={which}>{text}</p>
            ))}
          </div>
        ))}
      </div>

      {story.photos.length > 0 ? (
        <ul className="mine-grid">
          {story.photos.map((photo) => (
            <li key={photo.photo.src}>
              <Photo
                src={photo.photo.src}
                alt=""
                width={photo.photo.width}
                height={photo.photo.height}
                sizes="33vw"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {story.credits.length > 0 ? (
        <p className="app-note" style={{ padding: "14px var(--gutter)" }}>
          Photographs by {story.credits.join(", ")}.
        </p>
      ) : null}

      <p className="app-foot">
        <Link href={`/stories/${story.slug}`}>See it laid out on the website ↗</Link>
      </p>
    </>
  );
}
