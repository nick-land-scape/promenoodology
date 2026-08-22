"use server";

import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Writing the handbook, a page at a time.
 *
 * The order matters more here than anywhere else on the site: this is a book,
 * and page seven is only page seven because six pages come before it. So the
 * order is a thing you decide and keep, like the stories' — dragged, and written
 * when you say so.
 */

export type Block = { kind: string; text: string };

const KINDS = new Set(["heading", "text"]);

/** A blank page, opened straight away so there is somewhere to type. */
export async function createLeaf(): Promise<void> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("handbook_pages")
    .select("position")
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("handbook_pages")
    .insert({
      position: (last?.position ?? 0) + 1,
      title: "",
      blocks: [{ kind: "heading", text: "" }],
      // A page of a book is on as soon as it is written: an empty one at the
      // back of the book is not doing any harm, and one nobody can see is a
      // page somebody will write twice.
      published: true,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(error.message);

  refreshSite();
  redirect(`/admin/handbook/${data.id}`);
}

export async function saveLeaf(
  id: string,
  title: string,
  blocks: Block[],
): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  // Only the two kinds this writing is made of, and nothing empty: a block with
  // no words in it is one somebody started and left.
  const words = blocks
    .filter((block) => KINDS.has(block.kind))
    .map((block) => ({ kind: block.kind, text: block.text.trim() }))
    .filter((block) => block.text);

  const { error } = await supabase
    .from("handbook_pages")
    .update({ title: title.trim(), blocks: words, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

export async function showLeaf(id: string, published: boolean): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("handbook_pages").update({ published }).eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/** The order the book is read in, written in one go. */
export async function reorderLeaves(ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const [at, id] of ids.entries()) {
    const { error } = await supabase
      .from("handbook_pages")
      .update({ position: at + 1 })
      .eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

export async function deleteLeaf(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("handbook_pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
