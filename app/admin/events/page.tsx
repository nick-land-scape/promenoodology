import Head from "@/components/admin/Head";
import type { Pickable } from "@/components/admin/Pick";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export default async function EventsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: events }, { data: photos }, { data: bookings }] = await Promise.all([
    supabase
      .from("events")
      .select("id, happens_on, starts_at, title, place, spots, note, photo_path, published")
      .order("happens_on")
      .returns<Row[]>(),
    supabase
      .from("photos")
      .select("path")
      .eq("published", true)
      .order("position")
      .returns<{ path: string }[]>(),
    supabase.from("bookings").select("event_id, people").returns<{ event_id: string; people: number }[]>(),
  ]);

  const pickable: Pickable[] = (photos ?? []).map((photo) => ({
    path: photo.path,
    url: mediaUrl(photo.path),
  }));

  // How many places have been asked for, so an evening that is full is obvious.
  const asked = new Map<string, number>();
  for (const booking of bookings ?? []) {
    asked.set(booking.event_id, (asked.get(booking.event_id) ?? 0) + (booking.people || 1));
  }

  const taken = (events ?? []).filter((event) => asked.get(String(event.id)));

  return (
    <Head title="what's on">
      <p className="admin-intro">
        The evenings in the members&rsquo; app. A new one starts hidden: fill it in, then turn it on
        when it is really happening. Hidden means nobody outside can see it at all.
      </p>

      {taken.length > 0 ? (
        <div className="admin-panel">
          <header className="admin-panel-head">
            <div>
              <h2 className="admin-panel-name">places asked for</h2>
              <p className="admin-panel-hint">
                What members have asked for so far. Answering them is not built yet — this is only
                so you know.
              </p>
            </div>
          </header>
          <table className="admin-table" style={{ border: 0 }}>
            <tbody>
              {taken.map((event) => (
                <tr key={String(event.id)}>
                  <td>{String(event.title)}</td>
                  <td className="admin-table-quiet">
                    {asked.get(String(event.id))} asked
                    {Number(event.spots) > 0 ? ` of ${Number(event.spots)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <RowsEditor table="events" initial={events ?? []} photos={pickable} />
    </Head>
  );
}
