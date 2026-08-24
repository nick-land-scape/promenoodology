import Link from "next/link";
import Photo from "@/components/Photo";
import type { ClubEvent } from "@/lib/content";
import { pretty } from "@/lib/admin/when";
import { at, type Lang } from "@/lib/lang";
import type { Occasion } from "@/lib/occasions";
import type { Said } from "@/lib/words";

/**
 * One evening, as a card.
 *
 * It was written inside the what's-on page, which was fine while the page was the
 * only place a card appeared. The month now opens the same card when somebody
 * presses a day, and a card drawn twice by two components is a card that drifts —
 * one of them gets the project name under the title and the other does not.
 *
 * A list item rather than a link in a box, because it is always in a list: the
 * grid of cards on the page, and the one or two cards a day has in the month.
 */
export default function EventCard({
  event,
  lang,
  say,
}: {
  event: Occasion;
  lang: Lang;
  say: Said;
}) {
  return (
    <li className="story-card">
      <Link href={at(lang, `/events/${event.slug}`)}>
        <span className="story-cover event-cover-card">
          {event.photo ? (
            <Photo src={event.photo.src} alt="" fill sizes="(max-width: 767px) 45vw, 320px" />
          ) : null}
          {/* The date, on the picture, where a flyer puts it. A card in a row of
              cards is read as a picture and a name; the day is the thing you are
              actually scanning for. */}
          <span className="event-stamp">{stamp(event)}</span>
        </span>
        <span className="story-name">{event.title}</span>
        {/* Which project this afternoon is part of, where it has a name of its
            own. Without it, five cards with five different names look like five
            unrelated things rather than one thing five times. */}
        {event.dayOf ? (
          <span className="story-hook">
            {say("on.partOf")} {event.dayOf}
          </span>
        ) : event.subtitle ? (
          <span className="story-hook">{event.subtitle}</span>
        ) : null}
        <span className="story-meta">
          {[when(event), event.place].filter(Boolean).join(" · ")}
        </span>
        <span className="story-lead">
          {event.lead ||
            (event.days.length > 1
              ? `${event.days.length} ${say("on.days")} ${pretty(event.days[0].date)}`
              : event.note)}
        </span>
      </Link>
    </li>
  );
}

/** The day, short, for the corner of the picture: "SAT 22 AUG", "22 AUG – 20 SEP". */
export function stamp(event: ClubEvent): string {
  if (!event.date) return "";
  const short = (day: string) =>
    new Date(`${day}T00:00:00Z`)
      .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      .toUpperCase();

  if (event.until && event.until !== event.date) {
    return `${short(event.date)} – ${short(event.until)}`;
  }
  const weekday = new Date(`${event.date}T00:00:00Z`)
    .toLocaleDateString("en-GB", { weekday: "short" })
    .toUpperCase();
  return `${weekday} ${short(event.date)}`;
}

/** When it is, in one line: a day, or a stretch of them. */
export function when(event: { date: string; until: string; time: string; endTime: string }) {
  if (!event.date) return "";
  if (event.until) return `${pretty(event.date)} – ${pretty(event.until)}`;
  const hours = [event.time, event.endTime].filter(Boolean).join("–");
  return [pretty(event.date), hours].filter(Boolean).join(", ");
}
