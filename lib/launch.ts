/**
 * When the new website opens.
 *
 * Three things have to agree about this: the proxy, which keeps everybody else
 * on the holding page until the moment arrives; the holding page itself; and
 * the clock counting down on it. So the moment is written down once, here.
 *
 * NEXT_PUBLIC_LAUNCH_AT moves it. Write the offset into the value, so it means
 * the same instant wherever it is read — seven in the evening in Switzerland is
 * 2026-08-20T19:00:00+02:00, not 19:00 in whatever zone a server happens to
 * keep. Anything that is not a date at all (NEXT_PUBLIC_LAUNCH_AT=off) opens
 * the site: a typo in an environment variable should not be able to close it.
 */
const ANNOUNCED = "2026-08-20T19:00:00+02:00";

/** Where the club is, and therefore whose seven o'clock this is. */
const ZONE = "Europe/Zurich";

/** The moment itself, in milliseconds. NaN if it is not a date. */
export const LAUNCH = new Date(process.env.NEXT_PUBLIC_LAUNCH_AT || ANNOUNCED).getTime();

/** Is the site still behind the clock? */
export function beforeLaunch(now = Date.now()) {
  return Number.isFinite(LAUNCH) && now < LAUNCH;
}

/**
 * The moment written out in Swiss time — "Thursday 20 August, 19:00".
 *
 * Worked out on the server and passed down as text, rather than formatted again
 * in the browser: two machines with slightly different date tables would
 * otherwise disagree on the same page, and React would rebuild the line.
 */
export function launchInSwitzerland() {
  if (!Number.isFinite(LAUNCH)) return "";
  const at = new Date(LAUNCH);

  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(at);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);

  return `${day}, ${time}`;
}

/**
 * The same moment as the reader's own clock would put it, or null if they keep
 * Swiss time anyway and there is nothing to add. Browser only — it is the
 * browser's zone we are asking about.
 */
export function launchWhereYouAre() {
  if (!Number.isFinite(LAUNCH)) return null;

  try {
    const shape: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    const at = new Date(LAUNCH);
    const here = new Intl.DateTimeFormat(undefined, shape).format(at);
    const swiss = new Intl.DateTimeFormat(undefined, { ...shape, timeZone: ZONE }).format(at);

    return here === swiss ? null : here;
  } catch {
    // An old browser with no zone tables: the Swiss time on its own will do.
    return null;
  }
}
