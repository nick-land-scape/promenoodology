"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import JoinSheet from "./JoinSheet";
import { cancelMyPlace, markInterested } from "@/app/app/actions";

/**
 * Asking to come, on the evening's own screen.
 *
 * The list has its own version of this, folded into a row: you press "count me
 * in" and a small form opens under the evening it is about. Here there is only
 * one evening and the whole screen is about it, so nothing needs to fold and
 * nothing needs to say which one you mean.
 */
export default function Evening({
  eventId,
  spots,
  mine,
  interested,
}: {
  eventId: string;
  spots: number;
  /** What you have already said, if anything. */
  mine: { people: number; bringing: string; state: string } | null;
  interested: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [coming, setComing] = useState(
    Boolean(mine) && mine?.state !== "interested",
  );
  const [marked, setMarked] = useState(interested);
  const [pending, start] = useTransition();

  function cancel() {
    setProblem("");
    start(async () => {
      const answer = await cancelMyPlace(eventId);
      if (!answer.ok) {
        setProblem(answer.error ?? "That did not go through.");
        return;
      }
      setComing(false);
      setSaid("Taken off. Come anyway if the day turns out differently.");
    });
  }

  function mark(on: boolean) {
    setProblem("");
    setMarked(on);
    start(async () => {
      const answer = await markInterested(eventId, on);
      if (!answer.ok) {
        setProblem(answer.error ?? "That did not go through.");
        setMarked(!on);
      }
    });
  }

  return (
    <section className="evening-asking">
      {problem ? <p className="app-error">{problem}</p> : null}

      <div className="evening-does">
        <button
          type="button"
          className={marked ? "mark mark-on" : "mark"}
          onClick={() => mark(!marked)}
          disabled={pending}
          aria-pressed={marked}
          aria-label={marked ? "Take it off your list" : "Keep it on your list"}
          title={marked ? "On your list" : "Keep it on your list"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
              fill={marked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {coming ? (
          <button
            type="button"
            className="pill"
            onClick={cancel}
            disabled={pending}
          >
            not coming
          </button>
        ) : (
          <button
            type="button"
            className="pill pill-solid"
            onClick={() => {
              setOpen(!open);
              setSaid(null);
            }}
            disabled={pending}
          >
            count me in
          </button>
        )}

        <Link className="pill" href="/app/events">
          everything on
        </Link>
      </div>

      {coming ? (
        <p className="row-yes">
          you are coming
          {mine?.people
            ? `, ${mine.people} ${mine.people === 1 ? "place" : "places"}`
            : ""}
        </p>
      ) : null}

      {/* The same pop-up the list uses, so "count me in" asks the same questions
          wherever it is pressed — including the names of whoever is coming. */}
      <JoinSheet
        open={open && !coming}
        eventId={eventId}
        title="count me in"
        spots={spots}
        mine={mine}
        onClose={() => setOpen(false)}
        onDone={(words) => {
          setComing(true);
          setSaid(words);
        }}
      />

      {said ? <p className="app-note">{said}</p> : null}
    </section>
  );
}
