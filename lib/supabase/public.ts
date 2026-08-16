import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * A schema loose enough that any table can be read from and written to.
 *
 * Supabase can generate exact types from the database, but that needs the CLI
 * in the build, and the shapes are already written down by hand in rows.ts.
 * Queries say what they return with `.returns<Row[]>()`; this only stops the
 * client from insisting it knows nothing about any table at all.
 */
type Loose = {
  public: {
    Tables: {
      [table: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/**
 * A client with no cookies attached, for reading what everybody may read.
 *
 * Two reasons it exists rather than using the session client everywhere:
 * touching cookies would make every page render per request instead of being
 * cached, and `generateStaticParams` runs at build time where there is no
 * request to take cookies from.
 */
let client: ReturnType<typeof createClient<Loose>> | null = null;

export function supabasePublic() {
  client ??= createClient<Loose>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
