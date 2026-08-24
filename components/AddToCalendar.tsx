import type { EventPage } from "@/lib/content";
import type { Said } from "@/lib/words";

/**
 * The evening, in whatever keeps track of somebody's Saturdays.
 *
 * Two links, because there are two kinds of answer and neither covers the other.
 *
 * The **file** is the universal one: a .ics is the single format every calendar
 * agrees on, so a phone hands it to Calendar, an Android hands it to Google
 * Calendar, a Mac drops it wherever the default is and Outlook takes it too. It
 * also carries a programme properly — five afternoons arrive as five entries
 * rather than as one appointment a month long, which is what a date range looks
 * like in a month view and tells nobody anything.
 *
 * The **web calendars** are the one-press ones for anybody living in a browser:
 * Google and Outlook both have an address that opens their own "new entry" screen
 * with everything filled in, so all that is left is Save. They are offered only for
 * an evening that is a single occasion — those pages take one entry, and quietly
 * flattening a five-day programme into one block a month long would be worse than
 * not offering it.
 *
 * Apple has no such address, and it is worth being straight about that rather than
 * leaving somebody looking for it: there is no URL that opens Apple Calendar with a
 * new event in it. The file *is* the direct route there — iOS and macOS open it in
 * Calendar with an Add button showing, which is the same one press — and it is also
 * what Outlook on a desktop, Thunderbird and anything on Android will take.
 */
export default function AddToCalendar({
  event,
  say,
  tight = false,
}: {
  event: EventPage;
  say: Said;
  /* In the bar at the top, beside the other things you can do about this evening.
     One control rather than two: the file is the one that works everywhere, and a
     row of things to press is not the place to explain the difference. */
  tight?: boolean;
}) {
  if (!event.date || !event.slug) return null;

  const where = [event.place, event.address].filter(Boolean).join(", ");
  const single = event.days.length === 0;

  if (tight) {
    /* Built the way the bookmark beside it is, which is the way the language and
       paper switches are: see .icon-switch. Three controls in one bar all shouting
       their words is a bar nobody reads, and of the three this is the one whose
       icon — a calendar — needs no explaining. */
    return (
      <a
        className="icon-switch"
        href={`/events/${event.slug}/calendar.ics`}
        download
        aria-label={say("cal.addToCalendar")}
        title={say("cal.addToCalendar")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
          <path
            d="M4.5 6.5h15v13h-15zM8 3.5v4M16 3.5v4M4.5 11h15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span aria-hidden="true">{say("cal.addToCalendar")}</span>
      </a>
    );
  }

  return (
    <p className="add-to-calendar">
      <a href={`/events/${event.slug}/calendar.ics`} download>
        {say("cal.addToCalendar")}
      </a>
      {single ? (
        <>
          {" · "}
          <a href={googleAt(event, where)} target="_blank" rel="noreferrer noopener">
            {say("cal.google")}
          </a>
          {" · "}
          <a href={outlookAt(event, where)} target="_blank" rel="noreferrer noopener">
            {say("cal.outlook")}
          </a>
        </>
      ) : null}
      <span className="add-to-calendar-said">{say("cal.whichIsWhich")}</span>
    </p>
  );
}

/** Outlook's own "new entry, filled in" page. */
function outlookAt(event: EventPage, where: string) {
  const at = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  at.searchParams.set("path", "/calendar/action/compose");
  at.searchParams.set("rru", "addevent");
  at.searchParams.set("subject", event.title);
  if (where) at.searchParams.set("location", where);
  if (event.lead) at.searchParams.set("body", event.lead);

  /* Outlook wants the two ends as ISO instants, so the club's own hours are turned
     into UTC here — two in the afternoon in Versoix is noon in the summer and one
     in the winter, and the offset is worked out from the date rather than assumed. */
  const [from, to] = ends(event);
  at.searchParams.set("startdt", from);
  at.searchParams.set("enddt", to);
  if (!event.time) at.searchParams.set("allday", "true");
  return at.toString();
}

/** The two ends of an evening as instants, in UTC, from Zurich's own clock. */
function ends(event: EventPage): [string, string] {
  const day = event.date;
  if (!event.time) {
    const last = new Date(`${event.until || day}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return [`${day}T00:00:00.000Z`, `${last.toISOString().slice(0, 10)}T00:00:00.000Z`];
  }

  const shift = offsetOf(day);
  const asUtc = (time: string) => {
    const [hours = "0", minutes = "0"] = time.split(":");
    const at = new Date(
      `${day}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00.000Z`,
    );
    at.setUTCHours(at.getUTCHours() - shift);
    return at.toISOString();
  };

  const ending =
    event.endTime ||
    `${String((Number(event.time.split(":")[0]) + 3) % 24).padStart(2, "0")}:${
      event.time.split(":")[1] ?? "00"
    }`;
  return [asUtc(event.time), asUtc(ending)];
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

/** The address of Google's own "new entry, filled in" page. */
function googleAt(event: EventPage, where: string) {
  const at = new URL("https://calendar.google.com/calendar/render");
  at.searchParams.set("action", "TEMPLATE");
  at.searchParams.set("text", event.title);
  at.searchParams.set("dates", span(event));
  /* The hours are this club's own — "three in the afternoon" in Versoix — so the
     zone travels with them rather than being converted away. */
  at.searchParams.set("ctz", "Europe/Zurich");
  if (where) at.searchParams.set("location", where);
  if (event.lead) at.searchParams.set("details", event.lead);
  return at.toString();
}

function span(event: EventPage) {
  const plain = (iso: string) => iso.replaceAll("-", "");
  if (!event.time) {
    /* All day, and the end is the morning after: exclusive, in this format and in
       Google's, and getting it wrong loses the last day. */
    const last = new Date(`${event.until || event.date}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return `${plain(event.date)}/${plain(last.toISOString().slice(0, 10))}`;
  }

  const clock = (time: string) => {
    const [hours = "0", minutes = "0"] = time.split(":");
    return `${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
  };
  const ends =
    event.endTime ||
    `${String((Number(event.time.split(":")[0]) + 3) % 24).padStart(2, "0")}:${
      event.time.split(":")[1] ?? "00"
    }`;
  return `${plain(event.date)}T${clock(event.time)}/${plain(
    event.until || event.date,
  )}T${clock(ends)}`;
}
