import { supabasePublic } from "@/lib/supabase/public";
import { hasSupabase } from "@/lib/supabase/config";

/**
 * What the site is made of.
 *
 * Two typefaces and five colours, held in one row, and every one of them
 * optional: an empty value means "whatever the stylesheet already says". That is
 * the whole design of this feature. Nothing is overridden until somebody
 * overrides it, so the site keeps the look it was drawn with, and emptying a
 * field puts that look back rather than leaving a hole.
 *
 * Only the light palette is here. Dark is not a set of numbers anybody should be
 * typing — it is a considered inversion, with a warm paper so photographs do not
 * look like windows and lifted accents so purple can be read rather than merely
 * seen. Changing the light purple lifts the dark one with it; typing a dark
 * palette by hand would mean getting all of that right twice.
 */

export type Theme = {
  serif: string;
  sans: string;
  ink: string;
  paper: string;
  purple: string;
  blue: string;
  pink: string;
};

export const NOTHING_SET: Theme = {
  serif: "",
  sans: "",
  ink: "",
  paper: "",
  purple: "",
  blue: "",
  pink: "",
};

/**
 * The typefaces on offer.
 *
 * Stacks rather than one name, and only families that are already on the machine
 * reading the page. A web font would mean a request before the first word can be
 * drawn, and this site is words — so the choice here is between the good
 * typefaces everybody already has, not between everything on Google Fonts.
 */
export const FONTS = {
  serif: [
    { value: "", label: "Times — as drawn", stack: 'Times, "Times New Roman", Georgia, serif' },
    { value: 'Georgia, "Times New Roman", serif', label: "Georgia — wider, warmer" },
    {
      value: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
      label: "Palatino — older, quieter",
    },
    {
      value: '"Baskerville", "Libre Baskerville", Georgia, serif',
      label: "Baskerville — sharper",
    },
    { value: "ui-serif, Georgia, serif", label: "whatever the machine calls a serif" },
  ],
  sans: [
    {
      value: "",
      label: "Gotham, then Helvetica — as drawn",
      stack: 'Gotham, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    {
      value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      label: "Helvetica — no Gotham first",
    },
    {
      value: 'Avenir, "Avenir Next", "Century Gothic", sans-serif',
      label: "Avenir — rounder",
    },
    {
      value: '"Arial Narrow", "Helvetica Neue Condensed", sans-serif',
      label: "Arial Narrow — tighter",
    },
    {
      value: "ui-sans-serif, system-ui, sans-serif",
      label: "whatever the machine calls a sans",
    },
  ],
} as const;

/** The five colours, with the value the site was drawn with beside each. */
export const COLOURS: { key: keyof Theme; label: string; drawn: string; note: string }[] = [
  { key: "ink", label: "ink", drawn: "#000000", note: "Every word that is read." },
  { key: "paper", label: "paper", drawn: "#fffcf6", note: "Warm rather than white, on purpose." },
  { key: "purple", label: "purple", drawn: "#8b3fff", note: "The page you are on, and the mark." },
  { key: "blue", label: "blue", drawn: "#00a0e3", note: "Instagram, and the odd link." },
  { key: "pink", label: "pink", drawn: "#e82687", note: "The address, and anything gone wrong." },
];

/**
 * Read the one row.
 *
 * A missing table is the same answer as an unchanged one: nothing is set, so the
 * stylesheet stands. That matters because this ships before the migration is
 * run — the site should not go blank waiting for somebody to paste some SQL.
 */
export async function getTheme(): Promise<Theme> {
  if (!hasSupabase()) return NOTHING_SET;

  const { data, error } = await supabasePublic()
    .from("theme")
    .select("serif, sans, ink, paper, purple, blue, pink")
    .maybeSingle<Theme>();

  if (error || !data) return NOTHING_SET;
  return { ...NOTHING_SET, ...data };
}

/**
 * The theme as a stylesheet, or nothing at all if nothing is set.
 *
 * The typefaces go on :root, because they are right in both lights. The colours
 * go on the light one only, and are written with the same specificity as the
 * dark block in globals.css so that neither can quietly beat the other — they
 * simply never both match.
 */
export function themeAsCss(theme: Theme): string {
  const type = [
    theme.serif && `--serif: ${theme.serif};`,
    theme.sans && `--sans: ${theme.sans};`,
  ].filter(Boolean);

  const paint = [
    theme.ink && `--ink: ${theme.ink};`,
    theme.paper && `--paper: ${theme.paper};`,
    theme.purple && `--purple: ${theme.purple};`,
    theme.blue && `--blue: ${theme.blue};`,
    theme.pink && `--pink: ${theme.pink};`,
  ].filter(Boolean);

  return [
    type.length ? `:root{${type.join("")}}` : "",
    paint.length ? `:root[data-theme="light"]{${paint.join("")}}` : "",
  ]
    .filter(Boolean)
    .join("");
}
