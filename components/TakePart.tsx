"use client";

import { useState, useTransition } from "react";
import { cancelMyPlace, markInterested, signUpForEvent } from "@/app/app/actions";

/**
 * Count me in, and keep it on my list — on the website, actually working.
 *
 * The two controls have been on every evening's page for weeks with `disabled`
 * written into them: the shape of the thing, greyed out, above a line saying it
 * takes an account. That was honest while the website had no idea who anybody
 * was. It stopped being honest the day members could sign in here — somebody
 * signed in, looking at their own club's evening, being told by a grey button to
 * go and get an account they already have.
 *
 * So: signed in, these work; signed out, JoinToTakePart draws the greyed pair and
 * says why. The event page picks between them.
 *
 * The same three server actions the app uses, which is the point — a place taken
 * here is the same row as a place taken on a phone, and appears on both by the
 * time either is looked at again.
 *
 * No modal. The app asks its questions in a sheet that slides up from the bottom
 * of a phone; a website has room to simply put the form under the button, and a
 * dialogue over a page somebody is already reading is a dialogue that hides the
 * thing they were reading in order to ask them about it.
 */
export default function TakePart({
  eventId,
  days,
  mine,
  words,
}: {
  eventId: string;
  /** The programme, where the evening has one: a place is taken on a day. */
  days: { date: string; title: string; label: string }[];
  /** What you have already said, where you have said anything. */
  mine: {
    state: "interested" | "asked" | "kept" | "declined";
    people: number;
    bringing: string;
    onDay: string | null;
  } | null;
  words: {
    countMeIn: string;
    pickYourDays: string;
    save: string;
    saved: string;
    howMany: string;
    bringing: string;
    bringingHint: string;
    whichDays: string;
    send: string;
    sending: string;
    youAreComing: string;
    changeIt: string;
    notComing: string;
    neverMind: string;
    didNotWork: string;
    place: string;
    places: string;
  };
}) {
  const [marked, setMarked] = useState(mine?.state === "interested");
  const [coming, setComing] = useState(Boolean(mine && mine.state !== "interested"));
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState(mine?.people ?? 1);
  const [bringing, setBringing] = useState(mine?.bringing ?? "");
  const [chosen, setChosen] = useState<string[]>(mine?.onDay ? [mine.onDay] : []);
  const [said, setSaid] = useState("");
  const [pending, start] = useTransition();

  function mark(on: boolean) {
    setMarked(on);
    setSaid("");
    start(async () => {
      const answer = await markInterested(eventId, on);
      if (!answer.ok) {
        setMarked(!on);
        setSaid(answer.error ?? words.didNotWork);
      }
    });
  }

  function send() {
    setSaid("");
    start(async () => {
      /* A programme is booked a day at a time, so several days is several
         answers. Sent one after another rather than together: each is its own
         row, and one that fails should not take the others with it. */
      const daysToBook = days.length > 0 ? (chosen.length > 0 ? chosen : []) : [null];
      if (daysToBook.length === 0) {
        setSaid(words.whichDays);
        return;
      }

      for (const day of daysToBook) {
        const answer = await signUpForEvent(eventId, people, bringing, [], day);
        if (!answer.ok) {
          setSaid(answer.error ?? words.didNotWork);
          return;
        }
      }
      setComing(true);
      setMarked(false);
      setOpen(false);
      setSaid(words.saved);
    });
  }

  function give() {
    setSaid("");
    start(async () => {
      const answer = await cancelMyPlace(eventId, mine?.onDay ?? null);
      if (!answer.ok) {
        setSaid(answer.error ?? words.didNotWork);
        return;
      }
      setComing(false);
    });
  }

  return (
    <section className="taking-part taking-part-live">
      <span className="taking-part-does">
        {coming ? (
          <>
            <button type="button" className="pill" onClick={give} disabled={pending}>
              {words.notComing}
            </button>
            <button
              type="button"
              className="pill pill-solid"
              onClick={() => setOpen((now) => !now)}
              disabled={pending}
            >
              {words.changeIt}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pill pill-solid"
            onClick={() => setOpen((now) => !now)}
            disabled={pending}
            aria-expanded={open}
          >
            {days.length > 0 ? words.pickYourDays : words.countMeIn}
          </button>
        )}

        {/* The bookmark, drawn exactly as the two switches in the top strip are —
            see .icon-switch. It was already built that way while it was grey. */}
        <button
          type="button"
          className={marked ? "icon-switch is-on" : "icon-switch"}
          onClick={() => mark(!marked)}
          disabled={pending}
          aria-pressed={marked}
          aria-label={words.save}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
              fill={marked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span aria-hidden="true">{words.save}</span>
        </button>
      </span>

      {coming && !open ? <p className="taking-part-said">{words.youAreComing}</p> : null}

      {open ? (
        <form
          className="taking-part-form"
          onSubmit={(submit) => {
            submit.preventDefault();
            send();
          }}
        >
          {days.length > 0 ? (
            <fieldset className="taking-part-days">
              <legend>{words.whichDays}</legend>
              {days.map((day) => (
                <label key={day.date}>
                  <input
                    type="checkbox"
                    checked={chosen.includes(day.date)}
                    onChange={(change) =>
                      setChosen((now) =>
                        change.target.checked
                          ? [...now, day.date]
                          : now.filter((one) => one !== day.date),
                      )
                    }
                  />
                  <span>
                    <b>{day.title || day.label}</b>
                    {day.title ? <i>{day.label}</i> : null}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          <label className="taking-part-field">
            <span>{words.howMany}</span>
            <input
              type="number"
              min={1}
              max={12}
              value={people}
              onChange={(change) => setPeople(Number(change.target.value) || 1)}
            />
          </label>

          <label className="taking-part-field">
            <span>{words.bringing}</span>
            <input
              type="text"
              value={bringing}
              onChange={(change) => setBringing(change.target.value)}
              placeholder={words.bringingHint}
            />
          </label>

          <div className="taking-part-feet">
            <button type="submit" className="pill pill-solid" disabled={pending}>
              {pending ? words.sending : words.send}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {words.neverMind}
            </button>
          </div>
        </form>
      ) : null}

      {said ? <p className="taking-part-said">{said}</p> : null}
    </section>
  );
}
