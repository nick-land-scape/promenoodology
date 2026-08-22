/**
 * What the site says about itself to a machine.
 *
 * Two kinds of reader arrive here without eyes. A search engine, which wants to
 * know which address is the real one, which language it is in, and where the
 * same page lives in the other language. And a language model — the thing that
 * increasingly answers "is there anything on in Geneva this weekend" on somebody
 * else's behalf — which wants the facts of a page as facts rather than as
 * sentences it has to guess at.
 *
 * Both are served by the same two things: honest addresses, and a small block of
 * structured data saying what the page is about. Neither is visible, and neither
 * is allowed to say anything the page does not already say out loud. A page that
 * tells a crawler something the reader cannot see is lying to one of them.
 *
 * Everything here is plain data. No React, so a server page and a route handler
 * can both read it.
 */

import type { Metadata } from "next";
import { PLAIN, at, type Lang } from "./lang";
import { SITE_URL, siteUrl } from "./site";

/** A line the site has in both languages. */
export type Bilingual = { en: string; fr: string };

/** One of them, by language. */
export function say(lang: Lang, both: Bilingual): string {
  return lang === "fr" ? both.fr : both.en;
}

/**
 * The addresses of one page, in every language it exists in.
 *
 * This is the part that was wrong everywhere and mattered most. A canonical
 * written as a plain string — `canonical: "/about"` — is the same string on the
 * French page, so /fr/about spent its life telling search engines it was a
 * duplicate of the English one. The French site was, as far as anything indexing
 * it could tell, not there at all.
 *
 * So: the canonical is this page at this address, and the alternates are the
 * pair, each saying where the other is. x-default points at English, because
 * English is the address with no prefix and therefore the one to hand somebody
 * whose language we have not been told.
 */
export function addresses(lang: Lang, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: at(lang, path),
    languages: {
      en: at("en", path),
      fr: at("fr", path),
      "x-default": at(PLAIN, path),
    },
  };
}

/** What Open Graph calls these two. */
const LOCALE: Record<Lang, string> = { en: "en_GB", fr: "fr_CH" };

/**
 * The head of a page, said once.
 *
 * Every page on the website wants the same six things and used to write four of
 * them out by hand, which is how four of them came to disagree. Title,
 * description, the addresses above, and the social preview that repeats them —
 * a preview card that says something other than the page is a second
 * description nobody proofread.
 */
export function pageMetadata(page: {
  lang: Lang;
  /** The plain English path, with no language on it: "/about". */
  path: string;
  title: string;
  description: string;
  /** The one picture worth sharing this page with, if it has one. */
  image?: string | null;
  /** "article" for a story or an evening; the default is right for the rest. */
  type?: "website" | "article";
  /**
   * The title as the whole of it, with no "— promeNOODology" added.
   *
   * The template in the root layout is right for every page but one. The front
   * page's own title already names the collective, and run through the template
   * it came out as "promeNOODology — a social club that cooks in public —
   * promeNOODology", which is the site apologising for itself twice.
   */
  whole?: boolean;
}): Metadata {
  const { lang, path, title, description, image, type = "website", whole = false } = page;

  return {
    title: whole ? { absolute: title } : title,
    description,
    alternates: addresses(lang, path),
    openGraph: {
      title,
      description,
      type,
      url: siteUrl(at(lang, path)),
      siteName: "promeNOODology",
      locale: LOCALE[lang],
      alternateLocale: LOCALE[lang === "fr" ? "en" : "fr"],
      /* A page with no picture of its own still gets the site's, and gets it
         named rather than inherited. Setting openGraph on a page replaces the
         whole of the one above it, so a page that only wanted its own title
         would otherwise quietly lose the card image as well. */
      images: [{ url: image || "/opengraph-image.jpg" }],
    },
  };
}

/* -------------------------------------------------------- structured data */

/**
 * The collective itself, given a name a machine can hold on to.
 *
 * One node with one id, referred to by every other node on the site rather than
 * repeated. That is what the @id is for: the story's publisher, the evening's
 * organiser and the search box's owner are all this, and saying so once means
 * anything reading the site builds one picture of us instead of forty.
 */
export const US = siteUrl("/#organisation");
const SITE = siteUrl("/#website");

export function organisation() {
  return {
    "@type": "Organization",
    "@id": US,
    name: "promeNOODology",
    alternateName: "promeNOOD",
    url: SITE_URL,
    logo: siteUrl("/logo-mark.png"),
    email: "info@promeNOODology.com",
    description:
      "A social club, open to everyone. We cook, walk and put on small events that make a place feel like ours — and help other people put on their own.",
    sameAs: ["https://www.instagram.com/promenoodology/"],
    /* Where the club actually is. Vague on purpose and honest about it: this is
       a collective that cooks in car parks and on a friche outside Geneva, not
       an organisation with a front door, and inventing a street address to fill
       a field is exactly the kind of thing that gets a listing dropped. */
    areaServed: { "@type": "Place", name: "Geneva, Switzerland" },
  };
}

/** The website, and the fact that it is read in two languages. */
export function webSite(lang: Lang) {
  return {
    "@type": "WebSite",
    "@id": SITE,
    url: SITE_URL,
    name: "promeNOODology",
    inLanguage: lang === "fr" ? "fr" : "en",
    publisher: { "@id": US },
  };
}

/**
 * The trail from the front page to here.
 *
 * Worth the few lines: it is what turns a bare address in a search result into
 * "promeNOODology › events › this one", and it is the cheapest way to tell
 * anything reading the page where it sits in the site.
 */
export function breadcrumbs(lang: Lang, trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: siteUrl(at(lang, step.path)),
    })),
  };
}

/**
 * A list page, as a list.
 *
 * Only the addresses and the order. The point is not to reproduce the page in
 * JSON — each of those pages exists and can be read — but to say that this is a
 * list of those things, so nothing has to infer it from the shape of the markup.
 */
export function itemList(lang: Lang, paths: string[]) {
  return {
    "@type": "ItemList",
    numberOfItems: paths.length,
    itemListElement: paths.map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: siteUrl(at(lang, path)),
    })),
  };
}

/**
 * Several nodes, as one block.
 *
 * @graph rather than one script tag per thing: it lets the nodes above refer to
 * each other by id, and it is one parse instead of five.
 */
export function graph(...nodes: unknown[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

/**
 * A day and an hour, joined the way schema.org wants them.
 *
 * No offset. The alternative is to write +02:00 into it, which is right for six
 * months of the year and wrong for the other six; a local date-time is valid,
 * unambiguous next to the place on the same page, and cannot be wrong.
 */
export function moment(day: string, hour?: string): string | undefined {
  if (!day) return undefined;
  const clean = (hour ?? "").trim();
  return /^\d{1,2}:\d{2}/.test(clean) ? `${day}T${clean.padStart(5, "0")}` : day;
}

/**
 * A picture at an address anything can fetch.
 *
 * Photographs on this site come from two places: the ones that shipped with it,
 * which are paths like /resources/…, and the ones in Supabase storage, which
 * are already whole addresses. Structured data is read by something that is not
 * on this page and has no base to resolve a path against, so a relative one is
 * simply a broken picture — which is worse than none, because a search engine
 * that cannot fetch the image drops the whole rich result rather than the field.
 */
export function picture(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return /^https?:\/\//i.test(src) ? src : siteUrl(src);
}

/** Words with the markup and the newlines taken out, cut to a length. */
export function trim(words: string, most = 300): string {
  const one = words.replace(/\s+/g, " ").trim();
  if (one.length <= most) return one;
  return `${one.slice(0, most).replace(/[\s,;:.–—-]+\S*$/, "")}…`;
}
