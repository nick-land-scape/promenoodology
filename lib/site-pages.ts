import { cache } from "react";
import { PLAIN, say, type Lang } from "./lang";
import { hasSupabase } from "./supabase/config";
import { supabasePublic } from "./supabase/public";

/**
 * Which pages the site has, whether each one is shown, and what the menu calls
 * it.
 *
 * A page that is turned off is off everywhere: out of the menu, out of the
 * sitemap, and gone from its own address. That is deliberate — a page reachable
 * by anybody who kept the link is not hidden, it is just unlisted.
 *
 * Like everything else the site reads, this falls back to what the site shipped
 * with when there is no database: every page shown, in the order the menu was
 * written in by hand.
 */

export type SitePage = {
  slug: string;
  /** The words in the menu, or null for a page that is not listed. */
  navLabel: string | null;
  group: "main" | "more" | "none";
  position: number;
  visible: boolean;
  /** The French of this row, where anybody has written any. */
  fr?: unknown;
};

/** The menu as it was before there was anywhere to change it. */
const SHIPPED: SitePage[] = [
  /* What is on comes first, and it is the only one of these whose place is an
     argument rather than a habit: everything else on the site is a record of
     something that has happened, and this is the one page you can still act on. */
  { slug: "events", navLabel: "WHAT'S ON", group: "main", position: 1, visible: true },
  { slug: "stories", navLabel: "STORIES", group: "main", position: 2, visible: true },
  { slug: "archive", navLabel: "ARCHIVE", group: "main", position: 3, visible: true },
  { slug: "community", navLabel: "COMMUNITY", group: "main", position: 4, visible: true },
  { slug: "about", navLabel: "ABOUT US", group: "main", position: 5, visible: true },
  { slug: "handbook", navLabel: "handbook", group: "more", position: 6, visible: true },
  /* Two pages that are not in the menu. The newsletter has its own place — the
     last line of the menu is the session link, which reads "newsletter" until
     you are signed in and becomes your own face after; putting it in a group as
     well listed it twice. The public bank account has never been listed at all:
     only people given the address find it. */
  { slug: "newsletter", navLabel: null, group: "none", position: 7, visible: true },
  { slug: "donations", navLabel: null, group: "none", position: 8, visible: true },
];

type Row = {
  slug: string;
  nav_label: string | null;
  nav_group: string | null;
  nav_position: number | null;
  visible: boolean | null;
  /** The French of this row, keyed by the column it translates. */
  fr: unknown;
};

/* Asked once per request however many things want to know — a page asks whether
   it is shown, and the menu in the layout asks for the whole list. */
export const getSitePages = cache(async (): Promise<SitePage[]> => {
  if (!hasSupabase()) return SHIPPED;

  try {
    const { data } = await supabasePublic()
      .from("pages")
      .select("slug, nav_label, nav_group, nav_position, visible, fr")
      .order("nav_position")
      .returns<Row[]>();

    // Before migration 0004 these columns do not exist and the select fails, so
    // an empty answer covers both "no rows yet" and "the database has not caught
    // up" — either way the menu the site shipped with is the right answer.
    if (!data?.length) return SHIPPED;

    return data.map((row) => ({
      slug: row.slug,
      navLabel: row.nav_label,
      fr: row.fr,
      group: (row.nav_group === "main" || row.nav_group === "more" ? row.nav_group : "none"),
      position: row.nav_position ?? 99,
      visible: row.visible !== false,
    }));
  } catch {
    return SHIPPED;
  }
});

/**
 * Is this page on the site? Used by the pages themselves, so a turned-off page
 * is a 404 rather than something you can still reach with the old link.
 *
 * A page nobody has written a row for counts as shown: forgetting to add a row
 * should not take a page off the site.
 */
export async function pageIsVisible(slug: string): Promise<boolean> {
  const pages = await getSitePages();
  const page = pages.find((one) => one.slug === slug);
  return page ? page.visible : true;
}

/** The two menu groups, in order, with only what is actually shown. */
export async function getMenu(lang: Lang = PLAIN): Promise<{
  main: { href: string; label: string }[];
  more: { href: string; label: string }[];
}> {
  const pages = await getSitePages();

  /*
   * Which group a page is in is the answer, and the only answer.
   *
   * It used to also depend on the label not being empty, which made two ways to
   * say the same thing and one of them silent: a page put in the bold links with
   * its name left blank simply was not in the menu, and nothing anywhere said
   * why. Now an empty name falls back to the address, so a page in a group is
   * always in the menu, even if it is wearing its own slug until somebody names
   * it properly.
   */
  const listed = pages
    .filter((page) => page.visible && page.group !== "none")
    .sort((a, b) => a.position - b.position);

  const pick = (group: "main" | "more") =>
    listed
      .filter((page) => page.group === group)
      .map((page) => ({
        href: `/${page.slug}`,
        // The bold ones are set in capitals on the site; the quieter ones are not.
        label:
          say(page.fr, "nav_label", lang, page.navLabel)?.trim() ||
          (group === "main" ? page.slug.toUpperCase() : page.slug),
      }));

  return { main: pick("main"), more: pick("more") };
}
