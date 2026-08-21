import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { PAGES } from "@/lib/admin/pages";
import { getSitePages } from "@/lib/site-pages";
import PageList, { type PageLine } from "./PageList";

export default async function PagesPage() {
  await requireAdmin();

  const site = await getSitePages();
  // The two that are made of words. Every page has an editor either way — a
  // heading, the line under it, and whatever that page may decide about itself.
  const words = new Set<string>(
    PAGES.filter((spec) => spec.kinds.length > 0).map((spec) => spec.slug),
  );

  // What each page is made of, said in words — because "the archive" being
  // uneditable here is not a gap, it is that the archive is its photographs.
  const madeOf: Record<string, string> = {
    stories: "made of the stories",
    archive: "made of the photographs and quotes",
    community: "made of the people",
    newsletter: "a form — the words are in the code",
    donations: "made of the wall",
    about: "words you can edit",
    handbook: "words you can edit",
  };

  const lines: PageLine[] = site.map((page) => ({
    slug: page.slug,
    visible: page.visible,
    navLabel: page.navLabel ?? "",
    group: page.group,
    position: page.position,
    hasWords: words.has(page.slug),
    madeOf: madeOf[page.slug] ?? "",
  }));

  return (
    <Head title="pages">
      <p className="admin-intro">
        Every page of the website: whether it is on the site at all, what the menu calls it, and
        which part of the menu it sits in. <strong>Edit →</strong> opens everything about a page you
        can change: the heading, the line under it, the words where it has any, and the few things
        that page decides for itself. <strong>View ↗</strong> opens the page on the site itself, in
        a new tab.
      </p>
      <p className="admin-note">
        A page that is off is off for everybody: out of the menu, out of the sitemap, and a
        &ldquo;this page took a different walk&rdquo; at its own address. To read one over before it
        opens, use its edit → rather than turning it on.
      </p>
      <PageList initial={lines} />
    </Head>
  );
}
