import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { getTheme } from "@/lib/theme";
import ThemeEditor from "./ThemeEditor";

export default async function SettingsPage() {
  await requireAdmin();
  const theme = await getTheme();

  return (
    <Head title="theme">
      <p className="admin-intro">
        What the site is made of: two typefaces and five colours. Everything here can be left alone,
        and anything changed can be put back — an empty field means the value the site was drawn
        with, not a blank.
      </p>
      <ThemeEditor initial={theme} />
    </Head>
  );
}
