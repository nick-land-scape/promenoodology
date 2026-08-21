import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
  admin: boolean;
};

export type MyBooking = {
  id: string;
  eventId: string;
  people: number;
  bringing: string;
  state: "asked" | "kept" | "declined";
};

export async function whoIsThis(): Promise<Me | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name, country, email, photo_path, member_no, joined_on, listed, role")
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
      role: string;
    }>();
  if (!data) return null;

  return {
    id: data.id,
    userId: user.id,
    name: data.name ?? "",
    country: data.country ?? "",
    // The login's address, not the column's: the column follows it, and until a
    // changed address is confirmed the login is the one that is true.
    email: user.email ?? data.email ?? "",
    photoPath: data.photo_path,
    memberNo: data.member_no,
    since: data.joined_on,
    listed: data.listed ?? true,
    admin: data.role === "admin",
  };
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
  return me;
}

/** What you have asked to come to. Only ever your own — the policy sees to that. */
export async function myBookings(): Promise<MyBooking[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("bookings")
    .select("id, event_id, people, bringing, state")
    .returns<
      { id: string; event_id: string; people: number; bringing: string; state: string }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    people: row.people ?? 1,
    bringing: row.bringing ?? "",
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
