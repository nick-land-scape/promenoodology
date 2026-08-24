"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

type Done = { ok: boolean; error?: string };

/**
 * Somebody looked at it.
 *
 * Which is most of what happens to a report: a member flagged a photograph that
 * turned out to be a table of people eating, or the screening was unsure about a
 * joke. The row is kept rather than deleted — a list of what has been reported
 * and found to be fine is the only way to see somebody reporting everything.
 */
export async function settleReport(id: string, said: string): Promise<Done> {
  const me = await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("reports")
    .update({
      settled_at: new Date().toISOString(),
      settled_by: me.id,
      settled_said: said.trim().slice(0, 500),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * Taking down what was reported.
 *
 * The post or the reply goes, and the pictures with it — a photograph removed
 * from a feed but left at a public address is not removed, it is unlisted, and
 * the whole reason somebody pressed report was usually the picture.
 *
 * The report itself stays, settled, saying what was done. Deleting the record
 * along with the thing would leave nobody able to answer "why is my post gone".
 */
export async function takeDownReported(id: string): Promise<Done> {
  const me = await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: report } = await supabase
    .from("reports")
    .select("about_post, about_reply")
    .eq("id", id)
    .maybeSingle<{ about_post: string | null; about_reply: string | null }>();

  if (!report) return { ok: false, error: "That report is not there any more." };

  if (report.about_post) {
    /* The paths first: after the row is gone nothing knows which files were its. */
    const { data: post } = await supabase
      .from("posts")
      .select("photo_paths, photo_path")
      .eq("id", report.about_post)
      .maybeSingle<{ photo_paths: string[] | null; photo_path: string | null }>();

    const { error } = await supabase.from("posts").delete().eq("id", report.about_post);
    if (error) return { ok: false, error: error.message };

    const paths = [...(post?.photo_paths ?? []), post?.photo_path ?? ""].filter(Boolean);
    if (paths.length > 0) await supabase.storage.from("media").remove(paths);
  }

  if (report.about_reply) {
    const { error } = await supabase.from("post_replies").delete().eq("id", report.about_reply);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      settled_at: new Date().toISOString(),
      settled_by: me.id,
      settled_said: "taken down",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reports");
  revalidatePath("/app/connect");
  return { ok: true };
}
