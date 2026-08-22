"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/site-actions/account";
import DarkSwitch from "@/components/DarkSwitch";
import { GROUPS, sectionsIn, viewFor } from "@/lib/admin/sections";
import { Icon } from "./ui";

/**
 * The menu of the back of the house.
 *
 * A column down the left on a wide screen; on a phone the same links on one
 * line that scrolls sideways, with the mark and the way out at either end. It
 * lives in the layout, so it does not blink when you move between sections.
 */
export default function Shell({
  who,
  children,
}: {
  who: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const here = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  /* The page on the site that whatever you are looking at ends up on. It used
     to be a button inside every section's own header, which meant every section
     had to remember to pass it — and it sat where a section's own actions
     belong. One strip, one place, and every section gets it for nothing. */
  const view = viewFor(pathname);
  const first = who.split(" ")[0];

  return (
    <div className="admin">
      <div className="admin-top">
        <span className="admin-top-who">{first ? `Hey ${first}` : "Hey"}</span>
        {view ? (
          <a
            href={view}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-top-link admin-top-here"
          >
            look at it ↗
          </a>
        ) : null}
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-top-link">
          the whole site ↗
        </a>
      </div>

      <aside className="admin-side">
        <Link href="/admin" className="admin-mark" aria-label="The back of the house">
          {/* Not next/image: it is 34 pixels of logo in a menu that is always
              there, and optimising it would cost a request to save nothing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={600} height={582} />
        </Link>

        <nav className="admin-nav">
          <div className="admin-group">
            <Link href="/admin" className="admin-link" aria-current={here("/admin") ? "page" : undefined}>
              <Icon name="home" />
              everything
            </Link>
          </div>

          {GROUPS.map((group) => (
            <div key={group.key} className="admin-group">
              <p className="admin-group-label">{group.label}</p>
              {sectionsIn(group.key).map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="admin-link"
                  aria-current={here(section.href) ? "page" : undefined}
                >
                  <Icon name={section.icon} />
                  {section.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-foot">
          {who ? <p className="admin-who">{who}</p> : null}
          <form action={signOut}>
            <button type="submit">
              <Icon name="out" />
              <span>sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">{children}</main>

      {/* The same switch as on the site: the choice belongs to the screen, and
          the back of the house is on the same screen. */}
      <DarkSwitch />
    </div>
  );
}
