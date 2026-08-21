import fs from "node:fs";
import path from "node:path";
import type { ClubEvent, NewsItem, Photo, Post } from "./content";
import { readRows } from "./data";
import { imageSize } from "./image-size";

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
export function whenItIs(event: {
  date: string;
  until?: string;
  time?: string;
  endTime?: string;
  place?: string;
}): string {
  const first = shortDate(event.date);
  const day = event.until ? `${first} – ${shortDate(event.until)}` : `${weekday(event.date)} ${first}`;
  const hours = [event.time, event.endTime].filter(Boolean).join("–");
  return [day, hours, event.place].filter(Boolean).join(" · ");
}

export function getEvents(): ClubEvent[] {
  const [, ...rows] = readRows("events.csv");
  return rows
    .map((columns) => {
      const [date, time, title, place, spots, photo, ...note] = columns;
      return {
        id: `${date}-${title}`,
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
        asked: 0,
        story: null,
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
    const [author, place, when, likes, replies, photo, ...text] = columns;
    return {
      id: `${author}-${when}`,
      author: author ?? "",
      place: place ?? "",
      when: when ?? "",
      likes: Number(likes) || 0,
      replies: Number(replies) || 0,
      text: text.join(", "),
      photo: resourcePhoto(photo),
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "22 Aug", "5 Sep" — short and unambiguous. */
export function shortDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function weekday(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return DAYS[date.getUTCDay()];
}

/** Day and month split up, for the little date block on an event card. */
export function dateParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return { day: iso, month: "" };
  return { day: String(date.getUTCDate()), month: MONTHS[date.getUTCMonth()].toLowerCase() };
}
