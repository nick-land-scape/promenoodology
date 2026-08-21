import Link from "next/link";

/**
 * The top of a section: where you are, the way back, and the one or two things
 * you can do from here. It sticks to the top of the page so the title is still
 * there halfway down a long list.
 */
export default function Head({
  title,
  back,
  action,
  children,
}: {
  title: string;
  /** { href, label } for the crumb above the title. */
  back?: { href: string; label: string };
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <header className="admin-head">
        <div>
          {back ? (
            <p className="admin-back" style={{ margin: 0 }}>
              <Link href={back.href}>← {back.label}</Link>
            </p>
          ) : null}
          <h1 className="admin-title">{title}</h1>
        </div>
        {/*
         * Only what you can *do* here — the way out to the site is in the strip
         * along the top, the same one on every page.
         *
         * Always rendered, even empty: a section whose one action lives in a
         * client component puts it here through a portal (see InHead), and a
         * portal needs something to aim at.
         */}
        <div className="admin-head-actions" id="admin-head-slot">
          {action}
        </div>
      </header>
      <div className="admin-body">{children}</div>
    </>
  );
}
