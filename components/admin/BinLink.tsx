import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { binnable } from "@/lib/admin/bin";
import { supabaseServer } from "@/lib/supabase/server";
import { Icon } from "./ui";

/**
 * "3 in the bin →", in a section's heading, and nothing at all when it is empty.
 *
 * A bin that is always there is a bin nobody reads; one that appears the moment
 * something is in it is a bin that answers the only question anybody asks of it,
 * which is "where did that go". It links to the bin filtered to this section,
 * because somebody standing in the archive is looking for a photograph.
 */
export default async function BinLink({ table }: { table: string }) {
  await requireAdmin();
  const spec = binnable(table);
  if (!spec) return null;

  const supabase = await supabaseServer();
  const { count } = await supabase
    .from(spec.table)
    .select("id", { count: "exact", head: true })
    .not("deleted_at", "is", null);

  if (!count) return null;

  return (
    <Link href={`/admin/bin?of=${spec.table}`} className="admin-binlink">
      <Icon name="trash" />
      {count} in the bin
    </Link>
  );
}
