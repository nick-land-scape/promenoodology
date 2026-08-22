/**
 * The App Store profile, made over the API and put where Xcode looks for it.
 *
 *   ASC_KEY_ID=… ASC_ISSUER_ID=… node scripts/asc-profile.mjs
 *
 * Why this exists rather than letting Xcode sign automatically: automatic signing
 * asks Apple for a *development* profile while it archives, and a development
 * profile needs at least one registered device. A team that has never plugged a
 * phone in — which is the normal state of a team that ships from a laptop through
 * TestFlight — gets "your team has no devices from which to generate a
 * provisioning profile" and stops, for a profile the App Store never wanted.
 *
 * An App Store distribution profile needs no devices at all, by definition:
 * nothing is being installed on anything. So it is made here, from the
 * distribution certificate that is already in this Mac's keychain, and written to
 * ~/Library/MobileDevice/Provisioning Profiles — after which the archive is a
 * plain, manual, entirely predictable signing job.
 *
 * Idempotent: an existing valid profile with this name is reused rather than
 * duplicated, and a profile Apple has marked invalid (which happens the moment a
 * certificate is replaced) is deleted and made again.
 *
 * It prints two lines for the shell to read:
 *   PROFILE_NAME=…
 *   PROFILE_UUID=…
 */

import { createPrivateKey, createSign, X509Certificate } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY = process.env.ASC_KEY_ID;
const ISSUER = process.env.ASC_ISSUER_ID;
const BUNDLE = process.env.ASC_BUNDLE_ID ?? "com.promenoodology.community";
const NAME = process.env.ASC_PROFILE_NAME ?? "promeNOODology App Store";

if (!KEY || !ISSUER) {
  console.error("ASC_KEY_ID and ASC_ISSUER_ID are both needed.");
  process.exit(1);
}

/* ------------------------------------------------------------------ the token */

const p8 = join(homedir(), ".appstoreconnect", "private_keys", `AuthKey_${KEY}.p8`);
const base64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const now = Math.floor(Date.now() / 1000);
const head = base64url(JSON.stringify({ alg: "ES256", kid: KEY, typ: "JWT" }));
const body = base64url(
  JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" }),
);
const sign = createSign("SHA256");
sign.update(`${head}.${body}`);
const token = `${head}.${body}.${base64url(
  sign.sign({ key: createPrivateKey(readFileSync(p8, "utf8")), dsaEncoding: "ieee-p1363" }),
)}`;

async function apple(path, options = {}) {
  const answer = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (answer.status === 204) return null;
  const text = await answer.text();
  if (!answer.ok) {
    console.error(`Apple answered ${answer.status} to ${path}:\n${text.slice(0, 800)}`);
    process.exit(1);
  }
  return text ? JSON.parse(text) : null;
}

/* ------------------------------------------------ which certificate is ours */

/* The one in this keychain, by serial number. A team can hold several
   distribution certificates — an old one about to expire, a colleague's — and a
   profile made against a certificate whose private key is not on this machine
   produces an archive that cannot be signed, with an error two steps later that
   does not mention certificates at all. */
let ourSerial = null;
try {
  const pem = execFileSync(
    "security",
    ["find-certificate", "-c", "Apple Distribution", "-p"],
    { encoding: "utf8" },
  );
  ourSerial = new X509Certificate(pem).serialNumber.replace(/^0+/, "").toUpperCase();
} catch {
  console.error(
    "No Apple Distribution certificate in this keychain.\n" +
      "Xcode → Settings → Accounts → Manage Certificates, or Certificates, Identifiers & Profiles.",
  );
  process.exit(1);
}

const certs = await apple("/v1/certificates?limit=200");
const mine = (certs.data ?? []).filter((one) =>
  ["DISTRIBUTION", "IOS_DISTRIBUTION"].includes(one.attributes?.certificateType),
);
const cert =
  mine.find(
    (one) => (one.attributes?.serialNumber ?? "").replace(/^0+/, "").toUpperCase() === ourSerial,
  ) ?? mine[0];

if (!cert) {
  console.error("The team has no distribution certificate in App Store Connect.");
  process.exit(1);
}

/* ----------------------------------------------------------- which bundle id */

const ids = await apple(
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE)}&limit=200`,
);
const bundle = (ids.data ?? []).find((one) => one.attributes?.identifier === BUNDLE);
if (!bundle) {
  console.error(
    `No App ID for ${BUNDLE} in the developer account.\n` +
      "Certificates, Identifiers & Profiles → Identifiers → +, and turn on Sign in with Apple.",
  );
  process.exit(1);
}

/* ------------------------------------------------------------- the profile */

const have = await apple("/v1/profiles?limit=200&include=bundleId");
const already = (have.data ?? []).find(
  (one) =>
    one.attributes?.name === NAME && one.attributes?.profileType === "IOS_APP_STORE",
);

let profile = already;

// An invalid profile is one Apple has already written off — a replaced
// certificate, a changed capability. Deleting it is the only way to make a good
// one under the same name.
if (profile && profile.attributes?.profileState !== "ACTIVE") {
  await apple(`/v1/profiles/${profile.id}`, { method: "DELETE" });
  profile = null;
}

if (!profile) {
  const made = await apple("/v1/profiles", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "profiles",
        attributes: { name: NAME, profileType: "IOS_APP_STORE" },
        relationships: {
          bundleId: { data: { type: "bundleIds", id: bundle.id } },
          certificates: { data: [{ type: "certificates", id: cert.id }] },
        },
      },
    }),
  });
  profile = made.data;
}

/* Written where every Apple tool looks for profiles. The name on disk is the
   uuid, because that is what Xcode indexes them by. */
const content = profile.attributes?.profileContent;
if (!content) {
  console.error("Apple returned a profile with no content in it.");
  process.exit(1);
}

const folder = join(homedir(), "Library", "MobileDevice", "Provisioning Profiles");
mkdirSync(folder, { recursive: true });
const uuid = profile.attributes.uuid;
writeFileSync(join(folder, `${uuid}.mobileprovision`), Buffer.from(content, "base64"));

console.log(`PROFILE_NAME=${profile.attributes.name}`);
console.log(`PROFILE_UUID=${uuid}`);
console.error(
  `Profile "${profile.attributes.name}" (${uuid}) is in place, against certificate ${cert.id}.`,
);
