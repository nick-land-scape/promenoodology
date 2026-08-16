"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useRef } from "react";
import Photo from "./Photo";
import { AdminLink, SessionButton } from "./SessionLink";

/** The four places most people are looking for. */
const MAIN = [
  { href: "/stories", label: "STORIES" },
  { href: "/resources", label: "RESOURCES" },
  { href: "/community", label: "COMMUNITY" },
  { href: "/about", label: "ABOUT US" },
];

/** The ones you go to once you are interested. */
const MORE = [{ href: "/handbook", label: "handbook" }];

/* The public bank account is not listed anywhere for now. The page is still
   there at /donations for anybody given the address; put it back in MORE when
   it should be public. */

/** Knocks on the mark, and how long you have to make them. */
const KNOCKS = 3;
const KNOCK_WINDOW = 1500;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const knocks = useRef(0);
  const last = useRef(0);

  // /stories/dinner-for-500 keeps STORIES marked as the section you are in.
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /**
   * The mark is the way home. Knock on it three times quickly and it is also
   * the way in — there is no sign-in link anywhere, on purpose. The first click
   * still goes home; only the third is swallowed. The count survives that
   * because the menu is part of the layout and never unmounts.
   */
  const knock = (event: React.MouseEvent) => {
    const now = Date.now();
    knocks.current = now - last.current > KNOCK_WINDOW ? 1 : knocks.current + 1;
    last.current = now;

    if (knocks.current >= KNOCKS) {
      knocks.current = 0;
      event.preventDefault();
      router.push("/account/sign-in");
    }
  };

  return (
    <nav className="nav">
      <Link href="/" className="nav-mark" aria-label="promeNOODology — home" onClick={knock}>
        <Photo src="/logo-mark.png" alt="" width={600} height={582} priority sizes="74px" />
      </Link>

      <div className="nav-links">
        {MAIN.map((link) => (
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
        {MORE.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        <AdminLink />
      </div>

      {/* Top right on a phone, last line of the menu on a wide screen. */}
      <div className="nav-session">
        <SessionButton />
      </div>
    </nav>
  );
}
