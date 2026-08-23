"use client";

import { useState } from "react";
import EveningRow from "./EveningRow";
import type { ClubEvent } from "@/lib/content";

type Props = {
  events: (ClubEvent & {
    day: string;
    month: string;
    weekday: string;
    /** The whole of when it is, in one line. */
    when: string;
    /** Whether you have asked for a place. */
    going: boolean;
  })[];
  places: string[];
};

/** The list of what is coming up, narrowed down by place. */
export default function UpcomingEvents({ events, places }: Props) {
  const [place, setPlace] = useState<string | null>(null);
  const shown = place
    ? events.filter((event) => event.place === place)
    : events;

  return (
    <>
      <div className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">what is coming up</h2>
          <span className="app-label">
            {shown.length} {shown.length === 1 ? "event" : "events"}
          </span>
        </div>

        {/*
         * The places, under the heading they belong to.
         *
         * They were the first thing on the screen, above everything, which made
         * them look like they governed the whole of it — and they govern six
         * evenings. Under this heading it is obvious what they narrow down, and
         * only shown when there is more than one place to choose between.
         */}
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
          <p className="app-note">Nothing here yet. Try everywhere.</p>
        ) : (
          <ul className="row-list">
            {shown.map((event) => (
              <li key={event.id}>
                {/* The same row what's on draws, with the buttons switched off:
                    this screen is a summary, and deciding belongs on the screen
                    that is about deciding. */}
                <EveningRow
                  event={{
                    id: event.id,
                    title: event.title,
                    label: event.when,
                    day: event.day,
                    month: event.month,
                    photo: event.photo,
                    partners: event.partners,
                    note: event.note,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
