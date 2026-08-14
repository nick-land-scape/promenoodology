"use client";

import Photo from "../Photo";
import { useState } from "react";
import type { ClubEvent } from "@/lib/content";

type Props = {
  events: (ClubEvent & { day: string; month: string; weekday: string })[];
  places: string[];
};

/** The list of what is coming up, narrowed down by place. */
export default function UpcomingEvents({ events, places }: Props) {
  const [place, setPlace] = useState<string | null>(null);
  const shown = place ? events.filter((event) => event.place === place) : events;

  return (
    <>
      <div className="app-scroll" role="group" aria-label="Filter by place">
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

      <div className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">what is coming up</h2>
          <span className="app-label">
            {shown.length} {shown.length === 1 ? "event" : "events"}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="app-note">Nothing here yet. Try everywhere.</p>
        ) : (
          <ul className="row-list">
            {shown.map((event) => (
              <li key={event.id}>
                <div className="row">
                  <span className="row-date">
                    <span className="row-day">{event.day}</span>
                    <span className="row-month">{event.month}</span>
                  </span>
                  <span className="row-body">
                    <span className="row-title">{event.title}</span>
                    <span className="row-meta">
                      {event.weekday} {event.time} · {event.place} · {event.spots} places
                    </span>
                    {event.note ? <span className="row-meta">{event.note}</span> : null}
                  </span>
                  {event.photo ? (
                    <span className="row-thumb">
                      <Photo src={event.photo.src} alt="" fill sizes="58px" />
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
