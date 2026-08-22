import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSitePages } from "@/lib/site-pages";
import { getEvents, getSheets, getStories } from "@/lib/source";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only what is actually on the site. A page turned off in /admin is a 404, and
  // pointing search engines at a 404 is worse than not mentioning it.
  const site = await getSitePages();
  const on = (slug: string) => site.find((page) => page.slug === slug)?.visible !== false;

  const pages = [
    "/",
    ...["stories", "archive", "community", "about", "events", "newsletter", "handbook"]
      .filter(on)
      .map((slug) => `/${slug}`),
  ];
  const stories = on("stories")
    ? (await getStories()).map((story) => `/stories/${story.slug}`)
    : [];

  /* Every evening that is on and has an address. Behind the "what's on" switch,
     because that page can be turned off in /admin and pointing a search engine
     at a page that 404s is worse than not mentioning it. */
  const events = on("events")
    ? (await getEvents()).filter((event) => event.slug).map((event) => `/events/${event.slug}`)
    : [];

  /* The sheets. Not part of the pages that can be switched off in /admin: they
     are the invitation, they are meant to be found by somebody who has never
     heard of us, and a sheet nobody can find is a leaflet in a drawer. */
  const sheets = await getSheets();
  const doing = sheets.length
    ? ["/do-it-yourself", ...sheets.map((sheet) => `/do-it-yourself/${sheet.slug}`)]
    : [];

  return [...pages, ...stories, ...events, ...doing].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
