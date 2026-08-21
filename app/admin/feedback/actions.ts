"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/** Marking a note read or dealt with, and forgetting one. */
export async function markNote(id: string, state: "new" | "seen" | "done"): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("feedback").update({ state }).eq("id", id);
  if (error) return failed(error);
  return { ok: true };
}

/**
 * Gone, with no bin.
 *
 * Deliberately: these are notes to us rather than content, they are often
 * duplicates of each other, and a bin for them would be a second inbox nobody
 * reads.
 */
export async function forgetNote(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return failed(error);
  return { ok: true };
}
