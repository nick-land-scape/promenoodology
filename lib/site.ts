/**
 * Where this copy of the site lives.
 *
 * Used for canonical addresses, the social preview, the sitemap and the
 * reference people can copy from a story — so all of those follow the site
 * around instead of naming a domain that might not be live yet.
 *
 * In order: whatever NEXT_PUBLIC_SITE_URL says, then the address Vercel gives
 * the project, then localhost.
 */
function resolve() {
  const set = process.env.NEXT_PUBLIC_SITE_URL;
  if (set) return set.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();

/** An absolute address for a path on this site. */
export function siteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
