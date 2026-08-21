import Head from "@/components/admin/Head";
import type { Pickable } from "@/components/admin/Pick";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export default async function EventsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const [{ data: events }, { data: photos }, { data: bookings }, { data: partners }, { data: told }] =
    await Promise.all([
    supabase
      .from("events")
      .select(
        "id, happens_on, ends_on, starts_at, ends_at, title, place, spots, note, photo_path, partners, story_id, published",
      )
      .order("happens_on")
      .returns<Row[]>(),
    supabase
      .from("photos")
      .select("path")
      .eq("published", true)
      .order("position")
      .returns<{ path: string }[]>(),
    supabase
      .from("bookings")
      .select("event_id, people")
      .returns<{ event_id: string; people: number }[]>(),
    supabase
      .from("associations")
      .select("id, name, logo_path")
      .order("position")
      .returns<{ id: string; name: string; logo_path: string | null }[]>(),
    supabase
      .from("stories")
      .select("id, title")
      .order("position")
      .returns<{ id: string; title: string }[]>(),
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

  return (
    <Head title="what's on">
      <p className="admin-intro">
        The evenings in the members&rsquo; app. A new one starts hidden: fill it in, then turn it on
        when it is really happening. Hidden means nobody outside can see it at all. Where anybody has
        asked to come, it says so under the name — answering them is not built yet.
      </p>

      <RowsEditor
        table="events"
        initial={events ?? []}
        photos={pickable}
        coming={Object.fromEntries(asked)}
        partners={(partners ?? []).map((one) => ({
          value: one.id,
          label: one.name || "unnamed partner",
          image: one.logo_path ? mediaUrl(one.logo_path) : undefined,
        }))}
        told={told ?? []}
      />
    </Head>
  );
}
