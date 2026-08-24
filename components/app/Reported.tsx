"use client";

import { useState, useTransition } from "react";
import Photo from "../Photo";
import { settleReport, takeDownReported } from "@/app/admin/reports/actions";

export type Flagged = {
  id: string;
  because: string;
  said: string;
  /** Who reported it, or null for the screening — which has no name. */
  by: string | null;
  whose: string;
  words: string;
  photos: string[];
  missing: boolean;
};

/**
 * The same two decisions the website's report screen offers, on a phone.
 *
 * The actions are the website's own — imported rather than rewritten, because a
 * report settled here and a report settled at a desk have to mean the same thing
 * and do the same thing to the pictures. Two implementations of "take it down"
 * is how one of them ends up leaving the photographs in the bucket.
 *
 * Each one disappears from the list as it is dealt with, rather than greying out
 * where it stood. A phone screen holds four of these; the ones left are what is
 * left to do.
 */
export default function Reported({
  rows,
  words,
}: {
  rows: Flagged[];
  words: {
    flaggedOnTheWayIn: string;
    reportedBy: string;
    writtenBy: string;
    gone: string;
    itIsFine: string;
    takeItDown: string;
    reallyTakeItDown: string;
    neverMind: string;
    didNotWork: string;
  };
}) {
  const [done, setDone] = useState<string[]>([]);
  const left = rows.filter((row) => !done.includes(row.id));

  return (
    <ul className="flagged">
      {left.map((row) => (
        <One key={row.id} row={row} words={words} onDone={() => setDone((n) => [...n, row.id])} />
      ))}
    </ul>
  );
}

function One({
  row,
  words,
  onDone,
}: {
  row: Flagged;
  words: Parameters<typeof Reported>[0]["words"];
  onDone: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  function settle() {
    setTrouble("");
    start(async () => {
      const answer = await settleReport(row.id, "looked at it on a phone, nothing wrong");
      if (!answer.ok) {
        setTrouble(answer.error ?? words.didNotWork);
        return;
      }
      onDone();
    });
  }

  function takeDown() {
    setTrouble("");
    start(async () => {
      const answer = await takeDownReported(row.id);
      if (!answer.ok) {
        setTrouble(answer.error ?? words.didNotWork);
        return;
      }
      onDone();
    });
  }

  return (
    <li className="flagged-one">
      <p className="flagged-why">{row.because}</p>
      <p className="row-meta">
        {row.by ? `${words.reportedBy} ${row.by}` : words.flaggedOnTheWayIn}
        {row.whose ? ` · ${words.writtenBy} ${row.whose}` : ""}
      </p>

      {row.said ? <p className="flagged-said">“{row.said}”</p> : null}

      {row.missing ? (
        <p className="app-note">{words.gone}</p>
      ) : (
        <>
          {row.words ? <p className="flagged-words">{row.words}</p> : null}
          {row.photos.length > 0 ? (
            <ul className="flagged-photos">
              {row.photos.map((src) => (
                <li key={src}>
                  <Photo src={src} alt="" width={900} height={900} sizes="86vw" />
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <div className="flagged-does">
        <button type="button" className="pill pill-small" onClick={settle} disabled={pending}>
          {words.itIsFine}
        </button>

        {row.missing ? null : asking ? (
          <>
            <button
              type="button"
              className="pill pill-small pill-solid"
              onClick={takeDown}
              disabled={pending}
            >
              {words.reallyTakeItDown}
            </button>
            <button
              type="button"
              className="pill pill-small"
              onClick={() => setAsking(false)}
              disabled={pending}
            >
              {words.neverMind}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pill pill-small"
            onClick={() => setAsking(true)}
            disabled={pending}
          >
            {words.takeItDown}
          </button>
        )}
      </div>

      {trouble ? <p className="app-error">{trouble}</p> : null}
    </li>
  );
}
