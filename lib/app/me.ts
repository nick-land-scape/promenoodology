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

/** The same, but there is no version of these screens for a stranger. */
export async function requireMember(where: string): Promise<Me> {
  const me = await whoIsThis();
  if (!me) redirect(`/account/sign-in?from=${encodeURIComponent(where)}`);
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
