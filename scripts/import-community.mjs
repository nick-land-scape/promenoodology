/**
 * Moves the community list out of a spreadsheet and into the database, with the
 * portraits.
 *
 *   node scripts/import-community.mjs ~/Downloads/community.xlsx ~/Downloads/images
 *   node scripts/import-community.mjs <xlsx> <images> --dry
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The service role is what lets this write past the policies and put files in
 * the bucket; it stays on your machine and is never needed in Vercel.
 *
 * Safe to run twice. People are matched on their name, so a second run updates
 * the row that is already there rather than making a second one — which also
 * means that renaming somebody in the spreadsheet makes a new person rather than
 * renaming the old one. Rename them in /admin instead.
 *
 * The spreadsheet is read without a library: an .xlsx is a zip of XML, and one
 * sheet of five columns is not worth a dependency.
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [, , sheetPath, imageDir, ...flags] = process.argv;
const DRY = flags.includes("--dry");

if (!sheetPath || !imageDir) {
  console.error(
    "usage: node scripts/import-community.mjs <community.xlsx> <images folder> [--dry]",
  );
  process.exit(1);
}

/* ----------------------------------------------------------------- plumbing */

/**
 * A dry run writes nothing, so it asks for nothing: reading the spreadsheet and
 * matching up the pictures is worth checking on a machine that has no keys on it
 * at all.
 */
function readEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (DRY) return { url: url ?? "http://dry.run", key: key ?? "dry-run" };

  // A key with an ellipsis in it is the example from the instructions, pasted.
  // It fails on every single upload, and the failures are the last thing you
  // see rather than the first — so it is caught here instead.
  if (key && (key.includes("\u2026") || key.includes("...") || key.length < 40)) {
    console.error(
      "That does not look like a real key:\n" +
        `  SUPABASE_SERVICE_ROLE_KEY=${key.slice(0, 14)}…\n\n` +
        "Supabase → Project Settings → API Keys → service_role → Reveal, then copy\n" +
        "the whole thing. Edit the last line of .env.local rather than adding another.",
    );
    process.exit(1);
  }

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
        "Both are in the Supabase dashboard under Project Settings → API Keys.\n" +
        "The service role one has to be revealed first, and stays on this machine.",
    );
    process.exit(1);
  }
  return { url, key };
}

/* ---------------------------------------------------------- the spreadsheet */

