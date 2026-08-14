"use client";

import Image from "next/image";
import { useState } from "react";
import type { ClubEvent } from "@/lib/content";

const KINDS = [
  { key: "events", label: "events" },
  { key: "spaces", label: "spaces" },
  { key: "whole", label: "a whole evening" },
] as const;

type Kind = (typeof KINDS)[number]["key"];

type Props = {
  events: (ClubEvent & { label: string })[];
};

/**
 * The booking screen. Nothing is sent anywhere yet, so the form says so
 * plainly instead of pretending to have worked.
 */
export default function BookingForm({ events }: Props) {
  const [kind, setKind] = useState<Kind>("events");
  const [event, setEvent] = useState(events[0]?.id ?? "");
  const [people, setPeople] = useState("2");
  const [asked, setAsked] = useState<string | null>(null);

  const chosen = events.find((item) => item.id === event);

  return (
    <>
      <div className="strip" role="tablist" aria-label="What to book">
        {KINDS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={kind === option.key}
            onClick={() => {
              setKind(option.key);
              setAsked(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {kind === "events" ? (
        <form
          onSubmit={(submit) => {
            submit.preventDefault();
            setAsked(chosen ? `${chosen.title}, ${people} ${people === "1" ? "place" : "places"}` : null);
          }}
        >
          <div className="app-section">
            <h2 className="app-h2">keep me a place</h2>
          </div>

          <div className="field-block">
            <div className="field">
              <label htmlFor="event">which one</label>
              <select id="event" value={event} onChange={(e) => setEvent(e.target.value)}>
                {events.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-pair">
              <div className="field">
                <label htmlFor="people">how many of you</label>
                <select id="people" value={people} onChange={(e) => setPeople(e.target.value)}>
                  {["1", "2", "3", "4", "5", "6"].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bringing">bringing</label>
                <input id="bringing" placeholder="a pot, a friend…" />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="pill pill-solid pill-wide">
              ask for a place
            </button>
            {asked ? (
              <p className="app-note" style={{ paddingTop: 12 }}>
                Noted here only: {asked}. This is a placeholder — no message has been sent.
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      {kind === "spaces" ? (
        <div className="app-section">
          <h2 className="app-h2">spaces we can use</h2>
          <ul className="row-list">
            {[
              ["the courtyard kitchen", "Wipkingenplatz · Sundays until October"],
              ["the long table", "wherever it fits · forty plates"],
              ["the workshop", "Altstetten · Wednesday evenings"],
            ].map(([title, meta]) => (
              <li key={title}>
                <div className="row">
                  <span className="row-body">
                    <span className="row-title">{title}</span>
                    <span className="row-meta">{meta}</span>
                  </span>
                  <button type="button" className="pill pill-small">
                    ask
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {kind === "whole" ? (
        <div className="app-section">
          <h2 className="app-h2">a whole evening</h2>
          <p className="post-text" style={{ paddingBottom: 14 }}>
            Tell us roughly how many people and what you would like to eat, and we will work out the
            rest together. Anything from eight to five hundred.
          </p>
          <a className="pill pill-solid pill-wide" href="mailto:info@promeNOODology.com">
            write to us
          </a>
        </div>
      ) : null}

      {kind === "events" ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">open for booking</h2>
          </div>
          <ul className="row-list">
            {events.map((option) => (
              <li key={option.id}>
                <div className="row">
                  {option.photo ? (
                    <span className="row-thumb">
                      <Image src={option.photo.src} alt="" fill sizes="58px" />
                    </span>
                  ) : null}
                  <span className="row-body">
                    <span className="row-title">{option.title}</span>
                    <span className="row-meta">{option.label}</span>
                  </span>
                  <button
                    type="button"
                    className="pill pill-small"
                    onClick={() => {
                      setEvent(option.id);
                      setAsked(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    book
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
