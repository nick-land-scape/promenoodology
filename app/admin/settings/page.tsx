import Link from "next/link";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import { getTheme } from "@/lib/theme";
import Housekeeping from "./Housekeeping";
import ThemeEditor from "./ThemeEditor";

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [theme, { data: photos }] = await Promise.all([
    getTheme(),
    supabase
      .from("photos")
      .select("id, path, width, height")
    .is("deleted_at", null)
      .order("position")
      .returns<{ id: string; path: string; width: number; height: number }[]>(),
  ]);

  return (
    <Head title="settings">
      <p className="admin-intro">
        What the site is made of: two typefaces and five colours. Everything here can be left alone,
        and anything changed can be put back — an empty field means the value the site was drawn
        with, not a blank.
      </p>
      <ThemeEditor initial={theme} />

      {/* The words the site says on its own behalf. Its own page: it is a long
          list, it is edited rarely, and it has nothing to do with the colours. */}
      <section className="admin-panel">
        <header className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">translation</h2>
            <p className="admin-panel-hint">
              The French of the words the site says itself, kept apart from the words anybody wrote.
            </p>
          </div>
          <Link href="/admin/settings/translation" className="admin-btn">
            the words →
          </Link>
        </header>
      </section>

      {/* Housekeeping rather than daily work, which is why it is down here and
          not at the top of the archive: it earns its keep after an import and
          costs a screenful of clutter every other day of the year. */}
      <Housekeeping
        photos={(photos ?? []).map((one) => ({
          id: one.id,
          path: one.path,
          url: mediaUrl(one.path),
          width: one.width,
          height: one.height,
        }))}
      />
    </Head>
  );
}
