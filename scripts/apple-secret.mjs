/**
 * The client secret Supabase asks for, made from the key Apple gave you.
 *
 *   node scripts/apple-secret.mjs ~/Downloads/AuthKey_7327ATVLZ9.p8
 *
 * This exists because the field is a trap. Supabase's Apple provider asks for a
 * "Secret Key (for OAuth)" and the thing Apple gives you is a .p8 file — but the
 * .p8 is not the secret. The secret is a JSON Web Token, signed *with* the .p8,
 * that says which team, which key and which Services ID it is for. Pasting the
 * contents of the .p8 into that box gets you "invalid_client" from Apple and no
 * explanation from anybody.
 *
 * The .p8 never leaves this machine: it is read here, used to sign, and not
 * printed. What is printed is the token, which is the thing to paste.
 *
 * Apple will not accept one that lasts longer than six months, so this makes one
 * that lasts almost exactly that and tells you the day it dies. Put that day in a
 * calendar: when it expires, signing in with Apple stops working on the web and
 * the only symptom is people not being able to get in.
 *
 * No dependencies. Node's own crypto can sign ES256 — the one thing to get right
 * is `dsaEncoding: "ieee-p1363"`, which is the raw r‖s signature a JWT wants
 * rather than the DER wrapper Node hands out by default.
 */

import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";

/* promeNOODology's own, from the Apple Developer account. None of these are
   secrets — the .p8 is the secret, and it stays where it is. */
const TEAM = process.env.APPLE_TEAM_ID ?? "K35XLVJJ3T";
const KEY = process.env.APPLE_KEY_ID ?? "7327ATVLZ9";
const SERVICE = process.env.APPLE_SERVICE_ID ?? "com.promenoodology.community.signin";

/** Six months, less a day, in seconds. Apple's limit is 15777000. */
const LIFE = 15_770_000;

const p8 = process.argv[2];
if (!p8) {
  console.error(
    "Which key file?\n\n" +
      "  node scripts/apple-secret.mjs ~/Downloads/AuthKey_" + KEY + ".p8\n",
  );
  process.exit(1);
}

const base64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let key;
try {
  key = createPrivateKey(readFileSync(p8, "utf8"));
} catch (error) {
  console.error(
    `That file did not read as a private key (${error.message}).\n` +
      "It should be the .p8 exactly as Apple gave it, beginning -----BEGIN PRIVATE KEY-----.",
  );
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const header = base64url(JSON.stringify({ alg: "ES256", kid: KEY }));
const payload = base64url(
  JSON.stringify({
    iss: TEAM,
    iat: now,
    exp: now + LIFE,
    aud: "https://appleid.apple.com",
    sub: SERVICE,
  }),
);

const signer = createSign("SHA256");
signer.update(`${header}.${payload}`);
const signature = base64url(signer.sign({ key, dsaEncoding: "ieee-p1363" }));

const dies = new Date((now + LIFE) * 1000).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

console.log(`
Supabase → Authentication → Providers → Apple

  Client IDs        ${SERVICE},${SERVICE.replace(/\.signin$/, "")}
  Secret Key        the line below, all of it, no spaces
  Allow users without an email    off

${header}.${payload}.${signature}

It stops working on ${dies}. Put that in a calendar — when it goes, signing in
with Apple on the web stops and nothing says why.
`);
