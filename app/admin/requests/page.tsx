import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";
import type { ApplicationRow } from "@/lib/supabase/rows";
import RequestsInbox from "./RequestsInbox";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export default async function RequestsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ApplicationRow[]>();

  return (
    <Head title="requests">
      <p className="admin-intro">
        People asking us for a hand with something of their own, newest first. Help can be money for
        materials, pots and tables to borrow, or two of us turning up on the day.
      </p>
      <p className="admin-note">
        Nobody outside can read these. Answering happens by writing to whatever they left as a way of
        reaching them — the four answers here are only so the next person knows where it got to.
      </p>
      <RequestsInbox initial={data ?? []} />
    </Head>
  );
}
