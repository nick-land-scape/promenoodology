import type { ClubEvent } from "./content";

/**
 * The ways of putting one evening into somebody's own calendar.
 *
 * One row per thing that can be added — the whole programme, or one of its days,
 * or a single evening that has no programme — and per row, up to three routes to it.
 *
 * The file is always there and is the only one Apple has: there is no address that
 * opens Apple Calendar with an event in it, and the .ics is what iOS and macOS open
 * in Calendar with an Add button showing. Google and Outlook both have an address
 * that opens their own new-entry screen filled in, so all that is left is Save —
 * but each takes exactly one entry, which is why a whole programme is offered as
 * the file alone rather than flattened into a month-long block.
 */
export type CalendarRow = {
  /** Which occasion this is, for React and for the query. */
  key: string;
  /** What to call it: "the whole programme", or "Saturday 5 September". */
  label: string;
  file: string;
  google?: string;
  outlook?: string;
};

type Said = { whole: string; when: (iso: string, time: string) => string };

/** Every row for an evening, in the order somebody would read them. */
export function calendarRows(event: ClubEvent, say: Said): CalendarRow[] {
  if (!event.slug || !event.date) return [];

  const where = [event.place, event.address].filter(Boolean).join(", ");
  const file = `/events/${event.slug}/calendar.ics`;

  if (event.days.length === 0) {
    return [
      {
        key: "all",
        label: say.when(event.date, event.time),
        file,
        google: googleFor(event, where, {
          date: event.date,
          until: event.until,
          time: event.time,
          endTime: event.endTime,
          title: event.title,
        }),
        outlook: outlookFor(event, where, {
          date: event.date,
          until: event.until,
          time: event.time,
          endTime: event.endTime,
          title: event.title,
        }),
      },
    ];
  }

  return [
    /* The lot, as one file. First, because somebody who wants the programme wants
       all of it and should not have to add five things one at a time. */
    { key: "all", label: say.whole, file },
    ...event.days.map((day) => {
      const one = {
        date: day.date,
        until: "",
        time: day.time,
        endTime: day.endTime,
        title: [event.title, day.title].filter(Boolean).join(" · "),
      };
      return {
        key: day.date,
        label: [say.when(day.date, day.time), day.title].filter(Boolean).join(" — "),
        file: `${file}?day=${day.date}`,
        google: googleFor(event, where, one),
        outlook: outlookFor(event, where, one),
      };
    }),
  ];
}

type One = {
  date: string;
  until: string;
  time: string;
  endTime: string;
  title: string;
};

/** Google's own "new entry, filled in" page. */
function googleFor(event: ClubEvent, where: string, one: One) {
  const at = new URL("https://calendar.google.com/calendar/render");
  at.searchParams.set("action", "TEMPLATE");
  at.searchParams.set("text", one.title);
  at.searchParams.set("dates", span(one));
  /* The hours are this club's own — "three in the afternoon" in Versoix — so the
     zone travels with them rather than being converted away. */
  at.searchParams.set("ctz", "Europe/Zurich");
  if (where) at.searchParams.set("location", where);
  if (event.lead) at.searchParams.set("details", event.lead);
  return at.toString();
}

/** Outlook's. */
function outlookFor(event: ClubEvent, where: string, one: One) {
  const at = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  at.searchParams.set("path", "/calendar/action/compose");
  at.searchParams.set("rru", "addevent");
  at.searchParams.set("subject", one.title);
  if (where) at.searchParams.set("location", where);
  if (event.lead) at.searchParams.set("body", event.lead);

  const [from, to] = instants(one);
  at.searchParams.set("startdt", from);
  at.searchParams.set("enddt", to);
  if (!one.time) at.searchParams.set("allday", "true");
  return at.toString();
}

const plain = (iso: string) => iso.replaceAll("-", "");

const clock = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return `${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
};

/** Where an evening says when it starts and not when it ends. */
const threeHoursOn = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return `${String((Number(hours) + 3) % 24).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

/** Google wants local times either side of a slash. */
function span(one: One) {
  if (!one.time) {
    /* All day, and the end is the morning after: exclusive, here and in Google's
       own format, and getting it wrong loses the last day. */
    const last = new Date(`${one.until || one.date}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return `${plain(one.date)}/${plain(last.toISOString().slice(0, 10))}`;
  }
  const ends = one.endTime || threeHoursOn(one.time);
  return `${plain(one.date)}T${clock(one.time)}/${plain(one.until || one.date)}T${clock(ends)}`;
}

/** Outlook wants instants, so the club's hours are converted from its own clock. */
function instants(one: One): [string, string] {
  if (!one.time) {
    const last = new Date(`${one.until || one.date}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return [`${one.date}T00:00:00.000Z`, `${last.toISOString().slice(0, 10)}T00:00:00.000Z`];
  }

  const shift = offsetOf(one.date);
  const asUtc = (time: string) => {
    const [hours = "0", minutes = "0"] = time.split(":");
    const at = new Date(
      `${one.date}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00.000Z`,
    );
    at.setUTCHours(at.getUTCHours() - shift);
    return at.toISOString();
  };
  return [asUtc(one.time), asUtc(one.endTime || threeHoursOn(one.time))];
}

/**
 * How far ahead of UTC Zurich is on a given day: two in summer, one in winter.
 *
 * Asked of the runtime rather than worked out from the rules, because the rules
 * change and the runtime's tables do not have to be maintained here.
 */
function offsetOf(iso: string) {
  const noon = new Date(`${iso}T12:00:00Z`);
  const said = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "numeric",
    hour12: false,
  }).format(noon);
  return Number(said) - 12;
}
