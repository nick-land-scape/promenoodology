/**
 * Puts this project's keys into .env.local, so nobody has to copy one by hand.
 *
 *   node scripts/local-keys.mjs
 *
 * It needs a Supabase personal access token, which is a different thing from
 * the project keys it fetches: the token says who you are, the keys say what
 * this copy of the site may do. It is read from SUPABASE_ACCESS_TOKEN or
 * SUPABASE_PAT, whichever is set — the second is what the MCP server in
 * ~/.claude.json already uses, so on this machine there is usually nothing to
 * set up at all.
 *
 * Why this exists: copying the service_role key out of the dashboard went wrong
 * twice, and both times it went wrong quietly. Once the placeholder from the
 * instructions was pasted instead of the key; once the line landed in the wrong
 * .env.local, in the wrong directory. Neither is a mistake worth making twice,
 * and neither is really a mistake — they are both a copy-paste step that should
 * not have been there.
 *
 * The keys go in .env.local, which is git-ignored and must stay that way.
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT = "bqdtxqdmdtzffvkvrqpt";
const ENV = path.join(process.cwd(), ".env.local");

const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
if (!token) {
  console.error(
    "No Supabase access token in the environment.\n\n" +
      "Set SUPABASE_ACCESS_TOKEN, or SUPABASE_PAT (which ~/.claude.json already\n" +
      "expects for the MCP server). Make one at:\n" +
      "  https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

async function ask(what) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/${what}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`${what}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** Set one line in .env.local, replacing whatever was there under that name. */
function put(text, name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (pattern.test(text)) return text.replace(pattern, line);
  return `${text.replace(/\n*$/, "")}\n${line}\n`;
}

try {
  const keys = await ask("api-keys?reveal=true");

  const find = (name) => keys.find((key) => key.name === name)?.api_key;
  const publishable =
    find("anon") ?? keys.find((key) => key.type === "publishable")?.api_key;
  const secret = find("service_role") ?? keys.find((key) => key.type === "secret")?.api_key;

  if (!publishable || !secret) {
    throw new Error(
      `The project answered, but not with both keys — it has: ${keys
        .map((key) => key.name)
        .join(", ")}`,
    );
  }

  let text = fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8") : "";
  text = put(text, "NEXT_PUBLIC_SUPABASE_URL", `https://${PROJECT}.supabase.co`);
  text = put(text, "NEXT_PUBLIC_SUPABASE_ANON_KEY", publishable);
  text = put(text, "SUPABASE_SERVICE_ROLE_KEY", secret);
  fs.writeFileSync(ENV, text);

  console.log(
    "Written into .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY   (${publishable.slice(0, 12)}…)\n` +
      `  SUPABASE_SERVICE_ROLE_KEY       (${secret.slice(0, 12)}…)\n\n` +
      "The last one ignores every row level security policy. It belongs on this\n" +
      "machine and nowhere else — not in Vercel, not in the repository.",
  );
} catch (error) {
  console.error(`\n${error.message}`);
  process.exit(1);
}
