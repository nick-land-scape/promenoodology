import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

export default async function QuotesPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: quotes }, { data: stories }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, who, place, year, story_tag, text, published")
      .order("created_at")
      .returns<Row[]>(),
    supabase
      .from("stories")
      .select("tag, title")
      .order("position")
      .returns<{ tag: string; title: string }[]>(),
  ]);

  return (
    <Head title="quotes">
      <p className="admin-intro">
        The things people said. On the archive wall they are the pauses between the photographs, so a
        long one is fine and a short one is better. If the name matches somebody on the community
        page, their face appears next to it on its own.
      </p>
      <RowsEditor table="quotes" initial={quotes ?? []} stories={stories ?? []} />
    </Head>
  );
}
