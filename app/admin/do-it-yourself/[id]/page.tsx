import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import type { Pickable } from "@/components/admin/Pick";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/** One sheet, on its own page. */
export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseServer();

  const [{ data: sheet }, { data: photos }] = await Promise.all([
    supabase
      .from("sheets")
      .select("id, slug, title, hook, words, needs, steps, photo_path, people_fed, position, published")
      .is("deleted_at", null)
      .eq("id", id)
      .maybeSingle<Row>(),
    supabase
      .from("photos")
      .select("path")
      .eq("published", true)
      .is("deleted_at", null)
      .order("position")
      .returns<{ path: string }[]>(),
  ]);
  if (!sheet) notFound();

  const pickable: Pickable[] = (photos ?? []).map((photo) => ({
    path: photo.path,
    url: mediaUrl(photo.path),
  }));

  return (
    <Head
      title={String(sheet.title || "") || "Untitled sheet"}
      back={{ href: "/admin/pages/do-it-yourself", label: "do it yourself" }}
    >
      <RowsEditor
        table="sheets"
        initial={[sheet]}
        alone="/admin/pages/do-it-yourself"
        photos={pickable}
      />
    </Head>
  );
}
