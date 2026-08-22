import type { MetadataRoute } from "next";
import { LANGS, at } from "@/lib/lang";
import { LEGAL } from "@/lib/legal";
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

  const all = [...pages, ...stories, ...events, ...doing];

  /* How much of the site each page is. The front page, then the pages that are
     the point of it — what is on, and the sheets somebody can act on — then
     everything else. Search engines treat this as a hint about our own site
     rather than a claim about anybody else's, which is exactly what it is. */
  const weight = (route: string) => {
    if (route === "/") return 1;
    if (route === "/events" || route === "/do-it-yourself") return 0.9;
    return 0.7;
  };

  /* Both languages, and each one saying where the other is.
   *
   * A French page that no search engine knows is French is a French page nobody
   * French ever sees, which would make the whole exercise decorative.
   *
   * x-default with them: it is what a search engine shows somebody whose
   * language matches neither, and without it that choice is made for us. */
  const bilingual = all.flatMap((route) => {
    const languages = {
      en: `${SITE_URL}${route}`,
      fr: `${SITE_URL}${at("fr", route)}`,
      "x-default": `${SITE_URL}${route}`,
    };
    return LANGS.map((lang) => ({
      url: `${SITE_URL}${at(lang, route)}`,
      changeFrequency: "monthly" as const,
      priority: weight(route),
      alternates: { languages },
    }));
  });

  /* The written pages, at the short addresses they are canonical at, and in
     English only — they are written in English and served the same either way,
     so listing a French copy would be listing a duplicate of a page we have
     already said is a duplicate.

     They were missing here altogether, which meant the pages an app store, a
     bank and anybody checking who is behind this site go looking for were the
     pages nothing pointed at. Low priority, because nobody arrives at a privacy
     policy by accident — but a sitemap that leaves out the parts of a site that
     establish who runs it leaves out the part that makes the rest credible. */
  const written = LEGAL.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));

  return [...bilingual, ...written];
}
