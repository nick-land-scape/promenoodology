import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: news }, { data: people }] = await Promise.all([
    supabase
      .from("news")
      .select("id, published_on, title, text, authors, pinned, published")
      .order("pinned", { ascending: false })
      .order("published_on", { ascending: false })
      .returns<Row[]>(),
    supabase
      .from("profiles")
      .select("id, name, country, photo_path")
      .order("name")
      .returns<{ id: string; name: string; country: string | null; photo_path: string | null }[]>(),
  ]);

  return (
    <Head title="news" action={<BinLink table="news" />}>
      <p className="admin-intro">
        Short notes on the front screen of the members&rsquo; app, newest first — or whichever one is
        pinned, which stays at the top until another one takes its place. They are for people who are
        already coming: what changed, what to bring, what happened last time.
      </p>
      <RowsEditor
        table="news"
        initial={news ?? []}
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
