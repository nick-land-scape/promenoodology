"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The newsletter list.
 *
 * Somebody who asks to come off it should come off it, not be marked as
 * something — so this really deletes the row.
 */
export async function removeSubscriber(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("newsletter").delete().eq("id", id);
  if (error) return failed(error);
  return { ok: true };
}
