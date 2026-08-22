"use server";

import { hasSupabase } from "@/lib/supabase/config";
import { supabasePublic } from "@/lib/supabase/public";

/**
 * Asking us for a hand.
 *
 * Anybody may write one of these and only an admin may read them, which is the
 * whole reason the table exists: the form used to open the sender's own mail
 * programme instead, which is honest but means a request can be lost in an inbox
 * before anybody else sees it.
 *
 * The mail route is still on the page as the second way in, for anybody who
 * would rather write in their own words.
 */

export type Result = { error?: string; message?: string };

export async function apply(_state: Result, form: FormData): Promise<Result> {
  const read = (name: string) => String(form.get(name) ?? "").trim();

  const what = read("what");
  const contact = read("contact");

  if (!what) return { error: "Tell us what you want to do, even in one line." };
  if (!contact) return { error: "We need some way of getting back to you." };
  if (!hasSupabase()) {
    return { error: "This form is not connected yet — use the mail link underneath instead." };
  }

  const { error } = await supabasePublic()
    .from("applications")
    .insert({
      what,
      place: read("place"),
      when_roughly: read("when"),
      people: read("people"),
      cost: read("cost"),
      about: read("about"),
      contact,
    });

  if (error) {
    return { error: "Something went wrong at our end. Use the mail link underneath instead." };
  }

  return {
    message:
      "It is with us. Somebody will write back — we would rather fund ten small things badly than one big thing properly, so do not talk yourself out of asking.",
  };
}
