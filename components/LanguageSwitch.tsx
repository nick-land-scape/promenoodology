"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { chooseLanguage } from "@/lib/site-actions/language";
import { LANGS, NAMED, PLAIN, SHORT, at, plainly, type Lang } from "@/lib/lang";

/**
 * English or French, under the handbook.
 *
 * Two words rather than a dropdown with flags in it. A flag is a country and a
 * language is not — French is not France here, it is Geneva and Versoix and half
 * the people this collective works with — and with two of anything a list you
 * can read is better than a control you have to open.
 *
 * They are links, not buttons, and that is what makes the switch instant: Next
 * prefetches a link that comes into view, so the other language is already in
 * the browser before anybody presses it. As buttons — router.push inside a
 * transition — the page was fetched from the beginning on every switch, and it
 * showed.
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

  return (
    <div className="nav-langs" role="group" aria-label="Language">
      {LANGS.map((one) =>
        one === lang ? (
          <span
            key={one}
            className="is-here"
            aria-current="true"
            lang={one === PLAIN ? "en" : one}
            title={NAMED[one]}
          >
            {SHORT[one]}
          </span>
        ) : (
          <Link
            key={one}
            href={at(one, here)}
            lang={one === PLAIN ? "en" : one}
            title={NAMED[one]}
            aria-label={NAMED[one]}
            onClick={() => remember(one)}
          >
            {SHORT[one]}
          </Link>
        ),
      )}
    </div>
  );
}
