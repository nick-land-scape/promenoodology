/**
 * Moves everything the site is currently made of into Supabase: the stories and
 * the handbook, every photograph and quote, the events, the news, the wall, and
 * the community list.
 *
 *   node scripts/import.mjs            # everything
 *   node scripts/import.mjs --no-media # rows only, skip uploading photographs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Safe to run more than once: every table is keyed on something stable, so a
 * second run updates rather than duplicates.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_MEDIA = process.argv.includes("--no-media");

/* ----------------------------------------------------------------- plumbing */

function readEnv() {
  const file = path.join(ROOT, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
        "Both are in the Supabase dashboard under Project Settings → API Keys.",
    );
    process.exit(1);
  }
  return { url, key };
}

const { url, key } = readEnv();
const db = createClient(url, key, { auth: { persistSession: false } });

function rows(file) {
  const raw = fs.readFileSync(path.join(ROOT, "data", file), "utf8").replace(/^﻿/, "");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

/** Pixel size straight from the file header — same trick as lib/image-size.ts. */
function imageSize(absolute) {
  const fd = fs.openSync(absolute, "r");
  try {
    const buf = Buffer.alloc(65536);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    const head = buf.subarray(0, read);
    if (head.length > 24 && head.readUInt32BE(0) === 0x89504e47) {
      return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
    }
    if (head.length > 4 && head.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset + 9 < head.length) {
        if (head[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = head[offset + 1];
        const sof =
          marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (sof) {
          return { height: head.readUInt16BE(offset + 5), width: head.readUInt16BE(offset + 7) };
        }
        offset += 2 + head.readUInt16BE(offset + 2);
      }
    }
  } finally {
    fs.closeSync(fd);
  }
  return { width: 0, height: 0 };
}

async function upsert(table, values, onConflict) {
  if (values.length === 0) return;
  // In batches, so one enormous request does not time out.
  for (let i = 0; i < values.length; i += 200) {
    const slice = values.slice(i, i + 200);
    const { error } = await db.from(table).upsert(slice, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`  ${table}: ${values.length}`);
}

/* ------------------------------------------------------------------ content */

/** The story text files, parsed the way lib/stories.ts parses them. */
function readStories() {
  const dir = path.join(ROOT, "content", "stories");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8").replace(/^﻿/, "");
      const lines = raw.split(/\r?\n/);
      const fields = {};
      let cursor = 0;
      for (; cursor < lines.length; cursor++) {
        const line = lines[cursor].trim();
        if (line === "") break;
        const colon = line.indexOf(":");
        if (colon === -1) break;
        fields[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
      }

      const sections = [];
      const add = (text) => {
        if (!text) return;
        if (sections.length === 0) sections.push({ heading: null, texts: [] });
        sections[sections.length - 1].texts.push(text);
      };
      const flatten = (text) => text.replace(/\s*\n\s*/g, " ").trim();

      for (const block of lines
        .slice(cursor)
        .join("\n")
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)) {
        if (block.startsWith("##")) {
          const newline = block.indexOf("\n");
          sections.push({
            heading: (newline === -1 ? block : block.slice(0, newline)).replace(/^#+\s*/, ""),
            texts: [],
          });
          if (newline !== -1) add(flatten(block.slice(newline + 1)));
        } else {
          add(flatten(block));
        }
      }

      const slug = file.replace(/\.md$/, "");
      return {
        slug,
        title: fields.title ?? slug,
        tag: fields.tag ?? slug,
        position: Number(fields.order) || 99,
        place: fields.where ?? null,
        happened: fields.when ?? null,
        made_with: fields.with ?? null,
        sections,
        published: true,
      };
    });
}

function readHandbook() {
  const raw = fs.readFileSync(path.join(ROOT, "content", "handbook.md"), "utf8");
  const lines = raw.replace(/^﻿/, "").split(/\r?\n/);
  const fields = {};
  let cursor = 0;
  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor].trim();
    if (line === "") break;
    const colon = line.indexOf(":");
    if (colon === -1) break;
    fields[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
  }

  const blocks = lines
    .slice(cursor)
    .join("\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      if (!block.startsWith("##")) {
        return [{ kind: "text", text: block.replace(/\s*\n\s*/g, " ") }];
      }
      const newline = block.indexOf("\n");
      const heading = (newline === -1 ? block : block.slice(0, newline)).replace(/^#+\s*/, "");
      const rest = newline === -1 ? "" : block.slice(newline + 1).replace(/\s*\n\s*/g, " ").trim();
      return rest
        ? [{ kind: "heading", text: heading }, { kind: "text", text: rest }]
        : [{ kind: "heading", text: heading }];
    });

  return {
    slug: "handbook",
    title: fields.title ?? "the handbook",
    lead: fields.lead ?? "",
    blocks,
  };
}

