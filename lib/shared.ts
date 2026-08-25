import { cacheLife, cacheTag } from "next/cache";
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
import { getTheme } from "./theme";

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
 *
 * Written as `"use cache"` rather than as `unstable_cache`. Same sixty seconds,
 * same tag, and one real difference: a cached function that reads a cookie is now
 * a build error rather than a bug nobody notices. That guardrail is the reason
 * this file can be trusted at all — everything in here is handed from one
 * member's request to the next, so a single personal read that crept in would be
 * one member seeing another's screen. It cannot creep in now.
 */

/** Sixty seconds, and cleared by name whenever the back of the house writes. */
async function forAMinute() {
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag("content");
}

/*
 * Each one written out rather than made by a helper.
 *
 * There was an `inEach(read, key)` that took the reader as an argument and
 * wrapped it — nine lines instead of forty. It cannot survive `"use cache"`: a
 * cached function is compiled into something whose arguments are its key, and a
 * *function* is not a key. The build says so plainly ("functions cannot be passed
 * directly"), which is the second time today this feature has caught something by
 * refusing rather than by going wrong quietly.
 *
 * The language is an ordinary argument now, and arguments are the key, so English
 * and French keep their own answers with nothing written by hand to keep them
 * apart. That was the one thing the old helper existed to get right.
 */

/** Every story, with its photographs and cover. */
export async function sharedStories(lang: Lang = PLAIN) {
  "use cache";
  await forAMinute();
  return getStories(lang);
}

/** The whole archive. The heaviest read in the app, and the least personal. */
export async function sharedResources() {
  "use cache";
  await forAMinute();
  return getResources();
}

/** What is on. Bookings are read separately and never cached. */
export async function sharedEvents(lang: Lang = PLAIN) {
  "use cache";
  await forAMinute();
  return getEvents(lang);
}

/** The notes on the front screen. */
export async function sharedNews(lang: Lang = PLAIN) {
  "use cache";
  await forAMinute();
  return getNews(lang);
}

/** Who is around, for the community list. */
export async function sharedMembers() {
  "use cache";
  await forAMinute();
  return getMembers();
}

/** Everywhere this has happened, for the map. */
export async function sharedEverywhere() {
  "use cache";
  await forAMinute();
  return getEverywhere();
}

/** Plates, places, countries, years. */
export async function sharedCount() {
  "use cache";
  await forAMinute();
  return getTheCount();
}

/** The sheets. */
export async function sharedSheets(lang: Lang = PLAIN) {
  "use cache";
  await forAMinute();
  return getSheets(lang);
}

/** The films behind the curtain, read on every single screen by the layout. */
export async function sharedFilms() {
  "use cache";
  await forAMinute();
  return getHeroVideos();
}

/** One of the written pages, by slug. */
export async function sharedPage(slug: string, lang: Lang = PLAIN) {
  "use cache";
  await forAMinute();
  return getPage(slug, lang);
}

/**
 * The typefaces and the colours, which the layout reads before it can draw a
 * single page.
 *
 * Cached out here rather than in lib/theme.ts, and not by choice: that file also
 * holds the list of what can be painted, which the editor in /admin/settings
 * draws — so it is in the browser bundle too, and `next/cache` cannot be imported
 * into anything a client component touches. The read is the same read; only the
 * minute is added here.
 */
export async function sharedTheme() {
  "use cache";
  await forAMinute();
  return getTheme();
}

/**
 * Today, as a date somebody could have typed: 2026-08-25.
 *
 * Reading the clock is the one thing a page worked out ahead of time cannot do —
 * "now" is different by the time anybody asks, so Next refuses it outright and
 * says so at build. But a page that has to sort evenings into "this week" and
 * "already happened" has to know what day it is.
 *
 * So the clock is read in here, where the answer is kept for a minute like
 * everything else. A page therefore knows the date to within sixty seconds,
 * which is close enough for a thing measured in days, and the page itself stays
 * something that can be prepared before anybody arrives.
 */
export async function theDay(): Promise<string> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return new Date().toISOString().slice(0, 10);
}
