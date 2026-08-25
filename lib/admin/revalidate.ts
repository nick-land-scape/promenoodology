import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * Everything the site reads is kept for a minute (see lib/shared.ts and the
 * readers in lib/source.ts). That is right for visitors and wrong for whoever
 * just changed something: they should see it immediately, or they will change it
 * again.
 *
 * So every write in the back of the house ends here. One story can appear on
 * four pages — the story itself, the list, the archive's filters, the sitemap —
 * so there is little point being clever about which: the whole tree goes, and
 * with it the one tag every cached read is filed under.
 */
export function refreshSite() {
  revalidatePath("/", "layout");
  /* And the app's shared reads.
   *
   * Every screen in the members' app is dynamic — it reads a cookie — so the
   * paths above mean nothing to it; what it keeps for a minute is the *data*,
   * under the "content" tag (see lib/shared.ts), which is now also what the
   * website's own pages are built out of. Without this an evening turned
   * on here reaches the members' phones somewhere in the next sixty seconds,
   * which is exactly long enough for somebody to turn it on twice.
   *
   * `updateTag` rather than `revalidateTag`, because this runs inside a server
   * action and the person who just pressed save should see their own change in
   * the answer to that press — not in the one after it. Where it is called from
   * something that is not an action, the fall-back expires the tag instead. */
  try {
    updateTag("content");
  } catch {
    revalidateTag("content", { expire: 0 });
  }
}

/** A plain, useful answer for a form to show. */
export type Saved = { ok: boolean; error?: string };

export const saved: Saved = { ok: true };

export function failed(error: unknown): Saved {
  if (typeof error === "string") return { ok: false, error };
  if (error && typeof error === "object" && "message" in error) {
    return { ok: false, error: String((error as { message: unknown }).message) };
  }
  return { ok: false, error: "That did not save. Try again." };
}
