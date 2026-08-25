import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsList, { type Listed } from "@/components/admin/RowsList";
import { requireAdmin } from "@/lib/admin/guard";
import { hay } from "@/lib/admin/find";
import { pretty } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/**
 * The notes, as a list of their titles.
 *
 * A year of them is fifty short pieces of writing, and fifty textareas open at
 * once is not a page anybody can read.
 */
export default async function NewsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: news }, { data: people }] = await Promise.all([
    supabase
      .from("news")
      .select("id, published_on, title, text, authors, pinned, published")
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("published_on", { ascending: false })
      .returns<
        {
          id: string;
          published_on: string | null;
          title: string;
          text: string | null;
          authors: string[] | null;
          pinned: boolean;
          published: boolean;
        }[]
      >(),
    supabase
      .from("profiles")
      .select("id, name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  const named = new Map((people ?? []).map((one) => [one.id, one.name]));

  const rows: Listed[] = (news ?? []).map((note) => {
    const wroteIt = (note.authors ?? []).map((id) => named.get(id) ?? "").filter(Boolean);
    // The first line of the note itself, so the list says what each one is
    // about rather than only what it is called.
    const opening = (note.text ?? "").trim().split("\n")[0] ?? "";

    return {
      id: note.id,
      title: note.title,
      meta:
        [
          note.published_on ? pretty(note.published_on) : "no date yet",
          wroteIt.length ? wroteIt.join(", ") : null,
          opening ? (opening.length > 90 ? `${opening.slice(0, 90)}…` : opening) : null,
        ]
          .filter(Boolean)
          .join(" · "),
      hay: hay(
        note.title,
        note.text,
        wroteIt.join(" "),
        note.published_on ? pretty(note.published_on) : "",
        note.published_on,
      ),
      published: note.published,
      pinned: note.pinned,
    };
  });

  return (
    <Head title="news" action={<BinLink table="news" />}>
      <p className="admin-intro">
        Short notes on the front screen of the members&rsquo; app, newest first — or whichever one is
        pinned, which stays at the top until another one takes its place. They are for people who are
        already coming: what changed, what to bring, what happened last time.
      </p>

      <RowsList
        table="news"
        initial={rows}
        at="/admin/news"
        what="a note"
        untitled="Untitled note"
      />
    </Head>
  );
}
