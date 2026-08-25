import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLAIN, isLang, type Lang } from "@/lib/lang";
import { supabaseServer } from "@/lib/supabase/server";
import { whoever } from "@/lib/supabase/whoever";

/**
 * Who is holding the phone, and what they have said yes to.
 *
 * The app is for members and every screen in it needs the same three answers —
 * who you are, what you have asked to come to, and whether you are allowed in at
 * all — so they are asked once, here, rather than four slightly different ways.
 *
 * Anybody not signed in is sent to the door with a note saying where they were
 * going, so signing in puts them back on the screen they wanted rather than on
 * the front page of a website they were not looking at.
 */

export type Me = {
  id: string;
  userId: string;
  name: string;
  country: string;
  email: string;
  photoPath: string | null;
  memberNo: number | null;
  since: string;
  /** Their own answer to being on the community page. */
  listed: boolean;
  /** They have been past "tell us who you are", whether or not they filled it in. */
  settledIn: boolean;
  /* Who somebody is, beyond a name. All optional. */
  city: string;
  does: string;
  skills: string[];
  languages: string[];
  instagram: string;
  /** Day and month, as "29.2" — the year is never stored or shown. */
  birthday: string;
  birthdayShown: boolean;
  /** Private: the person and admins only. */
  cannotEat: string;
  phone: string;
  admin: boolean;
  /**
   * The language they read us in, or null where nobody has said.
   *
   * Not `languages`, just above, which is what they *speak* — that is for the
   * community page and for knowing who can talk to whom on the night. This one
   * is a setting, and it follows the account rather than the browser: a member
   * who chose French on their phone should not be asked again on a laptop.
   */
  readsIn: "en" | "fr" | null;
};

export type MyBooking = {
  /** First names of whoever is coming with them. */
  guests?: string[];
  /** The day this place is for, where the evening has a programme of days. */
  onDay?: string | null;
  id: string;
  eventId: string;
  people: number;
  bringing: string;
  /** interested = a bookmark; asked = coming; kept/declined = our answer. */
  state: "interested" | "asked" | "kept" | "declined";
};

/*
 * Asked once per request, however many things want to know.
 *
 * Nearly every screen in the app asks twice over — `requireMember` to be let in
 * and `readingIn` to know which language to be read in — and each ask was a
 * round trip to the database for the same row. React's cache holds the answer
 * for the length of one request and no longer, which is exactly as long as it
 * is true for.
 */
export const whoIsThis = cache(async (): Promise<Me | null> => {
  const supabase = await supabaseServer();
  /* From the token rather than from the auth server: see lib/supabase/whoever. */
  const user = await whoever(supabase);
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, name, country, city, does, skills, languages, instagram, birthday, birthday_shown, cannot_eat, phone, email, photo_path, member_no, joined_on, listed, settled_in, role, reads_in",
    )
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      name: string;
      country: string;
      email: string | null;
      photo_path: string | null;
      member_no: number | null;
      joined_on: string;
      listed: boolean;
      settled_in: boolean;
      city: string;
      does: string;
      skills: string[] | null;
      languages: string[] | null;
      instagram: string;
      birthday: string | null;
      birthday_shown: boolean;
      cannot_eat: string;
      phone: string;
      role: string;
      reads_in: string | null;
    }>();
  if (!data) return null;

  return {
    id: data.id,
    userId: user.id,
    name: data.name ?? "",
    country: data.country ?? "",
    // The login's address, not the column's: the column follows it, and until a
    // changed address is confirmed the login is the one that is true.
    email: user.email || data.email || "",
    photoPath: data.photo_path,
    memberNo: data.member_no,
    since: data.joined_on,
    listed: data.listed ?? true,
    settledIn: data.settled_in ?? false,
    city: data.city ?? "",
    does: data.does ?? "",
    skills: data.skills ?? [],
    languages: data.languages ?? [],
    instagram: data.instagram ?? "",
    /* Kept as a date in a year nobody reads; shown and typed as day and month. */
    /* "7.11", or "7.11.1990" where a year was given. A birthday stored in the
       year 2000 means no year was given — see `sayWhoYouAre`. */
    birthday: data.birthday ? said(data.birthday) : "",
    birthdayShown: data.birthday_shown ?? false,
    cannotEat: data.cannot_eat ?? "",
    phone: data.phone ?? "",
    admin: data.role === "admin",
    readsIn: data.reads_in === "en" || data.reads_in === "fr" ? data.reads_in : null,
  };
});

