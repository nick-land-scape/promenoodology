"use server";

import { supabasePublic } from "@/lib/supabase/public";
import { hasSupabase } from "@/lib/supabase/config";
import type { NewsletterRow } from "@/lib/supabase/rows";

export type Result = { error?: string; message?: string };

/**
 * Putting your address on the list.
 *
 * Anybody may write to this table and nobody but an admin may read it, so we
 * cannot check first whether an address is already there — we try, and treat
 * the "already exists" complaint as a perfectly good outcome.
 */
export async function subscribe(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(form.get("name") ?? "").trim();

  if (!email.includes("@")) return { error: "That does not look like an email address." };
  if (!hasSupabase()) return { error: "The list is not set up yet. Write to us instead." };

  const row: Partial<NewsletterRow> = { email, name };
  const { error } = await supabasePublic().from("newsletter").insert(row);

  if (error) {
    // 23505 is Postgres for "there is already a row like that".
    if (error.code === "23505") return { message: "You are already on the list. Nothing to do." };
    return { error: "Something went wrong. Try again, or just write to us." };
  }

  return { message: "You are on the list. We only write when there is something to come to." };
}
