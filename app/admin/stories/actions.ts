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
  /**
   * Labels. Not the tag above: that one is a key, and the photographs and
   * quotes find their story through it. These are the words you would use to
   * say what the story was about.
   */
  topics: string[];
  /** Who was there, by profile. */
  people: string[];
  /** Which organisations it was made with. */
  partners: string[];
  /** Where it happened, for the map. Null: not on the map. */
  lat: number | null;
  lng: number | null;
  /** Roughly how many people ate. The evidence for the whole argument. */
  people_fed: number | null;
  /** The French of this story, keyed by the column it translates. */
  fr?: Record<string, unknown>;
};

/** A blank story, opened straight away so there is somewhere to type. */
export async function createStory(): Promise<void> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from("stories")
    .select("position")
    .is("deleted_at", null)
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
  /* The bin counts. A slug or a tag held by a story waiting in the bin is still
     held — handing it to a new story would make restoring the old one put two
     stories at one address, and the archive would not know whose photographs it
     was holding. */
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
    .is("deleted_at", null)
    .eq("id", input.id)
    .maybeSingle<{ tag: string }>();

  // Labels, tidied: trimmed, emptied of blanks, de-duplicated case-blind, and
  // capped — a tag list is a handful of words, and anything longer is somebody
  // pasting a paragraph into the wrong field.
  const topics: string[] = [];
  for (const said of input.topics) {
    const one = said.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!one) continue;
    if (topics.some((have) => have.toLowerCase() === one.toLowerCase())) continue;
    topics.push(one);
    if (topics.length >= 12) break;
  }

  const { error } = await supabase
    .from("stories")
    .update({
      slug,
      title,
      tag,
      topics,
      subtitle: input.subtitle.trim() || null,
      featured_photo_id: input.featured_photo_id,
      place: input.place.trim() || null,
      /* Where it happened, and roughly how many ate. Both nullable, and both mean
         "nobody has said" rather than nought when they are. */
      lat: input.lat,
      lng: input.lng,
      people_fed: input.people_fed,
      happened: input.happened.trim() || null,
      made_with: input.made_with.trim() || null,
      sections,
      published: input.published,
      fr: onlyWhatIsWritten(input.fr ?? {}),
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

  /* Who was there, and who it was made with.
   *
   * Cleared and rewritten rather than compared row by row: the lists are a
   * dozen rows at most, and working out the difference is more code and more
   * ways to be wrong than simply saying what the answer is now. */
  const only = (ids: string[]) => ids.filter((id, at) => id && ids.indexOf(id) === at);

  const { error: clearedPeople } = await supabase
    .from("story_people")
    .delete()
    .eq("story_id", input.id);
  if (clearedPeople) return failed(clearedPeople);

  const people = only(input.people).map((profile_id, at) => ({
    story_id: input.id,
    profile_id,
    position: at + 1,
  }));
  if (people.length > 0) {
    const { error: written } = await supabase.from("story_people").insert(people);
    if (written) return failed(written);
  }

  const { error: clearedPartners } = await supabase
    .from("story_partners")
    .delete()
    .eq("story_id", input.id);
  if (clearedPartners) return failed(clearedPartners);

  const partners = only(input.partners).map((association_id, at) => ({
    story_id: input.id,
    association_id,
    position: at + 1,
  }));
  if (partners.length > 0) {
    const { error: written } = await supabase.from("story_partners").insert(partners);
    if (written) return failed(written);
  }

  refreshSite();
  return { ok: true, slug };
}

export type BlockInput = {
  kind: "heading" | "text" | "photo" | "space";
  words: string;
  photo_id: string | null;
  layout: string | null;
  fr?: Record<string, string>;
};

/**
 * The page, as somebody arranged it.
 *
 * Cleared and rewritten rather than compared block by block. A story is twenty
 * or thirty blocks, working out which of them moved is more code than saying
 * what the answer is now, and every one of them would have to carry an id
 * through the editor for no other reason. The two statements are one call, so a
 * failure to write leaves the delete unfinished — which is why the delete is
 * second, and the insert is checked first.
 */
export async function saveStoryPage(storyId: string, blocks: BlockInput[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const LAYOUTS = new Set(["wide", "narrow", "left", "right", "tall"]);

  const rows = blocks
    .map((block, at) => ({
      story_id: storyId,
      position: at + 1,
      kind: block.kind,
      words: block.kind === "heading" || block.kind === "text" ? block.words.trim() : "",
      photo_id: block.kind === "photo" ? block.photo_id : null,
      layout: block.kind === "photo" && block.layout && LAYOUTS.has(block.layout) ? block.layout : null,
      fr: onlyWhatIsWritten(block.fr ?? {}),
    }))
    // A block with nothing in it is a block somebody started and left; it should
    // not reach the page, and it should not be saved either.
    .filter((row) => row.kind === "space" || (row.kind === "photo" ? row.photo_id : row.words));

  const { error: cleared } = await supabase.from("story_blocks").delete().eq("story_id", storyId);
  if (cleared) return failed(cleared);

  if (rows.length > 0) {
    const { error } = await supabase.from("story_blocks").insert(rows);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/**
 * Put photographs from the archive into a story, or take one out again.
 *
 * A photograph belongs to a story by its tag — that is how the archive filters
 * and how the story finds its own — so joining one is writing the tag, and
 * unlinking is clearing it. Neither touches the file: a photograph taken out of
 * a story is still in the archive, which is the whole difference between
 * unlinking and deleting, and the reason both are offered.
 */
export async function tagPhotos(tag: string, ids: string[]): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  if (!tag || ids.length === 0) return { ok: true };

  const { error } = await supabase.from("photos").update({ story_tag: tag }).in("id", ids);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

export async function untagPhoto(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase.from("photos").update({ story_tag: null }).eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
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

  /* Into the bin. A story is the most expensive thing to lose in here — an
     evening's writing and an arrangement of thirty photographs — so it is the
     last thing that should go on one press. */
  const { error } = await supabase
    .from("stories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
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
    .is("deleted_at", null)
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

/**
 * The French, with the fields nobody has filled in taken out.
 *
 * The whole of the fallback rests on absence meaning "not translated", so an
 * empty box has to leave nothing behind: an empty string saved would put a blank
 * on the French page where the English would have stood in, and there would be
 * no way back to it from the form.
 */
function onlyWhatIsWritten(fr: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fr)) {
    if (typeof value === "string") {
      const said = value.trim();
      if (said) out[key] = said;
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) out[key] = value;
      continue;
    }
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * The same story again, hidden, with its page and its people.
 *
 * A story is the heaviest thing in here to make: the words, the arrangement,
 * who was there, who it was made with. A second one about the same evening in
 * another town starts from all of that and changes half of it.
 *
 * Its address and its tag are minted fresh, because both are unique and the tag
 * is what photographs look for — a copy sharing a tag would quietly claim the
 * original's photographs. Which means the copy has no photographs, and should
 * not: they are of the thing that happened, and this is about a different one.
 */
export async function duplicateStory(id: string): Promise<Saved & { slug?: string }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: was } = await supabase
    .from("stories")
    .select("*")
    .is("deleted_at", null)
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();
  if (!was) return { ok: false, error: "That story is not there any more." };

  const { data: last } = await supabase
    .from("stories")
    .select("position")
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const stub = `untitled-${suffix()}`;
  const called = String(was.title ?? "").trim();

  const { data: made, error } = await supabase
    .from("stories")
    .insert({
      slug: stub,
      tag: stub,
      title: called ? `${called} (copy)` : "Untitled",
      subtitle: was.subtitle ?? null,
      place: was.place ?? null,
      lat: was.lat ?? null,
      lng: was.lng ?? null,
      people_fed: was.people_fed ?? null,
      happened: was.happened ?? null,
      made_with: was.made_with ?? null,
      sections: was.sections ?? [],
      topics: was.topics ?? [],
      fr: was.fr ?? {},
      position: (last?.position ?? 0) + 1,
      // A copy is a draft. One that went live the moment it was made would be
      // the site publishing something nobody had finished writing.
      published: false,
      /* No cover: it names a photograph of the original, and the copy has none
         of its own until somebody tags them across. */
      featured_photo_id: null,
    })
    .select("id, slug")
    .single<{ id: string; slug: string }>();
  if (error) return failed(error);

  // The page as it was arranged, and who was there. The photographs the blocks
  // point at still belong to the original, which is right: a block is a place on
  // a page, and the picture in it is the archive's.
  for (const [child, key] of [
    ["story_blocks", "story_id"],
    ["story_people", "story_id"],
    ["story_partners", "story_id"],
  ] as const) {
    const { data: parts } = await supabase
      .from(child)
      .select("*")
      .eq(key, id)
      .order("position")
      .returns<Record<string, unknown>[]>();

    const rows = (parts ?? []).map((part) => {
      const { id: _was, created_at: _made, ...rest } = part;
      return { ...rest, [key]: made.id };
    });
    if (rows.length > 0) await supabase.from(child).insert(rows);
  }

  refreshSite();
  return { ok: true, slug: made.slug };
}
