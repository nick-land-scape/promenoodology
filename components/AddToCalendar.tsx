import CalendarPick from "@/components/CalendarPick";
import { calendarRows } from "@/lib/calendar";
import type { EventPage } from "@/lib/content";
import { dateParts } from "@/lib/app-data";
import type { Lang } from "@/lib/lang";
import type { Said } from "@/lib/words";

/**
 * The evening, in whatever keeps track of somebody's Saturdays.
 *
 * One control that asks two questions — which day, and which calendar — because both
 * were being answered on somebody's behalf. What each route can and cannot take is
 * in lib/calendar; what it looks like is in CalendarPick; this is the piece that
 * knows how to say a date in the reader's own language.
 */
export default function AddToCalendar({
  event,
  say,
  lang,
  /** Just one day of the programme, for the button on that day's own row. */
  onlyDay,
}: {
  event: EventPage;
  say: Said;
  lang: Lang;
  onlyDay?: string;
}) {
  const rows = calendarRows(event, {
    whole: say("cal.theWhole"),
    when: (iso, time) => {
      const when = dateParts(iso, lang);
      return [`${when.day} ${when.month}`, time].filter(Boolean).join(", ");
    },
  }).filter((row) => (onlyDay ? row.key === onlyDay : true));

  return (
    <CalendarPick
      rows={rows}
      words={{
        open: say("cal.addToCalendar"),
        which: say("cal.whichDay"),
        back: say("cal.back"),
        file: say("cal.theFile"),
        google: say("cal.google"),
        outlook: say("cal.outlook"),
        said: say("cal.whichIsWhich"),
      }}
    />
  );
}
