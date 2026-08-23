"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import EveningRow from "./EveningRow";
import JoinSheet from "./JoinSheet";
import type { ClubEvent } from "@/lib/content";
import {
  cancelMyPlace,
  markInterested,
  signUpForEvent,
} from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { localeOf, useReading, useSay } from "./Words";
import Photo from "../Photo";

export type Joinable = ClubEvent & {
  /** The days already taken, where this evening has a programme. */
  onDays: string[];
  /** Each day of that programme, with the words the row and the sheet show. */
  dayLabels: { date: string; title: string; time: string; label: string }[];
  /** When it is, said the way the row says it. */
  label: string;
  /** The day and the month, split on the server: the helper that does it reads
      files, so a client component cannot ask for it. */
  day: string;
  month: string;
  /** What is still wanted, one per line, as written in the back of the house. */
  needs: string;
  /** What people are already bringing. */
  bringing: { who: string; what: string; people: number }[];
  /** Your own place or mark, where you have one. */
  mine: {
    people: number;
    bringing: string;
    guests?: string[];
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
  const say = useSay();

  function join(event: Joinable) {
    setSaid(null);
    start(async () => {
      const answer = await signUpForEvent(event.id, Number(people), bringing);
      if (!answer.ok) {
        setSaid({
          id: event.id,
          words: answer.error ?? say("join.didNotGoThrough"),
          bad: true,
        });
        return;
      }
      void buzz("medium");
      setOpen(null);
      setBringing("");
      setSaid({
        id: event.id,
        words: say("join.youAreDownFor")
          .replace("{n}", people)
          .replace("{places}", say(people === "1" ? "row.place" : "row.places")),
      });
    });
  }

  function cancel(event: Joinable) {
    if (!confirm(say("join.reallyNotComing").replace("{title}", event.title)))
      return;
    setSaid(null);
    start(async () => {
      const answer = await cancelMyPlace(event.id);
      setSaid(
        answer.ok
          ? {
              id: event.id,
              words: say("join.takenOff"),
            }
          : {
              id: event.id,
              words: answer.error ?? say("join.didNotWork"),
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
          words: answer.error ?? say("join.didNotWork"),
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

  /* One row per evening, and the same row the front screen draws — one component
     with the buttons switched on. The pop-up that asks the questions is one
     component too, shared with the evening's own screen, so "count me in" means
     the same three questions wherever it is pressed. */
  function Evening({ event }: { event: Joinable }) {
    return (
      <li>
        <EveningRow
          does
          event={{
            id: event.id,
            title: event.title,
            label: event.label,
            day: event.day,
            month: event.month,
            photo: event.photo,
            partners: event.partners,
            lead: event.lead,
            note: event.note,
            needs: event.needs,
            bringing: event.bringing,
            mine: event.mine,
            spots: event.spots,
            days: event.dayLabels,
            onDays: event.onDays,
          }}
        />

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

  const asking =
    [...events, ...past].find((event) => event.id === open) ?? null;

  return (
    <>
      {/* One pop-up for the whole list: it says which evening it is about, so
          there is never a question of which one you are signing up for — which is
          what the form folding out underneath used to answer. */}
      <JoinSheet
        open={Boolean(asking)}
        eventId={asking?.id ?? ""}
        title={asking?.title ?? ""}
        when={asking?.label}
        spots={asking?.spots}
        mine={asking?.mine ?? null}
        onClose={() => setOpen(null)}
        onDone={(words) => setSaid({ id: asking?.id ?? "", words })}
      />

      <div className="segmented" role="tablist" aria-label={say("join.howToLook")}>
        {(["list", "month"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {say(option === "list" ? "join.whatsNext" : "join.byMonth")}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("join.stillToCome")}</h2>
            <span className="app-label">
              {shown.length} {say(shown.length === 1 ? "join.evening" : "join.evenings")}
            </span>
          </div>

          {/* The places, under the heading they narrow down — the same row the
              front screen has, because it is the same question. */}
          {places.length > 1 ? (
            <div className="app-scroll" role="group" aria-label={say("up.whichPlace")}>
              <button
                type="button"
                className="chip"
                aria-pressed={place === null}
                onClick={() => setPlace(null)}
              >
                {say("up.everywhere")}
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
            <p className="app-note">{say("join.nothingToCome")}</p>
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
            <h2 className="app-h2">{say("join.alreadyHappened")}</h2>
            <span className="app-label">{past.length}</span>
          </div>
          <ul className="row-list">
            {past.map((event) => (
              <li key={event.id}>
                <div className="row row-past">
                  {/* The whole row, not only the name. */}
                  <Link
                    className="row-reach"
                    href={`/app/events/${event.id}`}
                    aria-label={event.title}
                    tabIndex={-1}
                  />
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
                      <span className="row-yes">{say("join.youWereThere")}</span>
                    ) : null}
                  </span>
                  {/* Where somebody wrote it up afterwards, the way to read it. */}
                  {event.story ? (
                    <Link
                      className="pill pill-small"
                      href={`/app/read/${event.story.slug}`}
                    >
                      {say("join.readIt")}
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
  const say = useSay();
  /* The month's name, the weekday and the ordering of "3 September" are the
     language's business rather than ours, so they come from the locale. Only
     the seven initials along the top are written down: a locale gives "lun."
     where a calendar wants one letter. */
  const locale = localeOf(useReading());
  /* Which month is on screen. It follows the chosen day, so pressing into
     September and back is one control rather than two. */
  const [shownMonth, setShownMonth] = useState(() => day.slice(0, 7));

  const onDays = useMemo(() => {
    const map = new Map<string, Joinable[]>();
    const put = (at: string, event: Joinable) =>
      map.set(at, [...(map.get(at) ?? []), event]);

    for (const event of events) {
      /*
       * A calendar marks the days something is happening, not the days a season
       * covers.
       *
       * Every day between the first and the last used to be marked, which for a
       * programme running from the 22nd of August to the 20th of September put an
       * evening on thirty days — twenty-six of which had nothing on them at all.
       * A month view that says yes to every day answers nobody's question, which
       * is "am I free when something is on".
       *
       * So: where an evening has its own days written down — four Saturdays and a
       * Sunday, each with its own name — those are the days. Where it has none, it
       * is a single day, or a genuinely continuous stretch of them, and the range
       * is right. The first case is the one that was wrong.
       */
      if (event.days.length > 0) {
        for (const one of event.days) put(one.date, event);
        continue;
      }

      const first = event.date;
      const last = event.until || event.date;
      for (const at of daysBetween(first, last)) put(at, event);
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
            aria-label={say("month.before")}
          >
            ‹
          </button>
          <strong>
            {firstOfMonth.toLocaleDateString(locale, {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={say("month.after")}
          >
            ›
          </button>
        </div>

        <div className="month-week" aria-hidden="true">
          {say("month.weekLetters").split(" ").map((letter, index) => (
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
                aria-label={`${index + 1} — ${
                  on
                    ? say("month.howManyOn").replace("{n}", String(on.length))
                    : say("month.nothingOn")
                }`}
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
            {new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <span className="app-label">{chosen.length}</span>
        </div>

        {chosen.length === 0 ? (
          <p className="app-note">{say("month.nothingThatDay")}</p>
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
