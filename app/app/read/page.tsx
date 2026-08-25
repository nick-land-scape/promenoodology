import AppHeader from "@/components/app/AppHeader";
import Reading from "@/components/app/Reading";
import { readingIn, requireMember } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import {
  sharedEverywhere,
  sharedPage,
  sharedResources,
  sharedStories,
} from "@/lib/shared";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Read" };

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
export default async function ReadPage({
  searchParams,
}: {
  searchParams: Promise<{ of?: string }>;
}) {
  await requireMember("/app/read");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());
  /* Which of the three to open on, so a preview on the front screen lands where
     it was pointing rather than on the first tab. */
  const { of } = await searchParams;
  const openAt =
    of === "archive" || of === "handbook" || of === "map" ? of : "stories";

  const [stories, photos, handbook, pins] = await Promise.all([
    sharedStories(lang),
    sharedResources(),
    sharedPage("handbook", lang),
    sharedEverywhere(),
  ]);

  /* What the map's card shows when a pin is pressed: the photograph, the line
     under the title and the first paragraph — all of it already read for the list
     of stories above, so the map costs no second journey to the database. */
  const told = new Map(
    stories.map((story) => [
      story.slug,
      {
        cover: story.cover?.src ?? null,
        hook: story.subtitle ?? "",
        lead: story.lead ?? "",
      },
    ]),
  );

  return (
    <>
      <AppHeader eyebrow={say("read.eyebrow")} title={say("read.whatWeHaveDone")} />
      <Reading
        openAt={openAt}
        stories={stories.map((story) => ({
          slug: story.slug,
          title: story.title,
          subtitle: story.subtitle,
          where: story.where,
          when: story.when,
          cover: story.cover?.src ?? null,
          lead: story.lead ?? "",
        }))}
        photos={photos.map((photo) => ({
          src: photo.photo.src,
          width: photo.photo.width,
          height: photo.photo.height,
          credit: photo.credit,
          year: photo.year,
        }))}
        handbook={{
          title: handbook?.title ?? say("home.theHandbook"),
          lead: handbook?.lead ?? "",
          blocks: handbook?.blocks ?? [],
        }}
        pins={pins.map((pin) => ({
          id: pin.id,
          title: pin.title,
          where: pin.where,
          when: pin.when,
          lat: pin.lat,
          lng: pin.lng,
          slug: pin.slug,
          ahead: pin.ahead,
          fed: pin.fed,
          cover: pin.cover ?? (pin.slug ? (told.get(pin.slug)?.cover ?? null) : null),
          hook: pin.slug ? (told.get(pin.slug)?.hook ?? "") : "",
          lead: pin.slug ? (told.get(pin.slug)?.lead ?? "") : "",
        }))}
      />
    </>
  );
}
