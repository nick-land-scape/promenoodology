import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import type { Pickable } from "@/components/admin/Pick";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export default async function SheetsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: sheets }, { data: photos }] = await Promise.all([
    supabase
      .from("sheets")
      .select("id, slug, title, hook, words, needs, steps, photo_path, people_fed, position, published")
      .order("position")
      .returns<Row[]>(),
    supabase
      .from("photos")
      .select("path")
      .eq("published", true)
      .order("position")
      .returns<{ path: string }[]>(),
  ]);

  const pickable: Pickable[] = (photos ?? []).map((photo) => ({
    path: photo.path,
    url: mediaUrl(photo.path),
  }));

  return (
    <Head title="do it yourself" action={<BinLink table="sheets" />}>
      <p className="admin-intro">
        One sheet per kind of place: what it takes, what to do in what order, and a
        photograph of it having worked. These are the only pages here that anybody at
        all can open — no account, no login — because they are what we hand to
        somebody who has a courtyard and no idea it is possible. A new one starts
        hidden. The address is the thing people paste into messages, so pick it once
        and leave it alone.
      </p>

      <RowsEditor table="sheets" initial={sheets ?? []} photos={pickable} />
    </Head>
  );
}
