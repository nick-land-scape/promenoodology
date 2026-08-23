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

export type Asked = {
  ok: boolean;
  error?: string;
  state?: "interested" | "asked" | "kept" | "declined";
};

const MOST = 12;

export async function signUpForEvent(
  eventId: string,
  people: number,
  bringing: string,
  /* Who is coming with you, by first name.
   *
   * "Three places" is a number for a cook and nothing for anybody else: whoever
   * is on the door and whoever is laying the table both want names. Optional, and
   * never longer than the places asked for less yourself. */
  guests: string[] = [],
  /* Which day of a programme this place is for.
   *
   * Null — the ordinary case — means the whole thing, which is the only honest
   * answer for an evening that is one day, or a week where every day is the
   * point. An evening with a programme inside it (four Saturdays and a Sunday)
   * is not something anybody comes to as a whole, so those are booked a day at a
   * time. */
  onDay: string | null = null,
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

  const named = guests
    .map((one) => one.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, Math.max(0, many - 1));

  const booking = {
    event_id: eventId,
    profile_id: me.id,
    people: many,
    bringing: bringing.trim().slice(0, 280),
    state: "asked",
    on_day: onDay,
  };

  const { error } = await supabase
    .from("bookings")
    .upsert(
      { ...booking, guests: named },
      { onConflict: "event_id,profile_id,on_day" },
    );

  if (error) {
    /* The column may not be there yet.
     *
     * `guests` arrives with migration 0028, and a database that has not had it
     * answers 42703 — undefined column. Signing up is the one thing on this
     * screen that must not stop working while a migration is in the post, so the
     * names are dropped and the place is kept. Nothing is silently lost that
     * anybody can see: the names are shown back from the row, so an empty list
     * says plainly that they did not stick. */
    if (error.code !== "42703") return { ok: false, error: error.message };

    const { error: again } = await supabase
      .from("bookings")
      .upsert(booking, { onConflict: "event_id,profile_id,on_day" });
    if (again) return { ok: false, error: again.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/events");
  revalidatePath("/app/account");
  return { ok: true, state: "asked" };
}

/**
 * Places on several days of one programme, in one press.
 *
 * The days somebody picks are the days they have a place on, and the days they
 * unpick are places given up — so this is not "add these" but "these, and only
 * these". Doing it in one call rather than one per checkbox is the difference
 * between a form that saves and a form that half-saves: a browser that loses its
 * connection halfway through five separate requests leaves somebody down for a
 * Saturday they did not choose.
 */
export async function signUpForDays(
  eventId: string,
  days: string[],
  people: number,
  bringing: string,
  guests: string[] = [],
): Promise<Asked> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const wanted = [...new Set(days.filter(Boolean))].slice(0, 40);
  const supabase = await supabaseServer();

  /* Gone first, so a day taken off does not survive as a place nobody meant to
     keep — and only ever this member's own rows on this evening. */
  const off = await supabase
    .from("bookings")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", me.id)
    .not("on_day", "is", null);
  if (off.error) return { ok: false, error: off.error.message };

  if (wanted.length === 0) {
    revalidatePath("/app");
    revalidatePath("/app/events");
    revalidatePath("/app/account");
    return { ok: true, state: "asked" };
  }

  for (const day of wanted) {
    const answer = await signUpForEvent(eventId, people, bringing, guests, day);
    if (!answer.ok) return answer;
  }

  return { ok: true, state: "asked" };
}

/**
 * Marking an evening to think about.
 *
 * A bookmark rather than a promise, and it shares the row that a place would use:
 * it is the same fact about the same person and the same evening at a different
 * strength, so somebody who marks one and then comes has one row that changed its
 * mind rather than two rows disagreeing.
 *
 * Pressing it again takes the mark off. Pressing "count me in" over it turns the
 * maybe into a yes, and the number of places asked for starts counting it.
 */
export async function markInterested(eventId: string, on: boolean): Promise<Asked> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const supabase = await supabaseServer();

  if (!on) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", me.id)
      .eq("state", "interested");
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("bookings").upsert(
      {
        event_id: eventId,
        profile_id: me.id,
        // One, because it is not a number of places yet.
        people: 1,
        bringing: "",
        state: "interested",
      },
      { onConflict: "event_id,profile_id" },
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/events");
  revalidatePath("/app/account");
  return { ok: true, state: on ? "interested" : undefined };
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

/* Leaving is done by Supabase's own function — supabase/functions/leave-the-club —
 * and not from here.
 *
 * It was here, and it needed the service key: the only way to remove a login is
 * with a key that must never reach a browser, which meant a variable set by hand
 * on the hosting account. Until somebody set it, the button deleted a person's
 * things and left them a login they could still sign in with — which is not what
 * it says, and not what an app store allows of an app that keeps accounts.
 *
 * Inside Supabase that key is Supabase's own and there is nothing to configure. */

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

/* ------------------------------------------------------------ who you are */

export type WhoYouAre = {
  name: string;
  city: string;
  country: string;
  does: string;
  skills: string[];
  languages: string[];
  /** Day and month only. The year is not asked for and not stored. */
  birthday: string;
  birthdayShown: boolean;
  instagram: string;
  cannotEat: string;
  phone: string;
  listed: boolean;
};

/**
 * Saying who you are, once, after joining.
 *
 * Everything here is optional except the name, and the reason each field exists is
 * a reason from this collective rather than a field a form usually has. What
 * somebody does and what they can bring is how you find out who can weld, who has
 * a van and who speaks Romanian — which is the actual work of putting a kitchen
 * together out of what a place already has. What they cannot eat is asked because a
 * shared kitchen has to know, and it is never shown to anybody but us.
 *
 * The birthday is a day and a month, and a year only if somebody chose to give
 * one. It used not to take a year at all, on the grounds that a full date of
 * birth is the most useful field in the world to somebody impersonating you and
 * that a collective only wants to know it is your birthday. Both of those are
 * still true, which is why the year is optional and the form says so rather than
 * asking for it as though it were needed.
 */
export async function sayWhoYouAre(who: WhoYouAre): Promise<{ ok: boolean; error?: string }> {
  const me = await whoIsThis();
  if (!me) return { ok: false, error: "You are not signed in any more." };

  const name = who.name.trim();
  if (!name) return { ok: false, error: "A name, at least — it is what everybody sees." };

  /*
   * A day, a month, and a year only where one was given.
   *
   * The column is a date and a date must have a year, so a birthday with no year
   * is stored in 2000 — which is also the flag that says "no year was given", and
   * is read back that way. 2000 because it is a leap year: somebody born on the
   * twenty-ninth of February exists, and any other choice would refuse them.
   *
   * The one thing this cannot represent is somebody born in 2000 who wants their
   * year kept: theirs reads back as no year at all. That is the price of not
   * adding a column, and it is the right way round — the failure is that a year
   * is forgotten, never that one is invented.
   */
  let birthday: string | null = null;
  if (who.birthday) {
    const match = /^(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{4}))?$/.exec(who.birthday.trim());
    if (!match) {
      return { ok: false, error: "A birthday as day and month — 29.2, or 7.11." };
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = match[3] ? Number(match[3]) : 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { ok: false, error: "That is not a day and a month." };
    }
    const now = new Date().getFullYear();
    if (year > now || year < now - 120) {
      return { ok: false, error: "That is not a year anybody was born in." };
    }
    /* And the day has to exist in the month: the dropdown offers 31 in every
       month on purpose, so this is where the 31st of February is turned away.
       Checked against a leap year, so the 29th of February is not. */
    const days = new Date(Date.UTC(year === 2000 ? 2000 : year, month, 0)).getUTCDate();
    if (day > days) {
      return { ok: false, error: "That day is not in that month." };
    }
    birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const tidy = (list: string[]) =>
    [...new Set(list.map((one) => one.trim()).filter(Boolean))].slice(0, 12);

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      city: who.city.trim().slice(0, 80),
      country: who.country.trim().slice(0, 80),
      does: who.does.trim().slice(0, 120),
      skills: tidy(who.skills),
      languages: tidy(who.languages),
      birthday,
      birthday_shown: Boolean(birthday) && who.birthdayShown,
      instagram: who.instagram.trim().replace(/^@+/, "").slice(0, 60),
      cannot_eat: who.cannotEat.trim().slice(0, 400),
      phone: who.phone.trim().slice(0, 40),
      listed: who.listed,
      settled_in: true,
    })
    .eq("id", me.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app", "layout");
  revalidatePath("/community");
  return { ok: true };
}

/**
 * Not now.
 *
 * The screen is asked once and it has to be possible to walk past it — somebody
 * who has just joined to see what is on this Saturday does not owe us a
 * biography. It is all in their own details afterwards, whenever they feel like it.
 */
export async function notJustYet(): Promise<{ ok: boolean }> {
  const me = await whoIsThis();
  if (!me) return { ok: false };

  const supabase = await supabaseServer();
  await supabase.from("profiles").update({ settled_in: true }).eq("id", me.id);
  revalidatePath("/app", "layout");
  return { ok: true };
}
