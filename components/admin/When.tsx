"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A day and an hour, in one field, behind one calendar.
 *
 * The browser's own date control was the right answer while a date was a date:
 * it gives a phone a wheel, a laptop a calendar, and everybody the format their
 * machine is set to, and it costs nothing. What it cannot do is hold a day and a
 * time as one thing — two native controls side by side are two questions, and an
 * evening's beginning is one.
 *
 * So: a month at a time, and the hour underneath it. Everything is worked out on
 * plain Y-M-D strings and never on a Date built from one, because `new
 * Date("2026-08-22")` is midnight UTC — which in half the world is the day
 * before, and a calendar that highlights the wrong square is worse than no
 * calendar.
 */

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Days in a month, and which weekday it opens on, Monday first. */
function monthShape(year: number, month: number) {
  const length = new Date(year, month + 1, 0).getDate();
  // getDay is Sunday-first; this list is Monday-first, like a week.
  const opensOn = (new Date(year, month, 1).getDay() + 6) % 7;
  return { length, opensOn };
}

function readable(date: string, time: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const said = `${d} ${MONTHS[m - 1]?.slice(0, 3)} ${y}`;
  return time ? `${said}, ${time}` : said;
}

export default function When({
  date,
  time,
  onChange,
  label,
  empty = "not set",
  /** The earliest day worth offering — the beginning, when this is the end. */
  notBefore,
  /**
   * A day with no hour attached.
   *
   * Some of what this holds is genuinely a moment — an evening begins at a time
   * — and some of it is just a day: the date on a note, the day somebody joined.
   * The calendar is the same either way; asking "at what time" about the day
   * somebody joined is asking a question with no answer.
   */
  dayOnly = false,
}: {
  date: string;
  time: string;
  onChange: (date: string, time: string) => void;
  label: string;
  empty?: string;
  notBefore?: string;
  dayOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const now = new Date();
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate());

  /* Which month is on screen. It follows the chosen day when there is one, and
     otherwise opens on this month — and it is state, so paging through does not
     change anything until a day is pressed. */
  const [showing, setShowing] = useState(() => {
    const [y, m] = (date || today).split("-").map(Number);
    return { year: y, month: (m || 1) - 1 };
  });

  useEffect(() => {
    if (!open) return;
    const [y, m] = (date || today).split("-").map(Number);
    setShowing({ year: y, month: (m || 1) - 1 });
  }, [open, date, today]);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const { length, opensOn } = useMemo(
    () => monthShape(showing.year, showing.month),
    [showing],
  );

  function step(by: number) {
    setShowing(({ year, month }) => {
      const next = month + by;
      if (next < 0) return { year: year - 1, month: 11 };
      if (next > 11) return { year: year + 1, month: 0 };
      return { year, month: next };
    });
  }

  const said = readable(date, time);

  return (
    <div className="admin-when" ref={box}>
      <button
        type="button"
        className="admin-when-face"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((was) => !was)}
      >
        <span className={said ? undefined : "admin-when-none"}>{said || empty}</span>
        <svg viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {open ? (
        <div className="admin-when-drop" role="dialog" aria-label={label}>
          <header>
            <button type="button" onClick={() => step(-1)} aria-label="The month before">
              ‹
            </button>
            <strong>
              {MONTHS[showing.month]} {showing.year}
            </strong>
            <button type="button" onClick={() => step(1)} aria-label="The month after">
              ›
            </button>
          </header>

          <div className="admin-when-week" aria-hidden="true">
            {DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="admin-when-grid">
            {/* The blanks before the first, so the first lands on its weekday. */}
            {Array.from({ length: opensOn }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length }, (_, i) => {
              const day = i + 1;
              const value = iso(showing.year, showing.month, day);
              const tooEarly = Boolean(notBefore) && value < notBefore!;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={tooEarly}
                  className={[
                    value === date ? "admin-when-on" : "",
                    value === today ? "admin-when-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={tooEarly ? "Before it starts" : undefined}
                  onClick={() => {
                    onChange(value, time);
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <footer>
            {dayOnly ? (
              <span />
            ) : (
              <label>
                at
                <input
                  type="time"
                  value={time}
                  aria-label={`${label} — the time`}
                  onChange={(event) => onChange(date, event.target.value)}
                />
              </label>
            )}
            {date || time ? (
              <button
                type="button"
                className="admin-when-clear"
                onClick={() => {
                  onChange("", "");
                  setOpen(false);
                }}
              >
                clear it
              </button>
            ) : null}
          </footer>
        </div>
      ) : null}
    </div>
  );
}
