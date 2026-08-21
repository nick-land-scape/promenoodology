"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The partners: the people we do this with who are not people.
 *
 * Schools, festivals, councils, the association that lent us a kitchen. A name
 * and a logo, because that is how an organisation is recognised, and a link for
 * anybody who wants to know more.
 */

export type AssociationInput = {
  id: string;
  name: string;
  url: string;
  published: boolean;
};

export async function addAssociation(): Promise<Saved & { id?: string }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("associations")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("associations")
    .insert({
      name: "",
      position: (last?.position ?? 0) + 1,
      // Nothing with no name and no logo belongs on the page yet.
      published: false,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return failed(error);

  refreshSite();
  return { ok: true, id: data.id };
}

export async function saveAssociations(rows: AssociationInput[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const row of rows) {
    const name = row.name.trim();
    if (row.published && !name) {
      return { ok: false, error: "A partner on the page needs a name." };
    }

    const { error } = await supabase
      .from("associations")
      .update({
        name,
        // Either a real address or nothing — a half-typed one is a broken link
        // on a page nobody was asked to check.
        url: /^https?:\/\/\S+$/.test(row.url.trim()) ? row.url.trim() : null,
        published: row.published,
      })
      .eq("id", row.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/** The order they stand in. Dealt the places they already held between them. */
export async function reorderAssociations(ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from("associations")
      .update({ position: index + 1 })
      .eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

export async function setLogo(id: string, path: string | null): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: before } = await supabase
    .from("associations")
    .select("logo_path")
    .eq("id", id)
    .maybeSingle<{ logo_path: string | null }>();

  const { error } = await supabase.from("associations").update({ logo_path: path }).eq("id", id);
  if (error) return failed(error);

  // The one it replaces is nobody's now.
  const old = before?.logo_path;
  if (old && old !== path && old.startsWith("logos/")) {
    await supabase.storage.from("media").remove([old]);
  }

  refreshSite();
  return { ok: true };
}

export async function deleteAssociation(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  /* Into the bin, and the logo stays where it is.
   *
   * It used to be taken out of the bucket here, which was right when deleting
   * was final and is wrong now: a partner put back after a week would have come
   * back without its logo, which is a restore that restored nothing. The bucket
   * is swept when the thirty days are up, in bin-actions. */
  const { error } = await supabase
    .from("associations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
