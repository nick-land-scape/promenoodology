import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";
import LeafEditor from "./LeafEditor";

type Block = { kind: string; text: string };

export default async function EditLeafPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: leaf } = await supabase
    .from("handbook_pages")
    .select("id, position, title, blocks")
    .is("deleted_at", null)
    .eq("id", id)
    .maybeSingle<{ id: string; position: number; title: string; blocks: Block[] | null }>();
  if (!leaf) notFound();

  const blocks = leaf.blocks ?? [];

  return (
    <Head
      title={leaf.title || blocks.find((block) => block.kind === "heading")?.text || "a page"}
      back={{ href: "/admin/pages/handbook", label: "the handbook" }}
    >
      <LeafEditor
        id={leaf.id}
        initial={{
          title: leaf.title ?? "",
          // A page with nothing on it opens with somewhere to type rather than
          // with a button that makes somewhere to type.
          blocks: blocks.length > 0 ? blocks : [{ kind: "heading", text: "" }],
        }}
      />
    </Head>
  );
}
