import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { pageSpec } from "@/lib/admin/pages";
import { getPage, getPageHead } from "@/lib/source";
import { supabaseServer } from "@/lib/supabase/server";
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
    </Head>
  );
}
