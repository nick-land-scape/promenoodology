"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { BINNABLE, binnable, DAYS_IN_THE_BIN } from "@/lib/admin/bin";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The bin.
 *
 * Three things happen to something that has been deleted: it waits, it comes
 * back, or it goes for good. All three live here rather than in each section's
 * own actions, because the rule is the same everywhere and a rule written seven
 * times is seven chances to write it differently.
 *
 * A file is not touched until the very end. That is the whole point: a
 * photograph that came back to a missing file would be a restore that restored
 * nothing, so the bucket is only swept when a row is really destroyed.
 */

function known(table: string) {
  const spec = binnable(table);
  if (!spec) throw new Error(`There is no bin for “${table}”.`);
  return spec;
}

/** Into the bin. */
export async function bin(table: string, id: string): Promise<Saved> {
  await requireAdminAction();
  const spec = known(table);
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from(spec.table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/** Back out of it. */
export async function unbin(table: string, id: string): Promise<Saved> {
  await requireAdminAction();
  const spec = known(table);
  const supabase = await supabaseServer();

  const { error } = await supabase.from(spec.table).update({ deleted_at: null }).eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/**
 * Gone: the row, and the file behind it.
 *
 * The file goes first here, unlike everywhere else in this project. Everywhere
 * else the row is written first because a row pointing at a missing file is a
 * hole on a page and a file nothing points at is only a bill — but nothing points
 * at this row any more, so the only mistake left to make is deleting the row and
 * leaving the file to be paid for for ever.
 */
export async function destroy(table: string, id: string): Promise<Saved> {
  await requireAdminAction();
  const spec = known(table);
  const supabase = await supabaseServer();

  if (spec.file) {
    const { data } = await supabase
      .from(spec.table)
      .select(spec.file)
      .eq("id", id)
      .maybeSingle<Record<string, string | null>>();
    const path = data?.[spec.file];
    if (path) await supabase.storage.from("media").remove([path]);
  }

  const { error } = await supabase.from(spec.table).delete().eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/** Everything in the bin, out of it, in one go. */
export async function unbinAll(table: string): Promise<Saved & { count?: number }> {
  await requireAdminAction();
  const spec = known(table);
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from(spec.table)
    .update({ deleted_at: null })
    .not("deleted_at", "is", null)
    .select("id")
    .returns<{ id: string }[]>();
  if (error) return failed(error);

  refreshSite();
  return { ok: true, count: data?.length ?? 0 };
}

/**
 * Anything whose thirty days are up.
 *
 * Called by the nightly job and offered as a button in the bin, because a bin
 * that only empties while nobody is looking is a bin nobody trusts. It works one
 * row at a time on purpose: each has a file to see to, and a partial sweep that
 * says how far it got is better than one transaction that rolls back and leaves
 * the bucket half swept.
 */
export async function emptyTheBin(): Promise<Saved & { gone?: number }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const due = new Date(Date.now() - DAYS_IN_THE_BIN * 24 * 60 * 60 * 1000).toISOString();
  let gone = 0;

  for (const spec of BINNABLE) {
    const { data } = await supabase
      .from(spec.table)
      .select(spec.file ? `id, ${spec.file}` : "id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", due)
      .returns<Record<string, string | null>[]>();

    for (const row of data ?? []) {
      const path = spec.file ? row[spec.file] : null;
      if (path) await supabase.storage.from("media").remove([path]);

      const { error } = await supabase.from(spec.table).delete().eq("id", row.id as string);
      if (error) return { ok: false, error: `${gone} were emptied, then: ${error.message}` };
      gone += 1;
    }
  }

  refreshSite();
  return { ok: true, gone };
}
