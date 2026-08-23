"use client";

import Link from "next/link";
import Photo from "../Photo";

export type EveningRow = {
  id: string;
  title: string;
  /** When it is, said the way a row says it. */
  label: string;
  /** The day and the month, for the stamp on the picture. */
  day: string;
  month: string;
  photo: { src: string } | null;
  partners?: { name: string }[];
  note?: string;
  /** What is still wanted, one thing per line. */
  needs?: string;
  /** What people are already bringing. */
  bringing?: { who: string; what: string }[];
  /** Your own place or mark, where you have one. */
  mine?: {
    people: number;
    bringing: string;
    guests?: string[];
    state: "interested" | "asked" | "kept" | "declined";
  } | null;
};

/**
 * One evening, in a row. The same row on the front screen and on what's on.
 *
 * Not to be confused with Evening, which is the screen an evening gets to itself:
 * this is the line in a list, that is the page.
 *
 * It was two rows: one on the home screen that could only be read, one on what's
 * on that could be pressed — the same evening drawn twice, by two components,
 * with two ideas about where the date goes. Two of anything drift, and these had:
 * a date column here, a stamp on the picture there, a thumbnail on the right in
 * one and on the left in the other.
 *
 * So there is one, and `does` decides how much of it appears. On the front screen
 * it is the picture, the day, the words and nothing to press — that screen is a
 * summary and pressing belongs on the screen that is about deciding. On what's on
 * the same row grows a line of two buttons: the one real decision, and the
 * bookmark for the evening you have not decided about.
 *
 * The date is on the picture in both, which is the arrangement that gives the
 * words the width: a date column and a photograph column either side of them is
 * two pieces of furniture in a room four hundred points wide.
 */
export default function EveningRow({
  event,
  does,
  marked,
  pending,
  onMark,
  onJoin,
  onCancel,
}: {
  event: EveningRow;
  /** The buttons. Off on the front screen, on where the deciding happens. */
  does?: boolean;
  marked?: boolean;
  pending?: boolean;
  onMark?: (on: boolean) => void;
  onJoin?: () => void;
  onCancel?: () => void;
}) {
  const coming = Boolean(event.mine && event.mine.state !== "interested");

  return (
    <div className="row">
      {/* The whole row opens the evening, not only its name.
          It cannot be one big link: there are buttons inside it, and a button
          inside an anchor is invalid and behaves differently in every browser. So
          the link is a sheet stretched over the row, underneath the buttons —
          which means a press on the picture, the date or any of the words lands on
          the evening, and a press on a button lands on the button. */}
      <Link
        href={`/app/events/${event.id}`}
        className="row-reach"
        aria-label={event.title}
        tabIndex={-1}
      />

      {/* The day, stamped on the picture. Evenings with no photograph keep the
          same tile in paper with a hairline, so the list has one left edge. */}
      <span className={event.photo ? "row-when" : "row-when row-when-bare"}>
        {event.photo ? (
          <Photo src={event.photo.src} alt="" fill sizes="72px" />
        ) : null}
        <span className="row-date">
          <span className="row-day">{event.day}</span>
          <span className="row-month">{event.month}</span>
        </span>
      </span>

      <span className="row-body">
        <Link href={`/app/events/${event.id}`} className="row-title">
          {event.title}
        </Link>
        <span className="row-meta">{event.label}</span>

        {event.partners && event.partners.length > 0 ? (
          <span className="row-meta">
            with {event.partners.map((one) => one.name).join(", ")}
          </span>
        ) : null}
        {event.note ? <span className="row-meta">{event.note}</span> : null}

        {/* What is still wanted, and what is already coming. The two most useful
            sentences about an improvised kitchen. */}
        {does && event.needs?.trim() ? (
          <span className="row-wanted">
            <em>still wanted</em>
            {event.needs
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => (
                <span key={line}>{line}</span>
              ))}
          </span>
        ) : null}

        {does && event.bringing && event.bringing.length > 0 ? (
          <span className="row-coming">
            <em>coming with</em>
            {event.bringing.map((one) => (
              <span key={`${one.who}-${one.what}`}>
                {one.what} <i>{one.who.split(" ")[0]}</i>
              </span>
            ))}
          </span>
        ) : null}

        {coming ? (
          <span className="row-yes">
            you are coming, {event.mine?.people}{" "}
            {event.mine?.people === 1 ? "place" : "places"}
            {event.mine?.guests?.length
              ? ` · with ${event.mine.guests.join(", ")}`
              : null}
            {event.mine?.state === "kept" ? " · kept for you" : null}
            {event.mine?.state === "declined" ? " · not this time" : null}
          </span>
        ) : marked ? (
          <span className="row-maybe">on your list</span>
        ) : null}

        {/* The one decision on the left, the bookmark at the right end of the
            same line, both the same height. */}
        {does ? (
          <span className="row-does">
            {coming ? (
              <button
                type="button"
                className="pill pill-small"
                onClick={() => onCancel?.()}
                disabled={pending}
              >
                not coming
              </button>
            ) : (
              <button
                type="button"
                className="pill pill-small pill-solid"
                onClick={() => onJoin?.()}
                disabled={pending}
              >
                count me in
              </button>
            )}

            <button
              type="button"
              className={marked ? "mark mark-on" : "mark"}
              onClick={() => onMark?.(!marked)}
              disabled={pending}
              aria-pressed={marked}
              aria-label={marked ? "Take it off your list" : "Keep it on your list"}
              title={marked ? "On your list" : "Keep it on your list"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
                  fill={marked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
        ) : null}
      </span>
    </div>
  );
}
