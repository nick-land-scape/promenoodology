"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang, type Lang } from "@/lib/lang";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Choosing which language to be read in, from anywhere.
 *
 * Two places at once, and they are not the same place. The cookie is what the
 * proxy reads on the very next request, before anything has been looked up —
 * it is what stops the site guessing from the browser for ever after somebody
 * has said what they want. The account is where the choice actually lives for a
 * member: a cookie is one browser, and somebody who chose French on their phone
 * should not be asked again on a laptop.
 *
 * A visitor with no account gets the cookie and nothing else, which is all there
 * is to give them, and it is enough.
 */
export async function chooseLanguage(lang: string): Promise<{ ok: boolean }> {
  if (!isLang(lang)) return { ok: false };

  // A year, and the whole site: this is a preference, not a session.
  (await cookies()).set("lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    /* Their own row, and only their own: the policy on profiles allows a member
       to write theirs, so nothing here has to be trusted with more than that. */
    await supabase.from("profiles").update({ reads_in: lang }).eq("user_id", user.id);
  }

  // Every page is in a language, so every page is now possibly wrong.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** What somebody has chosen, for a screen that has to show it. */
export async function chosenLanguage(): Promise<Lang | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("reads_in")
    .eq("user_id", user.id)
    .maybeSingle<{ reads_in: string | null }>();

  return isLang(data?.reads_in ?? "") ? (data!.reads_in as Lang) : null;
}
