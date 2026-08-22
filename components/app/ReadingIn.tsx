"use client";

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
export default function ReadingIn({ chosen }: { chosen: Lang | null }) {
  const [now, setNow] = useState<Lang | null>(chosen);
  const [pending, start] = useTransition();

  function choose(lang: Lang) {
    const before = now;
    setNow(lang);
    start(async () => {
      const answer = await chooseLanguage(lang);
      if (!answer.ok) setNow(before);
    });
  }

  return (
    <section className="app-section">
      <p className="app-label app-label-alone">the language you read us in</p>
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
      <p className="app-note">
        It follows your account, so it is the same here and on the website. Anything nobody has
        translated yet is shown in English.
      </p>
    </section>
  );
}
