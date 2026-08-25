import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { BINNABLE, DAYS_IN_THE_BIN } from "@/lib/admin/bin";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import TheBin, { type Binned } from "./TheBin";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "The bin" };

/**
 * Everything that has been deleted and has not gone yet.
 *
 * One page rather than one per section. Seven bins would mean seven places to
 * look for the thing you cannot find, and the question anybody actually has is
 * "where did that go", not "which table was it in".
 */
export default async function BinPage({
  searchParams,
}: {
  searchParams: Promise<{ of?: string }>;
}) {
  await requireAdmin();
  const { of } = await searchParams;
  const supabase = await supabaseServer();

  const found = await Promise.all(
    BINNABLE.map(async (spec) => {
      const columns = ["id", "deleted_at", spec.title, spec.meta, ...(spec.files ?? [])]
        .filter(Boolean)
        .join(", ");

      const { data } = await supabase
        .from(spec.table)
        .select(columns)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: true })
        .returns<Record<string, string | null>[]>();

      return (data ?? []).map((row) => ({
        table: spec.table,
        section: spec.section,
        href: spec.href,
        one: spec.one,
        id: row.id as string,
        deletedAt: row.deleted_at as string,
        name: (row[spec.title] ?? "").toString().slice(0, 90),
        meta: spec.meta ? (row[spec.meta] ?? "").toString() : "",
        // Only a photograph, a logo and a film have one, and only they are
        // worth showing: the rest are words, and the words are the name. A film
        // shows its poster — an mp4 in an <img> is a blank square.
        picture: (() => {
          const column = spec.picture ?? spec.files?.[0];
          const path = column ? row[column] : null;
          return path ? mediaUrl(path) : null;
        })(),
      }));
    }),
  );

  const binned: Binned[] = found.flat();

  return (
    <Head title="the bin">
      <p className="admin-intro">
        Everything deleted in the last {DAYS_IN_THE_BIN} days. Put something back and it returns
        exactly where it was; leave it and it goes for good on the day it says. Nothing here is on
        the site — that is not a filter somebody has to remember, it is the database refusing.
      </p>
      <TheBin binned={binned} only={of ?? ""} />
    </Head>
  );
}
