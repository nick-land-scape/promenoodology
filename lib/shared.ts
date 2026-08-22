import { unstable_cache } from "next/cache";
import {
  getEvents,
  getEverywhere,
  getHeroVideos,
  getMembers,
  getNews,
  getPage,
  getResources,
  getSheets,
  getStories,
  getTheCount,
} from "./source";
import { PLAIN, type Lang } from "./lang";

/**
 * The things that are the same for everybody, kept for a minute.
 *
 * This is the whole answer to "why is switching tabs slow". Every screen in /app
 * reads a cookie to find out who you are, which makes the page dynamic — and a
 * dynamic page in Next runs *everything* on it again on every visit, including
 * the seven questions about stories, photographs, evenings and news whose answers
 * are identical for all sixty-five members. Three taps around the app was three
 * sets of the same queries.
 *
 * So the personal half stays dynamic, as it must, and the shared half is cached
 * on the server for sixty seconds and handed to whoever asks next. What arrives
 * is the same page; what does not happen is the second and third round trip to
 * the database for an answer that has not changed.
 *
 * Sixty seconds, and tagged: anything written in the back of the house clears the
 * tag, so an evening turned on in /admin is in the app on the next tap rather
 * than up to a minute later. The one thing deliberately *not* here is the feed —
 * somebody who posts expects to see it, and a minute of "where has my post gone"
 * is worse than any amount of speed.
 */

const A_MINUTE = { revalidate: 60, tags: ["content"] };

/*
 * The language is part of the key, and has to be said out loud.
 *
 * These are shared caches: what one member's request puts in, the next member's
 * request takes out. An answer in French handed to somebody reading English
 * would not be a slow page, it would be the wrong page — so every one of these
 * is keyed on the language as well as on what it is asking for.
 */
const inEach = <T,>(
  read: (lang: Lang) => Promise<T>,
  key: string,
): ((lang?: Lang) => Promise<T>) => {
  const cached = {
    en: unstable_cache(() => read("en"), [key, "en"], A_MINUTE),
    fr: unstable_cache(() => read("fr"), [key, "fr"], A_MINUTE),
  };
  return (lang: Lang = PLAIN) => cached[lang]();
};

/** Every story, with its photographs and cover. */
export const sharedStories = inEach(getStories, "stories");

/** The whole archive. The heaviest read in the app, and the least personal. */
export const sharedResources = unstable_cache(getResources, ["resources"], A_MINUTE);

/** What is on. Bookings are read separately and never cached. */
export const sharedEvents = inEach(getEvents, "events");

/** The notes on the front screen. */
export const sharedNews = inEach(getNews, "news");

/** Who is around, for the community list. */
export const sharedMembers = unstable_cache(getMembers, ["members"], A_MINUTE);

/** Everywhere this has happened, for the map. */
export const sharedEverywhere = unstable_cache(getEverywhere, ["everywhere"], A_MINUTE);

/** Plates, places, countries, years. */
export const sharedCount = unstable_cache(getTheCount, ["count"], A_MINUTE);

/** The sheets. */
export const sharedSheets = inEach(getSheets, "sheets");

/** The films behind the curtain, read on every single screen by the layout. */
export const sharedFilms = unstable_cache(getHeroVideos, ["films"], A_MINUTE);

/** One of the written pages, by slug. */
export const sharedPage = unstable_cache(
  async (slug: string, lang: Lang = PLAIN) => getPage(slug, lang),
  ["page"],
  A_MINUTE,
);
