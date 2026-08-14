"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Photo from "./Photo";

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
  const nav = useRef<HTMLElement>(null);

  // Publishes the menu's real height as --nav-height, so a page's own submenu
  // can sit under it without anybody guessing at a number.
  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        "--nav-height",
        `${Math.ceil(element.getBoundingClientRect().height)}px`,
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // /stories/dinner-for-500 keeps STORIES marked as the section you are in.
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="nav" ref={nav}>
      {/* The mark is the way back to the front page. */}
      <Link href="/" className="nav-mark" aria-label="promeNOODology — home">
        <Photo src="/logo-mark.png" alt="" width={600} height={582} priority sizes="74px" />
      </Link>

      <div className="nav-links">
        {MAIN.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
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
      </div>
    </nav>
  );
}
