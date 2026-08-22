/**
 * The bin: what is in it, and for how long.
 *
 * One list of what can be binned, so that a section added later is one entry
 * here rather than a page of its own — the same trade the four list-shaped
 * tables already make in lib/admin/tables.ts.
 */

export const DAYS_IN_THE_BIN = 30;

export type Binnable = {
  table:
    | "stories"
    | "photos"
    | "quotes"
    | "news"
    | "events"
    | "donations"
    | "associations"
    | "hero_videos"
    | "sheets";
  /** The heading it belongs under in the back of the house. */
  section: string;
  /** Where its section lives, for the link back. */
  href: string;
  /** "a story", for the sentences. */
  one: string;
  /** Which column reads as the row's name. */
  title: string;
  /** A second line, where there is something worth saying. */
  meta?: string;
  /**
   * The columns holding a path in the bucket, for anything with files of its own.
   *
   * More than one because a film has two: itself, and the still made from its
   * first frame. Both go when it does — a poster nothing points at is a bill like
   * any other file.
   */
  files?: string[];
  /**
   * Which of them can be drawn as a thumbnail, where that is not the first.
   *
   * An mp4 in an <img> is a blank square, so a film shows its poster.
   */
  picture?: string;
};

export const BINNABLE: Binnable[] = [
  { table: "stories", section: "stories", href: "/admin/stories", one: "a story", title: "title", meta: "place" },
  {
    table: "photos",
    section: "the archive",
    href: "/admin/photos",
    one: "a photograph",
    title: "credit",
    meta: "year",
    files: ["path"],
  },
  { table: "quotes", section: "quotes", href: "/admin/quotes", one: "a quote", title: "text", meta: "who" },
  { table: "news", section: "news", href: "/admin/news", one: "a note", title: "title", meta: "published_on" },
  { table: "events", section: "events", href: "/admin/events", one: "an event", title: "title", meta: "happens_on" },
  {
    table: "sheets",
    section: "do it yourself",
    href: "/admin/do-it-yourself",
    one: "a sheet",
    title: "title",
    meta: "slug",
  },
  {
    table: "donations",
    section: "the wall",
    href: "/admin/donations",
    one: "a gift",
    title: "who",
    meta: "amount",
  },
  {
    table: "associations",
    section: "partners",
    href: "/admin/associations",
    one: "a partner",
    title: "name",
    files: ["logo_path"],
  },
  {
    table: "hero_videos",
    section: "the front page",
    href: "/admin/home",
    one: "a film",
    title: "called",
    /* No second line: the only column left is how many seconds it runs, and
       "6" on its own under a name says nothing. */
    files: ["path", "poster_path"],
    picture: "poster_path",
  },
];

export const binnable = (table: string) => BINNABLE.find((one) => one.table === table);

/** How long something has left, in whole days. Never below zero. */
export function daysLeft(deletedAt: string): number {
  const gone = new Date(deletedAt).getTime();
  const due = gone + DAYS_IN_THE_BIN * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((due - Date.now()) / (24 * 60 * 60 * 1000)));
}
