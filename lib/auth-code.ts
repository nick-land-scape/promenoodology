/**
 * How many characters the code in the email has.
 *
 * Supabase decides this, in Authentication → Providers → Email → "Email OTP
 * Length" (six by default). Everything that draws or checks a code reads it from
 * here, so if it is changed there it is changed in one place here — and the row
 * of boxes on the code page has exactly as many boxes as there are characters to
 * type, which is the whole point of them.
 *
 * The codes Supabase sends are digits only, which is why the boxes ask for a
 * number pad on a phone.
 */
export const CODE_LENGTH = 6;

/** The name of the cookie that remembers whose code we are waiting for. */
export const CODE_COOKIE = "promenood-signin";

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
