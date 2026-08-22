import "server-only";
import { type PageSettings } from "./page-settings";
import { pageSpec, type PageSpec } from "./pages";
import { getPage, getPageHead } from "@/lib/source";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The top of a page, ready for the editor — wherever that editor is drawn.
 *
 * The handbook and the sheets are looked after in their own sections, because
 * that is where the writing is; their heading, the line under it and the
 * handful of things they decide about themselves were in a second place under
 * Pages, which meant two screens for one page and no way of telling which one
 * you were meant to be on. This is what lets the second screen be drawn inside
 * the first.
 */
export async function headOfPage(slug: string): Promise<{
  spec: PageSpec;
  initial: {
    title: string;
    lead: string;
    blocks: { kind: string; text: string }[];
    settings: PageSettings;
    fr: Record<string, string>;
  };
} | null> {
  const spec = pageSpec(slug);
  if (!spec) return null;

  const supabase = await supabaseServer();
  const [page, head, { data }] = await Promise.all([
    getPage(spec.slug),
    getPageHead(spec.slug),
    supabase
      .from("pages")
      .select("fr")
      .eq("slug", spec.slug)
      .maybeSingle<{ fr: Record<string, string> | null }>(),
  ]);

  return {
    spec,
    initial: {
      title: head.title || page?.title || spec.name,
      lead: head.lead || page?.lead || "",
      blocks:
        spec.kinds.length === 0
          ? []
          : page?.blocks?.length
            ? page.blocks
            : [{ kind: spec.kinds[0].value, text: "" }],
      settings: head.settings,
      fr: data?.fr ?? {},
    },
  };
}
