"use client";

import { usePathname, useRouter } from "next/navigation";
import { LANGS, NAMED, PLAIN, at, plainly, type Lang } from "@/lib/lang";

/**
 * English or French, under the handbook.
 *
 * Two words rather than a dropdown with flags in it. A flag is a country and a
 * language is not — French is not France here, it is Geneva and Versoix and half
 * the people this collective works with — and with two of anything a list you
 * can read is better than a control you have to open.
 *
 * It goes to *this* page in the other language rather than to the front, because
 * somebody reading about an evening who switches language wants that evening in
 * French, not the home page. And it writes down what was chosen, so the guess the
 * proxy makes from the browser is only ever made once — a choice said out loud
 * beats anything inferred, for ever.
 */
export default function LanguageSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const router = useRouter();

  const here = plainly(pathname);

  function choose(next: Lang) {
    // A year, and the whole site: this is a preference, not a session.
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(at(next, here));
  }

  return (
    <div className="nav-langs" role="group" aria-label="Language">
      {LANGS.map((one) => (
        <button
          key={one}
          type="button"
          className={one === lang ? "is-here" : undefined}
          aria-current={one === lang ? "true" : undefined}
          onClick={() => choose(one)}
          // The name of a language, in that language: nobody looking for French
          // is looking for the word "French".
          lang={one === PLAIN ? "en" : one}
        >
          {NAMED[one]}
        </button>
      ))}
    </div>
  );
}
