"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Photo from "../Photo";
import JoinSheet from "./JoinSheet";
import { cancelMyPlace, markInterested } from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { useSay } from "./Words";

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
  /* The paragraph the evening opens with — `lead` in the database, "the paragraph
     it opens with" in the back of the house. The row used to show `note` here,
     which is a different field with a different job: "anything else", the
     practical sentence, bring a bowl. So a row introduced an evening with its
     footnote. */
  lead?: string;
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
  /** How many places the evening has altogether. */
  spots?: number;
  /*
   * The programme inside it, where there is one.
   *
   * Three kinds of evening, and the third is the one that needed thinking about:
   * a single day; a stretch of days that is all one thing; and a stretch with a
   * programme in it — a month long, happening on five of those days, each with
   * its own name. Nobody comes to the month, so this is what turns "count me in"
   * into "which days".
   */
  days?: { date: string; title: string; time: string; label: string }[];
  /** The days you already have a place on. */
  onDays?: string[];
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
}: {
  event: EveningRow;
  /* The buttons.
   *
   * The row owns them itself rather than being handed callbacks, and that is what
   * lets the front screen have them too: a screen renders a row, and the row
   * knows how to mark an evening, take a place and give one up. Two screens
   * wiring the same three actions is two screens that drift. */
  does?: boolean;
}) {
  const say = useSay();
  const [marked, setMarked] = useState(event.mine?.state === "interested");
  const [coming, setComing] = useState(
    Boolean(event.mine && event.mine.state !== "interested"),
  );
  const [asking, setAsking] = useState(false);
  const [said, setSaid] = useState("");
  const [pending, start] = useTransition();

  const programme = event.days ?? [];
  const mineDays = event.onDays ?? [];

  function mark(on: boolean) {
    setMarked(on);
    start(async () => {
      const answer = await markInterested(event.id, on);
      if (!answer.ok) {
        setMarked(!on);
        setSaid(answer.error ?? say("row.didNotWork"));
        return;
      }
      void buzz("light");
    });
  }

  function give() {
    start(async () => {
      const answer = await cancelMyPlace(event.id);
      if (!answer.ok) {
        setSaid(answer.error ?? say("row.didNotWork"));
        return;
      }
      setComing(false);
      setSaid(say("row.takenOff"));
    });
  }

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

        {/* Said out loud, because it changes what "coming" means: an evening with
            a programme is a month with five days in it, and a place is taken on a
            day rather than on the month. */}
        {programme.length > 0 ? (
          <span className="row-badge">
            {say("row.daysToChooseFrom").replace("{n}", String(programme.length))}
          </span>
        ) : null}
        <span className="row-meta">{event.label}</span>

        {event.partners && event.partners.length > 0 ? (
          <span className="row-meta">
            {say("row.with")} {event.partners.map((one) => one.name).join(", ")}
          </span>
        ) : null}
        {/* What it is, in the words written for it. Two lines here, the whole of
            it on the evening's own screen: a row is a row. */}
        {event.lead ? <span className="row-lead">{event.lead}</span> : null}

        {event.note ? <span className="row-meta">{event.note}</span> : null}

        {/* What is still wanted, and what is already coming. The two most useful
            sentences about an improvised kitchen. */}
        {does && event.needs?.trim() ? (
          <span className="row-wanted">
            <em>{say("row.stillWanted")}</em>
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
            <em>{say("row.comingWith")}</em>
            {event.bringing.map((one) => (
              <span key={`${one.who}-${one.what}`}>
                {one.what} <i>{one.who.split(" ")[0]}</i>
              </span>
            ))}
          </span>
        ) : null}

        {coming ? (
          <span className="row-yes">
            {say("row.youAreComing")} {event.mine?.people}{" "}
            {say(event.mine?.people === 1 ? "row.place" : "row.places")}
            {event.mine?.guests?.length
              ? ` · ${say("row.withGuests")} ${event.mine.guests.join(", ")}`
              : null}
            {event.mine?.state === "kept"
              ? ` · ${say("row.keptForYou")}`
              : null}
            {event.mine?.state === "declined"
              ? ` · ${say("row.notThisTime")}`
              : null}
          </span>
        ) : marked ? (
          <span className="row-maybe">{say("row.onYourList")}</span>
        ) : null}

        {/* The one decision on the left, the bookmark at the right end of the
            same line, both the same height. */}
        {does ? (
          <span className="row-does">
            {coming ? (
              <span className="row-two">
                <button
                  type="button"
                  className="pill pill-small pill-solid"
                  onClick={() => setAsking(true)}
                  disabled={pending}
                >
                  {say(programme.length > 0 ? "row.changeDays" : "row.changeIt")}
                </button>
                <button
                  type="button"
                  className="pill pill-small"
                  onClick={give}
                  disabled={pending}
                >
                  {say("row.notComing")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="pill pill-small pill-solid"
                onClick={() => setAsking(true)}
                disabled={pending}
              >
                {say(programme.length > 0 ? "row.pickYourDays" : "row.countMeIn")}
              </button>
            )}

            <button
              type="button"
              className={marked ? "mark mark-on" : "mark"}
              onClick={() => mark(!marked)}
              disabled={pending}
              aria-pressed={marked}
              aria-label={say(marked ? "row.takeOffList" : "row.keepOnList")}
              title={say(marked ? "row.onYourList" : "row.keepOnList")}
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
        {said ? <span className="row-said">{said}</span> : null}
      </span>

      {does ? (
        <JoinSheet
          open={asking}
          eventId={event.id}
          title={event.title}
          when={event.label}
          spots={event.spots}
          mine={event.mine ?? null}
          days={programme.length > 0 ? programme : undefined}
          chosen={mineDays}
          onClose={() => setAsking(false)}
          onDone={(words) => {
            setComing(true);
            setSaid(words);
          }}
        />
      ) : null}
    </div>
  );
}
