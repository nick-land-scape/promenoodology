"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Photo from "../Photo";
import type { ClubEvent } from "@/lib/content";
import { cancelMyPlace, signUpForEvent } from "@/app/app/actions";

export type Joinable = ClubEvent & {
  /** When it is, said the way the row says it. */
  label: string;
  /** Your own place, where you have asked for one. */
  mine: { people: number; bringing: string; state: "asked" | "kept" | "declined" } | null;
};

/**
 * Signing up for an evening.
 *
 * Not booking, and the word matters: there is nothing here to book. Nobody is
 * reserving a table or paying for a room — you are saying you are coming, and
 * roughly how many of you, to something somebody else is putting on. "Book"
 * promised a transaction that does not exist, and the screen it named listed
 * three rooms that do not exist to go with it.
 *
 * What it is instead: the evenings still to come, one press to say you are in,
 * and the same press again to say you are not.
 */
export default function SignUpForm({ events, past }: { events: Joinable[]; past: Joinable[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [people, setPeople] = useState("2");
  const [bringing, setBringing] = useState("");
  const [said, setSaid] = useState<{ id: string; words: string; bad?: boolean } | null>(null);
  const [pending, start] = useTransition();

  function join(event: Joinable) {
    setSaid(null);
    start(async () => {
      const answer = await signUpForEvent(event.id, Number(people), bringing);
      if (!answer.ok) {
        setSaid({ id: event.id, words: answer.error ?? "That did not go through.", bad: true });
        return;
      }
      setOpen(null);
      setBringing("");
      setSaid({
        id: event.id,
        words: `You are down for ${people} ${people === "1" ? "place" : "places"}.`,
      });
    });
  }

  function cancel(event: Joinable) {
    if (!confirm(`Say you are not coming to “${event.title}” after all?`)) return;
    setSaid(null);
    start(async () => {
      const answer = await cancelMyPlace(event.id);
      setSaid(
        answer.ok
          ? { id: event.id, words: "Taken off. Sign up again whenever you like." }
          : { id: event.id, words: answer.error ?? "That did not work.", bad: true },
      );
    });
  }

  return (
    <>
      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">still to come</h2>
          <span className="app-label">
            {events.length} {events.length === 1 ? "evening" : "evenings"}
          </span>
        </div>

        {events.length === 0 ? (
          <p className="app-note">
            Nothing to come to just yet. It goes up here the moment there is.
          </p>
        ) : (
          <ul className="row-list">
            {events.map((event) => (
              <li key={event.id}>
                <div className="row">
                  {event.photo ? (
                    <span className="row-thumb">
                      <Photo src={event.photo.src} alt="" fill sizes="58px" />
                    </span>
                  ) : null}
                  <span className="row-body">
                    <span className="row-title">{event.title}</span>
                    <span className="row-meta">{event.label}</span>
                    {event.partners.length > 0 ? (
                      <span className="row-meta">with {event.partners.join(", ")}</span>
                    ) : null}
                    {event.note ? <span className="row-meta">{event.note}</span> : null}

                    {event.mine ? (
                      <span className="row-yes">
                        you are coming, {event.mine.people}{" "}
                        {event.mine.people === 1 ? "place" : "places"}
                        {event.mine.state === "kept" ? " · kept for you" : null}
                        {event.mine.state === "declined" ? " · not this time" : null}
                      </span>
                    ) : null}
                  </span>

                  {event.mine ? (
                    <button
                      type="button"
                      className="pill pill-small"
                      onClick={() => cancel(event)}
                      disabled={pending}
                    >
                      not coming
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pill pill-small"
                      onClick={() => {
                        setOpen(open === event.id ? null : event.id);
                        setSaid(null);
                      }}
                      disabled={pending}
                    >
                      {open === event.id ? "close" : "count me in"}
                    </button>
                  )}
                </div>

                {/* The form opens under the evening it is about, so there is
                    never a question of which one you are booking. */}
                {open === event.id ? (
                  <form
                    className="field-block"
                    onSubmit={(submit) => {
                      submit.preventDefault();
                      join(event);
                    }}
                  >
                    <div className="field-pair">
                      <div className="field">
                        <label htmlFor={`people-${event.id}`}>how many of you</label>
                        <select
                          id={`people-${event.id}`}
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
                        <label htmlFor={`bringing-${event.id}`}>bringing</label>
                        <input
                          id={`bringing-${event.id}`}
                          value={bringing}
                          onChange={(change) => setBringing(change.target.value)}
                          placeholder="a pot, a friend…"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="pill pill-solid pill-wide"
                        disabled={pending}
                      >
                        {pending ? "signing you up…" : "yes, I am coming"}
                      </button>
                    </div>
                  </form>
                ) : null}

                {said?.id === event.id ? (
                  <p className={said.bad ? "app-error" : "app-note"} style={{ paddingTop: 8 }}>
                    {said.words}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* What has already happened. Half of what this club is is what it has
          already done, and this screen used to throw all of it away. */}
      {past.length > 0 ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">already happened</h2>
            <span className="app-label">{past.length}</span>
          </div>
          <ul className="row-list">
            {past.map((event) => (
              <li key={event.id}>
                <div className="row row-past">
                  {event.photo ? (
                    <span className="row-thumb">
                      <Photo src={event.photo.src} alt="" fill sizes="58px" />
                    </span>
                  ) : null}
                  <span className="row-body">
                    <span className="row-title">{event.title}</span>
                    <span className="row-meta">{event.label}</span>
                    {event.mine ? <span className="row-yes">you were there</span> : null}
                  </span>
                  {/* Where somebody wrote it up afterwards, the way to read it. */}
                  {event.story ? (
                    <Link className="pill pill-small" href={`/stories/${event.story.slug}`}>
                      read it
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="band">
        <h2>Something of your own?</h2>
        <p>
          A room, a whole evening, eight people or five hundred. Tell us roughly what you have in
          mind and we will work the rest out together.
        </p>
        <Link className="pill" href="/handbook#apply">
          ask us for a hand
        </Link>
      </section>
    </>
  );
}
