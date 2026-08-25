"use client";

import { useState, useTransition } from "react";
import { agreeWith, answerIdea, suggestThis, takeDownIdea, type Idea } from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { useSay } from "./Words";

/**
 * What the club should do next, according to the club.
 *
 * A field, a list, and one number per line. Everything this deliberately is not
 * is in migration 0042: no way to vote an idea down, no thread under it, and one
 * answer per idea written by the club rather than argued about by it.
 *
 * The list is ordered by agreement rather than by date, which is the only thing
 * the votes are for — a suggestion box sorted by date is a list where the best
 * idea anybody has had sinks under whatever was written this morning.
 *
 * The number is a button and it is the whole interaction: pressed, you are one of
 * them; pressed again, you are not. Nothing anywhere says who disagreed, because
 * nothing anywhere knows.
 */
export default function Ideas({
  ideas,
  meId,
  admin,
}: {
  ideas: Idea[];
  meId: string;
  /** An admin sees the answer box under each one. Nobody else does. */
  admin: boolean;
}) {
  const say = useSay();
  const [words, setWords] = useState("");
  const [trouble, setTrouble] = useState("");
  const [said, setSaid] = useState("");
  const [pending, start] = useTransition();

  function send() {
    setTrouble("");
    setSaid("");
    start(async () => {
      const answer = await suggestThis(words);
      if (!answer.ok) {
        setTrouble(answer.error ?? say("idea.didNotWork"));
        return;
      }
      setWords("");
      setSaid(say("idea.thankYou"));
      void buzz("light");
    });
  }

  return (
    <>
      <form
        className="idea-write"
        onSubmit={(submit) => {
          submit.preventDefault();
          send();
        }}
      >
        <label className="visually-hidden" htmlFor="idea">
          {say("idea.yours")}
        </label>
        <textarea
          id="idea"
          value={words}
          onChange={(change) => setWords(change.target.value)}
          placeholder={say("idea.placeholder")}
          rows={2}
        />
        <button type="submit" className="pill pill-solid" disabled={pending || !words.trim()}>
          {pending ? "…" : say("idea.suggestIt")}
        </button>
      </form>

      {trouble ? <p className="app-error">{trouble}</p> : null}
      {said ? <p className="app-note idea-thanks">{said}</p> : null}

      {ideas.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("idea.nothingYet")}
        </p>
      ) : (
        <ul className="ideas">
          {ideas.map((idea) => (
            <One key={idea.id} idea={idea} mine={idea.byId === meId} admin={admin} />
          ))}
        </ul>
      )}
    </>
  );
}

function One({ idea, mine, admin }: { idea: Idea; mine: boolean; admin: boolean }) {
  const say = useSay();
  const [agreed, setAgreed] = useState(idea.agreed);
  const [votes, setVotes] = useState(idea.votes);
  const [gone, setGone] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [answer, setAnswer] = useState(idea.answer);
  const [state, setState] = useState(idea.state);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  if (gone) return null;

  function agree() {
    const now = !agreed;
    /* Moved before the server is asked, and put back if it says no. The number is
       the only thing on the screen that changes, and waiting a round trip to see
       it move makes a button feel broken. */
    setAgreed(now);
    setVotes((count) => count + (now ? 1 : -1));
    void buzz("light");
    start(async () => {
      const said = await agreeWith(idea.id, now);
      if (!said.ok) {
        setAgreed(!now);
        setVotes((count) => count + (now ? -1 : 1));
        setTrouble(said.error ?? say("idea.didNotWork"));
      }
    });
  }

  return (
    <li className="idea">
      {/* The count is the button. A separate arrow beside a number is two things
          to aim at where there is one decision. */}
      <button
        type="button"
        className={agreed ? "idea-agree is-on" : "idea-agree"}
        onClick={agree}
        disabled={pending}
        aria-pressed={agreed}
        aria-label={say(agreed ? "idea.youAgree" : "idea.agree")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13">
          <path
            d="M12 5l7 8h-4v6h-6v-6H5z"
            fill={agreed ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <b>{votes}</b>
      </button>

      <div className="idea-body">
        <p className="idea-words">{idea.words}</p>
        <p className="row-meta">
          {idea.by}
          {idea.state !== "open" ? (
            <span className={`idea-state idea-state-${idea.state.replace(" ", "-")}`}>
              {say(`idea.${idea.state === "not now" ? "notNow" : idea.state}`)}
            </span>
          ) : null}
        </p>

        {/* The club's answer, where there is one. Everybody sees it; only an admin
            can write it. */}
        {answer ? (
          <p className="idea-answer">
            <em>{say("idea.theClubSays")}</em> {answer}
          </p>
        ) : null}

        {admin ? (
          answering ? (
            <form
              className="idea-answering"
              onSubmit={(submit) => {
                submit.preventDefault();
                setTrouble("");
                start(async () => {
                  const said = await answerIdea(idea.id, state, answer);
                  if (!said.ok) {
                    setTrouble(said.error ?? say("idea.didNotWork"));
                    return;
                  }
                  setAnswering(false);
                });
              }}
            >
              <div className="idea-states">
                {(["open", "doing", "done", "not now"] as const).map((one) => (
                  <button
                    key={one}
                    type="button"
                    className={state === one ? "chip is-on" : "chip"}
                    aria-pressed={state === one}
                    onClick={() => setState(one)}
                  >
                    {say(`idea.${one === "not now" ? "notNow" : one}`)}
                  </button>
                ))}
              </div>
              <textarea
                value={answer}
                onChange={(change) => setAnswer(change.target.value)}
                placeholder={say("idea.answerHint")}
                rows={2}
              />
              <div className="idea-feet">
                <button type="submit" className="pill pill-small pill-solid" disabled={pending}>
                  {say("idea.saveAnswer")}
                </button>
                <button
                  type="button"
                  className="pill pill-small"
                  onClick={() => setAnswering(false)}
                  disabled={pending}
                >
                  {say("report.neverMind")}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="post-action"
              onClick={() => setAnswering(true)}
              disabled={pending}
            >
              {answer ? say("idea.changeAnswer") : say("idea.answerIt")}
            </button>
          )
        ) : null}

        {mine || admin ? (
          <button
            type="button"
            className="post-action post-action-quiet"
            disabled={pending}
            onClick={() => {
              if (!confirm(say("idea.reallyTakeDown"))) return;
              start(async () => {
                const said = await takeDownIdea(idea.id);
                if (!said.ok) {
                  setTrouble(said.error ?? say("idea.didNotWork"));
                  return;
                }
                setGone(true);
              });
            }}
          >
            {say("idea.takeItDown")}
          </button>
        ) : null}

        {trouble ? <p className="app-error">{trouble}</p> : null}
      </div>
    </li>
  );
}
