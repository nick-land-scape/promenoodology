"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useKnock } from "@/lib/knock";
import Photo from "./Photo";
import { SessionButton } from "./SessionLink";

export type NavLink = { href: string; label: string };

export default function Nav({
  main,
  more,
}: {
  /** The bold links. Which pages these are is set in the back of the house. */
  main: NavLink[];
  /** The quieter second group underneath. */
  more: NavLink[];
}) {
  const pathname = usePathname();

  /**
   * The mark is the way home. Knock on it three times quickly and it is also the
   * way in — there is no sign-in link anywhere, on purpose. See lib/knock: going
   * home waits a moment, so the second and third knocks land on the same page as
   * the first.
   */
  const knock = useKnock("/account/sign-in", "/");

  // /stories/dinner-for-500 keeps STORIES marked as the section you are in.
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="nav">
      <Link href="/" className="nav-mark" aria-label="promeNOODology — home" onClick={knock}>
        <Photo src="/logo-mark.png" alt="" width={600} height={582} priority sizes="74px" />
      </Link>

      <div className="nav-links">
        {main.map((link) => (
          <Fragment key={link.href}>
            <Link href={link.href} aria-current={current(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
            {/* A page with filters of its own puts them in here. */}
            <div className="nav-submenu" id={`submenu-${link.href.slice(1)}`} />
          </Fragment>
        ))}
      </div>

      <div className="nav-more">
        {more.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        {/* The way into the back of the house used to be here. It is in the
            strip along the top now, on every page, where it also says who you
            are — two links to the same place is one link too many. */}
      </div>

      {/* Top right on a phone, last line of the menu on a wide screen. */}
      <div className="nav-session">
        <SessionButton />
      </div>
    </nav>
  );
}
