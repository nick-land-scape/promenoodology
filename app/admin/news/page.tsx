import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: news } = await supabase
    .from("news")
    .select("id, published_on, title, text, published")
    .order("published_on", { ascending: false })
    .returns<Row[]>();

  return (
    <Head title="news" view="/app">
      <p className="admin-intro">
        Short notes on the front screen of the members&rsquo; app, newest first. They are for people
        who are already coming — what changed, what to bring, what happened last time.
      </p>
      <RowsEditor table="news" initial={news ?? []} />
    </Head>
  );
}
