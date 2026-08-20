"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { failed, refreshSite, type Saved } from "@/lib/admin/revalidate";
import { SITE_URL } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The community list, which is also the list of accounts.
 *
 * One list, because they are one thing seen from two sides: a row here is a
 * PERSON, and `user_id` is the account they sign in with when they have one. Most
 * of the community does not — the names on the wall are older than the idea of
 * accounts here, and being on that wall was never meant to require a login.
 *
 * So there are two ways to add somebody. Written down, which puts them on the
 * community page and asks nothing of them. Or invited, which does the same and
 * also sends them a way in. Either can become the other later.
 *
 * There is deliberately no way to delete somebody. A person is what their posts
 * and their bookings hang off, and deleting one would take those with it while
 * leaving them able to sign in to a half-existing account. Taking somebody off
 * the community page is the honest version, and it is reversible.
 */

export type PersonInput = {
  id: string;
  name: string;
  country: string;
  colour: string | null;
  /** Their own answer to being listed. */
  listed: boolean;
  /** An admin's answer, which wins. Null: leave it to them. */
  listed_by_admin: boolean | null;
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
        listed_by_admin: person.listed_by_admin,
        role: person.role === "admin" ? "admin" : "member",
      })
      .eq("id", person.id);
    if (error) return failed(error);
  }

  refreshSite();
  return { ok: true };
}

/**
 * Somebody on the community page who has not been asked to sign in to anything.
 *
 * Which is most of them. A name is enough; an address can be added later, and
 * turns into an invitation the moment it is.
 */
export async function addPerson(input: {
  name: string;
  country: string;
}): Promise<Saved & { id?: string }> {
  await requireAdminAction();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "A person needs a name." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name,
      country: input.country.trim(),
      // Written down by an admin because they belong on the page — so they are
      // on it, rather than waiting for a decision that has just been made.
      listed: true,
      role: "member",
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return failed(error);

  refreshSite();
  return { ok: true, id: data.id };
}

/**
 * A way in, sent to somebody.
 *
 * It writes the address onto the person and asks Supabase to send them a code.
 * That code makes the account, and the trigger on auth.users joins it to the
 * person already waiting under the same address — so somebody who has been on
 * the community page for years does not become a second row the day they first
 * sign in.
 *
 * This is also the only way an account gets made now: the public join page is
 * gone. Worth being straight about the limit — it goes through the same public
 * key the site uses, so it is the app that only offers this to admins, not the
 * database. A real lock means turning signups off in Supabase and giving this a
 * service-role key of its own; see the note in .env.example.
 */
export async function invitePerson(input: {
  /** An existing person to invite, or null to make a new one. */
  id: string | null;
  name: string;
  email: string;
}): Promise<Saved> {
  await requireAdminAction();

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email.includes("@")) return { ok: false, error: "That does not look like an email address." };
  if (!name) return { ok: false, error: "A person needs a name." };

  const supabase = await supabaseServer();

  // Somebody else already holding that address is a mistake worth stopping: the
  // trigger joins an arriving account to whichever person has it.
  const { data: clash } = await supabase
    .from("profiles")
    .select("id, name")
    .ilike("email", email)
    .maybeSingle<{ id: string; name: string }>();
  if (clash && clash.id !== input.id) {
    return { ok: false, error: `${clash.name} already has that address.` };
  }

  if (input.id) {
    const { error } = await supabase
      .from("profiles")
      .update({ email, name })
      .eq("id", input.id);
    if (error) return failed(error);
  } else {
    const { error } = await supabase
      .from("profiles")
      .insert({ name, email, listed: true, role: "member" });
    if (error) return failed(error);
  }

  const { error: sending } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // This is what makes the account. The person is already written down; the
      // trigger joins the two by address when they arrive.
      shouldCreateUser: true,
      emailRedirectTo: `${SITE_URL}/account/confirm`,
      data: { name },
    },
  });

  refreshSite();

  if (sending) {
    return {
      ok: false,
      error: `${name} is written down with that address, but the email did not go out: ${sending.message}`,
    };
  }
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

  // The one it replaces is nobody's now. Portraits that came in with the
  // community list live under community/ and are shared with the spreadsheet
  // import, so those are left alone.
  const old = before?.photo_path;
  if (old && old !== path && old.startsWith("profiles/")) {
    await supabase.storage.from("media").remove([old]);
  }

  refreshSite();
  return { ok: true };
}
