import type { SupabaseClient } from "@supabase/supabase-js";

/** An account, as the token itself says who it is. */
export type Whoever = { id: string; email: string } | null;

/**
 * Who is asking, read from the token rather than from the auth server.
 *
 * `getUser()` — which every screen in the app and every server action used to
 * begin with — sends the token to Supabase and waits to be told whose it is.
 * That is a network round trip before a single line of a page can be worked out,
 * on every request, and it is the same answer every time for an hour.
 *
 * `getClaims()` reads the same answer out of the token and checks the signature
 * against the project's public keys, which are fetched once and kept. No round
 * trip, and no less certain: a token whose signature does not verify is refused
 * here exactly as it would be there. The library still refreshes an expiring
 * session before it looks, so nothing about staying signed in changes.
 *
 * If the project is still signing with the old shared secret rather than a
 * public/private pair, the library cannot check a signature locally and asks the
 * server, which is what used to happen anyway — so this is safe to run before
 * that switch is made, and quietly becomes faster after it.
 *
 * What it does *not* give is the user record: an email changed a minute ago is in
 * the record and not yet in the token, which is at most an hour behind. So the
 * screens that show or change your address keep asking the server (see
 * lib/site-actions/account.ts), and everything that only needs to know *who you
 * are* asks here.
 */
export async function whoever(supabase: SupabaseClient): Promise<Whoever> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : "",
  };
}
