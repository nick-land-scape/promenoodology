"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { pretty } from "@/lib/admin/when";

/**
 * A month, and the evening that opens when you press a day.
 *
 * The list answers "what is coming up"; this answers the other question people
 * actually have, which is "is anything on the weekend I am free". Two shapes of
 * the same handful of evenings, and pressing the button beside the page's name
 * swaps one for the other — see WhatsOn, which owns that switch. It used to
 * unfold underneath the list, which meant the answer to the second question
 * pushed the answer to the first one off the screen.
 *
 * What a day opens is the card, not a line of small print. It was a list of blue
 * links under the grid: a different thing to read, in a different shape, for the
 * evening whose card was already three inches further down the page. Now it is
 * that card — the photograph, the date on it, what it is part of, where and when,
 * the paragraph it opens with — in a pop-up over the month, so the month stays
 * where it was and nothing has to be scrolled back to.
 *
 * A day is marked only where something really happens on it. An evening with a
 * programme runs for a month and takes up five afternoons of it; filling in the
 * twenty-six days between them would be a calendar that is wrong twenty-six
 * times.
 *
 * Monday first, because that is the week here. Only marked days are pressable: a
 * calendar where every square invites a tap and thirty of them answer "nothing"
 * is a calendar that wastes thirty taps.
 */
export default function EventsCalendar({
  days,
  lang,
  words,
}: {
  /* The days anything is on, each with the cards for it — rendered on the server
     and handed over whole, so the month draws the same card the page does and
     this file knows nothing about what is in one. */
  days: { date: string; cards: ReactNode[] }[];
  lang: "en" | "fr";
  /* Handed in rather than held here: the words the site says are looked up on
     the server, where the language is known. */
  words: {
    pressOne: string;
    before: string;
    after: string;
    close: string;
  };
}) {
  const today = new Date().toISOString().slice(0, 10);

  /* Which month is on screen. It opens on the one the next evening is in rather
     than on this one, so a quiet fortnight does not open on an empty grid. */
  const [shown, setShown] = useState(() => {
    const next = days
      .map((day) => day.date)
      .filter((date) => date >= today)
      .sort()[0];
    return (next ?? today).slice(0, 7);
  });

  const [chosen, setChosen] = useState<string | null>(null);

  const onDays = new Map(days.map((day) => [day.date, day.cards]));

  const [year, month] = shown.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Sunday is 0 in JavaScript and last in a week here.
  const blanks = (first.getUTCDay() + 6) % 7;

  const step = (by: number) => {
    const at = new Date(Date.UTC(year, month - 1 + by, 1));
    setShown(`${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`);
    setChosen(null);
  };

  /* Escape shuts the pop-up, and while it is open the page underneath does not
     scroll — it is a thing on top of the month, and a backdrop you can scroll
     behind is a backdrop that reads as part of the page. */
  useEffect(() => {
    if (!chosen) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChosen(null);
    };
    window.addEventListener("keydown", key);
    const held = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = held;
    };
  }, [chosen]);

  const showing = chosen ? (onDays.get(chosen) ?? []) : [];

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" onClick={() => step(-1)} aria-label={words.before}>
          ‹
        </button>
        <strong>
          {first.toLocaleDateString(lang === "fr" ? "fr-CH" : "en-GB", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <button type="button" onClick={() => step(1)} aria-label={words.after}>
          ›
        </button>
      </div>

      <div className="cal-week" aria-hidden="true">
        {(lang === "fr"
          ? ["L", "M", "M", "J", "V", "S", "D"]
          : ["M", "T", "W", "T", "F", "S", "S"]
        ).map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>

      <div className="cal-grid">
        {Array.from({ length: blanks }, (_, blank) => (
          <span key={`blank-${blank}`} />
        ))}
        {Array.from({ length: count }, (_, index) => {
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

      <p className="cal-hint">{words.pressOne}</p>

      {/* Into the body, not into the page.

          The site's own furniture — the menu, the strip along the top — is drawn
          in `body`, and this used to live inside the page wrapper: anything with
          a stacking context of its own paints over a pop-up that is a
          descendant of it, however high its z-index. The lightbox learned this
          the hard way. */}
      {chosen && showing.length > 0
        ? createPortal(
            <div
              className="cal-pop"
              role="dialog"
              aria-modal="true"
              aria-label={pretty(chosen)}
              onClick={(event) => {
                // The backdrop shuts it; a press on the card itself does not.
                if (event.target === event.currentTarget) setChosen(null);
              }}
            >
              <div className="cal-pop-box">
                <p className="cal-pop-day">
                  {pretty(chosen)}
                  <button type="button" onClick={() => setChosen(null)} aria-label={words.close}>
                    ×
                  </button>
                </p>
                {/* The same list the page is made of, so it is the same card. */}
                <ul className="story-list cal-pop-list">{showing}</ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
