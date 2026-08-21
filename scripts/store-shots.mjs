/**
 * The screenshots the App Store asks for, taken of the real app.
 *
 *   node scripts/store-shots.mjs
 *
 * Not a mockup and not a device frame: the actual screens, at the actual pixel
 * sizes Apple requires, signed in as a real member so there is something on them.
 *
 * How it signs in: it asks Supabase for a one-time link for one account and opens
 * it in a throwaway Chrome profile. Nothing is typed, no password exists, and the
 * profile is deleted at the end — this is the same trick the review sign-in uses,
 * for the same reason.
 *
 * The sizes are the two Apple currently accepts:
 *   iPhone 6.9"  1320 × 2868  (440 × 956 points at 3×)
 *   iPad 13"     2064 × 2752  (1032 × 1376 points at 2×)
 *
 * Chrome is given a virtual time budget so the opening curtain has finished
 * playing before the shutter — otherwise every screenshot is the same logo.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SITE = process.env.SHOT_SITE ?? "https://www.promenoodology.com";
const OUT = process.env.SHOT_OUT ?? path.join(process.env.HOME ?? ".", "Desktop/promeNOODology app store");
const PROFILE = "/tmp/promenood-shots";

/* Which screens, and what each one is for. The order is the order they should be
   uploaded in: the first is the one most people will ever see. */
const SCREENS = [
  { at: "/app", name: "1-whats-coming-up" },
  { at: "/app/events", name: "2-say-you-are-coming" },
  { at: "/app/read", name: "3-what-we-have-done" },
  { at: "/app/connect", name: "4-what-everyone-is-up-to" },
  { at: "/app/account", name: "5-your-membership" },
];

const SIZES = [
  { name: "iphone-6.9", w: 440, h: 956, scale: 3 },
  { name: "ipad-13", w: 1032, h: 1376, scale: 2 },
];

function env() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }),
  );
}

const keys = env();
const url = keys.NEXT_PUBLIC_SUPABASE_URL;
const service = keys.SUPABASE_SERVICE_ROLE_KEY;
const who = process.env.SHOT_AS ?? "me@marvin-lehmann.de";

if (!url || !service) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

/** A one-time link, so the throwaway browser is signed in as somebody real. */
async function wayIn() {
  const answer = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email: who }),
  });
  if (!answer.ok) throw new Error(`No link for ${who}: ${answer.status} ${await answer.text()}`);
  const made = await answer.json();
  return `${SITE}/account/confirm?token_hash=${made.hashed_token}&type=magiclink&next=/app`;
}

function chrome(args) {
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${PROFILE}`, ...args], {
    stdio: "pipe",
    timeout: 90_000,
  });
}

rmSync(PROFILE, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log(`Signing a throwaway browser in as ${who}…`);
const door = await wayIn();
// The first visit trades the link for a session cookie in the profile.
chrome(["--window-size=440,956", "--virtual-time-budget=9000", `--screenshot=${PROFILE}/door.png`, door]);

for (const size of SIZES) {
  for (const screen of SCREENS) {
    const file = path.join(OUT, `${size.name}-${screen.name}.png`);
    chrome([
      `--window-size=${size.w},${size.h}`,
      `--force-device-scale-factor=${size.scale}`,
      // Long enough for the opening curtain to finish and the pictures to land.
      "--virtual-time-budget=9000",
      `--screenshot=${file}`,
      `${SITE}${screen.at}`,
    ]);
    console.log(`  ${path.basename(file)}`);
  }
}

rmSync(PROFILE, { recursive: true, force: true });
console.log(`\nIn ${OUT}`);
