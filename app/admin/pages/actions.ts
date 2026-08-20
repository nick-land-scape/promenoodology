"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { pageSpec } from "@/lib/admin/pages";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Saving the words of a fixed-shape page.
 *
 * The row is written whether or not one was ever there: until the first save,
 * these pages come out of the files the site shipped with, and the first save is
 * what moves them into the database.
 */
export async function savePageWords(input: {
  slug: string;
  title: string;
  lead: string;
  blocks: { kind: string; text: string }[];
}): Promise<Saved> {
  const admin = await requireAdminAction();

  const spec = pageSpec(input.slug);
  if (!spec) return { ok: false, error: `There is no “${input.slug}” page.` };

  // Only the kinds this page's design knows how to draw. Anything else would
  // land on the page as an unstyled paragraph.
  const allowed = new Set(spec.kinds.map((kind) => kind.value));
  const blocks = input.blocks
    .map((block) => ({ kind: block.kind, text: block.text.trim() }))
    .filter((block) => block.text && allowed.has(block.kind));

  if (blocks.length === 0) {
    return {
      ok: false,
      error: "A page with nothing on it would fall back to the original words. Write something, or leave it as it is.",
    };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.from("pages").upsert(
    {
      slug: spec.slug,
      // The about page never shows its title, but the column is not null and
      // something has to be there for anybody reading the table by hand.
      title: input.title.trim() || spec.name,
      lead: spec.usesLead ? input.lead.trim() : "",
      blocks,
      updated_by: admin.id,
    },
    { onConflict: "slug" },
  );
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}

/**
 * Whether each page is on the site, what the menu calls it, and in what order.
 *
 * This is the one place a whole page can be taken off promeNOODology.com — out
 * of the menu, out of the sitemap and gone from its own address — so it is worth
 * being clear about: hidden means hidden from everybody, including whoever is
 * signed in. To look a page over before it opens, read it here in the words
 * editor and turn it on when it is ready.
 */
export async function savePageList(
  rows: {
    slug: string;
    visible: boolean;
    navLabel: string;
    group: "main" | "more" | "none";
    position: number;
  }[],
): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const groups = new Set(["main", "more", "none"]);

  for (const row of rows) {
    const label = row.navLabel.trim();
    const { error } = await supabase
      .from("pages")
      .update({
        visible: row.visible,
        // No label means it is simply not in the menu, whatever group it is in.
        nav_label: label || null,
        nav_group: groups.has(row.group) && label ? row.group : "none",
        nav_position: Number.isFinite(row.position) ? row.position : 99,
      })
      .eq("slug", row.slug);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}
