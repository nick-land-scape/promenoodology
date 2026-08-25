"use client";

import { createContext, useContext } from "react";
import { PLAIN, type Lang } from "@/lib/lang";
import type { Said } from "@/lib/words";

/**
 * The app's own words, in the language the member reads us in.
 *
 * Resolved on the server by the layout — which is the only place that knows the
 * language without asking — and put here so any screen can read it without being
 * handed strings by whatever drew it. A tab bar four components deep should not
 * need its parent to know it says "what's on".
 *
 * The fallback is the key itself, which is the same thing `speaking` does: a
 * screen that asks for a phrase nobody has written shows "tab.whatsOn" rather
 * than nothing, which is wrong in a way somebody notices.
 */
const Said = createContext<{ lang: Lang; words: Record<string, string>; you: string }>({
  lang: PLAIN,
  words: {},
  you: "",
});

export function Words({
  lang,
  words,
  you = "",
  children,
}: {
  lang: Lang;
  words: Record<string, string>;
  /** What to call the member reading this. See useYou(). */
  you?: string;
  children: React.ReactNode;
}) {
  return <Said.Provider value={{ lang, words, you }}>{children}</Said.Provider>;
}

/** What this screen says, in the language it is being read in. */
export function useSay(): Said {
  const { words } = useContext(Said);
  return (key: string) => words[key] ?? key;
}

/**
 * The language itself, for the things a phrase book cannot hold.
 *
 * A month's name, a weekday, a number with its thousands marked — those are
 * `toLocaleDateString` and `toLocaleString`, and what they need is a locale
 * rather than a translated string. Nobody should be writing out the twelve
 * months of the year in a list we then have to keep.
 */
export function useReading(): Lang {
  return useContext(Said).lang;
}

/** The locale to format a date or a number in. */
export function localeOf(lang: Lang): string {
  return lang === "fr" ? "fr-CH" : "en-GB";
}

/**
 * Your own first name, for the one sentence in this app that uses it.
 *
 * In here with the words rather than in a context of its own, because that is
 * what it is: the front screen says hello, and saying hello to somebody needs
 * their name in the same way it needs the language. The layout knows both, at the
 * same moment, from the same read.
 *
 * It is here at all so that the waiting screen can say "hello, Marvin" rather than
 * "hello" — a greeting that arrives in two instalments is a greeting that is
 * watched rather than read. Empty for anybody not signed in.
 */
export function useYou(): string {
  return useContext(Said).you;
}
