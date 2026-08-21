"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/session";

/**
 * A thin line along the top, for admins only.
 *
 * Two things it does. It says who you are, so it is obvious at a glance that you
 * are looking at the site as somebody who can change it — and it hands you the
 * way in, which otherwise meant knowing that the archive is edited under
 * Photographs and the community page under People. Nobody should hold that map
 * in their head while reading the site.
 *
 * It is fixed, so it also has to make room for itself: everything the stylesheet
 * pins to the top of the window is offset by --admin-bar, which is zero until
 * this mounts and sets the class that gives it a height. That way the site's own
 * layout has one number to respect rather than a special case per element.
 */

/** Where this page is edited, or null for a page that is not. */
function whereToEdit(pathname: string): { href: string; what: string } | null {
  // A story is edited at its own address, so this one is a pattern.
  const story = /^\/stories\/([^/]+)$/.exec(pathname);
  if (story) return { href: `/admin/stories/${story[1]}`, what: "edit this story" };

  const map: Record<string, { href: string; what: string }> = {
    "/stories": { href: "/admin/stories", what: "edit the stories" },
    "/archive": { href: "/admin/photos", what: "edit the archive" },
    "/community": { href: "/admin/people", what: "edit the people" },
    "/about": { href: "/admin/pages/about", what: "edit this page" },
    "/handbook": { href: "/admin/pages/handbook", what: "edit this page" },
    "/newsletter": { href: "/admin/newsletter", what: "the newsletter list" },
    "/donations": { href: "/admin/donations", what: "edit the wall" },
  };

  return map[pathname] ?? null;
}

export default function AdminBar() {
  const session = useSession();
  const pathname = usePathname();
  const admin = Boolean(session?.admin);

  // The class carries the bar's height into the stylesheet, so the menu and the
  // pages below move down by exactly as much as the bar takes.
  useEffect(() => {
    const root = document.documentElement;
    if (admin) root.classList.add("admin-bar");
    else root.classList.remove("admin-bar");
    return () => root.classList.remove("admin-bar");
  }, [admin]);

  // Nothing is drawn until we know: a bar that appears under somebody's finger,
  // moving the whole page down as it lands, is worse than one a moment late.
  if (!admin) return null;

  const first = (session?.name ?? "").split(" ")[0];
  const place = whereToEdit(pathname);

  return (
    <div className="admin-bar-strip">
      <span className="admin-bar-who">{first ? `Hey ${first}` : "Hey"}</span>
      {place ? (
        <Link href={place.href} className="admin-bar-link admin-bar-here">
          {place.what} →
        </Link>
      ) : null}
      <Link href="/admin" className="admin-bar-link">
        look after the site →
      </Link>
    </div>
  );
}
