"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The archive.
 *
 * The picture itself is already in the bucket by the time anything here runs —
 * the browser puts it there (see lib/admin/upload.ts). These actions only look
 * after the row that says who took it, which year it is from and which story it
 * belongs to.
 */

export type PhotoInput = {
  id: string;
  credit: string;
  year: string;
  story_tag: string | null;
  published: boolean;
};

/** Register a picture that has just been uploaded. */
export async function addPhoto(input: {
  path: string;
  width: number;
  height: number;
  credit: string;
  year: string;
  story_tag: string | null;
}): Promise<Saved & { id?: string }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("photos")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("photos")
    .insert({
      path: input.path,
      width: input.width,
      height: input.height,
      credit: input.credit.trim(),
      year: input.year.trim(),
      story_tag: input.story_tag,
      position: (last?.position ?? 0) + 1,
      published: true,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return failed(error);

  refreshSite();
  return { ok: true, id: data.id };
}

export async function savePhoto(input: PhotoInput): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("photos")
    .update({
      credit: input.credit.trim(),
      year: input.year.trim(),
      story_tag: input.story_tag,
      published: input.published,
    })
    .eq("id", input.id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/** Several at once: giving a whole batch the same credit, year or story. */
export async function savePhotos(inputs: PhotoInput[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const input of inputs) {
    const { error } = await supabase
      .from("photos")
      .update({
        credit: input.credit.trim(),
        year: input.year.trim(),
        story_tag: input.story_tag,
        published: input.published,
      })
      .eq("id", input.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/**
 * The order photographs appear in on the wall and in a story.
 *
 * Only the ones handed in are touched, and they are dealt the places they
 * already occupied between them — so putting a story's photographs in order does
 * not shuffle the rest of the archive around them.
 */
export async function reorderPhotos(ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: current } = await supabase
    .from("photos")
    .select("id, position")
    .in("id", ids)
    .returns<{ id: string; position: number }[]>();

  if (!current || current.length !== ids.length) {
    return { ok: false, error: "Some of those photographs are no longer there. Reload the page." };
  }

  const places = current.map((photo) => photo.position).sort((a, b) => a - b);

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from("photos")
      .update({ position: places[index] })
      .eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/**
 * Deleting takes the file out of the bucket as well as the row — a picture
 * nothing points at is just a bill.
 *
 * An evening in the app can be pointing at it too, and the database would let
 * that go quietly (photo_path is only text), so that is checked here.
 */
export async function deletePhoto(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: photo } = await supabase
    .from("photos")
    .select("path")
    .eq("id", id)
    .maybeSingle<{ path: string }>();
  if (!photo) return { ok: false, error: "That photograph is already gone." };

  const { data: used } = await supabase
    .from("events")
    .select("title")
    .eq("photo_path", photo.path)
    .returns<{ title: string }[]>();

  if (used && used.length > 0) {
    return {
      ok: false,
      error: `Still the picture for ${used.map((event) => `“${event.title}”`).join(", ")}. Change that first.`,
    };
  }

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return failed(error);

  // The row is what the site reads, so the row goes first; a file left behind
  // is untidy, not broken.
  await supabase.storage.from("media").remove([photo.path]);

  refreshSite();
  return { ok: true };
}
