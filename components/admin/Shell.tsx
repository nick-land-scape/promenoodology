"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(site)/account/actions";
import { GROUPS, sectionsIn } from "@/lib/admin/sections";
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

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin" className="admin-mark" aria-label="The back of the house">
          {/* Not next/image: it is 34 pixels of logo in a menu that is always
              there, and optimising it would cost a request to save nothing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={600} height={582} />
          <span>
            looking
            <br />
            after the site
          </span>
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
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="eye" />
            <span>the site ↗</span>
          </a>
          <form action={signOut}>
            <button type="submit">
              <Icon name="out" />
              <span>sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
