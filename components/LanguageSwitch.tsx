"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { chooseLanguage } from "@/lib/site-actions/language";
import { LANGS, NAMED, PLAIN, SHORT, at, plainly, type Lang } from "@/lib/lang";

/**
 * The other language, as one button beside the paper switch.
 *
 * Not a dropdown with flags in it. A flag is a country and a language is not —
 * French is not France here, it is Geneva and Versoix and half the people this
 * collective works with. And not two words either, which is what it was: with two
 * languages a switch has exactly one job, and showing both made the reader work out
 * which of them was the link and which was where they already were.
 *
 * So it says the language you are *not* reading in, in the same 34-point box as the
 * light-and-dark switch it stands next to, because they are the same kind of thing:
 * how you are reading, rather than where you are going.
 *
 * Each one goes to *this* page in its language rather than to the front, because
 * somebody reading about an evening who switches wants that evening in French.
 *
 * The choice is written down twice. The cookie, by hand and immediately, so the
 * proxy stops guessing from the browser on the very next request. And, for a
 * member, their account — so it follows them to the app and to whatever they
 * open the site on next. Neither one holds the navigation up.
 */
export default function LanguageSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const here = plainly(pathname);
  const [, start] = useTransition();

  function remember(next: Lang) {
    // A year, and the whole site: this is a preference, not a session.
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    start(async () => {
      await chooseLanguage(next);
    });
  }

  /* The other one. With two languages a switch has one job — go to the other — and
     two words side by side made the reader do the arithmetic of working out which
     of them was a link. */
  const other = LANGS.find((one) => one !== lang) ?? PLAIN;

  return (
    /* A link, not a button, and that is what makes it instant: Next prefetches a
       link that is on the screen, so the other language is already in the browser
       before anybody presses. As a button — a push inside a transition — the page
       was fetched from the beginning on every switch, and it showed. */
    <Link
      className="lang-switch"
      href={at(other, here)}
      lang={other === PLAIN ? "en" : other}
      title={NAMED[other]}
      aria-label={NAMED[other]}
      onClick={() => remember(other)}
    >
      <b aria-hidden="true">{SHORT[other]}</b>
      {/* The whole name, for the hover that has room for it — the same way the
          paper switch beside it says what it does. */}
      <span>{NAMED[other]}</span>
    </Link>
  );
}
