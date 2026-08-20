"use server";

import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { slugify, suffix } from "@/lib/admin/slug";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Writing the stories.
 *
 * Two things are handled with more care than the rest. A story's slug is its
 * address, and an address that has been shared should not move, so it is only
 * minted once. And a story's tag is what its photographs are looking for: change
 * the tag and every photograph loses its story, so changing one carries the
 * photographs across with it.
 */

export type StorySection = { heading: string | null; texts: string[] };

export type StoryInput = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  place: string;
  happened: string;
  made_with: string;
  sections: StorySection[];
  published: boolean;
  /** Which photograph stands for the story. Null: worked out from the photos. */
  featured_photo_id: string | null;
};

/** A blank story, opened straight away so there is somewhere to type. */
export async function createStory(): Promise<void> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("stories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const stub = `untitled-${suffix()}`;
  const { error } = await supabase.from("stories").insert({
    slug: stub,
    title: "Untitled",
    tag: stub,
    position: (last?.position ?? 0) + 1,
    sections: [{ heading: null, texts: [""] }],
    // Nobody sees it until it is finished.
    published: false,
  });
  if (error) throw new Error(error.message);

  refreshSite();
  redirect(`/admin/stories/${stub}`);
}

/** Free, or taken by somebody else? */
async function taken(
  column: "slug" | "tag",
  value: string,
  exceptId: string,
): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("stories")
    .select("id")
    .eq(column, value)
    .neq("id", exceptId)
    .maybeSingle();
  return Boolean(data);
}

export async function saveStory(input: StoryInput): Promise<Saved & { slug?: string }> {
  const admin = await requireAdminAction();
  const supabase = await supabaseServer();

  const title = input.title.trim();
  if (!title) return { ok: false, error: "A story needs a title." };

  // The address is minted once, from the first real title, and then left alone.
  let slug = input.slug.trim();
  if (/^untitled-/.test(slug) && title.toLowerCase() !== "untitled") {
    const stem = slugify(title) || slug;
    slug = stem;
    for (let n = 2; await taken("slug", slug, input.id); n += 1) slug = `${stem}-${n}`;
  }
  if (!slug) return { ok: false, error: "A story needs an address." };
  if (await taken("slug", slug, input.id)) {
    return { ok: false, error: `Another story already lives at /stories/${slug}.` };
  }

  // A tag is what the photographs look for, so it may not collide either.
  const tag = (slugify(input.tag) || slug).slice(0, 40);
  if (await taken("tag", tag, input.id)) {
    return { ok: false, error: `Another story already uses the tag “${tag}”.` };
  }

  // Empty paragraphs are how a section looks while it is being written; they
  // should not reach the page.
  const sections = input.sections
    .map((section) => ({
      heading: section.heading?.trim() ? section.heading.trim() : null,
      texts: section.texts.map((text) => text.trim()).filter(Boolean),
    }))
    .filter((section) => section.heading || section.texts.length > 0);

  const { data: before } = await supabase
    .from("stories")
    .select("tag")
    .eq("id", input.id)
    .maybeSingle<{ tag: string }>();

  const { error } = await supabase
    .from("stories")
    .update({
      slug,
      title,
      tag,
      subtitle: input.subtitle.trim() || null,
      featured_photo_id: input.featured_photo_id,
      place: input.place.trim() || null,
      happened: input.happened.trim() || null,
      made_with: input.made_with.trim() || null,
      sections,
      published: input.published,
      updated_by: admin.id,
    })
    .eq("id", input.id);
  if (error) return failed(error);

  // The photographs and quotes follow the tag, or they would be orphaned by a
  // rename that looked harmless.
  if (before?.tag && before.tag !== tag) {
    await Promise.all([
      supabase.from("photos").update({ story_tag: tag }).eq("story_tag", before.tag),
      supabase.from("quotes").update({ story_tag: tag }).eq("story_tag", before.tag),
    ]);
  }

  refreshSite();
  return { ok: true, slug };
}

/** The order the stories are read in, top to bottom. */
export async function reorderStories(ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from("stories")
      .update({ position: index + 1 })
      .eq("id", id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

export async function showStory(id: string, published: boolean): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("stories").update({ published }).eq("id", id);
  if (error) return failed(error);
  refreshSite();
  return { ok: true };
}

/**
 * Deleting a story leaves its photographs where they are, tagged for a story
 * that no longer exists — which is why the list warns first, and why they end up
 * under "loose" in the archive rather than disappearing.
 */
export async function deleteStory(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: story } = await supabase
    .from("stories")
    .select("tag")
    .eq("id", id)
    .maybeSingle<{ tag: string }>();

  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) return failed(error);

  if (story?.tag) {
    await supabase.from("photos").update({ story_tag: null }).eq("story_tag", story.tag);
    await supabase.from("quotes").update({ story_tag: null }).eq("story_tag", story.tag);
  }

  refreshSite();
  return { ok: true };
}

/**
 * The order the photographs are read in, and how each one sits.
 *
 * Both at once, because they are one decision: moving a photograph and saying it
 * should be wide are the same act of arranging a page, and two save buttons for
 * that would be two chances to lose half of it.
 *
 * Only this story's photographs are touched, and they are dealt the places they
 * already occupied between them — so arranging one story does not shuffle the
 * archive around it.
 */
export async function saveStoryPhotos(
  photos: { id: string; layout: string | null }[],
): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const ids = photos.map((photo) => photo.id);
  if (ids.length === 0) return { ok: true };

  const { data: current } = await supabase
    .from("photos")
    .select("id, position")
    .in("id", ids)
    .returns<{ id: string; position: number }[]>();

  if (!current || current.length !== ids.length) {
    return { ok: false, error: "Some of those photographs are no longer there. Reload the page." };
  }

  const places = current.map((photo) => photo.position).sort((a, b) => a - b);
  const named = new Set(["wide", "narrow", "left", "right", "tall"]);

  for (const [index, photo] of photos.entries()) {
    const { error } = await supabase
      .from("photos")
      .update({
        position: places[index],
        // Anything not one of the named layouts means "let the page decide",
        // which is the right answer almost always.
        layout: photo.layout && named.has(photo.layout) ? photo.layout : null,
      })
      .eq("id", photo.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}
