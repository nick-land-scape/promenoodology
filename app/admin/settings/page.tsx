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
