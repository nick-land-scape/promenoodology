"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { PHRASES } from "@/lib/words";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Writing the French of the words the site says itself.
 *
 * Only keys that are actually in the phrase book: this is a public endpoint, and
 * a row keyed on something nobody ever asks for would sit in the table for ever
 * looking like a translation of something.
 *
 * A field cleared is a row deleted rather than a row holding an empty string.
 * The whole fallback rests on absence — no row means the French written into
 * lib/words.ts stands — so an empty string saved would be a third state nobody
 * asked for and the only one with no way back to it from the form.
 */
export async function saveFrench(said: Record<string, string>): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const known = new Set(PHRASES.map((phrase) => phrase.key));

  const keep: { key: string; fr: string; updated_at: string }[] = [];
  const clear: string[] = [];

  for (const [key, value] of Object.entries(said)) {
    if (!known.has(key)) continue;
    const fr = typeof value === "string" ? value.trim() : "";
    if (fr) keep.push({ key, fr, updated_at: new Date().toISOString() });
    else clear.push(key);
  }

  if (keep.length > 0) {
    const { error } = await supabase.from("phrases").upsert(keep, { onConflict: "key" });
    if (error) return failed(error);
  }

  if (clear.length > 0) {
    const { error } = await supabase.from("phrases").delete().in("key", clear);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}
