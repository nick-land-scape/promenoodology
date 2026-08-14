"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import Photo from "./Photo";
import { AdminLink, SessionButton } from "./SessionLink";

/** The four places most people are looking for. */
const MAIN = [
  { href: "/stories", label: "STORIES" },
  { href: "/resources", label: "RESOURCES" },
  { href: "/community", label: "COMMUNITY" },
  { href: "/about", label: "ABOUT US" },
];

/** The three you go to once you are interested. */
const MORE = [
  { href: "/join", label: "become a member" },
  { href: "/handbook", label: "handbook" },
  { href: "/donations", label: "the wall" },
];

export default function Nav() {
  const pathname = usePathname();


  // /stories/dinner-for-500 keeps STORIES marked as the section you are in.
  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="nav">
      {/* The mark is the way back to the front page. */}
      <Link href="/" className="nav-mark" aria-label="promeNOODology — home">
        <Photo
          src="/logo-mark.png"
          alt=""
          width={600}
          height={582}
          priority
          sizes="74px"
        />
      </Link>

      <div className="nav-links">
        {MAIN.map((link) => (
          <Fragment key={link.href}>
            <Link
              href={link.href}
              aria-current={current(link.href) ? "page" : undefined}
            >
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
