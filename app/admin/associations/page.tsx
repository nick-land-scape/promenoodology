import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import type { AssociationRow } from "@/lib/supabase/rows";
import { supabaseServer } from "@/lib/supabase/server";
import AssociationList, { type Partner } from "./AssociationList";

export default async function AssociationsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("associations")
    .select("id, name, url, logo_path, position, published")
    .order("position")
    .returns<AssociationRow[]>();

  const partners: Partner[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name ?? "",
    url: row.url ?? "",
    logo: row.logo_path,
    logoUrl: row.logo_path ? mediaUrl(row.logo_path) : null,
    published: row.published,
  }));

  return (
    <Head title="partners">
      <p className="admin-intro">
        The people we do this with who are not people: schools, festivals, councils, the association
        that lent us a kitchen. A name and a logo, because that is how an organisation is recognised.
      </p>
      <p className="admin-note">
        They stand under the names on the community page. A partner with no name is not shown, and a
        new one starts hidden until it has one.
      </p>
      <AssociationList initial={partners} />
    </Head>
  );
}