/**
 * Which language to read this screen in.
 *
 * The account first, because a member has said it once and meant it everywhere.
 * Then whatever the browser was told to remember, which is what a visitor's
 * choice on the website leaves behind. Then English.
 *
 * The app has no /fr addresses of its own and does not need any: it is behind a
 * sign-in, nothing in it is shared or indexed, and an address that says "fr" in
 * an app nobody can link into would be a segment for its own sake.
 */
export async function readingIn(): Promise<Lang> {
  const me = await whoIsThis();
  if (me?.readsIn) return me.readsIn;

  const said = (await cookies()).get("lang")?.value;
  return isLang(said) ? said : PLAIN;
}

/**
 * The same, but there is no version of these screens for a stranger.
 *
 * To the app's own door rather than the website's sign-in page: opening an app and
 * being shown a web page — heading, paragraph, menu, footer — is the moment
 * somebody decides this is not really an app.
 */
export async function requireMember(where: string): Promise<Me> {
  const me = await whoIsThis();
  if (!me) redirect(`/app/enter?from=${encodeURIComponent(where)}`);

  /* Somebody who has just joined is asked once who they are.
   *
   * Once: the screen sets the flag whether it is filled in or walked past, so
   * this cannot become a wall somebody meets every time they open the app. And
   * not on the screen that does the asking, or it would send itself in circles. */
  if (!me.settledIn && !where.startsWith("/app/hello")) redirect("/app/hello");

  return me;
}

/** What you have asked to come to. Only ever your own — the policy sees to that. */
export async function myBookings(): Promise<MyBooking[]> {
  const supabase = await supabaseServer();

  type Row = {
    id: string;
    event_id: string;
    people: number;
    bringing: string;
    state: string;
    guests?: string[] | null;
    on_day?: string | null;
  };

  /* Asked for with the names, and again without them if the column is not there.
   *
   * `guests` arrives with migration 0028. PostgREST refuses the whole select for
   * one unknown column, which would empty this list — and an empty list here
   * means the app forgets every place every member has taken. Worth one retry. */
  let { data } = await supabase
    .from("bookings")
    .select("id, event_id, people, bringing, state, guests, on_day")
    .returns<Row[]>();

  if (!data) {
    ({ data } = await supabase
      .from("bookings")
      .select("id, event_id, people, bringing, state")
      .returns<Row[]>());
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    people: row.people ?? 1,
    bringing: row.bringing ?? "",
    guests: row.guests ?? [],
    onDay: row.on_day ?? null,
    state: (row.state as MyBooking["state"]) ?? "asked",
  }));
}

/** A photograph of yours, as a grid draws one. */
export type MyPhoto = { id: string; src: string; width: number; height: number; year: string };

/**
 * The photographs the archive says you took.
 *
 * Credited to you by an admin — the archive's own "who took it" — rather than
 * anything uploaded from the app. It is the one place this club keeps a record of
 * whose photographs these are, and until now nobody could see their own.
 */
export async function myPhotos(): Promise<MyPhoto[]> {
  const me = await whoIsThis();
  if (!me) return [];

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("photos")
    .select("id, path, width, height, year")
    .is("deleted_at", null)
    .eq("published", true)
    .eq("credit_profile_id", me.id)
    .order("position")
    .returns<{ id: string; path: string; width: number; height: number; year: string }[]>();

  const { mediaUrl } = await import("@/lib/supabase/config");
  return (data ?? []).map((row) => ({
    id: row.id,
    src: mediaUrl(row.path),
    width: row.width || 1200,
    height: row.height || 900,
    year: row.year ?? "",
  }));
}

/** What you have written on the feed. */
export type MyPost = {
  id: string;
  text: string;
  place: string;
  when: string;
  photos: string[];
  replies: number;
};

export async function myPosts(): Promise<MyPost[]> {
  const me = await whoIsThis();
  if (!me) return [];

  const supabase = await supabaseServer();
  const [{ data: posts }, { data: replies }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, text, place, photo_paths, photo_path, created_at")
      .eq("author_id", me.id)
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          text: string;
          place: string | null;
          photo_paths: string[] | null;
          photo_path: string | null;
          created_at: string;
        }[]
      >(),
    supabase
      .from("post_replies")
      .select("post_id")
      .returns<{ post_id: string }[]>(),
  ]);

  const answered = new Map<string, number>();
  for (const reply of replies ?? []) {
    answered.set(reply.post_id, (answered.get(reply.post_id) ?? 0) + 1);
  }

  const { mediaUrl } = await import("@/lib/supabase/config");
  return (posts ?? []).map((row) => ({
    id: row.id,
    text: row.text ?? "",
    place: row.place ?? "",
    when: new Date(row.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    photos: (row.photo_paths?.length ? row.photo_paths : row.photo_path ? [row.photo_path] : []).map(
      (path) => mediaUrl(path),
    ),
    replies: answered.get(row.id) ?? 0,
  }));
}

