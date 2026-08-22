import Head from "@/components/admin/Head";
import PageWords from "@/app/admin/pages/[slug]/PageWords";
import { Icon } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { headOfPage } from "@/lib/admin/head-of-page";
import { supabaseServer } from "@/lib/supabase/server";
import { createLeaf } from "./actions";
import LeafList, { type LeafRow } from "./LeafList";

type Block = { kind: string; text: string };

/**
 * The handbook, page by page.
 *
 * It was one field with two thousand words in it. What it is on the site now is
 * a book you turn, and a book is written a page at a time — so this is the list
 * of pages, in the order they are read in.
 */
export default async function HandbookPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const top = await headOfPage("handbook");

  const { data: leaves } = await supabase
    .from("handbook_pages")
    .select("id, title, blocks, published")
    .is("deleted_at", null)
    .order("position")
    .returns<{ id: string; title: string; blocks: Block[] | null; published: boolean }[]>();

  const rows: LeafRow[] = (leaves ?? []).map((leaf) => {
    const blocks = (leaf.blocks ?? []).filter((block) => block.text?.trim());
    const opening =
      blocks.find((block) => block.kind !== "heading")?.text ?? blocks[0]?.text ?? "";

    return {
      id: leaf.id,
      title: leaf.title || blocks.find((block) => block.kind === "heading")?.text || "",
      opening: opening.length > 110 ? `${opening.slice(0, 110)}…` : opening,
      words: blocks.reduce((sum, block) => sum + block.text.trim().split(/\s+/).length, 0),
      published: leaf.published,
    };
  });

  return (
    <Head
      title="the handbook"
      action={
        <form action={createLeaf}>
          <button type="submit" className="admin-btn">
            <Icon name="plus" />
            new page
          </button>
        </form>
      }
    >
      <p className="admin-intro">
        The book we give away, a page at a time. The order is the book: drag a page, or type a
        number, and keep it. A page is a page of the real thing — on a phone it is one screen, on a
        laptop it is one half of the open book — so a page that runs long is a page that will need
        splitting.
      </p>

      {/* The title, the line under it, and the handful of things the book decides
          about itself — how it turns, what its paper is, whether the sheets and
          the form are offered underneath. They were on a second screen under
          Pages, which meant two places for one handbook and no way of telling
          which one you were meant to be on. */}
      {top ? <PageWords spec={top.spec} initial={top.initial} /> : null}

      <LeafList initial={rows} />
    </Head>
  );
}
