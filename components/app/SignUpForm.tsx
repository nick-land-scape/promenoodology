"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import Photo from "../Photo";
import type { ClubEvent } from "@/lib/content";
import {
  cancelMyPlace,
  markInterested,
  signUpForEvent,
} from "@/app/app/actions";
import { buzz } from "@/lib/native";

export type Joinable = ClubEvent & {
  /** When it is, said the way the row says it. */
  label: string;
  /** What is still wanted, one per line, as written in the back of the house. */
  needs: string;
  /** What people are already bringing. */
  bringing: { who: string; what: string; people: number }[];
  /** Your own place or mark, where you have one. */
  mine: {
    people: number;
    bringing: string;
    state: "interested" | "asked" | "kept" | "declined";
  } | null;
};

/**
 * What's on: a list, or a month.
 *
 * Two ways of looking at the same evenings, because they answer different
 * questions. A list answers "what is next"; a month answers "am I free on the
 * fourteenth", which is the question anybody with a life actually asks.
 *
 * And two things to do with an evening rather than one. Saying you will be there
 * and marking one to think about are different promises, and until now the app only
 * had the first — so an evening somebody might come to looked exactly like one they
 * had ignored, and the number of places asked for counted nobody's maybe.
 */
export default function SignUpForm({
  events,
  past,
}: {
  events: Joinable[];
  past: Joinable[];
}) {
  const [view, setView] = useState<"list" | "month">("list");
  const [place, setPlace] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [people, setPeople] = useState("2");
  const [bringing, setBringing] = useState("");
  const [said, setSaid] = useState<{
    id: string;
    words: string;
    bad?: boolean;
  } | null>(null);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();

  const places = useMemo(
    () => [...new Set(events.map((event) => event.place))].filter(Boolean),
    [events],
  );
  const shown = place
    ? events.filter((event) => event.place === place)
    : events;

  /* Which day is being looked at in the month. The first day with something on
     it, so the month opens with an answer rather than an empty afternoon. */
  const [day, setDay] = useState<string>(
    () => events[0]?.date ?? new Date().toISOString().slice(0, 10),
  );

  function join(event: Joinable) {
    setSaid(null);
    start(async () => {
      const answer = await signUpForEvent(event.id, Number(people), bringing);
      if (!answer.ok) {
        setSaid({
          id: event.id,
          words: answer.error ?? "That did not go through.",
          bad: true,
        });
        return;
      }
      void buzz("medium");
      setOpen(null);
      setBringing("");
      setSaid({
        id: event.id,
        words: `You are down for ${people} ${people === "1" ? "place" : "places"}.`,
      });
    });
  }

  function cancel(event: Joinable) {
    if (!confirm(`Say you are not coming to “${event.title}” after all?`))
      return;
    setSaid(null);
    start(async () => {
      const answer = await cancelMyPlace(event.id);
      setSaid(
        answer.ok
          ? {
              id: event.id,
              words: "Taken off. Sign up again whenever you like.",
            }
          : {
              id: event.id,
              words: answer.error ?? "That did not work.",
              bad: true,
            },
      );
    });
  }

  function mark(event: Joinable, on: boolean) {
    setMarks((current) => ({ ...current, [event.id]: on }));
    start(async () => {
      const answer = await markInterested(event.id, on);
      if (!answer.ok) {
        setMarks((current) => ({ ...current, [event.id]: !on }));
        setSaid({
          id: event.id,
          words: answer.error ?? "That did not work.",
          bad: true,
        });
        return;
      }
      void buzz("light");
    });
  }

  /** Whether an evening is marked, allowing for a press that has just happened. */
  const marked = (event: Joinable) =>
    marks[event.id] ?? event.mine?.state === "interested";

  /** Coming means a place, not a bookmark. */
  const coming = (event: Joinable) =>
    Boolean(event.mine && event.mine.state !== "interested");

  function Evening({ event }: { event: Joinable }) {
    return (
      <li>
        <div className="row">
          {event.photo ? (
            <span className="row-thumb">
              <Photo src={event.photo.src} alt="" fill sizes="58px" />
            </span>
          ) : null}

          {/* The bookmark, top right of the row.
              It is the smallest decision on the screen — no promise, no number,
              nobody told — so it belongs in a corner rather than in a line of
              buttons under the evening, where it took a third of the width and
              read as the equal of saying you are coming. */}
          <button
            type="button"
            className={marked(event) ? "mark mark-on" : "mark"}
            onClick={() => mark(event, !marked(event))}
            disabled={pending}
            aria-pressed={marked(event)}
            aria-label={
              marked(event) ? "Take it off your list" : "Keep it on your list"
            }
            title={marked(event) ? "On your list" : "Keep it on your list"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
                fill={marked(event) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="row-body">
            {/* The name opens the evening itself — the programme, what was
                written about it, who is bringing what. The row keeps the one
                thing you came to the list for, which is saying you are coming. */}
            <Link href={`/app/events/${event.id}`} className="row-title">
              {event.title}
            </Link>
            <span className="row-meta">{event.label}</span>
            {event.partners.length > 0 ? (
              <span className="row-meta">
                with {event.partners.map((one) => one.name).join(", ")}
              </span>
            ) : null}
            {event.note ? <span className="row-meta">{event.note}</span> : null}

            {/* What is still wanted, and what is already coming. The two most
                useful sentences about an improvised kitchen, and until now
                neither was ever shown: "bringing" was typed into a form and
                never read back, so four people brought salad. */}
            {event.needs.trim() ? (
              <span className="row-wanted">
                <em>still wanted</em>
                {event.needs
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <span key={line}>{line}</span>
                  ))}
              </span>
            ) : null}

            {event.bringing.length > 0 ? (
              <span className="row-coming">
                <em>coming with</em>
                {event.bringing.map((one) => (
                  <span key={`${one.who}-${one.what}`}>
                    {one.what} <i>{one.who.split(" ")[0]}</i>
                  </span>
                ))}
              </span>
            ) : null}

            {coming(event) ? (
              <span className="row-yes">
                you are coming, {event.mine?.people}{" "}
                {event.mine?.people === 1 ? "place" : "places"}
                {event.mine?.state === "kept" ? " · kept for you" : null}
                {event.mine?.state === "declined" ? " · not this time" : null}
              </span>
            ) : marked(event) ? (
              <span className="row-maybe">on your list</span>
            ) : null}
          </span>

          {/* One button, under the evening it is about. */}
          <span className="row-does">
            {coming(event) ? (
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
                className="pill pill-small pill-solid"
                onClick={() => {
                  setOpen(open === event.id ? null : event.id);
                  setSaid(null);
                }}
                disabled={pending}
              >
                {open === event.id ? "close" : "count me in"}
              </button>
            )}
          </span>
        </div>

        {/* The form opens under the evening it is about, so there is never a
            question of which one you are signing up for. */}
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
          <p
            className={said.bad ? "app-error" : "app-note"}
            style={{ paddingTop: 8 }}
          >
            {said.words}
          </p>
        ) : null}
      </li>
    );
  }

  return (
    <>
      <div className="segmented" role="tablist" aria-label="How to look at it">
        {(["list", "month"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {option === "list" ? "what's next" : "by month"}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">still to come</h2>
            <span className="app-label">
              {shown.length} {shown.length === 1 ? "evening" : "evenings"}
            </span>
          </div>

          {/* The places, under the heading they narrow down — the same row the
              front screen has, because it is the same question. */}
          {places.length > 1 ? (
            <div className="app-scroll" role="group" aria-label="Which place">
              <button
                type="button"
                className="chip"
                aria-pressed={place === null}
                onClick={() => setPlace(null)}
              >
                everywhere
              </button>
              {places.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="chip"
                  aria-pressed={place === name}
                  onClick={() => setPlace(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}

          {shown.length === 0 ? (
            <p className="app-note">
              Nothing to come to just yet. It goes up here the moment there is.
            </p>
          ) : (
            <ul className="row-list">
              {shown.map((event) => (
                <Evening key={event.id} event={event} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <Month
          events={events}
          day={day}
          onDay={setDay}
          render={(event) => <Evening key={event.id} event={event} />}
        />
      )}

      {/* What has already happened. Half of what this club is is what it has
          already done, and this screen used to throw all of it away. */}
      {view === "list" && past.length > 0 ? (
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
                    <Link
                      href={`/app/events/${event.id}`}
                      className="row-title"
                    >
                      {event.title}
                    </Link>
                    <span className="row-meta">{event.label}</span>
                    {event.mine ? (
                      <span className="row-yes">you were there</span>
                    ) : null}
                  </span>
                  {/* Where somebody wrote it up afterwards, the way to read it. */}
                  {event.story ? (
                    <Link
                      className="pill pill-small"
                      href={`/app/read/${event.story.slug}`}
                    >
                      read it
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/**
 * A month, and what is on the day you press.
 *
 * Monday first, because that is the week here. Only the days with something on
 * them are pressable — a calendar where every square invites a tap and thirty of
 * them answer "nothing" is a calendar that wastes thirty taps.
 */
function Month({
  events,
  day,
  onDay,
  render,
}: {
  events: Joinable[];
  day: string;
  onDay: (day: string) => void;
  render: (event: Joinable) => React.ReactNode;
}) {
  /* Which month is on screen. It follows the chosen day, so pressing into
     September and back is one control rather than two. */
  const [shownMonth, setShownMonth] = useState(() => day.slice(0, 7));

  const onDays = useMemo(() => {
    const map = new Map<string, Joinable[]>();
    for (const event of events) {
      /* Something that runs over days belongs on each of them, which is the whole
         point of a calendar: an evening you could still join on the third is not
         only on the first. */
      const first = event.date;
      const last = event.until || event.date;
      for (const at of daysBetween(first, last)) {
        map.set(at, [...(map.get(at) ?? []), event]);
      }
    }
    return map;
  }, [events]);

  const [year, month] = shownMonth.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday first: Sunday is 0 in JavaScript and last in a week here.
  const blanks = (firstOfMonth.getUTCDay() + 6) % 7;

  const step = (by: number) => {
    const at = new Date(Date.UTC(year, month - 1 + by, 1));
    setShownMonth(
      `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  };

  const today = new Date().toISOString().slice(0, 10);
  const chosen = onDays.get(day) ?? [];

  return (
    <>
      <div className="month">
        <div className="month-head">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="The month before"
          >
            ‹
          </button>
          <strong>
            {firstOfMonth.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="The month after"
          >
            ›
          </button>
        </div>

        <div className="month-week" aria-hidden="true">
          {["M", "T", "W", "T", "F", "S", "S"].map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </div>

        <div className="month-grid">
          {Array.from({ length: blanks }, (_, blank) => (
            <span key={`blank-${blank}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = `${shownMonth}-${String(index + 1).padStart(2, "0")}`;
            const on = onDays.get(date);
            return (
              <button
                key={date}
                type="button"
                className={[
                  "month-day",
                  on ? "month-day-on" : "",
                  date === day ? "month-day-chosen" : "",
                  date === today ? "month-day-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={!on}
                onClick={() => onDay(date)}
                aria-label={`${index + 1} — ${on ? `${on.length} on` : "nothing on"}`}
              >
                {index + 1}
                {on ? <em aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">
            {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <span className="app-label">{chosen.length}</span>
        </div>

        {chosen.length === 0 ? (
          <p className="app-note">
            Nothing on that day. The marked ones have something.
          </p>
        ) : (
          <ul className="row-list">{chosen.map((event) => render(event))}</ul>
        )}
      </section>
    </>
  );
}

/** Every day from one to the other, inclusive. Both are Y-M-D strings. */
function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const at = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(at.getTime()) || Number.isNaN(end.getTime())) return [from];
  // A month of it at most, so a bad pair of dates cannot spin for ever.
  for (let guard = 0; at <= end && guard < 40; guard += 1) {
    days.push(at.toISOString().slice(0, 10));
    at.setUTCDate(at.getUTCDate() + 1);
  }
  return days;
}
