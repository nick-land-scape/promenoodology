/**
 * Whether this copy of the site has a database behind it.
 *
 * Until the keys are set, every reader falls back to the CSV and text files in
 * /data and /content, so the site keeps working exactly as it did — and keeps
 * working if the database is ever taken away again.
 */
export function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Public address of a file in the media bucket. */
export function mediaUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
