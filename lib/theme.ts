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
 * Two palettes, because the site has two. Dark began as a considered inversion
 * with no way to argue with it — a warm paper so photographs do not look like
 * windows, accents lifted until they can be read rather than merely seen — and
 * those are still what you get by leaving its five fields alone. They are
 * defaults now rather than decisions somebody else made.
 */

export type Theme = {
  serif: string;
  sans: string;
  ink: string;
  paper: string;
  purple: string;
  blue: string;
  pink: string;
  /** The same five for when the paper is turned down. */
  dark_ink: string;
  dark_paper: string;
  dark_purple: string;
  dark_blue: string;
  dark_pink: string;
};

export const NOTHING_SET: Theme = {
  serif: "",
  sans: "",
  ink: "",
  paper: "",
  purple: "",
  blue: "",
  pink: "",
  dark_ink: "",
  dark_paper: "",
  dark_purple: "",
  dark_blue: "",
  dark_pink: "",
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

type Colour = { key: keyof Theme; label: string; drawn: string; note: string };

/** The five colours, with the value the site was drawn with beside each. */
export const COLOURS: Colour[] = [
  { key: "ink", label: "ink", drawn: "#000000", note: "Every word that is read." },
  { key: "paper", label: "paper", drawn: "#fffcf6", note: "Warm rather than white, on purpose." },
  { key: "purple", label: "purple", drawn: "#8b3fff", note: "The page you are on, and the mark." },
  { key: "blue", label: "blue", drawn: "#00a0e3", note: "Instagram, and the odd link." },
  { key: "pink", label: "pink", drawn: "#e82687", note: "The address, and anything gone wrong." },
];

/**
 * And the same five at night. The values are the ones in globals.css, so
 * "as drawn" here means exactly what the site does with the lights off.
 */
export const DARK_COLOURS: Colour[] = [
  { key: "dark_ink", label: "ink", drawn: "#f2ece1", note: "Warm rather than white." },
  {
    key: "dark_paper",
    label: "paper",
    drawn: "#14120f",
    note: "Not black: black behind a photograph makes it look like a window.",
  },
  {
    key: "dark_purple",
    label: "purple",
    drawn: "#b98cff",
    note: "Lifted — the light purple can be seen on this but not read.",
  },
  { key: "dark_blue", label: "blue", drawn: "#4cc4f5", note: "Lifted, for the same reason." },
  { key: "dark_pink", label: "pink", drawn: "#ff5fa5", note: "Lifted, for the same reason." },
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
    .select(
      "serif, sans, ink, paper, purple, blue, pink, dark_ink, dark_paper, dark_purple, dark_blue, dark_pink",
    )
    .maybeSingle<Theme>();

  if (error || !data) return NOTHING_SET;
  return { ...NOTHING_SET, ...data };
}

/**
 * The theme as a stylesheet, or nothing at all if nothing is set.
 *
 * The typefaces go on :root, because they are right in both lights. Each palette
 * goes on its own [data-theme], at the same weight as the blocks in globals.css
 * and printed after them — so a colour that has been set wins, and one that has
 * not is left to the stylesheet.
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

  const night = [
    theme.dark_ink && `--ink: ${theme.dark_ink};`,
    theme.dark_paper && `--paper: ${theme.dark_paper};`,
    theme.dark_purple && `--purple: ${theme.dark_purple};`,
    theme.dark_blue && `--blue: ${theme.dark_blue};`,
    theme.dark_pink && `--pink: ${theme.dark_pink};`,
  ].filter(Boolean);

  return [
    type.length ? `:root{${type.join("")}}` : "",
    paint.length ? `:root[data-theme="light"]{${paint.join("")}}` : "",
    // Same weight as the dark block in globals.css, and printed after it, so
    // this wins where it says anything and that one stands where it does not.
    night.length ? `:root[data-theme="dark"]{${night.join("")}}` : "",
  ]
    .filter(Boolean)
    .join("");
}
