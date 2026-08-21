"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The film on the front page.
 *
 * The file is already in the bucket by the time anything here runs — the browser
 * shrinks it and puts it there (see lib/admin/video.ts). These actions only look
 * after the rows that say which films there are and in what order.
 */

export type FilmInput = {
  id: string;
  called: string;
  published: boolean;
};

export async function addFilm(input: {
  path: string;
  posterPath: string;
  called: string;
  seconds: number;
  bytes: number;
}): Promise<Saved & { id?: string }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("hero_videos")
    .select("position")
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("hero_videos")
    .insert({
      path: input.path,
      poster_path: input.posterPath || null,
      called: input.called.trim(),
      seconds: input.seconds,
      bytes: input.bytes,
      position: (last?.position ?? 0) + 1,
      published: true,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return failed(error);

  refreshSite();
  return { ok: true, id: data.id };
}

export async function saveFilms(rows: FilmInput[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  /* Hiding every one of them is allowed. It does not leave the front page with
     nothing — it leaves it with the film the site was built with, which is a
     real answer to "take that one off for now". The screen says so rather than
     this refusing to do it. */
  for (const row of rows) {
    const { error } = await supabase
      .from("hero_videos")
      .update({ called: row.called.trim(), published: row.published })
      .eq("id", row.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/** The order they are offered in. Which one plays is still a toss of a coin. */
export async function reorderFilms(ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from("hero_videos")
      .update({ position: index + 1 })
      .eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/**
 * Into the bin for thirty days, film and poster left where they are.
 *
 * The files stay until the thirty days are up: a film put back that came back to
 * a missing file would be a restore that restored nothing. The bucket is swept
 * in bin-actions.
 */
export async function deleteFilm(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("hero_videos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
