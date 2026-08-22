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

/** Every story, with its photographs and cover. */
export const sharedStories = unstable_cache(getStories, ["stories"], A_MINUTE);

/** The whole archive. The heaviest read in the app, and the least personal. */
export const sharedResources = unstable_cache(getResources, ["resources"], A_MINUTE);

/** What is on. Bookings are read separately and never cached. */
export const sharedEvents = unstable_cache(getEvents, ["events"], A_MINUTE);

/** The notes on the front screen. */
export const sharedNews = unstable_cache(getNews, ["news"], A_MINUTE);

/** Who is around, for the community list. */
export const sharedMembers = unstable_cache(getMembers, ["members"], A_MINUTE);

/** Everywhere this has happened, for the map. */
export const sharedEverywhere = unstable_cache(getEverywhere, ["everywhere"], A_MINUTE);

/** Plates, places, countries, years. */
export const sharedCount = unstable_cache(getTheCount, ["count"], A_MINUTE);

/** The sheets. */
export const sharedSheets = unstable_cache(getSheets, ["sheets"], A_MINUTE);

/** The films behind the curtain, read on every single screen by the layout. */
export const sharedFilms = unstable_cache(getHeroVideos, ["films"], A_MINUTE);

/** One of the written pages, by slug. */
export const sharedPage = unstable_cache(
  async (slug: string) => getPage(slug),
  ["page"],
  A_MINUTE,
);
