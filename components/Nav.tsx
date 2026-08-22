"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useKnock } from "@/lib/knock";
import { at, type Lang } from "@/lib/lang";
import LanguageSwitch from "./LanguageSwitch";
import DarkSwitch from "./DarkSwitch";
import Photo from "./Photo";
import { SessionButton } from "./SessionLink";

export type NavLink = { href: string; label: string };

export default function Nav({
  main,
  more,
  lang,
}: {
  /** The bold links. Which pages these are is set in the back of the house. */
  main: NavLink[];
  /** The quieter second group underneath. */
  more: NavLink[];
  /** Which language the site is being read in. */
  lang: Lang;
}) {
  const pathname = usePathname();

  /**
   * The mark is the way home. Knock on it three times quickly and it is also the
   * way in — there is no sign-in link anywhere, on purpose. See lib/knock: going
   * home waits a moment, so the second and third knocks land on the same page as
   * the first.
   */
  const knock = useKnock(at(lang, "/account/sign-in"), at(lang, "/"));

  // /stories/dinner-for-500 keeps STORIES marked as the section you are in.
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="nav">
      <Link href={at(lang, "/")} className="nav-mark" aria-label="promeNOODology — home" onClick={knock}>
        <Photo src="/logo-mark.png" alt="" width={600} height={582} priority sizes="74px" />
      </Link>

      <div className="nav-links">
        {main.map((link) => (
          <Fragment key={link.href}>
            <Link href={at(lang, link.href)} aria-current={current(at(lang, link.href)) ? "page" : undefined}>
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
            href={at(lang, link.href)}
            aria-current={current(at(lang, link.href)) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}

        {/* Under the handbook, at the foot of the quiet group: it is a thing
            about how you are reading rather than a place to go. */}
        <LanguageSwitch lang={lang} />
        {/* The way into the back of the house used to be here. It is in the
            strip along the top now, on every page, where it also says who you
            are — two links to the same place is one link too many. */}
      </div>

      {/*
       * Top right on a phone, last line of the menu on a wide screen.
       *
       * "Make it dark" is in here rather than in the layout, and it has to be:
       * on a phone it sits to the left of this, and what is to its right is
       * sometimes a 34-pixel face and sometimes a hundred-pixel NEWSLETTER
       * button. Positioned against a guessed width it landed on top of the
       * button for everybody who was not signed in. In the same row, the row
       * does the arithmetic.
       *
       * On a wide screen it is still the floating thing in the bottom corner —
       * where an element sits in the markup and where it is drawn are different
       * questions, and CSS answers the second one.
       */}
      <div className="nav-session">
        <DarkSwitch />
        <SessionButton />
      </div>
    </nav>
  );
}