/** One sheet, as an array of { A: "…", B: "…" } rows. */
function readSheet(file) {
  // unzip -p writes one member of the archive to stdout. Available everywhere
  // this will be run, and it saves pulling in a zip library for two files.
  const read = (member) => execFileSync("unzip", ["-p", file, member], { maxBuffer: 1 << 26 });

  const strings = [];
  try {
    const xml = read("xl/sharedStrings.xml").toString("utf8");
    for (const si of xml.split("<si>").slice(1)) {
      strings.push(
        [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((m) => m[1])
          .join("")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'"),
      );
    }
  } catch {
    // A sheet with no shared strings keeps its text inline; handled below.
  }

  const sheet = read("xl/worksheets/sheet1.xml").toString("utf8");
  const rows = [];

  for (const row of sheet.split("<row").slice(1)) {
    const cells = {};
    for (const cell of row.split("<c ").slice(1)) {
      const ref = /r="([A-Z]+)\d+"/.exec(cell)?.[1];
      if (!ref) continue;
      const shared = /t="s"/.test(cell);
      const value = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1] ?? "";
      const inline = [...cell.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join("");
      cells[ref] = (shared ? (strings[Number(value)] ?? "") : inline || value).trim();
    }
    rows.push(cells);
  }

  return rows;
}

/**
 * Mends a name that was saved as UTF-8 and then read back as Latin-1.
 *
 * "Majoberová" is in the spreadsheet as "MajoberovÃ¡" — the two bytes of the á
 * read as two separate Western European characters. Whatever wrote the file did
 * it; the sheet is the source of truth and the source of truth is wrong.
 *
 * So it is mended here rather than by hand, because by hand it would come back
 * the next time the sheet is exported. Only when the giveaway sequences are
 * present and the round trip produces something valid — a name is not worth
 * guessing at.
 */
function mend(text) {
  if (!/[ÃÂ]|â€/.test(text)) return text;
  try {
    const again = Buffer.from(text, "latin1").toString("utf8");
    return again.includes("\uFFFD") ? text : again;
  } catch {
    return text;
  }
}

/* ------------------------------------------------------------- the pictures */

/**
 * The file the spreadsheet means, which is not always the file that is there.
 *
 * Six of the sixty-four disagreed: four saved as .jpeg where the sheet says
 * .jpg, and one where the sheet's img060 is img60 on disk. Rather than correcting
 * either by hand — and having it drift again next time — the name is looked for
 * the way a person would look for it.
 */
function findImage(dir, wanted) {
  if (!wanted) return null;
  const files = fs.readdirSync(dir);
  const stem = wanted.replace(/\.[^.]+$/, "");

  const candidates = [
    wanted,
    ...[".jpg", ".jpeg", ".png", ".webp"].map((ext) => stem + ext),
    // img060 → img60: a leading zero somebody dropped when saving.
    ...[".jpg", ".jpeg", ".png", ".webp"].map(
      (ext) => stem.replace(/^(\D+)0*(\d+)$/, "$1$2") + ext,
    ),
  ];

  for (const candidate of candidates) {
    const found = files.find((file) => file.toLowerCase() === candidate.toLowerCase());
    if (found) return found;
  }
  return null;
}

const mimeOf = (file) =>
  /\.png$/i.test(file) ? "image/png" : /\.webp$/i.test(file) ? "image/webp" : "image/jpeg";

/* -------------------------------------------------------------------- main */

const { url, key } = readEnv();
const db = createClient(url, key, { auth: { persistSession: false } });

const rows = readSheet(sheetPath);
const [header, ...body] = rows;
console.log("columns:", Object.values(header).join(", "));

const people = body
  .map((row) => ({
    first: mend(row.A ?? ""),
    last: mend(row.B ?? ""),
    country: mend(row.C ?? ""),
    image: row.D ?? "",
    colour: (row.E ?? "").toLowerCase(),
  }))
  .filter((person) => person.first || person.last);

console.log(`${people.length} people in the sheet\n`);

const COLOURS = new Set(["orange", "green", "blue"]);
const problems = [];
let added = 0;
let updated = 0;
let uploaded = 0;

/**
 * Before the loop: one cheap authenticated question, so a key that will fail on
 * all sixty-four fails once, now, with a sentence.
 */
if (!DRY) {
  const { error } = await db.from("profiles").select("id").limit(1);
  if (error) {
    console.error(
      `The database would not answer: ${error.message}\n\n` +
        "Almost always the key. Supabase → Project Settings → API Keys →\n" +
        "service_role → Reveal, and check the last line of .env.local.",
    );
    process.exit(1);
  }
}

for (const [nth, person] of people.entries()) {
  const name = [person.first, person.last].filter(Boolean).join(" ");
  // Sixty-four uploads is a slow minute. Silence for a whole minute is
  // indistinguishable from being stuck, so it says where it is.
  if (!DRY) process.stdout.write(`  ${String(nth + 1).padStart(2)}/${people.length}  ${name}`);

  /* ---- the portrait ---- */
  let photoPath = null;
  const file = findImage(imageDir, person.image);

  if (!file) {
    if (person.image) problems.push(`${name}: no file for ${person.image}`);
  } else {
    const bytes = fs.readFileSync(path.join(imageDir, file));
    // Named after what is in it, so running this again with the same picture
    // does not leave a second copy in the bucket behind the first.
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    photoPath = `community/${digest}${path.extname(file).toLowerCase()}`;

    if (!DRY) {
      const { error } = await db.storage
        .from("media")
        .upload(photoPath, bytes, { contentType: mimeOf(file), upsert: true });
      if (error) {
        problems.push(`${name}: ${error.message}`);
        photoPath = null;
      } else {
        uploaded += 1;
      }
    }
  }

  /* ---- the person ---- */
  const { data: existing } = DRY
    ? { data: null }
    : await db.from("profiles").select("id, name, photo_path").ilike("name", name).maybeSingle();

  const values = {
    name,
    country: person.country,
    colour: COLOURS.has(person.colour) ? person.colour : null,
    // They were on the public list before there was anywhere to say so.
    listed: true,
    ...(photoPath ? { photo_path: photoPath } : {}),
  };

  if (DRY) {
    console.log(
      `  ${name.padEnd(28)} ${person.country.padEnd(18)} ${file ?? "— NO PHOTO"}${
        person.colour ? `  (${person.colour})` : ""
      }`,
    );
    continue;
  }

  let said = "";
  if (existing) {
    const { error } = await db.from("profiles").update(values).eq("id", existing.id);
    if (error) {
      problems.push(`${name}: ${error.message}`);
      said = "failed";
    } else {
      updated += 1;
      said = "updated";
    }
  } else {
    const { error } = await db.from("profiles").insert(values);
    if (error) {
      problems.push(`${name}: ${error.message}`);
      said = "failed";
    } else {
      added += 1;
      said = "added";
    }
  }

  process.stdout.write(`  —  ${said}${photoPath ? " with a portrait" : ", no portrait"}\n`);
}

console.log("");
if (DRY) {
  console.log("Nothing was written — that was a dry run.");
} else {
  console.log(`${added} added, ${updated} updated, ${uploaded} portraits in the bucket.`);
}

if (problems.length > 0) {
  console.log(`\n${problems.length} to look at:`);
  for (const problem of problems) console.log(`  ${problem}`);
}

console.log(
  "\nNobody imported here has an account: they are people on the community page,\n" +
    "not logins. /admin → people is where to invite any of them.",
);
