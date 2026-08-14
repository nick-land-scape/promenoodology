"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/projects", label: "PROJECTS" },
  { href: "/resources", label: "RESOURCES" },
  { href: "/community", label: "COMMUNITY" },
  { href: "/about", label: "ABOUT US" },
];

export default function Nav() {
  const pathname = usePathname();
  // /projects/dinner-for-500 keeps PROJECTS marked as the section you are in.
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="nav">
      {/* The mark is the way back to the front page. */}
      <Link href="/" className="nav-mark" aria-label="promeNOODology — home">
        <Image src="/logo-mark.png" alt="" width={600} height={582} priority sizes="74px" />
      </Link>
      <div className="nav-links">
        {LINKS.map((link) => (
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
