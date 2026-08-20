"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Applications from the handbook page: somebody doing something in public space
 * who would like a hand with it.
 *
 * Nothing here appears anywhere on the site, so none of it purges the cache —
 * this is an inbox, not content.
 */

const STATES = new Set(["new", "talking", "yes", "no"]);

export async function setRequestState(id: string, state: string): Promise<Saved> {
  await requireAdminAction();
  if (!STATES.has(state)) return { ok: false, error: `“${state}” is not one of the answers.` };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("applications").update({ state }).eq("id", id);
  if (error) return failed(error);
  return { ok: true };
}

export async function deleteRequest(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return failed(error);
  return { ok: true };
}
