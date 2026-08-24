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
 * The **Google link** is the one-press one for anybody living in a browser, and it
 * is only offered for an evening that is a single occasion: that page takes one
 * entry, and quietly turning a five-day programme into one long block would be
 * worse than not offering it.
 */
export default function AddToCalendar({
  event,
  say,
}: {
  event: EventPage;
  say: Said;
}) {
  if (!event.date || !event.slug) return null;

  const where = [event.place, event.address].filter(Boolean).join(", ");
  const single = event.days.length === 0;

  return (
    <p className="add-to-calendar">
      <a href={`/events/${event.slug}/calendar.ics`} download>
        {say("cal.addToCalendar")}
      </a>
      {single ? (
        <>
          {" · "}
          <a
            href={googleAt(event, where)}
            target="_blank"
            rel="noreferrer noopener"
          >
            {say("cal.google")}
          </a>
        </>
      ) : null}
    </p>
  );
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
