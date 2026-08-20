"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The community list.
 *
 * These are people, not rows: everybody here has an account and can change most
 * of this themselves on their own profile page. What the back of the house adds
 * is the two things they cannot — a portrait, and who else may look after the
 * site.
 *
 * There is deliberately no way to delete somebody. A profile is what their posts
 * and their bookings hang off, and deleting it would take those with it while
 * leaving them able to sign in to a half-existing account. Taking somebody off
 * the community page is the honest version of that, and it is reversible.
 */

export type PersonInput = {
  id: string;
  name: string;
  country: string;
  colour: string | null;
  listed: boolean;
  role: "member" | "admin";
};

const COLOURS = new Set(["orange", "green", "blue"]);

export async function savePeople(people: PersonInput[]): Promise<Saved> {
  const me = await requireAdminAction();
  const supabase = await supabaseServer();

  // Nobody may lock the last door behind them. Counted against what is about to
  // be true, not what is true now, so demoting two admins at once is caught too.
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .returns<{ id: string }[]>();

  const after = new Set((admins ?? []).map((one) => one.id));
  for (const person of people) {
    if (person.role === "admin") after.add(person.id);
    else after.delete(person.id);
  }
  if (after.size === 0) {
    return {
      ok: false,
      error: "Somebody has to be able to get in here. Make somebody else an admin first.",
    };
  }
  if (!after.has(me.id) && people.some((person) => person.id === me.id)) {
    return {
      ok: false,
      error: "That would sign you out of the back of the house. Ask the other admin to do it.",
    };
  }

  for (const person of people) {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: person.name.trim(),
        country: person.country.trim(),
        colour: person.colour && COLOURS.has(person.colour) ? person.colour : null,
        listed: person.listed,
        role: person.role === "admin" ? "admin" : "member",
      })
      .eq("id", person.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/** A portrait for the community page, uploaded on somebody's behalf. */
export async function setPortrait(id: string, path: string | null): Promise<Saved> {
  await requireAdminAction();
  const supabase = await supabaseServer();

  const { data: before } = await supabase
    .from("profiles")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle<{ photo_path: string | null }>();

  const { error } = await supabase.from("profiles").update({ photo_path: path }).eq("id", id);
  if (error) return failed(error);

  // The one it replaces is nobody's now. Imported portraits live under
  // community/ and are shared with the repository, so those are left alone.
  const old = before?.photo_path;
  if (old && old !== path && old.startsWith("profiles/")) {
    await supabase.storage.from("media").remove([old]);
  }

  refreshSite();
  return { ok: true };
}
