"use client";

import { useState, useTransition } from "react";
import { answerIdea, takeDownIdea } from "@/app/app/actions";

export type IdeaLine = {
  id: string;
  words: string;
  by: string;
  when: string;
  votes: number;
  state: "open" | "doing" | "done" | "not now";
  answer: string;
  answeredBy: string;
};

const STATES = ["open", "doing", "done", "not now"] as const;

/**
 * One suggestion, its count, and the box the answer goes in.
 *
 * The actions are the app's own rather than a second pair written for a desk: an
 * answer written here and an answer written on a phone are the same row, and the
 * rule that only an admin may touch it lives in the database either way.
 */
export default function IdeaRows({ rows }: { rows: IdeaLine[] }) {
  return (
    <ul className="admin-rows">
      {rows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </ul>
  );
}

function Row({ row }: { row: IdeaLine }) {
  const [state, setState] = useState(row.state);
  const [answer, setAnswer] = useState(row.answer);
  const [saved, setSaved] = useState("");
  const [gone, setGone] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  if (gone) return null;

  return (
    <li className="admin-row idea-row">
      <div className="idea-row-head">
        <span className="idea-row-count">{row.votes}</span>
        <div>
          <p className="idea-row-words">{row.words}</p>
          <p className="idea-row-who">
            {row.by} · {new Date(row.when).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
            {row.answeredBy ? ` · answered by ${row.answeredBy}` : ""}
          </p>
        </div>
      </div>

      <div className="idea-row-states">
        {STATES.map((one) => (
          <button
            key={one}
            type="button"
            className={state === one ? "admin-button admin-button-on" : "admin-button"}
            aria-pressed={state === one}
            onClick={() => setState(one)}
          >
            {one}
          </button>
        ))}
      </div>

      <textarea
        className="idea-row-answer"
        value={answer}
        onChange={(change) => setAnswer(change.target.value)}
        placeholder="What the club has decided, and why. Members see this."
        rows={2}
      />

      <div className="idea-row-feet">
        <button
          type="button"
          className="admin-button"
          disabled={pending}
          onClick={() => {
            setTrouble("");
            setSaved("");
            start(async () => {
              const said = await answerIdea(row.id, state, answer);
              if (!said.ok) {
                setTrouble(said.error ?? "That did not save.");
                return;
              }
              setSaved("Saved. Members see it now.");
            });
          }}
        >
          save the answer
        </button>

        <button
          type="button"
          className="admin-button admin-button-loud"
          disabled={pending}
          onClick={() => {
            if (!confirm("Take this suggestion down?")) return;
            start(async () => {
              const said = await takeDownIdea(row.id);
              if (!said.ok) {
                setTrouble(said.error ?? "That did not work.");
                return;
              }
              setGone(true);
            });
          }}
        >
          take it down
        </button>

        {saved ? <span className="admin-said">{saved}</span> : null}
      </div>

      {trouble ? <p className="admin-error">{trouble}</p> : null}
    </li>
  );
}
