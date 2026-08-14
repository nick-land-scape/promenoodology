import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * A client with no cookies attached, for reading what everybody may read.
 *
 * Two reasons it exists rather than using the session client everywhere:
 * touching cookies would make every page render per request instead of being
 * cached, and `generateStaticParams` runs at build time where there is no
 * request to take cookies from.
 */
let client: ReturnType<typeof createClient> | null = null;

export function supabasePublic() {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
