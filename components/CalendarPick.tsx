"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarRow } from "@/lib/calendar";

/**
 * Which day, and which calendar — asked at the moment somebody presses the button.
 *
 * Two questions, so two steps: which occasion, then which calendar. Both were being
 * answered on somebody's behalf — the button downloaded the whole programme as a file
 * and gave no hint that Google and Outlook existed or that a single Saturday could be
 * added on its own.
 *
 * Asked in that order because that is the order they are decided in: whether you can
 * come on the fifth is a question about your life, and which calendar you keep is a
 * fact about your phone. And where there is only one occasion there is no first
 * question, so it is not asked — an evening on one afternoon opens straight into the
 * three routes.
 *
 * A menu of links rather than a `<select>`: one of these is a download and two are
 * journeys to somebody else's site, and dressing a link as a form control means it
 * cannot be opened in a new tab, copied, or sent to somebody.
 *
 * On the icons: there are none, and that is a decision rather than an omission.
 * Apple's own guidelines forbid using the apple mark in an interface without
 * permission, Google's and Microsoft's brands have their own rules about colour and
 * clear space, and a hand-drawn approximation of a logo reads as a counterfeit. The
 * names are the names.
 */
export default function CalendarPick({
  rows,
  words,
  className = "icon-switch",
}: {
  rows: CalendarRow[];
  words: {
    open: string;
    /** The heading of the first step. */
    which: string;
    /** The way back to it. */
    back: string;
    file: string;
    google: string;
    outlook: string;
    said: string;
  };
  /** How the button looks: the site's icon switch, or the app's own pill. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  /* Which occasion is being added. Null means the question has not been asked yet —
     and with one occasion to choose from there is no question, so it answers itself. */
  const [chose, setChose] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const only = rows.length === 1 ? rows[0] : null;
  const picked = only ?? rows.find((row) => row.key === chose) ?? null;

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        /* Escape goes back a step before it closes the menu, which is the order
           somebody presses it in. */
        if (chose && !only) setChose(null);
        else setOpen(false);
      }
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open, chose, only]);

  /* Shutting it forgets which day was chosen: opening it again is a new question,
     not the middle of the last one. */
  function shut() {
    setOpen(false);
    setChose(null);
  }

  if (rows.length === 0) return null;

  return (
    <div className="calendar-pick" ref={box}>
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={words.open}
        title={words.open}
        onClick={() => (open ? shut() : setOpen(true))}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
          <path
            d="M4.5 6.5h15v13h-15zM8 3.5v4M16 3.5v4M4.5 11h15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span aria-hidden="true">{words.open}</span>
      </button>

      {open ? (
        <div className="calendar-pick-list" role="menu">
          {picked ? (
            /* The second step: this day, and the calendars that can take it. */
            <>
              <p className="calendar-pick-head">
                {only ? null : (
                  <button type="button" onClick={() => setChose(null)}>
                    ← {words.back}
                  </button>
                )}
                <b>{picked.label}</b>
              </p>

              {/* One route per line, each with its own mark.
              
                  The marks are letters in a box, in this site's own type, and that
                  is deliberate: Apple's guidelines forbid using the apple in an
                  interface without permission, Google's and Microsoft's brands have
                  rules about colour and clear space, and a hand-drawn approximation
                  of somebody's logo reads as a counterfeit. A letter is honest and
                  tells them apart at a glance, which is all a mark has to do here. */}
              <a className="calendar-pick-way" role="menuitem" href={picked.file} download onClick={shut}>
                <b aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="13" height="13">
                    <path
                      d="M4.5 6.5h15v13h-15zM8 3.5v4M16 3.5v4M4.5 11h15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </b>
                {words.file}
              </a>
              {picked.google ? (
                <a
                  className="calendar-pick-way"
                  role="menuitem"
                  href={picked.google}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={shut}
                >
                  <b aria-hidden="true">G</b>
                  {words.google}
                </a>
              ) : null}
              {picked.outlook ? (
                <a
                  className="calendar-pick-way"
                  role="menuitem"
                  href={picked.outlook}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={shut}
                >
                  <b aria-hidden="true">O</b>
                  {words.outlook}
                </a>
              ) : null}

              <p className="calendar-pick-said">{words.said}</p>
            </>
          ) : (
            /* The first step: which of them. */
            <>
              <p className="calendar-pick-head">
                <b>{words.which}</b>
              </p>
              {rows.map((row) => (
                <button
                  type="button"
                  role="menuitem"
                  className="calendar-pick-day"
                  key={row.key}
                  onClick={() => setChose(row.key)}
                >
                  {row.label}
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
