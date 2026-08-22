"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClubEvent } from "@/lib/content";
import { pretty } from "@/lib/admin/when";

/**
 * A month, and what is on the day you press.
 *
 * The list underneath answers "what is coming up"; this answers the other
 * question people actually have, which is "is anything on the weekend I am
 * free". Those are different enough to be worth two shapes of the same handful
 * of evenings.
 *
 * A day is marked only where something really happens on it. An evening with a
 * programme runs for a month and takes up five afternoons of it — filling in the
 * twenty-six days between them would be a calendar that says "something is on"
 * every day of September and is wrong on twenty-six of them.
 *
 * Monday first, because that is the week here. Only marked days are pressable: a
 * calendar where every square invites a tap and thirty of them answer "nothing"
 * is a calendar that wastes thirty taps.
 */
export default function EventsCalendar({ events }: { events: ClubEvent[] }) {
  const today = new Date().toISOString().slice(0, 10);

  /* Which month is on screen. It opens on the one the next evening is in rather
     than on this one, so a quiet fortnight does not open on an empty grid. */
  const [shown, setShown] = useState(() => {
    const next = [...events]
      .map((event) => firstDay(event))
      .filter((day) => day >= today)
      .sort()[0];
    return (next ?? today).slice(0, 7);
  });

  const [chosen, setChosen] = useState<string | null>(null);

  /* Folded away until asked for. The list under it is the answer to the first
     question anybody has of this page; a month is the second, and a month open
     by default pushes the first answer below the fold to do it. */
  const [open, setOpen] = useState(false);

  const onDays = useMemo(() => {
    const map = new Map<string, ClubEvent[]>();
    for (const event of events) {
      for (const day of daysOf(event)) {
        map.set(day, [...(map.get(day) ?? []), event]);
      }
    }
    return map;
  }, [events]);

  const [year, month] = shown.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Sunday is 0 in JavaScript and last in a week here.
  const blanks = (first.getUTCDay() + 6) % 7;

  const step = (by: number) => {
    const at = new Date(Date.UTC(year, month - 1 + by, 1));
    setShown(`${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`);
    setChosen(null);
  };

  const showing = chosen ? (onDays.get(chosen) ?? []) : [];

  if (!open) {
    return (
      <button type="button" className="cal-open" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16v15H4zM4 10h16M8 3v4M16 3v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        see it as a month
      </button>
    );
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" onClick={() => step(-1)} aria-label="The month before">
          ‹
        </button>
        <strong>
          {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </strong>
        <button type="button" onClick={() => step(1)} aria-label="The month after">
          ›
        </button>
      </div>

      <div className="cal-week" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>

      <div className="cal-grid">
        {Array.from({ length: blanks }, (_, blank) => (
          <span key={`blank-${blank}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const date = `${shown}-${String(index + 1).padStart(2, "0")}`;
          const on = onDays.get(date);
          return (
            <button
              key={date}
              type="button"
              className={[
                "cal-day",
                on ? "cal-day-on" : "",
                date === chosen ? "cal-day-chosen" : "",
                date === today ? "cal-day-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!on}
              onClick={() => setChosen(date === chosen ? null : date)}
              aria-label={`${index + 1} — ${on ? `${on.length} on` : "nothing on"}`}
            >
              {index + 1}
              {on ? <em aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {chosen ? (
        <div className="cal-said" aria-live="polite">
          <p className="cal-said-day">{pretty(chosen)}</p>
          {showing.length === 0 ? (
            <p>Nothing on that day.</p>
          ) : (
            <ul>
              {showing.map((event) => (
                <li key={event.id}>
                  <Link href={`/events/${event.slug}`}>{event.title}</Link>
                  {/* Which part of it, where it is one of several. */}
                  {dayName(event, chosen) ? <span> — {dayName(event, chosen)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="cal-hint">The marked days have something on. Press one.</p>
      )}

      <button type="button" className="cal-shut" onClick={() => setOpen(false)}>
        back to the list
      </button>
    </div>
  );
}

/** The first day anything actually happens. */
function firstDay(event: ClubEvent): string {
  return event.days.length > 0 ? event.days[0].date : event.date;
}

/**
 * The days this evening is really on.
 *
 * Its programme, where it has one; otherwise every day between its beginning and
 * its end, which for anything without a programme is one day or a short run.
 */
function daysOf(event: ClubEvent): string[] {
  if (event.days.length > 0) return event.days.map((day) => day.date).filter(Boolean);
  if (!event.date) return [];
  if (!event.until || event.until === event.date) return [event.date];

  const out: string[] = [];
  const at = new Date(`${event.date}T00:00:00Z`);
  const end = new Date(`${event.until}T00:00:00Z`);
  if (Number.isNaN(at.getTime()) || Number.isNaN(end.getTime())) return [event.date];
  // A month of it at most, so a bad pair of dates cannot spin for ever.
  for (let guard = 0; at <= end && guard < 40; guard += 1) {
    out.push(at.toISOString().slice(0, 10));
    at.setUTCDate(at.getUTCDate() + 1);
  }
  return out;
}

/** What that day of it is called, for an evening with a programme. */
function dayName(event: ClubEvent, day: string): string {
  return event.days.find((one) => one.date === day)?.title ?? "";
}
