"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import JoinSheet from "./JoinSheet";
import { cancelMyPlace, markInterested } from "@/app/app/actions";
import { useSay } from "./Words";

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
  tight = false,
  children,
}: {
  eventId: string;
  spots: number;
  /** What you have already said, if anything. */
  mine: { people: number; bringing: string; state: string } | null;
  interested: boolean;
  /* In the header, where the whole screen can see them.
   *
   * They were halfway down a long page: an evening's own screen is a photograph, a
   * paragraph, a programme and a list of what is wanted, and the one thing somebody
   * came to do was below all of it. Up there it is on the screen the whole way down.
   *
   * What `tight` leaves out is the running commentary — the confirmations, the
   * problem lines, "everything on" — because a header is three controls wide and
   * a sentence in it is a sentence nobody has room to read. The confirmation is the
   * button changing to "not coming", which is the only one anybody needs. */
  tight?: boolean;
  /** The calendar picker, which the page builds because it reads the database. */
  children?: React.ReactNode;
}) {
  const say = useSay();
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
        setProblem(answer.error ?? say("join.didNotGoThrough"));
        return;
      }
      setComing(false);
      setSaid(say("eve.takenOff"));
    });
  }

  function mark(on: boolean) {
    setProblem("");
    setMarked(on);
    start(async () => {
      const answer = await markInterested(eventId, on);
      if (!answer.ok) {
        setProblem(answer.error ?? say("join.didNotGoThrough"));
        setMarked(!on);
      }
    });
  }

  if (tight) {
    return (
      <span className="evening-does evening-does-tight">
        {joinButton(true)}
        {mark_()}
        {children}
        <JoinSheet
          open={open && !coming}
          eventId={eventId}
          title={say("row.countMeIn")}
          spots={spots}
          mine={mine}
          onClose={() => setOpen(false)}
          onDone={(words) => {
            setComing(true);
            setSaid(words);
          }}
        />
      </span>
    );
  }

  /* Written once, drawn in two places: the header and the page. Two copies of a
     button that books a place is two ways of booking a place. */
  function mark_() {
    return (
      <button
        type="button"
        className={marked ? "mark mark-on" : "mark"}
        onClick={() => mark(!marked)}
        disabled={pending}
        aria-pressed={marked}
        aria-label={say(marked ? "row.takeOffList" : "row.keepOnList")}
        title={say(marked ? "row.onYourList" : "row.keepOnList")}
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
    );
  }

  function joinButton(asIcon = false) {
    /* As a drawing in the header, where three words do not fit beside two other
       controls, and as words in the page, where they do.
       
       A tick, outline or filled, and that is not an arbitrary glyph: the bookmark
       beside it already means "outline is not yet, filled is yes", so the same pair
       of states reads the same way twice rather than teaching two conventions on one
       screen. Pressing a filled one gives the place back, which is what pressing a
       filled bookmark does too. */
    if (asIcon) {
      return (
        <button
          type="button"
          className={coming ? "mark mark-on" : "mark"}
          onClick={() => {
            if (coming) cancel();
            else {
              setOpen(!open);
              setSaid(null);
            }
          }}
          disabled={pending}
          aria-pressed={coming}
          aria-label={say(coming ? "row.notComing" : "row.countMeIn")}
          title={say(coming ? "row.notComing" : "row.countMeIn")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {coming ? (
              <>
                <circle cx="12" cy="12" r="9" fill="currentColor" />
                <path
                  d="M7.5 12.5 10.5 15.5 16.5 9"
                  fill="none"
                  stroke="var(--paper)"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M7.5 12.5 10.5 15.5 16.5 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </svg>
        </button>
      );
    }

    return coming ? (
      <button type="button" className="pill" onClick={cancel} disabled={pending}>
        {say("row.notComing")}
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
        {say("row.countMeIn")}
      </button>
    );
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
          aria-label={say(marked ? "row.takeOffList" : "row.keepOnList")}
          title={say(marked ? "row.onYourList" : "row.keepOnList")}
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
            {say("row.notComing")}
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
            {say("row.countMeIn")}
          </button>
        )}

        <Link className="pill" href="/app/events">
          {say("eve.everythingOn")}
        </Link>
      </div>

      {coming ? (
        <p className="row-yes">
          {say("eve.youAreComing")}
          {mine?.people
            ? `, ${mine.people} ${say(mine.people === 1 ? "row.place" : "row.places")}`
            : ""}
        </p>
      ) : null}

      {/* The same pop-up the list uses, so "count me in" asks the same questions
          wherever it is pressed — including the names of whoever is coming. */}
      <JoinSheet
        open={open && !coming}
        eventId={eventId}
        title={say("row.countMeIn")}
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