export type Wave = {
  id: string;
  who: string;
  whoId: string;
  photo: string | null;
  when: string;
  seen: boolean;
  /** Whether you have waved back at them. */
  waved: boolean;
};

/**
 * Who waved at you, and whether you have waved back.
 *
 * Both directions in one read, because the only useful thing to know about a wave
 * you were sent is whether you have answered it.
 */
export async function myWaves(): Promise<{ waves: Wave[]; unseen: number }> {
  const me = await whoIsThis();
  if (!me) return { waves: [], unseen: 0 };

  const supabase = await supabaseServer();
  const [{ data: rows }, { data: people }] = await Promise.all([
    supabase
      .from("waves")
      .select("id, from_profile, to_profile, at, seen_at")
      .order("at", { ascending: false })
      .returns<
        {
          id: string;
          from_profile: string;
          to_profile: string;
          at: string;
          seen_at: string | null;
        }[]
      >(),
    supabase
      .from("profiles")
      .select("id, name, photo_path")
      .returns<{ id: string; name: string; photo_path: string | null }[]>(),
  ]);

  const named = new Map((people ?? []).map((one) => [one.id, one]));
  const mine = new Set(
    (rows ?? []).filter((row) => row.from_profile === me.id).map((row) => row.to_profile),
  );

  const waves = (rows ?? [])
    .filter((row) => row.to_profile === me.id)
    .map((row) => {
      const them = named.get(row.from_profile);
      return {
        id: row.id,
        who: them?.name || "somebody",
        whoId: row.from_profile,
        photo: them?.photo_path ?? null,
        when: new Date(row.at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
        seen: Boolean(row.seen_at),
        waved: mine.has(row.from_profile),
      };
    });

  return { waves, unseen: waves.filter((one) => !one.seen).length };
}

/**
 * Who is bringing what to an evening, and what is still wanted.
 *
 * The most useful sentence anybody writes about an improvised kitchen is "we still
 * need a pot big enough for forty", and the second most useful is the list of what
 * is already coming. Both existed as facts and neither was ever shown: "bringing"
 * was typed into a form and never read back, so four people brought salad.
 *
 * Only for an evening somebody is actually part of — the read policy on bookings
 * returns your own and an admin's view of all of them, so this is the honest
 * answer either way: a member sees what they are bringing, and the people running
 * it see everything.
 */
export type Bringing = { who: string; what: string; people: number };

/**
 * For a whole list of evenings, in two queries rather than two per evening.
 *
 * What's on used to ask this once per evening, and each ask fetched every booking
 * for that evening *and the entire list of names* — so four evenings on the screen
 * meant four downloads of all sixty-six people to put a first name next to a
 * salad. The names are the same names every time; ask once.
 */
export async function whoIsBringingWhatForAll(
  eventIds: string[],
): Promise<Map<string, Bringing[]>> {
  const found = new Map<string, Bringing[]>();
  if (eventIds.length === 0) return found;

  const supabase = await supabaseServer();
  const [{ data: rows }, { data: people }] = await Promise.all([
    supabase
      .from("bookings")
      .select("event_id, profile_id, people, bringing, state")
      .in("event_id", eventIds)
      .neq("state", "interested")
      .returns<
        {
          event_id: string;
          profile_id: string;
          people: number;
          bringing: string;
          state: string;
        }[]
      >(),
    supabase.from("profiles").select("id, name").returns<{ id: string; name: string }[]>(),
  ]);

  const named = new Map((people ?? []).map((one) => [one.id, one.name || "somebody"]));

  for (const row of rows ?? []) {
    if (!(row.bringing ?? "").trim()) continue;
    const list = found.get(row.event_id) ?? [];
    list.push({
      who: named.get(row.profile_id) ?? "somebody",
      what: row.bringing.trim(),
      people: row.people ?? 1,
    });
    found.set(row.event_id, list);
  }

  return found;
}

/** One evening's worth, for the screen that is about one evening. */
export async function whoIsBringingWhat(eventId: string): Promise<Bringing[]> {
  return (await whoIsBringingWhatForAll([eventId])).get(eventId) ?? [];
}

/** A stored birthday, as the form and the profile say it. */
function said(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const day = Number(iso.slice(8, 10));
  const month = Number(iso.slice(5, 7));
  return year === 2000 ? `${day}.${month}` : `${day}.${month}.${year}`;
}
