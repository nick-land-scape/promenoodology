import "server-only";
import { SUPABASE_URL } from "./supabase/config";

/**
 * The way in for whoever is reviewing the app.
 *
 * Apple and Google both need to sign in to look at an app that keeps anything
 * behind a login, and this login has no password: a code goes to an inbox, and
 * the reviewer has no inbox here. Every way around that is a bad idea except one
 * — a single account whose code does not change, given to the review team in the
 * form they ask for it.
 *
 * How narrow it is, said out loud, because a way past the front door deserves it:
 *
 *  - Two secrets have to be set for it to exist at all. Without either of them
 *    this file answers "no" to everything and the ordinary code path is the only
 *    one there is.
 *  - It works for exactly one address, and only with exactly one code.
 *  - It mints a real session the ordinary way — a one-time link, made on the
 *    server and traded in immediately — rather than putting a second, weaker
 *    kind of session anywhere near the codebase.
 *  - It is written down every time it is used, in the log, with the address.
 *
 * The account it lets into is an ordinary member with nothing of anybody else's
 * on it. It is not an admin, and it must never be made one.
 */

const email = (process.env.REVIEW_EMAIL ?? "").trim().toLowerCase();
/* Eight digits, and only digits: the code page strips everything else out of
   what is typed (see tidyCode in lib/auth-code.ts) and keeps the first eight, so
   a code with a letter in it could never be typed in. */
const code = (process.env.REVIEW_CODE ?? "").trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Is the standing-code account set up at all? */
export const reviewerExists = Boolean(email && /^\d{8}$/.test(code) && service);

/** Is this the reviewer's address? */
export const isReviewer = (address: string) =>
  reviewerExists && address.trim().toLowerCase() === email;

/**
 * The reviewer's code, traded for a session.
 *
 * Returns the token_hash of a fresh one-time link, which the caller hands to
 * Supabase exactly as it would hand over a code somebody read in an email — so
 * the session that comes out is an ordinary session, made the ordinary way.
 */
export async function tokenForReviewer(typed: string): Promise<string | null> {
  if (!reviewerExists) return null;
  if (typed.trim() !== code) return null;

  const answer = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });

  if (!answer.ok) {
    console.error("The review sign-in could not be made:", answer.status, await answer.text());
    return null;
  }

  const made = (await answer.json()) as { hashed_token?: string };
  if (!made.hashed_token) return null;

  // In the log, every time. A door like this should leave footprints.
  console.warn(`Signed in with the standing review code: ${email}`);
  return made.hashed_token;
}
