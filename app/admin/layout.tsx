import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/admin/guard";
import { hasSupabase } from "@/lib/supabase/config";
import "./admin.css";

export const metadata: Metadata = {
  title: "Looking after the site",
  // Never in a search result, whatever happens.
  robots: { index: false, follow: false },
};

/**
 * The back of the house.
 *
 * It sits outside the (site) group, so it has none of the front of the house's
 * furniture — no menu top left, no turned contact details down the edge. What it
 * does keep is globals.css, because the colours and the two typefaces should be
 * the site's own and not a second set that drifts away from them.
 *
 * Nothing back here is ever cached: an editor who is shown a copy from a minute
 * ago will type the same change twice.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Without keys there is no database, so there is nothing to look after and
  // nobody to be an admin — the site is running off the files in /data.
  if (!hasSupabase()) return <Closed />;

  const admin = await requireAdmin();

  return <Shell who={admin.name || admin.email}>{children}</Shell>;
}

function Closed() {
  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">not connected</h1>
        <p className="page-intro">
          There is no database behind this copy of the site, so there is nothing back here to
          change. Everything you can see is coming from the files in <code>/data</code> and{" "}
          <code>/content</code>, which is exactly how it is meant to work until the keys are set.
        </p>
        <p className="page-note">
          Put <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in <code>.env.local</code>, restart, and this page turns into the back of the house.
        </p>
        <p>
          <Link href="/">back to the site</Link>
        </p>
      </div>
    </main>
  );
}
