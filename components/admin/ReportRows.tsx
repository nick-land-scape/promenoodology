"use client";

import { useState, useTransition } from "react";
import { settleReport, takeDownReported } from "@/app/admin/reports/actions";

export type ReportRow = {
  id: string;
  kind: "post" | "reply" | "person";
  because: string;
  said: string;
  madeAt: string;
  settled: boolean;
  settledSaid: string;
  /** Who reported it, or null for the screening — which has no name. */
  by: string | null;
  /** Whose post or reply it is. */
  whose: string;
  words: string;
  where: string;
  when: string;
  photos: string[];
  /** The thing itself is already gone. */
  missing: boolean;
};

/**
 * One report, with the thing it is about underneath it.
 *
 * The pictures are shown at a size somebody can actually judge, which is the
 * whole reason this screen exists: a report saying "sexual" about a photograph,
 * read as a line of text, tells an admin nothing about whether it is true, and
 * the alternative was opening the app on a phone and scrolling until you found
 * it.
 *
 * Two things to do about it, and they are deliberately different weights. Settle
 * it — the ordinary answer, meaning somebody looked and it is fine — is a plain
 * button. Take it down deletes what was written, and asks first.
 */
export default function ReportRows({ rows }: { rows: ReportRow[] }) {
  return (
    <ul className="admin-rows">
      {rows.map((row) => (
        <Report key={row.id} row={row} />
      ))}
    </ul>
  );
}

function Report({ row }: { row: ReportRow }) {
  const [gone, setGone] = useState(row.missing);
  const [settled, setSettled] = useState(row.settled);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  function settle(what: string) {
    setTrouble("");
    start(async () => {
      const answer = await settleReport(row.id, what);
      if (!answer.ok) {
        setTrouble(answer.error ?? "That did not save.");
        return;
      }
      setSettled(true);
      setAsking(false);
    });
  }

  function takeDown() {
    setTrouble("");
    start(async () => {
      const answer = await takeDownReported(row.id);
      if (!answer.ok) {
        setTrouble(answer.error ?? "That did not work.");
        return;
      }
      setGone(true);
      setSettled(true);
      setAsking(false);
    });
  }

  return (
    <li className={settled ? "admin-row report-row is-settled" : "admin-row report-row"}>
      <div className="report-head">
        <span className="report-why">{row.because}</span>
        <span className="report-who">
          {/* The screening has no name, and saying "reported by nobody" would be
              a worse answer than saying what actually happened. */}
          {row.by ? `reported by ${row.by}` : "flagged on the way in"}
          {row.whose ? ` · ${row.kind === "person" ? "about" : "written by"} ${row.whose}` : ""}
        </span>
        <span className="report-when">{whenSaid(row.madeAt)}</span>
      </div>

      {row.said ? <p className="report-said">“{row.said}”</p> : null}

      {gone ? (
        <p className="report-gone">
          Gone already — either its author took it down or it was removed here.
        </p>
      ) : (
        <div className="report-what">
          {row.words ? <p className="report-words">{row.words}</p> : null}
          {row.where ? <p className="report-where">{row.where}</p> : null}
          {row.photos.length > 0 ? (
            <div className="report-photos">
              {row.photos.map((src) => (
                // Not next/image: these are looked at once by one person, and
                // putting them through the optimiser would cache a picture that
                // is about to be deleted.
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {settled ? (
        <p className="report-settled">
          Dealt with{row.settledSaid ? ` — ${row.settledSaid}` : ""}
        </p>
      ) : (
        <div className="report-does">
          <button
            type="button"
            className="admin-button"
            onClick={() => settle("looked at it, nothing wrong")}
            disabled={pending}
          >
            it is fine
          </button>

          {gone ? null : asking ? (
            <>
              <input
                className="report-note"
                value={note}
                onChange={(change) => setNote(change.target.value)}
                placeholder="why, for the record"
              />
              <button
                type="button"
                className="admin-button admin-button-loud"
                onClick={takeDown}
                disabled={pending}
              >
                yes, take it down
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setAsking(false)}
                disabled={pending}
              >
                never mind
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-button"
              onClick={() => setAsking(true)}
              disabled={pending}
            >
              take it down
            </button>
          )}
        </div>
      )}

      {trouble ? <p className="admin-error">{trouble}</p> : null}
    </li>
  );
}

/** "2 hours ago", "yesterday", "3 August" — the same shape the feed uses. */
function whenSaid(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 8) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
