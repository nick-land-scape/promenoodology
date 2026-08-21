/**
 * How many characters the code in the email has.
 *
 * Supabase decides this, in Authentication → Providers → Email → "Email OTP
 * Length". This project is set to eight — not the six Supabase ships with, and
 * not something to guess at: a row of six boxes quietly cut the last two
 * characters off an eight-character code, sent the stump, and was told the code
 * had expired. Which it had not.
 *
 * Everything that draws or checks a code reads the number from here, so the row
 * of boxes always has exactly as many boxes as there are characters to type —
 * which is the whole point of them. If it is changed in the dashboard, change it
 * here in the same breath.
 *
 * The codes Supabase sends are digits only, which is why the boxes ask for a
 * number pad on a phone.
 */
export const CODE_LENGTH = 8;

/** The name of the cookie that remembers whose code we are waiting for. */
export const CODE_COOKIE = "promenood-signin";

/**
 * And the page they were reading when they knocked.
 *
 * Signing in used to end on the profile page whatever you were doing — you
 * knocked from the archive, typed a code, and arrived somewhere else entirely,
 * with your own name in a form as though it had been asked for. This remembers
 * where you were so you can be put back.
 *
 * A path only, and only ever a path on this site: checked at both ends, because
 * a cookie is something a browser can be persuaded to send.
 */
export const BACK_COOKIE = "promenood-back";

/** A path on this site, or nothing. Never an address somewhere else. */
export function onlyAPath(said: string | undefined | null): string {
  if (!said) return "";
  // A single leading slash, and no "//host" or "/\host" smuggled past it.
  if (!/^\/[^/\\]/.test(said) && said !== "/") return "";
  if (said.length > 200) return "";
  return said;
}

/** How long that cookie lives. The code itself expires within the hour. */
export const CODE_COOKIE_MAX_AGE = 60 * 60;

/** Only the digits, and never more of them than a code has. */
export function tidyCode(input: string) {
  return input.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * m•••••n@example.com — enough to recognise your own address on the code page,
 * not enough to be worth reading over your shoulder.
 */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  if (name.length <= 2) return `${name[0]}•${domain}`;
  return `${name[0]}${"•".repeat(Math.min(5, name.length - 2))}${name[name.length - 1]}${domain}`;
}
