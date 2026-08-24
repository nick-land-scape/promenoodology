"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarRow } from "@/lib/calendar";

/**
 * Which day, and which calendar — asked at the moment somebody presses the button.
 *
 * Two questions, and they were both being answered on somebody's behalf: the button
 * downloaded the whole programme as a file and gave no hint that Google and Outlook
 * existed or that a single Saturday could be added on its own. So it asks. One row
 * per thing that can be added, and on each row the routes that can take it.
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
  words: { open: string; file: string; google: string; outlook: string; said: string };
  /** How the button looks: the site's icon switch, or the app's own pill. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

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
        onClick={() => setOpen((was) => !was)}
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
          {rows.map((row) => (
            <div className="calendar-pick-row" key={row.key}>
              <p>{row.label}</p>
              <span>
                {/* The file first: it is the only route Apple has, and the one every
                    other calendar takes as well. */}
                <a role="menuitem" href={row.file} download onClick={() => setOpen(false)}>
                  {words.file}
                </a>
                {row.google ? (
                  <a
                    role="menuitem"
                    href={row.google}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => setOpen(false)}
                  >
                    {words.google}
                  </a>
                ) : null}
                {row.outlook ? (
                  <a
                    role="menuitem"
                    href={row.outlook}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => setOpen(false)}
                  >
                    {words.outlook}
                  </a>
                ) : null}
              </span>
            </div>
          ))}
          <p className="calendar-pick-said">{words.said}</p>
        </div>
      ) : null}
    </div>
  );
}
