"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { whoIsThis } from "@/lib/app/me";

/**
 * Saying you are coming, and saying you are not after all.
 *
 * Signing up rather than booking: nobody is reserving anything or paying for
 * anything, they are saying they will be there and roughly how many of them.
 * The table is still called `bookings` — it is what the first migration named it
 * and renaming a table to match a word on a screen is how migrations go wrong —
 * but nothing anybody reads says "book" any more.
 *
 * One row per person per evening (the table says so), so signing up twice edits
 * the first one instead of failing on a constraint nobody should ever see.
 */

export type Asked = { ok: boolean; error?: string; state?: "asked" | "kept" | "declined" };

const MOST = 12;

export async function signUpForEvent(
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
  revalidatePath("/app/events");
  revalidatePath("/app/account");
  return { ok: true, state: "asked" };
}

export async function cancelMyPlace(eventId: string): Promise<Asked> {
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
  revalidatePath("/app/events");
  revalidatePath("/app/account");
  return { ok: true };
}

/* ------------------------------------------------------------------ the feed */

/**
 * Saying something to everybody, and replying to somebody.
 *
 * The pictures are already in the bucket by the time this runs — the browser
 * shrinks them and puts them under posts/<your login>/, the one folder the
 * storage policy lets a member write to — so what arrives here is a list of paths
 * and the words that go with them.
 *
 * Nothing about a post is edited afterwards, on purpose: a feed where things
 * quietly change under people who have already read them is a worse feed. It can
 * be written and it can be taken down.
 */

const LONGEST = 2000;
const MOST_PICTURES = 8;

