"use client";

import { useState, type ReactNode } from "react";
import EventsCalendar from "./EventsCalendar";

/**
 * What's on: as a list, or as a month.
 *
 * The switch between them, and the only reason this file is a client component —
 * everything it draws is rendered on the server and handed over whole.
 *
 * The button sits on the same line as the page's name, at the right end of it,
 * because that is what it is: the other way of looking at this page. It used to
 * be a button under the introduction which unfolded a month *above* the list, so
 * asking the second question pushed the answer to the first one off the screen,
 * and the page had two answers open at once with no way to say which you were
 * reading. One or the other, chosen where the page is named.
 */
export default function WhatsOn({
  title,
  intro,
  days,
  lang,
  words,
  children,
}: {
  title: string;
  intro: ReactNode;
  /** The days anything is on, each with its cards. Empty: no month to offer. */
  days: { date: string; cards: ReactNode[] }[];
  lang: "en" | "fr";
  words: {
    asMonth: string;
    asList: string;
    pressOne: string;
    before: string;
    after: string;
    close: string;
  };
  /** The list: the groups of cards, and what has been. */
  children: ReactNode;
}) {
  const [asMonth, setAsMonth] = useState(false);

  /* Nothing to see as a month until there is more than one day with something on
     it: a calendar of one marked day is a worse way of saying one date. */
  const worth = days.length > 1;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
        {worth ? (
          <button
            type="button"
            className="cal-open"
            aria-pressed={asMonth}
            onClick={() => setAsMonth((now) => !now)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {asMonth ? (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6h16v15H4zM4 10h16M8 3v4M16 3v4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            {asMonth ? words.asList : words.asMonth}
          </button>
        ) : null}
      </div>

      {intro}

      {asMonth ? (
        <EventsCalendar
          days={days}
          lang={lang}
          words={{
            pressOne: words.pressOne,
            before: words.before,
            after: words.after,
            close: words.close,
          }}
        />
      ) : (
        children
      )}
    </>
  );
}
