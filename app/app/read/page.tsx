import AppHeader from "@/components/app/AppHeader";
import Reading from "@/components/app/Reading";
import { requireMember } from "@/lib/app/me";
import { getPage, getResources, getStories } from "@/lib/source";

export const metadata = { title: "Read" };

/* The same minute of cache the website gives these: they are the same words for
   everybody, and there are a lot of photographs. */
export const revalidate = 60;

/**
 * Stories, the archive and the handbook, in the app.
 *
 * They were only on the website, which meant a member holding the app had no way
 * to read what this club has done or how to put on their own — the two things it
 * is mostly for. They are not copies: they read the same functions the website
 * reads, so a story written once is a story in both places.
 *
 * One tab rather than three. Five is the most a phone's bar can hold, and these
 * three are one activity: reading rather than turning up.
 */
export default async function ReadPage() {
  await requireMember("/app/read");

  const [stories, photos, handbook] = await Promise.all([
    getStories(),
    getResources(),
    getPage("handbook"),
  ]);

  return (
    <>
      <AppHeader eyebrow="read" title="what we have done" />
      <Reading
        stories={stories.map((story) => ({
          slug: story.slug,
          title: story.title,
          subtitle: story.subtitle,
          where: story.where,
          when: story.when,
          cover: story.cover?.src ?? null,
        }))}
        photos={photos.map((photo) => ({
          src: photo.photo.src,
          width: photo.photo.width,
          height: photo.photo.height,
          credit: photo.credit,
          year: photo.year,
        }))}
        handbook={{
          title: handbook?.title ?? "the handbook",
          lead: handbook?.lead ?? "",
          blocks: handbook?.blocks ?? [],
        }}
      />
    </>
  );
}
