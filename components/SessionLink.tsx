"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { hasSupabase } from "@/lib/supabase/config";

type Who = { signedIn: boolean; admin: boolean };

/**
 * The last line of the menu: sign in, or your profile — and for an admin, the
 * way into the back of the house.
 *
 * Who you are is worked out in the browser on purpose. Asking on the server
 * would mean reading cookies, and a page that reads cookies has to be built
 * again for every single visitor instead of being served from the cache.
 */
export default function SessionLink() {
  const [who, setWho] = useState<Who | null>(null);

  useEffect(() => {
    if (!hasSupabase()) return;
    const supabase = supabaseBrowser();
    let alive = true;

    const look = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) return setWho({ signedIn: false, admin: false });

      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (alive) setWho({ signedIn: true, admin: (data as { role?: string })?.role === "admin" });
    };

    look();
    const { data: sub } = supabase.auth.onAuthStateChange(() => look());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Nothing at all until we know — a link that changes under you is worse than
  // a link that arrives a moment late.
  if (!who) return null;

  return (
    <>
      {who.admin ? (
        <Link href="/admin" className="nav-admin">
          look after the site
        </Link>
      ) : null}
      <Link href={who.signedIn ? "/account" : "/account/sign-in"}>
        {who.signedIn ? "your profile" : "sign in"}
      </Link>
    </>
  );
}
