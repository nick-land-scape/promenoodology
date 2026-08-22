import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/** One note, on its own page. */
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: note } = await supabase
    .from("news")
    .select("id, published_on, title, text, authors, pinned, published, fr")
    .is("deleted_at", null)
    .eq("id", id)
    .maybeSingle<Row>();
  if (!note) notFound();

  const { data: people } = await supabase
    .from("profiles")
    .select("id, name, country, photo_path")
    .order("name")
    .returns<{ id: string; name: string; country: string | null; photo_path: string | null }[]>();

  return (
    <Head
      title={String(note.title || "") || "Untitled note"}
      back={{ href: "/admin/news", label: "news" }}
    >
      <RowsEditor
        table="news"
        initial={[note]}
        alone="/admin/news"
        people={(people ?? []).map((one) => ({
          value: one.id,
          label: one.name,
          note: one.country || undefined,
          image: one.photo_path ? mediaUrl(one.photo_path) : undefined,
        }))}
      />
    </Head>
  );
}
