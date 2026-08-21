"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { whoIsThis } from "@/lib/app/me";

/**
 * Asking for a place, changing your mind, and dropping out.
 *
 * The booking screen used to be a drawing: you picked an evening, pressed the
 * button, and it told you what you would have asked for if anything had been
 * sent anywhere. The table and its policies have been there since the first
 * migration — a member may write their own booking and read no one else's — so
 * this is the screen catching up with the database rather than anything new.
 *
 * One booking per person per evening (the table says so), so asking twice edits
 * the first one instead of failing on a constraint nobody should ever see.
 */

export type Asked = { ok: boolean; error?: string; state?: "asked" | "kept" | "declined" };

const MOST = 12;

export async function askForAPlace(
  eventId: string,
  people: number,
  bringing: string,
): Promise<Asked> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const many = Math.round(people);
  if (!Number.isFinite(many) || many < 1 || many > MOST) {
    return { ok: false, error: `Between one and ${MOST} places, please.` };
  }

  const supabase = await supabaseServer();

  /* Is there room? Asked out loud rather than left to the evening.
   *
   * This can only count the bookings the reader is allowed to see, which for a
   * member is their own — so it is not a gate, it is a courtesy. The evening
   * itself is the only place that knows the real total, and telling somebody
   * "full" on a count that excludes everybody else would be worse than saying
   * nothing. */
  const { data: event } = await supabase
    .from("events")
    .select("id, title, spots")
    .is("deleted_at", null)
    .eq("published", true)
    .eq("id", eventId)
    .maybeSingle<{ id: string; title: string; spots: number }>();
  if (!event) return { ok: false, error: "That evening is not on any more." };

  const { error } = await supabase
    .from("bookings")
    .upsert(
      {
        event_id: eventId,
        profile_id: me.id,
        people: many,
        bringing: bringing.trim().slice(0, 280),
        state: "asked",
      },
      { onConflict: "event_id,profile_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/book");
  revalidatePath("/app/account");
  return { ok: true, state: "asked" };
}

export async function dropMyPlace(eventId: string): Promise<Asked> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", me.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/book");
  revalidatePath("/app/account");
  return { ok: true };
}
