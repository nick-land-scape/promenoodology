"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelMyPlace, markInterested, signUpForEvent } from "@/app/app/actions";

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
  const [people, setPeople] = useState(String(mine?.people ?? 1));
  const [bringing, setBringing] = useState(mine?.bringing ?? "");
  const [said, setSaid] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [coming, setComing] = useState(Boolean(mine) && mine?.state !== "interested");
  const [marked, setMarked] = useState(interested);
  const [pending, start] = useTransition();

  function join() {
    setProblem("");
    start(async () => {
      const answer = await signUpForEvent(eventId, Number(people), bringing);
      if (!answer.ok) {
        setProblem(answer.error ?? "That did not go through.");
        return;
      }
      setComing(true);
      setOpen(false);
      setSaid("You are down for it. Somebody will be in touch if anything changes.");
    });
  }

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
          <button type="button" className="pill" onClick={cancel} disabled={pending}>
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
            {open ? "close" : "count me in"}
          </button>
        )}

        <Link className="pill" href="/app/events">
          everything on
        </Link>
      </div>

      {coming ? (
        <p className="row-yes">
          you are coming{mine?.people ? `, ${mine.people} ${mine.people === 1 ? "place" : "places"}` : ""}
        </p>
      ) : null}

      {open && !coming ? (
        <form
          className="field-block"
          onSubmit={(submit) => {
            submit.preventDefault();
            join();
          }}
        >
          <div className="field-pair">
            <div className="field">
              <label htmlFor="evening-people">how many of you</label>
              <select
                id="evening-people"
                value={people}
                onChange={(change) => setPeople(change.target.value)}
              >
                {["1", "2", "3", "4", "5", "6"].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="evening-bringing">bringing</label>
              <input
                id="evening-bringing"
                value={bringing}
                onChange={(change) => setBringing(change.target.value)}
                placeholder="a pot, a friend…"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="pill pill-solid pill-wide" disabled={pending}>
              {pending ? "signing you up…" : "yes, I am coming"}
            </button>
          </div>
          {spots > 0 ? <p className="app-note">{spots} places altogether.</p> : null}
        </form>
      ) : null}

      {said ? <p className="app-note">{said}</p> : null}
    </section>
  );
}
