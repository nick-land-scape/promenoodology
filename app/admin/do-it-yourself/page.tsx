import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsList, { type Listed } from "@/components/admin/RowsList";
import { requireAdmin } from "@/lib/admin/guard";
import { hay } from "@/lib/admin/find";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The sheets, as a list of the places they are about.
 *
 * They were all open at once, every field of every one, which is the shape the
 * back of the house has been growing out of everywhere: a sheet is a page of
 * writing with a photograph and eight steps on it, and three of those in a
 * column is a screen nobody can find anything in.
 */
export default async function SheetsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: sheets } = await supabase
    .from("sheets")
    .select("id, slug, title, hook, words, needs, steps, people_fed, published")
    .is("deleted_at", null)
    .order("position")
    .returns<
      {
        id: string;
        slug: string;
        title: string;
        hook: string | null;
        words: string | null;
        needs: string | null;
        steps: string | null;
        people_fed: number | null;
        published: boolean;
      }[]
    >();

  const rows: Listed[] = (sheets ?? []).map((sheet) => {
    const steps = (sheet.steps ?? "").split("\n").filter((line) => line.trim()).length;
    return {
      id: sheet.id,
      title: sheet.title,
      meta:
        [
          sheet.slug ? `/do-it-yourself/${sheet.slug}` : "no address yet",
          steps ? `${steps} step${steps === 1 ? "" : "s"}` : "no steps yet",
          sheet.hook || null,
        ]
          .filter(Boolean)
          .join(" · "),
      hay: hay(sheet.title, sheet.slug, sheet.hook, sheet.words, sheet.needs, sheet.steps),
      published: sheet.published,
    };
  });

  return (
    <Head title="do it yourself" action={<BinLink table="sheets" />}>
      <p className="admin-intro">
        One sheet per kind of place: what it takes, what to do in what order, and a photograph of it
        having worked. These are the only pages here that anybody at all can open — no account, no
        login — because they are what we hand to somebody who has a courtyard and no idea it is
        possible. A new one starts hidden, and its address is the thing people paste into messages,
        so pick it once and leave it alone.
      </p>

      <RowsList
        table="sheets"
        initial={rows}
        at="/admin/do-it-yourself"
        what="a sheet"
        untitled="Untitled sheet"
      />
    </Head>
  );
}
