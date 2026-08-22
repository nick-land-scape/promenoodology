/**
 * Two languages, said out loud.
 *
 * English is what the site was written in and stays the address without a
 * prefix: promenoodology.com/events. French lives one segment in,
 * promenoodology.com/fr/events, so a French page is a thing that can be linked
 * to, shared and indexed as French rather than a state the browser happens to be
 * in.
 *
 * Not a general internationalisation system. Two languages named in a constant,
 * because that is what is actually needed — a third would be one more entry here
 * and one more column in the database, which is a better trade than a framework
 * nobody can read a query out of.
 */

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];

/** The one with no prefix. */
export const PLAIN: Lang = "en";

export function isLang(what: string | undefined): what is Lang {
  return what === "en" || what === "fr";
}

/** What a language is called, in itself. */
export const NAMED: Record<Lang, string> = { en: "English", fr: "Français" };

/**
 * An address, in a language.
 *
 * English keeps the plain path; French gets the prefix. Every link on the site
 * goes through this, because a French page whose links quietly go back to
 * English is a language switch that undoes itself on the first click.
 */
export function at(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === PLAIN) return clean;
  return clean === "/" ? "/fr" : `/fr${clean}`;
}

/** The other one, for the switcher. */
export function otherwise(lang: Lang): Lang {
  return lang === "en" ? "fr" : "en";
}

/** The path with any language prefix taken off. */
export function plainly(pathname: string): string {
  for (const lang of LANGS) {
    if (lang === PLAIN) continue;
    if (pathname === `/${lang}`) return "/";
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1);
  }
  return pathname;
}

/**
 * The French of one field, or the English where nobody has written any.
 *
 * The `fr` column holds whatever has been translated, keyed by the column it is
 * the French of. A key that is not there has not been translated — which is not
 * the same as translated to nothing — so the English stands in its place and the
 * page is never half empty.
 */
export function say<T>(
  fr: unknown,
  key: string,
  lang: Lang,
  english: T,
): T {
  if (lang === PLAIN) return english;
  if (!fr || typeof fr !== "object") return english;

  const said = (fr as Record<string, unknown>)[key];
  if (said === undefined || said === null) return english;
  // An empty string in the French is somebody clearing a field, and clearing a
  // field is a decision. An empty *array* is not: nobody sets one on purpose.
  if (Array.isArray(said) && said.length === 0) return english;
  return said as T;
}
