/**
 * Dates, said the way the back of the house says them.
 *
 * Plain functions in a plain module, and that matters: they used to live in the
 * component kit, which is a client module — so a server page calling one got
 * "Attempted to call pretty() from the server". Nothing in here touches React,
 * so nothing in here should have been behind "use client".
 */

/** A plain day, or a moment, in words. */
export function pretty(iso: string) {
  if (!iso) return "";
  /* "2026-08-21" needs a time bolted on to be read as UTC rather than as local
     midnight; "2026-08-21T13:05:22Z" already is one, and bolting a second time
     onto it hands the raw string back — which is how a deletion came to be
     dated "2026-08-21T13:05:22.685+00:00" in the bin. */
  const moment = iso.includes("T");
  const date = new Date(moment ? iso : `${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Today, as the date inputs want it. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}
