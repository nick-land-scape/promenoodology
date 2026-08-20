import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabase } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The door to the back of the house.
 *
 * There is no separate admin login: the site already knows how to sign somebody
 * in, and `profiles.role` decides whether they see this half of it. Every page
 * and every action in /admin starts by calling one of these, so a missing check
 * is a missing page rather than an open door — and the database says no as well,
 * through the row level security policies, if one is ever forgotten here.
 */

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
};

/** Asked once per request, however many components want to know. */
export const currentAdmin = cache(async (): Promise<Admin | null> => {
  if (!hasSupabase()) return null;

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("id, name, role")
      // A profile is a PERSON now, and the account they sign in with is
      // user_id. These used to be the same number; looking one up by the other
      // finds nobody, which reads as "you are not an admin".
      .eq("user_id", user.id)
      .single<{ id: string; name: string; role: "member" | "admin" }>();

    if (data?.role !== "admin") return null;
    return { id: data.id, name: data.name, email: user.email ?? "", role: data.role };
  } catch {
    return null;
  }
});

/**
 * Whoever is looking, or away with them.
 *
 * A member who is signed in but not an admin is sent to their own profile
 * rather than to the sign-in page: they are not lost, they are in the wrong
 * half of the house.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (admin) return admin;

  // Without a database there is nobody to be: the layout says so in words
  // instead, so this is never reached.
  if (!hasSupabase()) redirect("/");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/account" : "/account/sign-in");
}

/** For actions: the same check, but it throws instead of redirecting. */
export async function requireAdminAction(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) throw new Error("Not signed in as an admin any more.");
  return admin;
}
