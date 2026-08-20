import fs from "node:fs";
import path from "node:path";
import type { Donation, Member, Photo, Quote, Resource } from "./content";
import { imageSize } from "./image-size";

/**
 * Content lives in two CSV files under /data so it can be edited in Excel,
 * Numbers or a text editor. They are read once at build time and baked into
 * static HTML — no fetching or CSV parsing happens in the browser.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const PUBLIC_DIR = path.join(process.cwd(), "public");

export function readRows(file: string): string[][] {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  return raw
    .replace(/^﻿/, "") // strip the byte-order mark Excel likes to add
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

export function getMembers(): Member[] {
  const [, ...rows] = readRows("community.csv"); // first row is the header
  return rows.map(([first, last, country, image, special, project]) => ({
    name: [first, last].filter(Boolean).join(" "),
    first: first ?? "",
    last: last ?? "",
    country: country ?? "",
    project: project ?? "",
    color: special || null,
    photo: photo(`/community/${image}`, image),
  }));
}

export function getResources(): Resource[] {
  return readRows("resources.csv")
    .map(([file, credit, year, event]) => {
      const image = photo(`/resources/${file}`, file);
      if (!image) return null;
      // The files know nothing about layouts — that is a decision made in the
      // back of the house, so from here it is always "let the page decide".
      const row: Resource = {
        file,
        credit: credit ?? "",
        year: year ?? "",
        event: event || null,
        photo: image,
        layout: null,
      };
      return row;
    })
    .filter((row): row is Resource => row !== null);
}

/**
 * Things people said. The text is the last column, so it may contain commas.
 * A portrait is attached when the person is in the community list.
 */
export function getQuotes(): Quote[] {
  const portraits = portraitsByName();
  const [, ...rows] = readRows("quotes.csv");
  return rows.map((columns, index) => {
    const [who, where, year, story, ...text] = columns;
    return {
      id: `${who}-${index}`,
      who: who ?? "",
      where: where ?? "",
      year: year ?? "",
      story: story || null,
      text: text.join(", "),
      photo: portraits.get((who ?? "").toLowerCase()) ?? null,
    };
  });
}

/**
 * The donation wall. Individual gifts only — deliberately no total, because the
 * point is who turned up, not how much was raised. An empty name means the
 * donor would rather stay anonymous.
 */
export function getDonations(): Donation[] {
  const portraits = portraitsByName();
  const [, ...rows] = readRows("donations.csv");
  return rows
    .map((columns, index) => {
      const [who, when, amount, ...note] = columns;
      return {
        id: `${when}-${index}`,
        who: who ?? "",
        when: when ?? "",
        amount: amount ?? "",
        note: note.join(", "),
        photo: who ? portraits.get(who.toLowerCase()) ?? null : null,
      };
    })
    .sort((a, b) => b.when.localeCompare(a.when));
}

/** name (lower case) -> portrait, so quotes and donations can show a face. */
function portraitsByName() {
  return new Map(
    getMembers()
      .filter((member) => member.photo)
      .map((member) => [member.name.toLowerCase(), member.photo!]),
  );
}

/** Every event and year that actually has photos. */
export function getFilters(resources: Resource[]) {
  const events: string[] = [];
  const years: string[] = [];
  for (const item of resources) {
    if (item.event && !events.includes(item.event)) events.push(item.event);
    if (item.year && !years.includes(item.year)) years.push(item.year);
  }
  return { events, years: years.sort() };
}

function photo(src: string, file: string | undefined): Photo | null {
  if (!file) return null; // a row without a photo is fine — the name still shows
  const absolute = path.join(PUBLIC_DIR, src);
  if (!fs.existsSync(absolute)) return null;
  return { src, ...imageSize(absolute) };
}
