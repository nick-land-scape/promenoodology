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
 * It sits *in* the form on "your personal information", as a field among the
 * fields, because that is what it is: a fact about how somebody wants to be
 * spoken to, of the same kind as their name and their city. Above the form as its
 * own section it read as a setting for the app rather than as an answer about the
 * person, and looked stuck to the top of the screen.
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
    <div className="field">
      <span className="field-label">{words.label}</span>
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
      <em className="field-said">{words.note}</em>
    </div>
  );
}