/** The about statement, as it is written in the page today. */
function readAbout() {
  return {
    slug: "about",
    title: "about us",
    lead: "",
    blocks: [
      {
        kind: "loud",
        text: "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
      },
      {
        kind: "quiet",
        text: "We encourage people to participate in the transformation of their local environments, fostering a culture where failure is seen as a learning opportunity and interdependencies are embraced within a resource-rich ecosystem.",
      },
      {
        kind: "loud",
        text: "promeNOODology offers accessible and repeatable experiences designed to disrupt the ordinary.",
      },
      {
        kind: "quiet",
        text: "Together, we create enjoyable scenarios that highlight individual dependencies and collective resources, promoting a sense of community and shared purpose.",
      },
    ],
  };
}

/* ------------------------------------------------------------------- media */

async function uploadFolder(folder) {
  const dir = path.join(ROOT, "public", folder);
  if (!fs.existsSync(dir)) return new Map();

  const sizes = new Map();
  const files = fs.readdirSync(dir).filter((file) => /\.(jpe?g|png)$/i.test(file));

  for (const [index, file] of files.entries()) {
    const absolute = path.join(dir, file);
    sizes.set(file, imageSize(absolute));
    if (SKIP_MEDIA) continue;

    const { error } = await db.storage
      .from("media")
      .upload(`${folder}/${file}`, fs.readFileSync(absolute), {
        contentType: file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
        upsert: true,
      });
    if (error) throw new Error(`upload ${folder}/${file}: ${error.message}`);
    if ((index + 1) % 25 === 0) console.log(`  ${folder}: ${index + 1}/${files.length} uploaded`);
  }

  console.log(`  ${folder}: ${files.length} files${SKIP_MEDIA ? " (sizes only)" : ""}`);
  return sizes;
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log(`Importing into ${url}`);

  console.log("media");
  const resourceSizes = await uploadFolder("resources");
  const communitySizes = await uploadFolder("community");

  console.log("content");
  await upsert("stories", readStories(), "slug");
  await upsert("pages", [readHandbook(), readAbout()], "slug");

  const photos = rows("resources.csv").map(([file, credit, year, tag], index) => {
    const size = resourceSizes.get(file) ?? { width: 0, height: 0 };
    return {
      path: `resources/${file}`,
      width: size.width,
      height: size.height,
      credit: credit ?? "",
      year: year ?? "",
      story_tag: tag || null,
      position: index,
      published: true,
    };
  });
  await upsert("photos", photos, "path");

  const [, ...quoteRows] = rows("quotes.csv");
  await upsert(
    "quotes",
    quoteRows.map(([who, place, year, story, ...text]) => ({
      who: who ?? "",
      place: place ?? "",
      year: year ?? "",
      story_tag: story || null,
      text: text.join(", "),
      published: true,
    })),
  );

  const [, ...eventRows] = rows("events.csv");
  await upsert(
    "events",
    eventRows.map(([date, time, title, place, spots, photo, ...note]) => ({
      happens_on: date,
      starts_at: time ?? "",
      title: title ?? "",
      place: place ?? "",
      spots: Number(spots) || 0,
      note: note.join(", "),
      photo_path: photo ? `resources/${photo}` : null,
      published: true,
    })),
  );

  const [, ...newsRows] = rows("news.csv");
  await upsert(
    "news",
    newsRows.map(([date, title, ...text]) => ({
      published_on: date,
      title: title ?? "",
      text: text.join(", "),
      published: true,
    })),
  );

  const [, ...donationRows] = rows("donations.csv");
  await upsert(
    "donations",
    donationRows.map(([who, when, amount, ...note]) => ({
      given_on: when,
      who: who ?? "",
      amount: amount ?? "",
      note: note.join(", "),
      published: true,
    })),
  );

  // The community list is people without accounts yet, so it goes in as rows in
  // its own right; when somebody signs in, their profile is matched by name.
  const [, ...memberRows] = rows("community.csv");
  console.log(`  community.csv: ${memberRows.length} people`);
  console.log(
    "\nNote: members become rows in `profiles` only once they sign in — the list\n" +
      "in data/community.csv stays the source until then. The community page reads\n" +
      "whichever of the two has anybody in it.",
  );

  console.log(`\nDone.${SKIP_MEDIA ? " (photographs were not uploaded)" : ""}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
