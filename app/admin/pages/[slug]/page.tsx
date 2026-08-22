import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { pageSpec } from "@/lib/admin/pages";
import { getPage, getPageHead } from "@/lib/source";
import { supabaseServer } from "@/lib/supabase/server";
import { Icon } from "@/components/admin/ui";
import RowsList, { type Listed } from "@/components/admin/RowsList";
import { hay } from "@/lib/admin/find";
import { createLeaf } from "@/app/admin/handbook/actions";
import LeafList, { type LeafRow } from "@/app/admin/handbook/LeafList";
import PageWords from "./PageWords";

/** Whatever French has been written for this page, and {} where none has. */
async function frenchOf(slug: string): Promise<Record<string, string>> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("pages")
    .select("fr")
    .eq("slug", slug)
    .maybeSingle<{ fr: Record<string, string> | null }>();
  return data?.fr ?? {};
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const spec = pageSpec(slug);
  if (!spec) notFound();



  // Whatever is on the page right now — from the database if it has been saved,
  // otherwise the words the site shipped with, so editing starts from something
  // rather than from nothing.
  const [page, head, french] = await Promise.all([
    getPage(spec.slug),
    getPageHead(spec.slug),
    // The French as it stands, so the editor can show what has been written and
    // what has not. Asked for directly: everything else on this page reads the
    // site's own language, and this is the one thing that has to see both.
    frenchOf(spec.slug),
  ]);

  /*
   * Two pages are made of more than a heading and a line.
   *
   * The handbook is made of pages, each written on its own; do it yourself is
   * made of sheets. Both used to be sections of their own in the menu, which put
   * the words of a page in one place and the top of it in another — two screens
   * for one page and no telling which one you were meant to be on. They are here
   * now, under the page they belong to, and the menu is shorter for it.
   */
  const made = spec.slug === "handbook" ? await theHandbook() : spec.slug === "do-it-yourself" ? await theSheets() : null;

  return (
    <Head title={spec.name} back={{ href: "/admin/pages", label: "pages" }}>
      <p className="admin-intro">{spec.blurb}</p>
      <PageWords
        spec={spec}
        initial={{
          title: head.title || page?.title || spec.name,
          lead: head.lead || page?.lead || "",
          blocks:
            spec.kinds.length === 0
              ? []
              : page?.blocks?.length
                ? page.blocks
                : [{ kind: spec.kinds[0].value, text: "" }],
          settings: head.settings,
          fr: french,
        }}
      />

      {made}
    </Head>
  );
}

/** The handbook, page by page, under its own settings. */
async function theHandbook() {
  const supabase = await supabaseServer();
  const { data: leaves } = await supabase
    .from("handbook_pages")
    .select("id, title, blocks, published")
    .is("deleted_at", null)
    .order("position")
    .returns<{ id: string; title: string; blocks: { kind: string; text: string }[] | null; published: boolean }[]>();

  const rows: LeafRow[] = (leaves ?? []).map((leaf) => {
    const blocks = (leaf.blocks ?? []).filter((block) => block.text?.trim());
    const opening = blocks.find((block) => block.kind !== "heading")?.text ?? blocks[0]?.text ?? "";
    return {
      id: leaf.id,
      title: leaf.title || blocks.find((block) => block.kind === "heading")?.text || "",
      opening: opening.length > 110 ? `${opening.slice(0, 110)}…` : opening,
      words: blocks.reduce((sum, block) => sum + block.text.trim().split(/\s+/).length, 0),
      published: leaf.published,
    };
  });

  return (
    <section style={{ marginTop: 30 }}>
      <div className="admin-panel-head" style={{ border: 0, padding: "0 0 12px" }}>
        <div>
          <h2 className="admin-panel-name">the pages of it</h2>
          <p className="admin-panel-hint">
            The order is the book. It is the same writing whether it is turned as a book or read
            as one column — that is decided by “as a book” above.
          </p>
        </div>
        <form action={createLeaf}>
          <button type="submit" className="admin-btn">
            <Icon name="plus" />
            new page
          </button>
        </form>
      </div>
      <LeafList initial={rows} />
    </section>
  );
}

/** The sheets, under theirs. */
async function theSheets() {
  const supabase = await supabaseServer();
  const { data: sheets } = await supabase
    .from("sheets")
    .select("id, slug, title, hook, words, needs, steps, published")
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
        published: boolean;
      }[]
    >();

  const rows: Listed[] = (sheets ?? []).map((sheet) => {
    const steps = (sheet.steps ?? "").split("\n").filter((line) => line.trim()).length;
    return {
      id: sheet.id,
      title: sheet.title,
      meta: [
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
    <section style={{ marginTop: 30 }}>
      <div className="admin-panel-head" style={{ border: 0, padding: "0 0 12px" }}>
        <div>
          <h2 className="admin-panel-name">the sheets</h2>
          <p className="admin-panel-hint">
            One per kind of place. A new one starts hidden, and its address is what people paste
            into messages — pick it once and leave it alone.
          </p>
        </div>
      </div>
      <RowsList
        table="sheets"
        initial={rows}
        at="/admin/do-it-yourself"
        what="a sheet"
        untitled="Untitled sheet"
      />
    </section>
  );
}
