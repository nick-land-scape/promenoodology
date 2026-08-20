import { revalidatePath } from "next/cache";

/**
 * Every page on the site keeps a copy for a minute (`export const revalidate =
 * 60`). That is right for visitors and wrong for whoever just changed
 * something: they should see it immediately, or they will change it again.
 *
 * So every write in the back of the house ends here. One story can appear on
 * four pages — the story itself, the list, the archive's filters, the sitemap —
 * so there is little point being clever about which: the whole tree goes.
 */
export function refreshSite() {
  revalidatePath("/", "layout");
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
