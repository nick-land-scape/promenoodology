"use client";

import { useState, useTransition } from "react";
import Photo from "../Photo";
import { unblockThem } from "@/app/app/actions";

export type Blocked = { id: string; name: string; photo: string | null };

/**
 * The people you have blocked, each with the way back.
 *
 * The undo is a plain button and asks nothing: unblocking is not a decision that
 * needs guarding — the worst it does is put somebody back on your feed, and the
 * block that put them there was made in a moment and can be made again in one.
 * A confirmation here would be the app being careful on the wrong side.
 */
export default function Blocked({
  rows,
  words,
}: {
  rows: Blocked[];
  words: { undo: string; didNotWork: string };
}) {
  const [gone, setGone] = useState<string[]>([]);
  const left = rows.filter((row) => !gone.includes(row.id));

  return (
    <ul className="blocked">
      {left.map((row) => (
        <One key={row.id} row={row} words={words} onGone={() => setGone((n) => [...n, row.id])} />
      ))}
    </ul>
  );
}

function One({
  row,
  words,
  onGone,
}: {
  row: Blocked;
  words: { undo: string; didNotWork: string };
  onGone: () => void;
}) {
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  return (
    <li className="row">
      <span className="avatar" aria-hidden="true">
        {row.photo ? <Photo src={row.photo} alt="" fill sizes="44px" /> : initials(row.name)}
      </span>
      <span className="row-body">
        <span className="row-title">{row.name}</span>
        {trouble ? <span className="row-said">{trouble}</span> : null}
      </span>
      <button
        type="button"
        className="pill pill-small"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const answer = await unblockThem(row.id);
            if (!answer.ok) {
              setTrouble(answer.error ?? words.didNotWork);
              return;
            }
            onGone();
          })
        }
      >
        {words.undo}
      </button>
    </li>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