export async function say(
  words: string,
  place: string,
  paths: string[],
): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const text = words.trim();
  const pictures = paths.filter(Boolean).slice(0, MOST_PICTURES);
  if (!text && pictures.length === 0) {
    return { ok: false, error: "A word or a picture, at least." };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.from("posts").insert({
    author_id: me.id,
    text: text.slice(0, LONGEST),
    place: place.trim().slice(0, 120),
    photo_paths: pictures,
    // The old single column stays in step, so anything still reading it sees
    // the first picture rather than nothing.
    photo_path: pictures[0] ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/connect");
  return { ok: true };
}

export async function takeDownMyPost(id: string): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const supabase = await supabaseServer();

  /* The pictures go with it. Read first, because after the row is gone there is
     nothing left that knows which files were its. */
  const { data: post } = await supabase
    .from("posts")
    .select("photo_paths, photo_path")
    .eq("id", id)
    .eq("author_id", me.id)
    .maybeSingle<{ photo_paths: string[] | null; photo_path: string | null }>();

  const { error } = await supabase.from("posts").delete().eq("id", id).eq("author_id", me.id);
  if (error) return { ok: false, error: error.message };

  const paths = [...(post?.photo_paths ?? []), post?.photo_path ?? ""].filter(Boolean);
  if (paths.length > 0) await supabase.storage.from("media").remove(paths);

  revalidatePath("/app/connect");
  return { ok: true };
}

export async function replyTo(
  postId: string,
  words: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const text = words.trim();
  if (!text) return { ok: false, error: "Nothing to say?" };

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("post_replies")
    .insert({ post_id: postId, author_id: me.id, text: text.slice(0, LONGEST) });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/connect");
  return { ok: true };
}

export async function takeDownMyReply(id: string): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("post_replies")
    .delete()
    .eq("id", id)
    .eq("author_id", me.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/connect");
  return { ok: true };
}

/* ---------------------------------------------------------------- leaving */

/**
 * Leaving, and meaning it.
 *
 * Everything: the profile, the portrait, what you signed up for, everything you
 * wrote and every picture on it, and the login itself. Not a flag, not a request
 * that lands in somebody's inbox — the rows are deleted.
 *
 * It is here rather than as a note to us for two reasons. It is what the words on
 * the button say, and a button that says "leave the club" and files a ticket is a
 * button that lies. And Google will not take an app that keeps accounts without a
 * way to delete one from inside it, so the honest version is also the required
 * one.
 *
 * The order is deliberate: the files first, because after the rows are gone
 * nothing knows which files were theirs; then the profile, which takes the posts,
 * the replies and the bookings with it through the foreign keys; then the login.
 * If the last step fails the account is empty and cannot be signed into
 * meaningfully — better that than a login with a half-deleted person behind it.
 */
export async function leaveTheClub(): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!service) {
    return {
      ok: false,
      error:
        "This cannot finish here: the server has no service key, so the login itself cannot be removed. Write to info@promeNOODology.com and we will do it by hand.",
    };
  }

  const supabase = await supabaseServer();

  /* Their own two folders in the bucket: the portrait and anything they put on a
     post. Listed and removed rather than guessed at. */
  for (const folder of [`profiles/${me.userId}`, `posts/${me.userId}`]) {
    const { data: files } = await supabase.storage.from("media").list(folder);
    const paths = (files ?? []).map((file) => `${folder}/${file.name}`);
    if (paths.length > 0) await supabase.storage.from("media").remove(paths);
  }

  // Anything they posted before the folders existed, or that an admin uploaded
  // for them, is pointed at by the row rather than by the folder.
  const { data: theirs } = await supabase
    .from("posts")
    .select("photo_paths, photo_path")
    .eq("author_id", me.id)
    .returns<{ photo_paths: string[] | null; photo_path: string | null }[]>();
  const loose = (theirs ?? []).flatMap((post) => [...(post.photo_paths ?? []), post.photo_path ?? ""]).filter(Boolean);
  if (loose.length > 0) await supabase.storage.from("media").remove(loose);
  if (me.photoPath) await supabase.storage.from("media").remove([me.photoPath]);

  const { error } = await supabase.from("profiles").delete().eq("id", me.id);
  if (error) return { ok: false, error: error.message };

  const gone = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${me.userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  if (!gone.ok) {
    console.error("The profile went but the login stayed:", gone.status, await gone.text());
    return {
      ok: false,
      error:
        "Everything about you has been deleted, but the login itself would not go. Write to info@promeNOODology.com and we will finish it.",
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------------- waving */

/**
 * Waving at somebody, and seeing who waved at you.
 *
 * A wave is the whole message. No subject, no words, no thread — you waved, they
 * know, they can wave back. It is the smallest thing this club could offer that
 * is still worth having, and it was a button called "say hello" wired to nothing.
 *
 * Waving twice at the same person replaces the first wave rather than piling up,
 * so this cannot become a way to pester anybody: the table has one row per pair,
 * and the row is what the other person sees.
 */
export async function wave(atProfile: string): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };
  if (atProfile === me.id) return { ok: false, error: "That is you." };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("waves").upsert(
    {
      from_profile: me.id,
      to_profile: atProfile,
      at: new Date().toISOString(),
      // A wave that has been waved again is a new wave, so it counts again.
      seen_at: null,
    },
    { onConflict: "from_profile,to_profile" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/connect");
  revalidatePath("/app/waves");
  return { ok: true };
}

/** Read. Called when the page that shows them is opened. */
export async function waveseen(): Promise<{ ok: boolean }> {
  const me = await whoIsThis();
  if (!me) return { ok: false };

  const supabase = await supabaseServer();
  await supabase
    .from("waves")
    .update({ seen_at: new Date().toISOString() })
    .eq("to_profile", me.id)
    .is("seen_at", null);

  revalidatePath("/app", "layout");
  return { ok: true };
}

/* --------------------------------------------------------------- telling us */

/**
 * A bug, an idea, or a word.
 *
 * One field and a button, from inside the app, because by the time somebody has
 * opened their mail app and worked out what to write, the thing they noticed is
 * gone. The screen they were on and what they were holding go with it: "it does
 * not work on my phone" is only useful when we know which phone.
 */
export async function tellUs(
  kind: "bug" | "idea" | "note",
  words: string,
  about: string,
  agent: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const text = words.trim();
  if (text.length < 3) return { ok: false, error: "A sentence, at least." };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("feedback").insert({
    from_profile: me.id,
    kind,
    text: text.slice(0, 4000),
    about: about.slice(0, 200),
    agent: agent.slice(0, 300),
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
