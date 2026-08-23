import type { ClubEvent } from "./content";

/**
 * One thing you can turn up to.
 *
 * Not the same as an event, and that difference is the whole file. "Ateliers
 * olfactifs" is one event: one page, one description, one set of partners, one
 * flyer, one story about it afterwards. But it is five things you can turn up to —
 * four Saturdays and a Sunday, each with its own name and its own hours — and a
 * list of what is on is a list of those, not of the month they sit in.
 *
 * The old shape put the month in the list: a single row saying 22 August to 20
 * September, filed under August, three weeks before anything happened. Somebody
 * looking for what is on this Saturday could not see that there was something on
 * this Saturday. So the list is built out of occasions instead, and each one lands
 * in the week it belongs to.
 *
 * What it deliberately does *not* do is make five events. The id stays the parent's
 * — bookings, photographs and the story hang off it — so five rows still open one
 * page, and the archive still shows one project rather than five copies of it.
 */
export type Occasion = ClubEvent & {
  /** The day this one is, where the event has a programme. Null: the whole thing. */
  onDay: string | null;
  /* What the whole thing is called, where this is one day of it.
     Not `partOf`, which an event already has and which means something else: the
     festival or the larger project the whole event belongs to. This is the event
     itself, seen from one of its days. */
  dayOf: string | null;
};

/** Every event, with a programme turned into its days, in the order they happen. */
export function byDay(events: ClubEvent[]): Occasion[] {
  const out: Occasion[] = [];

  for (const event of events) {
    /* One day, or a stretch that is all one thing: it is already an occasion. */
    if (event.days.length === 0) {
      out.push({ ...event, onDay: null, dayOf: null });
      continue;
    }

    for (const day of event.days) {
      out.push({
        ...event,
        /* The day's own date and hours stand in for the event's, so every piece of
           date formatting in the app and on the site goes on working without
           knowing any of this happened. */
        date: day.date,
        until: "",
        time: day.time,
        endTime: day.endTime,
        /* Its own name where it has one — "Marathon of the scrub" is what somebody
           is deciding about — and the parent's where it does not. */
        title: day.title || event.title,
        lead: day.what || event.lead,
        /* No programme inside an occasion: this *is* one of the days, so a row
           drawn from it must not offer to pick between them again. */
        days: [],
        onDay: day.date,
        dayOf: day.title ? event.title : null,
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

/** A key for one person's answer about one occasion. */
export const placeKey = (eventId: string, onDay: string | null) =>
  `${eventId}|${onDay ?? ""}`;
