"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/browser";
import { hasSupabase, mediaUrl } from "./supabase/config";

export type Session = {
  signedIn: boolean;
  admin: boolean;
  name: string;
  photo: string | null;
};

/**
 * Who is signed in, asked once and shared by everything that wants to know.
 *
 * It is worked out in the browser on purpose: asking on the server means
 * reading cookies, and a page that reads cookies has to be built again for
 * every visitor instead of being served from the cache.
 */
let known: Session | null = null;
let asking: Promise<void> | null = null;
const listeners = new Set<(session: Session) => void>();

async function look() {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    known = { signedIn: false, admin: false, name: "", photo: null };
  } else {
    const { data } = await supabase
      .from("profiles")
      .select("name, role, photo_path")
      .eq("id", user.id)
      .single();
    const profile = data as { name?: string; role?: string; photo_path?: string | null } | null;
    known = {
      signedIn: true,
      admin: profile?.role === "admin",
      name: profile?.name || user.email || "",
      photo: profile?.photo_path ? mediaUrl(profile.photo_path) : null,
    };
  }

  for (const listener of listeners) listener(known);
}

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(known);

  useEffect(() => {
    if (!hasSupabase()) return;

    listeners.add(setSession);
    asking ??= look();

    const { data: sub } = supabaseBrowser().auth.onAuthStateChange(() => {
      asking = look();
    });

    return () => {
      listeners.delete(setSession);
      sub.subscription.unsubscribe();
    };
  }, []);

  return session;
}

/** Two letters for somebody with no photograph. */
export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}
