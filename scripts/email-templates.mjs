/**
 * Puts the emails in supabase/email-templates/ into the Supabase project.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/email-templates.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/email-templates.mjs --check
 *
 * Why this exists rather than "paste it in the dashboard": pasting is where it
 * goes wrong. The templates are not interchangeable, each has its own save
 * button, and an email that looks unchanged is indistinguishable from one that
 * was never saved — you cannot tell by looking at the inbox which one you are
 * seeing. This reads the files and writes them all, and `--check` tells you what
 * is actually up there without changing anything.
 *
 * The token is a personal access token from
 * https://supabase.com/dashboard/account/tokens. It is read from the environment
 * and never written anywhere: keep it out of the repository and out of your shell
 * history (a leading space, or a password manager, is enough).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const PROJECT = "bqdtxqdmdtzffvkvrqpt";

/** file → which template it is, and the subject line that goes with it. */
const TEMPLATES = [
  {
    file: "magic-link.html",
    contentKey: "mailer_templates_magic_link_content",
    subjectKey: "mailer_subjects_magic_link",
    subject: "Your code for promeNOODology",
    what: "Magic Link — somebody who already has an account",
  },
  {
    file: "confirm-signup.html",
    contentKey: "mailer_templates_confirmation_content",
    subjectKey: "mailer_subjects_confirmation",
    subject: "Welcome to promeNOODology — here is your code",
    what: "Confirm signup — somebody joining for the first time",
  },
  {
    file: "email-change.html",
    contentKey: "mailer_templates_email_change_content",
    subjectKey: "mailer_subjects_email_change",
    subject: "Confirm your new address for promeNOODology",
    what: "Change Email Address — somebody moving their account to a new inbox",
    /* The one email here that carries no code, and should not.
     *
     * A code is typed into the page you left open, which checks it against the
     * address in a cookie — the address being left behind. There is nowhere for
     * a code from this email to go, so it sends the link and says so. */
    needsCode: false,
  },
];

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN.\n" +
      "Make one at https://supabase.com/dashboard/account/tokens, then:\n" +
      "  SUPABASE_ACCESS_TOKEN=sbp_... node scripts/email-templates.mjs",
  );
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${PROJECT}/config/auth`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function config() {
  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    throw new Error(`Reading the settings failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** What is up there now, and whether it carries a code at all. */
async function check() {
  const current = await config();

  console.log(`OTP length:  ${current.mailer_otp_length ?? "(default 6)"}`);
  console.log(`OTP expires: ${current.mailer_otp_exp ?? "?"}s\n`);

  for (const template of TEMPLATES) {
    const live = current[template.contentKey] ?? "";
    const mine = readFileSync(path.join(ROOT, "supabase/email-templates", template.file), "utf8");
    const same = live.trim() === mine.trim();

    console.log(template.what);
    console.log(`  subject:  ${current[template.subjectKey] ?? "(default)"}`);
    console.log(
      template.needsCode === false
        ? `  has link: ${live.includes("token_hash") ? "yes" : "NO — the stock link only works in one browser"}`
        : `  has code: ${live.includes("{{ .Token }}") ? "yes" : "NO — it will only send a link"}`,
    );
    console.log(`  matches ${template.file}: ${same ? "yes" : "no"}`);
    console.log("");
  }

  console.log(
    "The OTP length above has to agree with CODE_LENGTH in lib/auth-code.ts,\n" +
      "which decides how many boxes the code page draws.",
  );
}

async function push() {
  const body = {};

  for (const template of TEMPLATES) {
    const html = readFileSync(path.join(ROOT, "supabase/email-templates", template.file), "utf8");
    if (template.needsCode !== false && !html.includes("{{ .Token }}")) {
      throw new Error(
        `${template.file} has no {{ .Token }} in it — it would send a link and no code.`,
      );
    }
    if (!html.includes("token_hash")) {
      throw new Error(
        `${template.file} does not link through token_hash — the link would only work in the browser that asked for it.`,
      );
    }
    body[template.contentKey] = html;
    body[template.subjectKey] = template.subject;
  }

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Writing failed: ${response.status} ${await response.text()}`);
  }

  for (const template of TEMPLATES) console.log(`  wrote ${template.what}`);
  console.log("\nAll in place. Ask for a code and read what arrives.");
}

try {
  await (process.argv.includes("--check") ? check() : push());
} catch (error) {
  console.error(`\n${error.message}`);
  process.exit(1);
}
