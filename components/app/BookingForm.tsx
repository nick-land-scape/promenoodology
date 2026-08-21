"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Photo from "../Photo";
import type { ClubEvent } from "@/lib/content";
import { askForAPlace, dropMyPlace } from "@/app/app/actions";

export type Bookable = ClubEvent & {
  /** When it is, said the way the row says it. */
  label: string;
  /** Your own booking, where you have one. */
  mine: { people: number; bringing: string; state: "asked" | "kept" | "declined" } | null;
};

/**
 * Asking for a place, for real.
 *
 * This was a drawing: you chose an evening, pressed the button, and it told you
 * what you *would* have asked for — "this is a placeholder, no message has been
 * sent". The table and its policies have been in the database since the first
 * migration, so the only thing missing was this screen meaning it.
 *
 * The two other tabs went the same way. "Spaces we can use" listed three rooms
 * that do not exist with an "ask" button that did nothing, and a whole evening
 * was a mailto. What there really is for both is the form on the handbook page,
 * which lands in the back of the house — so that is where they point.
 */
export default function BookingForm({ events }: { events: Bookable[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [people, setPeople] = useState("2");
  const [bringing, setBringing] = useState("");
  const [said, setSaid] = useState<{ id: string; words: string; bad?: boolean } | null>(null);
  const [pending, start] = useTransition();

  function ask(event: Bookable) {
    setSaid(null);
    start(async () => {
      const answer = await askForAPlace(event.id, Number(people), bringing);
      if (!answer.ok) {
        setSaid({ id: event.id, words: answer.error ?? "That did not go through.", bad: true });
        return;
      }
      setOpen(null);
      setBringing("");
      setSaid({
        id: event.id,
        words: `Asked for ${people} ${people === "1" ? "place" : "places"}. We will answer you.`,
      });
    });
  }

  function drop(event: Bookable) {
    if (!confirm(`Drop your place at “${event.title}”?`)) return;
    setSaid(null);
    start(async () => {
      const answer = await dropMyPlace(event.id);
      setSaid(
        answer.ok
          ? { id: event.id, words: "Dropped. Ask again whenever you like." }
          : { id: event.id, words: answer.error ?? "That did not work.", bad: true },
      );
    });
  }

  return (
    <>
      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">open for booking</h2>
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
                        you asked for {event.mine.people}{" "}
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
                      onClick={() => drop(event)}
                      disabled={pending}
                    >
                      drop out
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
                      {open === event.id ? "close" : "book"}
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
                      ask(event);
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
                        {pending ? "asking…" : "ask for a place"}
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
