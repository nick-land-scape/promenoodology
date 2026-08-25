"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useKnock } from "@/lib/knock";
import { at, plainly, type Lang } from "@/lib/lang";
import ContactPop from "./ContactPop";
import LanguageSwitch from "./LanguageSwitch";
import DarkSwitch from "./DarkSwitch";
import Photo from "./Photo";
import { SessionButton } from "./SessionLink";

export type NavLink = { href: string; label: string };

/* The newsletter's own name. Every other word in this menu comes from the back
   of the house, because every other word is a page somebody put there; the
   newsletter is not in the menu table, so it says its name here. */
const POST: Record<Lang, string> = { en: "newsletter", fr: "la lettre" };

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

  /* Which section you are in, marked in purple.
   *
   * Both sides are stripped of their language before they are compared, because
   * the two are not written in the same alphabet: the links are made with at(),
   * which gives English no prefix, while the address a prepared page was built
   * under is /en/events even when the reader's own address bar says /events. Left
   * as they were, the mark simply never appeared on an English page.
   *
   * /stories/dinner-for-500 keeps STORIES marked as the section you are in — but
   * the front page marks only itself, or it would be lit on every page there is. */
  const here = plainly(pathname);
  const current = (href: string) => {
    const to = plainly(href);
    if (to === "/") return here === "/";
    return here === to || here.startsWith(`${to}/`);
  };

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

        {/* The newsletter, under the handbook, at every width and whoever is
            reading.
            
            It used to be drawn twice and never both at once: this link on a
            phone, and on a wide screen the session row instead — which showed
            *either* the newsletter or your own face. That made the two the same
            slot, and they are not the same thing. Somebody signed in still wants
            the newsletter; signing in is not a way of unsubscribing from it.
            
            So it is a menu item like the handbook, and the session row below is
            only ever about who you are. */}
        <Link href={at(lang, "/newsletter")} className="nav-post">
          {POST[lang]}
        </Link>

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
        {/* Language and paper together, because they are the same kind of thing:
            how you are reading rather than where you are going. On a phone that
            is the strip along the top, which is where somebody looks for it —
            under the handbook at the foot of a long menu it was three scrolls
            from anywhere. */}
        {/* The two of them in one box, and that box is what sits in the corner.
            They are the same kind of control — how you are reading — and they are
            the same shape, so they belong side by side. In one row rather than two
            fixed corners for a plain reason: the paper switch grows to say its own
            name, and something anchored to its left would have been slid over. On
            a phone the box is `display: contents`, so both of them go back to being
            what they were in the strip along the top. */}
        <div className="corner-switches">
          <LanguageSwitch lang={lang} />
          <DarkSwitch />
        </div>
        {/* Getting in touch, beside the newsletter and dressed the same: one word
            in a ring. On a wide screen the addresses are still the lane up the
            left margin and this is not rendered at all. */}
        <ContactPop />
        <SessionButton />
      </div>
    </nav>
  );
}
