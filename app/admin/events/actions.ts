"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/admin/slug";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Writing an evening.
 *
 * An evening used to be a row in a list of rows and is now a thing with a page,
 * so it is written the way a story is written: one save, three tables. The row
 * itself, the programme — the days it actually runs — and the page, block by
 * block.
 *
 * The programme and the page are cleared and rewritten rather than compared
 * item by item. Five sessions and thirty blocks is not enough to be worth
 * working out which of them moved, and every one of them would have to carry an
 * id through the editor for no other reason.
 */

export type SessionInput = {
  happens_on: string;
  starts_at: string;
  ends_at: string;
  title: string;
  what: string;
};

export type BlockInput = {
  kind: "heading" | "text" | "photo" | "space";
  words: string;
  photo_id: string | null;
  layout: string | null;
};

export type EventInput = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  lead: string;
  happens_on: string;
  ends_on: string | null;
  starts_at: string;
  ends_at: string;
  place: string;
  address: string;
  lat: number | null;
  lng: number | null;
  spots: number;
  cost: string;
  sign_up_email: string;
  part_of: string;
  part_of_url: string;
  needs: string;
  note: string;
  people_fed: number | null;
  photo_path: string | null;
  flyer_path: string | null;
  partners: string[];
  story_id: string | null;
  published: boolean;
};

/** Free, or does another evening already live there? The bin counts. */
async function taken(slug: string, exceptId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .neq("id", exceptId)
    .maybeSingle();
  return Boolean(data);
}

const DEGREES = (value: number | null, limit: number) =>
  value === null || !Number.isFinite(value) || Math.abs(value) > limit ? null : value;

export async function saveEvent(
  input: EventInput,
  programme: SessionInput[],
  page: BlockInput[],
): Promise<Saved & { slug?: string }> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const title = input.title.trim();
  if (!title) return { ok: false, error: "An evening needs a name." };

  /* The address is minted once, from the first real title, and then left alone —
     the same rule a story's slug follows, and for the same reason: an address
     that has been on a flyer should not move. */
  let slug = input.slug.trim();
  if (!slug) {
    const stem = slugify(title) || "evening";
    slug = stem;
    for (let n = 2; await taken(slug, input.id); n += 1) slug = `${stem}-${n}`;
  } else if (await taken(slug, input.id)) {
    return { ok: false, error: `Another evening already lives at /events/${slug}.` };
  }

  /*
   * The programme, in the order the days fall, and the row's own dates taken
   * from its ends.
   *
   * Everything that already knows when an evening is — the members' app, the
   * map, the "still to come" half of the list — reads happens_on and ends_on.
   * Rather than teach all of them about a programme, the first and last days of
   * one become the evening's own. So "22 August to 20 September" is not typed
   * anywhere: it is what the five afternoons add up to.
   */
  const days = programme
    .filter((one) => one.happens_on)
    .map((one) => ({
      happens_on: one.happens_on,
      starts_at: one.starts_at.trim(),
      ends_at: one.ends_at.trim(),
      title: one.title.trim(),
      what: one.what.trim(),
    }))
    .sort((a, b) => a.happens_on.localeCompare(b.happens_on));

  const first = days[0];
  const last = days[days.length - 1];

  const happensOn = first ? first.happens_on : input.happens_on;
  if (!happensOn) return { ok: false, error: "An evening needs a day." };

  const endsOn = last && last.happens_on !== happensOn ? last.happens_on : input.ends_on || null;

  const { error } = await supabase
    .from("events")
    .update({
      slug,
      title,
      subtitle: input.subtitle.trim(),
      lead: input.lead.trim(),
      happens_on: happensOn,
      ends_on: endsOn,
      starts_at: first ? first.starts_at : input.starts_at.trim(),
      ends_at: last && !endsOn ? last.ends_at : input.ends_at.trim(),
      place: input.place.trim(),
      address: input.address.trim(),
      lat: DEGREES(input.lat, 90),
      lng: DEGREES(input.lng, 180),
      spots: Number.isFinite(input.spots) ? Math.max(0, Math.round(input.spots)) : 0,
      cost: input.cost.trim(),
      sign_up_email: input.sign_up_email.trim(),
      part_of: input.part_of.trim(),
      part_of_url: input.part_of_url.trim(),
      needs: input.needs.trim(),
      note: input.note.trim(),
      people_fed: input.people_fed === null ? null : Math.max(0, Math.round(input.people_fed)),
      photo_path: input.photo_path,
      flyer_path: input.flyer_path,
      partners: input.partners.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 20),
      story_id: input.story_id,
      published: input.published,
    })
    .eq("id", input.id);
  if (error) return failed(error);

  const wroteProgramme = await writeProgramme(input.id, days);
  if (!wroteProgramme.ok) return wroteProgramme;

  const wrotePage = await writePage(input.id, page);
  if (!wrotePage.ok) return wrotePage;

  refreshSite();
  return { ok: true, slug };
}

async function writeProgramme(eventId: string, days: SessionInput[]): Promise<Saved> {
  const supabase = await supabaseServer();

  const { error: cleared } = await supabase
    .from("event_sessions")
    .delete()
    .eq("event_id", eventId);
  if (cleared) return failed(cleared);

  if (days.length === 0) return { ok: true };

  const { error } = await supabase
    .from("event_sessions")
    .insert(days.map((day, at) => ({ ...day, event_id: eventId, position: at + 1 })));
  if (error) return failed(error);

  return { ok: true };
}

async function writePage(eventId: string, blocks: BlockInput[]): Promise<Saved> {
  const supabase = await supabaseServer();
  const LAYOUTS = new Set(["wide", "narrow", "left", "right", "tall"]);

  const rows = blocks
    .map((block, at) => ({
      event_id: eventId,
      position: at + 1,
      kind: block.kind,
      words: block.kind === "heading" || block.kind === "text" ? block.words.trim() : "",
      photo_id: block.kind === "photo" ? block.photo_id : null,
      layout:
        block.kind === "photo" && block.layout && LAYOUTS.has(block.layout) ? block.layout : null,
    }))
    // A block with nothing in it is one somebody started and left.
    .filter((row) => row.kind === "space" || (row.kind === "photo" ? row.photo_id : row.words));

  const { error: cleared } = await supabase.from("event_blocks").delete().eq("event_id", eventId);
  if (cleared) return failed(cleared);

  if (rows.length === 0) return { ok: true };

  const { error } = await supabase.from("event_blocks").insert(rows);
  if (error) return failed(error);

  return { ok: true };
}

/** Into the bin for thirty days, as everywhere else in here. */
export async function deleteEvent(id: string): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return failed(error);

  refreshSite();
  return { ok: true };
}
