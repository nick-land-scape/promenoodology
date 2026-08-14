import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * A Supabase client for server components, server actions and route handlers.
 * It reads the signed-in person from the cookies, so row level security applies
 * to whoever is actually looking.
 */
export async function supabaseServer() {
  const store = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Server components may not set cookies; the proxy refreshes the
          // session instead, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in person's profile, or null. */
export async function currentProfile() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, country, photo_path")
    .eq("id", user.id)
    .single();

  return data ? { ...data, email: user.email ?? "" } : null;
}

export async function isAdmin() {
  const profile = await currentProfile();
  return profile?.role === "admin";
}
