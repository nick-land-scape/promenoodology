import Link from "next/link";

/**
 * The top of a section: where you are, the way back, and the one or two things
 * you can do from here. It sticks to the top of the page so the title is still
 * there halfway down a long list.
 */
export default function Head({
  title,
  back,
  view,
  action,
  children,
}: {
  title: string;
  /** { href, label } for the crumb above the title. */
  back?: { href: string; label: string };
  /** The page on the public site this section looks after. */
  view?: string;
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
        <div className="admin-head-actions">
          {view ? (
            <a href={view} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-quiet">
              look at it ↗
            </a>
          ) : null}
          {action}
        </div>
      </header>
      <div className="admin-body">{children}</div>
    </>
  );
}
