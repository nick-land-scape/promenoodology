"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LANGS, NAMED, type Lang } from "@/lib/lang";
import { chooseLanguage } from "@/lib/site-actions/language";

/**
 * Which language you read us in, on your account.
 *
 * The website has the same choice in its menu; this is the one that sticks. A
 * cookie is one browser, and a member who chose French on a phone should not be
 * asked again on a laptop — so this writes it on the account, and the account
 * follows them to both.
 *
 * Deliberately near "your personal information" rather than buried under
 * settings: it is a fact about how somebody wants to be spoken to, which is the
 * same kind of thing as their name.
 *
 * It is not the same as the languages on your profile. Those are what you speak,
 * so that somebody can find whoever can talk to the neighbour who came out to
 * see what the noise was.
 */
export default function ReadingIn({
  chosen,
  words,
}: {
  chosen: Lang | null;
  /* Handed in rather than held here: the words the site says are looked up on
     the server, where the language is known. */
  words: { label: string; note: string };
}) {
  const router = useRouter();
  const [now, setNow] = useState<Lang | null>(chosen);
  const [pending, start] = useTransition();

  function choose(lang: Lang) {
    const before = now;
    setNow(lang);
    start(async () => {
      const answer = await chooseLanguage(lang);
      if (!answer.ok) {
        setNow(before);
        return;
      }
      /* This screen, again, rather than the whole site: every screen in the app
         is worked out per request anyway, so the only one that is stale is the
         one you are looking at. */
      router.refresh();
    });
  }

  return (
    <section className="app-section">
      <p className="app-label app-label-alone">{words.label}</p>
      <div className="reading-in">
        {LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            className={lang === now ? "pill pill-solid" : "pill"}
            aria-pressed={lang === now}
            disabled={pending}
            onClick={() => choose(lang)}
            lang={lang}
          >
            {NAMED[lang]}
          </button>
        ))}
      </div>
      <p className="app-note">{words.note}</p>
    </section>
  );
}
