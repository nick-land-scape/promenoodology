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
  /** Who took it, when they are somebody with a row of their own. */
  credit_profile_id: string | null;
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
  credit_profile_id: string | null;
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
      credit_profile_id: input.credit_profile_id,
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
      credit_profile_id: input.credit_profile_id,
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
        credit_profile_id: input.credit_profile_id,
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
 * Write down what a photograph actually measures.
 *
 * The archive draws every picture from the size recorded for it, so a row that
 * disagrees with its file is a photograph printed in the wrong shape — squashed
 * into a landscape box when it is a portrait. Nothing about the file is wrong,
 * which is why this cannot be spotted by looking for broken images: it is the
 * row that is wrong, and only the file can settle it.
 *
 * Two of these were found in the archive as imported. Rather than correcting
 * them by hand, the browser measures every file and hands the disagreements
 * here — so the next import is checked the same way.
 */
export async function fixSizes(
  fixes: { id: string; width: number; height: number }[],
): Promise<Saved & { fixed?: number }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  let fixed = 0;
  for (const one of fixes) {
    if (one.width <= 0 || one.height <= 0) {
      return {
        ok: false,
        error: `${one.id} was measured as ${one.width}×${one.height}, which cannot be right. Nothing has been changed.`,
      };
    }
    const { error } = await supabase
      .from("photos")
      .update({ width: one.width, height: one.height })
      .eq("id", one.id);
    if (error) return failed(error);
    fixed += 1;
  }

  refreshSite();
  return { ok: true, fixed };
}

/**
 * Put an edited photograph in the place of the one it came from.
 *
 * A new path rather than the old one, and that is deliberate. Overwriting the
 * file in the bucket would leave every cache in the chain — the CDN, the
 * browser, the copy in somebody's open tab — serving the picture that no longer
 * exists, and no amount of revalidating this site fixes a file cached under a
 * name that has not changed. A new name is the only version of this that is
 * honest with a cache.
 *
 * So: write the row, then take the old file out. That order, because a row
 * pointing at a file that is gone is a hole on the page, while a file nothing
 * points at is only a bill — and if the delete fails we would rather have the
 * bill.
 */
export async function replacePhoto(input: {
  id: string;
  path: string;
  width: number;
  height: number;
}): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: before } = await supabase
    .from("photos")
    .select("path")
    .eq("id", input.id)
    .maybeSingle<{ path: string }>();

  if (!before) {
    return {
      ok: false,
      error: "That photograph is not in the archive any more, so there was nothing to replace.",
    };
  }
  if (!input.path || input.width <= 0 || input.height <= 0) {
    return {
      ok: false,
      error: `The edited file was handed over as ${input.width}×${input.height} at "${input.path}", which cannot be right. Nothing has changed.`,
    };
  }

  const { error } = await supabase
    .from("photos")
    .update({ path: input.path, width: input.width, height: input.height })
    .eq("id", input.id);
  if (error) return failed(error);

  // An evening in the app can point at a photograph by its path, so it follows
  // the picture rather than being left pointing at a file about to go.
  await supabase.from("events").update({ photo_path: input.path }).eq("photo_path", before.path);

  if (before.path !== input.path) {
    const { error: leftover } = await supabase.storage.from("media").remove([before.path]);
    if (leftover) {
      // Said out loud, and not as a failure: the archive is correct, there is
      // simply a file in the bucket nobody will ever ask for again.
      console.warn(`The old file ${before.path} could not be removed:`, leftover.message);
    }
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
