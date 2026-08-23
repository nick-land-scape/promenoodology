"use client";

import { useState } from "react";
import EveningRow from "./EveningRow";
import type { Occasion } from "@/lib/occasions";
import { useSay } from "@/components/app/Words";

type Props = {
  events: (Occasion & {
    day: string;
    month: string;
    weekday: string;
    /** The whole of when it is, in one line. */
    when: string;
    /** Whether you have asked for a place. */
    going: boolean;
    /** What you have already said, so the row can offer to change it. */
    mine: {
      people: number;
      bringing: string;
      guests?: string[];
      state: "interested" | "asked" | "kept" | "declined";
    } | null;
    /** The days already taken, and the programme's own days. */
    onDays: string[];
    dayLabels: { date: string; title: string; time: string; label: string }[];
  })[];
  places: string[];
};

/** The list of what is coming up, narrowed down by place. */
export default function UpcomingEvents({ events, places }: Props) {
  const say = useSay();
  const [place, setPlace] = useState<string | null>(null);
  const shown = place
    ? events.filter((event) => event.place === place)
    : events;

  return (
    <>
      <div className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("up.comingUp")}</h2>
          <span className="app-label">
            {shown.length} {say(shown.length === 1 ? "up.event" : "up.events")}
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
          <p className="app-note">{say("up.nothingHere")}</p>
        ) : (
          <ul className="row-list">
            {shown.map((event) => (
              <li key={`${event.id}|${event.onDay ?? ""}`}>
                {/* The same row what's on draws, buttons and all: somebody on the
                    front screen who has just read that an evening is on should be
                    able to say yes to it there, rather than being sent to another
                    screen to press the same button. */}
                <EveningRow
                  does
                  event={{
                    id: event.id,
                    title: event.title,
                    label: event.when,
                    day: event.day,
                    month: event.month,
                    photo: event.photo,
                    partners: event.partners,
                    lead: event.lead,
                    note: event.note,
                    mine: event.mine,
                    spots: event.spots,
                    days: event.dayLabels,
                    onDays: event.onDays,
                    onDay: event.onDay,
                    dayOf: event.dayOf,
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
