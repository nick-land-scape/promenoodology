"use client";

import { useState, useTransition } from "react";
import { tellUs } from "@/app/app/actions";
import { useSay } from "./Words";

const KINDS = [
  { key: "note", label: "tell.aWord", hint: "tell.aWordHint" },
  { key: "bug", label: "tell.aBug", hint: "tell.aBugHint" },
  { key: "idea", label: "tell.anIdea", hint: "tell.anIdeaHint" },
] as const;

/**
 * Saying something to us, from inside the app.
 *
 * Three kinds, because they are read differently: a bug is a job, an idea is a
 * decision, and a word is a person. One field for each of them — asking somebody
 * to fill in six boxes about a bug is how you get no bug reports.
 *
 * The screen and the browser go along with a bug, quietly and only for a bug:
 * "it does not work on my phone" is only useful when we know which phone. It is
 * said out loud on the form rather than collected silently.
 */
export default function TellUs() {
  const say = useSay();
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("note");
  const [words, setWords] = useState("");
  const [said, setSaid] = useState("");
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  const chosen = KINDS.find((one) => one.key === kind)!;

  if (said) {
    return (
      <div className="app-section">
        <p className="post-text">{said}</p>
        <button
          type="button"
          className="pill pill-small"
          onClick={() => {
            setSaid("");
            setWords("");
          }}
        >
          say something else
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="segmented segmented-three" role="tablist" aria-label={say("tell.whatKind")}>
        {KINDS.map((one) => (
          <button
            key={one.key}
            type="button"
            role="tab"
            aria-selected={kind === one.key}
            onClick={() => setKind(one.key)}
          >
            {say(one.label)}
          </button>
        ))}
      </div>

      <form
        className="app-section"
        onSubmit={(submit) => {
          submit.preventDefault();
          setTrouble("");
          start(async () => {
            const answer = await tellUs(
              kind,
              words,
              // Where they were and what they were holding — only for a bug.
              kind === "bug" ? document.referrer || "the app" : "",
              kind === "bug" ? navigator.userAgent : "",
            );
            if (!answer.ok) {
              setTrouble(answer.error ?? say("tell.didNotSend"));
              return;
            }
            setSaid(say(kind === "bug" ? "tell.thanksBug" : "tell.thanks"));
          });
        }}
      >
        <p className="app-note" style={{ paddingBottom: 10 }}>
          {say(chosen.hint)}
          {kind === "bug" ? ` ${say("tell.alsoSent")}` : null}
        </p>

        <textarea
          className="tellus"
          rows={7}
          value={words}
          onChange={(change) => setWords(change.target.value)}
          placeholder={
            kind === "bug"
              ? say("tell.bugEg")
              : kind === "idea"
                ? say("tell.ideaEg")
                : "…"
          }
          aria-label={say("tell.whatToSay")}
        />

        {trouble ? <p className="app-error">{trouble}</p> : null}

        <div className="form-actions">
          <button
            type="submit"
            className="pill pill-solid pill-wide"
            disabled={pending || words.trim().length < 3}
          >
            {say(pending ? "tell.sending" : "tell.sendIt")}
          </button>
        </div>
      </form>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("tell.orFindUs")}</h2>
        </div>
        <a className="wide-row" href="https://www.instagram.com/promenoodology/" target="_blank" rel="noreferrer">
          <span>@promeNOODology on Instagram</span>
          <span aria-hidden="true">↗</span>
        </a>
        <a className="wide-row" href="mailto:info@promeNOODology.com">
          <span>info@promeNOODology.com</span>
          <span aria-hidden="true">›</span>
        </a>
      </section>
    </>
  );
}
