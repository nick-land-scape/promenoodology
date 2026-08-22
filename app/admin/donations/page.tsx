import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

export default async function DonationsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: donations } = await supabase
    .from("donations")
    .select("id, given_on, who, amount, note, published")
    // The bin is a place of its own; what is deleted is not in this list.
    .is("deleted_at", null)
    .order("given_on", { ascending: false })
    .returns<Row[]>();

  return (
    <Head title="the wall" action={<BinLink table="donations" />}>
      <p className="admin-intro">
        Every gift, one by one, newest first. There is deliberately no total on the page and none
        here either: it is a list of people who made something possible, not a thermometer.
      </p>
      <p className="admin-note">
        Leave the name empty for somebody who would rather stay anonymous — the wall says
        &ldquo;someone&rdquo; instead. The page itself is not in the menu yet, so only people given
        the address can find it.
      </p>
      <RowsEditor table="donations" initial={donations ?? []} />
    </Head>
  );
}
