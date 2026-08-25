import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import type { Block } from "@/components/admin/Build";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import type { PhotoLayout } from "@/lib/supabase/rows";
import { supabaseServer } from "@/lib/supabase/server";
import EventEditor, { type Draft } from "./EventEditor";
import type { Session } from "./Programme";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/**
 * One evening, on its own page.
 *
 * Everything it is made of comes from here — the row, the days it runs, the page
 * somebody built — and the archive comes with it twice over: once as the
 * pictures to choose a cover from, once as the photographs that can go on the
 * page.
 */
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .eq("id", id)
    .maybeSingle<Record<string, unknown>>();
  if (!event) notFound();

  const [{ data: days }, { data: blocks }, { data: photos }, { data: bookings }, { data: partners }, { data: told }] =
    await Promise.all([
      supabase
        .from("event_sessions")
        .select("id, happens_on, starts_at, ends_at, title, what, fr")
        .eq("event_id", id)
        .order("position")
        .returns<
          {
            id: string;
            happens_on: string;
            starts_at: string | null;
            ends_at: string | null;
            title: string;
            what: string;
            fr: Record<string, string> | null;
          }[]
        >(),
      supabase
        .from("event_blocks")
        .select("id, position, kind, words, photo_id, layout, fr")
        .eq("event_id", id)
        .order("position")
        .returns<
          {
            id: string;
            position: number;
            kind: "heading" | "text" | "photo" | "space";
            words: string;
            photo_id: string | null;
            layout: string | null;
            fr: Record<string, string> | null;
          }[]
        >(),
      supabase
        .from("photos")
        .select("id, path, credit, credit_profile_id, year, width, height")
        .is("deleted_at", null)
        .order("position")
        .returns<
          {
            id: string;
            path: string;
            credit: string;
            credit_profile_id: string | null;
            year: string;
            width: number;
            height: number;
          }[]
        >(),
      supabase.from("bookings").select("people").eq("event_id", id).returns<{ people: number }[]>(),
      supabase
        .from("associations")
        .select("id, name, logo_path")
        .is("deleted_at", null)
        .order("position")
        .returns<{ id: string; name: string; logo_path: string | null }[]>(),
      supabase
        .from("stories")
        .select("id, title")
        .is("deleted_at", null)
        .order("position")
        .returns<{ id: string; title: string }[]>(),
    ]);

  const word = (key: string) => String(event[key] ?? "");
  const number = (key: string) => (event[key] === null ? null : Number(event[key]));

  const draft: Draft = {
    id: String(event.id),
    slug: word("slug"),
    title: word("title"),
    subtitle: word("subtitle"),
    lead: word("lead"),
    happens_on: word("happens_on"),
    ends_on: word("ends_on"),
    starts_at: word("starts_at"),
    ends_at: word("ends_at"),
    place: word("place"),
    address: word("address"),
    lat: number("lat"),
    lng: number("lng"),
    spots: Number(event.spots ?? 0),
    cost: word("cost"),
    sign_up_email: word("sign_up_email"),
    part_of: word("part_of"),
    part_of_url: word("part_of_url"),
    needs: word("needs"),
    note: word("note"),
    people_fed: number("people_fed"),
    photo_path: (event.photo_path as string | null) ?? null,
    flyer_path: (event.flyer_path as string | null) ?? null,
    partners: (event.partners as string[] | null) ?? [],
    story_id: (event.story_id as string | null) ?? null,
    published: event.published === true,
    fr: ((event.fr ?? {}) as Record<string, string>),
  };

  return (
    <Head
      title={draft.title || "Untitled evening"}
      back={{ href: "/admin/events", label: "what's on" }}
    >
      <EventEditor
        event={draft}
        programme={(days ?? []).map<Session>((day) => ({
          id: day.id,
          happens_on: day.happens_on ?? "",
          starts_at: day.starts_at ?? "",
          ends_at: day.ends_at ?? "",
          title: day.title ?? "",
          what: day.what ?? "",
          fr: day.fr ?? {},
        }))}
        page={(blocks ?? []).map<Block>((block) => ({
          id: block.id,
          kind: block.kind,
          words: block.words ?? "",
          photoId: block.photo_id,
          layout: (block.layout ?? null) as PhotoLayout | null,
          fr: block.fr ?? {},
        }))}
        photos={(photos ?? []).map((photo) => ({
          // A picture to choose as the cover…
          path: photo.path,
          url: mediaUrl(photo.path),
          // …and the same one as a photograph that can go on the page.
          value: photo.id,
          label: [photo.credit || "nobody credited", photo.year].filter(Boolean).join(", "),
          note: photo.width > 0 ? `${photo.width}×${photo.height}` : undefined,
          image: mediaUrl(photo.path),
          width: photo.width,
          height: photo.height,
        }))}
        partners={(partners ?? []).map((one) => ({
          value: one.id,
          label: one.name || "unnamed partner",
          image: one.logo_path ? mediaUrl(one.logo_path) : undefined,
        }))}
        told={told ?? []}
        coming={(bookings ?? []).reduce((sum, one) => sum + (one.people || 1), 0)}
      />
    </Head>
  );
}
