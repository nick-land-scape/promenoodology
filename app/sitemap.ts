import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSitePages } from "@/lib/site-pages";
import { getEvents, getStories } from "@/lib/source";

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

  /* Every evening that is on and has an address. Not behind the "stories"
     switch: an evening's page is a flyer, and turning off the stories does not
     cancel what is on. */
  const events = on("events")
    ? (await getEvents()).filter((event) => event.slug).map((event) => `/events/${event.slug}`)
    : [];

  return [...pages, ...stories, ...events].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
