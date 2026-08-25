"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { plainly } from "@/lib/lang";
import { useEffect } from "react";
import { useSession } from "@/lib/session";

/**
 * A thin line along the top, for whoever is signed in.
 *
 * It began as an admin's strip and that was too narrow a reading. Signing in is
 * a state, and a site that does not acknowledge it leaves you wondering whether
 * it took: a member had nothing at all to show they had arrived except a small
 * face in a corner of the menu. So everybody signed in gets their name and the
 * way to their own details, and an admin gets two more links — the way into the
 * back of the house, and the way into editing whichever page they are reading.
 *
 * It is fixed, so it also has to make room for itself: everything the stylesheet
 * pins to the top of the window is offset by --bar-top, which is zero until this
 * mounts and sets the class that gives it a height. That way the site's own
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

export default function TopBar() {
  const session = useSession();
  /* Stripped of its language: a prepared page knows itself as /en/stories even
     where the reader's address bar says /stories, and this bar's one job is to
     recognise the page it is sitting on. See plainly(). */
  const pathname = plainly(usePathname());
  const signedIn = Boolean(session?.signedIn);
  const admin = Boolean(session?.admin);

  // The class carries the bar's height into the stylesheet, so the menu and the
  // pages below move down by exactly as much as the bar takes.
  useEffect(() => {
    const root = document.documentElement;
    if (signedIn) root.classList.add("has-top-bar");
    else root.classList.remove("has-top-bar");
    return () => root.classList.remove("has-top-bar");
  }, [signedIn]);

  // Nothing is drawn until we know: a bar that appears under somebody's finger,
  // moving the whole page down as it lands, is worse than one a moment late.
  if (!signedIn) return null;

  const first = (session?.name ?? "").split(" ")[0];
  // Only an admin can edit a page, so only an admin is offered the way.
  const place = admin ? whereToEdit(pathname) : null;
  const here = pathname === "/account";

  return (
    <div className="top-bar">
      <span className="top-bar-who">{first ? `Hey ${first}` : "Hey"}</span>

      {place ? (
        <Link href={place.href} className="top-bar-link top-bar-here">
          {place.what} →
        </Link>
      ) : null}

      {/*
       * A member's one link, and the reason the strip exists for them at all:
       * signing in should show you something.
       *
       * Not offered to an admin — they already have it in the menu, with their
       * own face beside it, and four links on one strip is a strip nobody
       * reads. Not offered while you are standing on it either.
       */}
      {admin || here ? null : (
        <Link href="/account" className="top-bar-link top-bar-here">
          your details →
        </Link>
      )}

      {admin ? (
        <Link href="/admin" className="top-bar-link">
          look after the site →
        </Link>
      ) : null}
    </div>
  );
}
