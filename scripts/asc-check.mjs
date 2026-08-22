/**
 * Does the key work, and is there an app for it to upload to?
 *
 *   ASC_KEY_ID=… ASC_ISSUER_ID=… node scripts/asc-check.mjs
 *
 * Asked before archiving rather than after, because an archive is twenty minutes
 * and the two ways this fails are both instant to check: a key that has not been
 * granted the right role, and — much more likely the first time — an app record
 * that does not exist yet in App Store Connect. Apple's answer to the second is
 * an upload that fails at the very last step with "no suitable application
 * record", which is a long way to walk for a form nobody filled in.
 *
 * The .p8 is read, used to sign a token that lasts twenty minutes, and never
 * printed. Same ES256 signing as scripts/apple-secret.mjs, and the same one thing
 * to get right: `dsaEncoding: "ieee-p1363"`.
 */

import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY = process.env.ASC_KEY_ID;
const ISSUER = process.env.ASC_ISSUER_ID;
const BUNDLE = process.env.ASC_BUNDLE_ID ?? "com.promenoodology.community";

if (!KEY || !ISSUER) {
  console.error("ASC_KEY_ID and ASC_ISSUER_ID are both needed. See scripts/ship-ios.sh.");
  process.exit(1);
}

const where = join(homedir(), ".appstoreconnect", "private_keys", `AuthKey_${KEY}.p8`);

let key;
try {
  key = createPrivateKey(readFileSync(where, "utf8"));
} catch (error) {
  console.error(
    `No usable key at ${where} (${error.message}).\n` +
      "It downloads once from App Store Connect and belongs in that folder under that exact name.",
  );
  process.exit(1);
}

const base64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const now = Math.floor(Date.now() / 1000);
const head = base64url(JSON.stringify({ alg: "ES256", kid: KEY, typ: "JWT" }));
const body = base64url(
  JSON.stringify({
    iss: ISSUER,
    iat: now,
    // Apple refuses anything longer than twenty minutes for this API.
    exp: now + 1200,
    aud: "appstoreconnect-v1",
  }),
);
const sign = createSign("SHA256");
sign.update(`${head}.${body}`);
const token = `${head}.${body}.${base64url(sign.sign({ key, dsaEncoding: "ieee-p1363" }))}`;

const answer = await fetch(
  `https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE)}`,
  { headers: { Authorization: `Bearer ${token}` } },
);

if (answer.status === 401) {
  console.error(
    "Apple refused the key (401).\n" +
      "Either the Issuer ID is not the one at the top of the Integrations page, or the key was\n" +
      "made under a person rather than as a Team Key, or it has been revoked.",
  );
  process.exit(1);
}
if (answer.status === 403) {
  console.error(
    "The key works but is not allowed to see the apps (403).\n" +
      "It needs the App Manager role — Users and Access → Integrations → the key → Edit.",
  );
  process.exit(1);
}
if (!answer.ok) {
  console.error(`Apple answered ${answer.status}: ${(await answer.text()).slice(0, 400)}`);
  process.exit(1);
}

const found = await answer.json();
const app = found.data?.[0];

if (!app) {
  console.error(
    `The key works. There is no app in App Store Connect for ${BUNDLE} yet.\n\n` +
      "Make it once: App Store Connect → Apps → + → New App.\n" +
      "  Platform  iOS\n" +
      "  Name      promeNOODology  (or whatever the store should call it)\n" +
      "  Language  English (UK)\n" +
      `  Bundle ID ${BUNDLE}\n` +
      "  SKU       promenoodology-community  (yours, never shown to anybody)\n\n" +
      "An upload with no app record fails at the very last step, which is why this is checked first.",
  );
  process.exit(2);
}

console.log(
  `The key works, and the app is there: ${app.attributes?.name} (${app.attributes?.sku ?? "no sku"}).`,
);
