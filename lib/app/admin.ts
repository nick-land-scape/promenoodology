import { redirect } from "next/navigation";
import { whoIsThis } from "@/lib/app/me";

/**
 * The back of the house, from a phone.
 *
 * Deliberately not a second idea of who an admin is. `profiles.role` decides it
 * for the website and it decides it here — one flag, one answer, and the database
 * says no as well through the same row level security policies the website's
 * admin screens rely on. A second flag would mean two lists of who is trusted,
 * and two lists of anything drift.
 *
 * A member who is not an admin is sent back to their own account rather than to
 * the door: they are not locked out of the app, they are in the wrong half of it.
 */
export async function requireAppAdmin() {
  const me = await whoIsThis();
  if (!me) redirect("/app/enter?from=%2Fapp%2Faccount");
  if (!me.admin) redirect("/app/account");
  return me;
}
