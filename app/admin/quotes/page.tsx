import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export default async function QuotesPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: quotes }, { data: stories }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, who, place, year, story_tag, text, published")
      // The bin is a place of its own; what is deleted is not in this list.
      .is("deleted_at", null)
      .order("created_at")
      .returns<Row[]>(),
    supabase
      .from("stories")
      .select("tag, title")
      .order("position")
      .returns<{ tag: string; title: string }[]>(),
  ]);

  return (
    <Head title="quotes" action={<BinLink table="quotes" />}>
      <p className="admin-intro">
        The things people said. On the archive wall they are the pauses between the photographs, so a
        long one is fine and a short one is better. If the name matches somebody on the community
        page, their face appears next to it on its own.
      </p>
      <RowsEditor table="quotes" initial={quotes ?? []} stories={stories ?? []} />
    </Head>
  );
}
