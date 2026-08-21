import Link from "next/link";
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
  const lines: PageLine[] = site.map((page) => ({
    slug: page.slug,
    visible: page.visible,
    navLabel: page.navLabel ?? "",
    group: page.group,
    position: page.position,
    hasWords: words.has(page.slug),
  }));

  return (
    <Head title="pages">
      <p className="admin-intro">
        Every page of the website: whether it is on the site at all, what the menu calls it, and
        which part of the menu it sits in. <strong>Edit page →</strong> opens everything about a page you
        can change: the heading, the line under it, the words where it has any, and the few things
        that page decides for itself. <strong>View ↗</strong> opens the page on the site itself, in
        a new tab.
      </p>
      <p className="admin-note">
        A page that is off is off for everybody: out of the menu, out of the sitemap, and a
        &ldquo;this page took a different walk&rdquo; at its own address. To read one over before it
        opens, use its edit page → rather than turning it on.
      </p>
      {/*
       * The front page, above the list and not in it.
       *
       * It is a page and it belongs here — it was a menu item of its own for an
       * afternoon, which put the film behind the logo in the same list as the
       * archive and the newsletter. But it is not one of the rows below either:
       * there is nothing to call it in the menu, nowhere to move it to, and no
       * turning it off. So it is named, and it has the same two doors as
       * everything else.
       */}
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">the front page</h2>
            <p className="admin-panel-hint">
              The film behind the logo. Add more than one and every visitor gets one of them.
            </p>
          </div>
          <span className="admin-doors">
            <Link
              href="/admin/pages/home"
              className="admin-btn"
              title="The film behind the logo: swap it, or add more and let the page pick"
            >
              edit page →
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn"
              title="Opens the front page itself, in a new tab"
            >
              view ↗
            </a>
          </span>
        </div>
      </div>

      <PageList initial={lines} />
    </Head>
  );
}
