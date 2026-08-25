import fs from "node:fs";
import path from "node:path";
import type { ClubEvent, NewsItem, Photo, Post } from "./content";
import { readRows } from "./data";
import { slugify } from "./admin/slug";
import { imageSize } from "./image-size";
import { PLAIN, type Lang } from "@/lib/lang";

/**
 * Content for the members' app. Same idea as the website: plain CSV files in
 * /data, read at build time. The last column of each file may contain commas —
 * everything after the last fixed column is treated as one piece of text.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * When a thing is, in one line: "Sat 22 Aug, 19:00–23:00" — or "22–24 Aug" for
 * something that runs over days.
 *
 * One function because every screen was writing its own version out of date,
 * time and place, and each of them had a different idea about which parts to
 * leave out when they were missing. The back of the house now keeps a last day
 * and a finishing time, and neither was reaching the app at all.
 */
export function whenItIs(
  event: {
    date: string;
    until?: string;
    time?: string;
    endTime?: string;
    place?: string;
  },
  lang: Lang = PLAIN,
): string {
  const first = shortDate(event.date, lang);
  const spread = Boolean(event.until) && event.until !== event.date;
  const day = spread
    ? `${first} – ${shortDate(event.until as string, lang)}`
    : `${weekday(event.date, lang)} ${first}`;

  /* The two times belong to the same day, or they belong to nothing.
   *
   * An evening that runs from the 22nd of August to the 20th of September starts
   * at three on the first day and finishes at one on the last, and pairing those
   * with a dash produced "15:00–13:00" — an evening that ends two hours before it
   * begins. Across several days the hours are the programme's business, one line
   * per day, and this line has already said which days they are. */
  const hours = spread ? "" : [event.time, event.endTime].filter(Boolean).join("–");
  return [day, hours, event.place].filter(Boolean).join(" · ");
}

export function getEvents(): ClubEvent[] {
  const [, ...rows] = readRows("events.csv");
  return rows
    .map((columns) => {
      const [date, time, title, place, spots, photo, ...note] = columns;
      return {
        id: `${date}-${title}`,
        slug: slugify(`${title}-${date}`),
        date,
        // The file the site shipped with knows about one day and one time; the
        // rest are things only the database keeps.
        until: "",
        time: time ?? "",
        endTime: "",
        title: title ?? "",
        place: place ?? "",
        spots: Number(spots) || 0,
        note: note.join(", "),
        photo: resourcePhoto(photo),
        partners: [],
        needs: "",
        fed: null,
        asked: 0,
        story: null,
        // Everything a flyer says beyond a name and a day is something only the
        // database keeps; the file the site shipped with never had it.
        subtitle: "",
        lead: "",
        address: "",
        cost: "",
        signUpEmail: "",
        partOf: "",
        partOfUrl: "",
        days: [],
        flyer: null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getNews(): NewsItem[] {
  const [, ...rows] = readRows("news.csv");
  return rows
    .map(([date, title, ...text]) => ({
      date: date ?? "",
      title: title ?? "",
      text: text.join(", "),
      // The files know nothing about authors or pinning: a copy of the site
      // without a database simply has neither.
      by: [],
      pinned: false,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPosts(): Post[] {
  const [, ...rows] = readRows("posts.csv");
  return rows.map((columns) => {
    /* The file still has its likes and replies columns and they are read past:
       there are no likes any more, and a reply is a row in a table now rather
       than a number somebody typed into a spreadsheet. */
    const [author, place, when, , , photo, ...text] = columns;
    const picture = resourcePhoto(photo);
    return {
      id: `${author}-${when}`,
      author: author ?? "",
      // A copy of the site without a database has no portraits either.
      authorPhoto: null,
      authorId: "",
      place: place ?? "",
      when: when ?? "",
      text: text.join(", "),
      photos: picture ? [picture] : [],
      replies: [],
    };
  });
}

/** Turns a file name from /public/resources into a photo with its real size. */
function resourcePhoto(file: string | undefined): Photo | null {
  if (!file) return null;
  const src = `/resources/${file}`;
  const absolute = path.join(PUBLIC_DIR, src);
  if (!fs.existsSync(absolute)) return null;
  return { src, ...imageSize(absolute) };
}

/* Dates are read in UTC on purpose: a date in a CSV is a day, not a moment,
   and no time zone should be able to shift it. */

/*
 * The names of the months and the days, in the language they are being read in.
 *
 * They were two arrays of English, which is how a French member came to be told
 * their evening was on "Saturday 22 Aug". Nobody should be keeping a list of the
 * twelve months in two languages when every runtime already has one, so these ask
 * for it — in UTC, because a date here is a calendar day rather than a moment,
 * and letting the phone's own zone at it moves the evening a day either way.
 */
function named(iso: string, lang: Lang, how: Intl.DateTimeFormatOptions): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(lang === "fr" ? "fr-CH" : "en-GB", {
    ...how,
    timeZone: "UTC",
  });
}

/** "22 Aug", "5 Sep" — short and unambiguous. */
export function shortDate(iso: string, lang: Lang = PLAIN) {
  return named(iso, lang, { day: "numeric", month: "short" }) || iso;
}

export function weekday(iso: string, lang: Lang = PLAIN) {
  return named(iso, lang, { weekday: "long" });
}

/** Day and month split up, for the little date block on an event card. */
export function dateParts(iso: string, lang: Lang = PLAIN) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return { day: iso, month: "" };
  return {
    day: String(date.getUTCDate()),
    month: named(iso, lang, { month: "short" }).replace(".", "").toLowerCase(),
  };
}
