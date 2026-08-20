import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { pageSpec } from "@/lib/admin/pages";
import { getPage, getPageHead } from "@/lib/source";
import PageWords from "./PageWords";

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
  const [page, head] = await Promise.all([getPage(spec.slug), getPageHead(spec.slug)]);

  return (
    <Head title={spec.name} back={{ href: "/admin/pages", label: "pages" }} view={spec.view}>
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
        }}
      />
    </Head>
  );
}
