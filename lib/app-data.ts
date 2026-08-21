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

export function getEvents(): ClubEvent[] {
  const [, ...rows] = readRows("events.csv");
  return rows
    .map((columns) => {
      const [date, time, title, place, spots, photo, ...note] = columns;
      return {
        id: `${date}-${title}`,
        date,
        time: time ?? "",
        title: title ?? "",
        place: place ?? "",
        spots: Number(spots) || 0,
        note: note.join(", "),
        photo: resourcePhoto(photo),
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
