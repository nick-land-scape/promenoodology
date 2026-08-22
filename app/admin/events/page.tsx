import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import RowsList, { type Listed } from "@/components/admin/RowsList";
import { requireAdmin } from "@/lib/admin/guard";
import { hay } from "@/lib/admin/find";
import { pretty, today } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * What is on: a list of evenings, each a way in to its own page.
 *
 * It was all of them at once, every field of every one, which was fine at four
 * and unreadable at forty — and forty is what a summer of weekends comes to.
 */
export default async function EventsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: events }, { data: bookings }, { data: partners }] = await Promise.all([
    supabase
      .from("events")
      .select("id, happens_on, ends_on, starts_at, title, place, spots, note, needs, partners, published")
      // The bin is a place of its own; what is deleted is not in this list.
      .is("deleted_at", null)
      .order("happens_on")
      .returns<
        {
          id: string;
          happens_on: string | null;
          ends_on: string | null;
          starts_at: string | null;
          title: string;
          place: string | null;
          spots: number | null;
          note: string | null;
          needs: string | null;
          partners: string[] | null;
          published: boolean;
        }[]
      >(),
    supabase
      .from("bookings")
      .select("event_id, people")
      .returns<{ event_id: string; people: number }[]>(),
    supabase
      .from("associations")
      .select("id, name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  // How many places have been asked for, so an evening that is full says so.
  const asked = new Map<string, number>();
  for (const booking of bookings ?? []) {
    asked.set(booking.event_id, (asked.get(booking.event_id) ?? 0) + (booking.people || 1));
  }
  const named = new Map((partners ?? []).map((one) => [one.id, one.name]));

  const now = today();

  const rows: Listed[] = (events ?? []).map((event) => {
    const coming = asked.get(event.id) ?? 0;
    const withThem = (event.partners ?? []).map((id) => named.get(id) ?? "").filter(Boolean);
    const over = Boolean(event.happens_on && (event.ends_on ?? event.happens_on) < now);

    return {
      id: event.id,
      title: event.title,
      meta:
        [
          event.happens_on ? pretty(event.happens_on) : "no day yet",
          event.starts_at || null,
          event.place || null,
          coming
            ? `${coming} asked to come${Number(event.spots) > 0 ? ` of ${event.spots}` : ""}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      hay: hay(
        event.title,
        event.place,
        event.note,
        event.needs,
        withThem.join(" "),
        event.happens_on ? pretty(event.happens_on) : "",
        event.happens_on,
      ),
      published: event.published,
      note: over ? "over" : undefined,
    };
  });

  /*
   * The ones still to come first, soonest first; then the ones that have been,
   * most recent first.
   *
   * By date alone the top of the list was 2024 and the thing you came to change
   * was somewhere in the middle. Nobody opens this page to look at last year.
   */
  const stillToCome = rows.filter((row) => !row.note);
  const been = rows.filter((row) => row.note).reverse();

  return (
    <Head title="what's on" action={<BinLink table="events" />}>
      <p className="admin-intro">
        The evenings in the members&rsquo; app, the ones still to come first. A new one starts
        hidden: fill it in on its own page, then turn it on when it is really happening. Hidden means
        nobody outside can see it at all. Where anybody has asked to come, it says so under the name.
      </p>

      <RowsList
        table="events"
        initial={[...stillToCome, ...been]}
        at="/admin/events"
        what="an evening"
        untitled="Untitled evening"
      />
    </Head>
  );
}
