import { getEvent } from "@/lib/source";
import { SITE_URL } from "@/lib/site";

/**
 * An evening as a file a calendar understands.
 *
 * Every phone, laptop and watch already has something that keeps track of what
 * somebody is doing on Saturday, and until now the only way to get an evening into
 * it was to read the date off the page and type it in again. A .ics file is the one
 * format all of them agree on: iOS opens it in Calendar, Android hands it to Google
 * Calendar, a Mac drops it into whichever calendar is set, and Outlook takes it too.
 *
 * One file per evening, at the evening's own address with `/calendar.ics` on the
 * end, so the link can be copied, sent to somebody, or opened twice without
 * anything being generated in a browser and held in memory.
 *
 * An evening with a programme of days is *several* entries in one file, which is
 * what VCALENDAR is for and is the honest shape of it: five afternoons over a
 * month, each with its own name and hours, not one appointment thirty days long
 * that fills a month view and tells nobody anything.
 */

/* Not static any more: the file can be asked for one day at a time, and a query is
   not a path. Cached at the edge for an hour, which is what it was before. */
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });

  /* One day of a programme, where one was asked for: `?day=2026-09-05`. Somebody
     who can come to the Saturday and not to the month should be able to put the
     Saturday in their calendar and nothing else. */
  const asked = new URL(request.url).searchParams.get("day");

  const where = [event.place, event.address].filter(Boolean).join(", ");
  const url = `${SITE_URL}/events/${event.slug}`;
  /* What the description says: the paragraph the evening opens with, and the
     address of the page it came from. Not the whole page — a calendar entry is a
     reminder, and the reminder should carry the way back to the thing. */
  const about = [event.lead, url].filter(Boolean).join("\n\n");

  /* One entry per day where there is a programme, one for the whole thing where
     there is not. */
  const programme = asked
    ? event.days.filter((day) => day.date === asked)
    : event.days;

  const days =
    programme.length > 0
      ? programme.map((day) => ({
          date: day.date,
          until: day.date,
          time: day.time,
          endTime: day.endTime,
          title: [event.title, day.title].filter(Boolean).join(" · "),
          about: [day.what, about].filter(Boolean).join("\n\n"),
          id: `${event.slug}-${day.date}`,
        }))
      : [
          {
            date: event.date,
            until: event.until || event.date,
            time: event.time,
            endTime: event.endTime,
            title: event.title,
            about,
            id: event.slug,
          },
        ];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//promeNOODology//events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...days.flatMap((day) => entry(day, where, url)),
    "END:VCALENDAR",
  ];

  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      /* The type is what makes a phone hand this to a calendar rather than show it
         as text, and the filename is what the calendar calls it while it asks. */
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}${asked ? `-${asked}` : ""}.ics"`,
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

type Day = {
  date: string;
  until: string;
  time: string;
  endTime: string;
  title: string;
  about: string;
  id: string;
};

function entry(day: Day, where: string, url: string): string[] {
  if (!day.date) return [];

  /*
   * With an hour on it, or without.
   *
   * An evening that says 15:00 is an appointment and goes in as one, in the time
   * zone this club is in — Europe/Zurich, written as a local time with a TZID
   * rather than converted to UTC, because "three in the afternoon" is what was
   * meant and a phone in another country should still show the local three.
   *
   * An evening with no hour is an all-day entry, and an all-day entry ends on the
   * day *after* the last one: DTEND is exclusive in this format, and a file that
   * gets that wrong drops the last day of every festival.
   */
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  if (day.time) {
    const from = `${plain(day.date)}T${clock(day.time)}`;
    const to = `${plain(day.date)}T${clock(day.endTime || addHours(day.time, 3))}`;
    return [
      "BEGIN:VEVENT",
      `UID:${day.id}@promenoodology.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Zurich:${from}`,
      `DTEND;TZID=Europe/Zurich:${to}`,
      ...body(day, where, url),
      "END:VEVENT",
    ];
  }

  return [
    "BEGIN:VEVENT",
    `UID:${day.id}@promenoodology.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${plain(day.date)}`,
    `DTEND;VALUE=DATE:${plain(theDayAfter(day.until || day.date))}`,
    ...body(day, where, url),
    "END:VEVENT",
  ];
}

function body(day: Day, where: string, url: string): string[] {
  return [
    ...fold(`SUMMARY:${escape_(day.title)}`),
    ...(where ? fold(`LOCATION:${escape_(where)}`) : []),
    ...(day.about ? fold(`DESCRIPTION:${escape_(day.about)}`) : []),
    `URL:${url}`,
  ];
}

/** 2026-08-22 → 20260822 */
const plain = (iso: string) => iso.replaceAll("-", "");

/** "15:00" → "150000", and "15" → "150000". */
function clock(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return `${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
}

/** Where an evening says when it starts and not when it ends. */
function addHours(time: string, by: number) {
  const [hours = "0", minutes = "0"] = time.split(":");
  const at = (Number(hours) + by) % 24;
  return `${String(at).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

/** The day after, because an all-day DTEND is the morning it is over. */
function theDayAfter(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** What the format reserves: backslash, semicolon, comma, and the line break. */
const escape_ = (text: string) =>
  text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");

/**
 * Seventy-five octets a line, and the rest continued with a space.
 *
 * The one rule in this format that everybody forgets and every parser enforces: a
 * long description on one line is a file some calendars refuse outright. Counted in
 * bytes rather than characters, because a paragraph about a French evening is full
 * of accents and each of those is two.
 */
function fold(line: string): string[] {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return [line];

  const out: string[] = [];
  let held = "";
  let size = 0;
  for (const letter of line) {
    const wide = new TextEncoder().encode(letter).length;
    // 74, so the leading space of a continued line still fits inside 75.
    if (size + wide > (out.length === 0 ? 75 : 74)) {
      out.push(out.length === 0 ? held : ` ${held}`);
      held = "";
      size = 0;
    }
    held += letter;
    size += wide;
  }
  if (held) out.push(out.length === 0 ? held : ` ${held}`);
  return out;
}
