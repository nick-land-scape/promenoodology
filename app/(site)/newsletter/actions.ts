"use server";

import { canSend, confirmationLetter, send } from "@/lib/mail";
import { hasSupabase } from "@/lib/supabase/config";
import { supabasePublic } from "@/lib/supabase/public";

export type Result = { error?: string; message?: string };

/**
 * Putting your address on the list — twice.
 *
 * Once here, and once from inside the inbox, which is the only proof that the
 * address belongs to the person typing it. Until that second time the row sits
 * there unconfirmed and nothing is ever sent to it: anybody can type anybody's
 * address into a form, and a list that writes to addresses it has not heard back
 * from is a list that sends mail nobody asked for.
 *
 * Nobody may read the table — the whole point of it — so the signing up goes
 * through one function in the database that hands back the token for the email
 * and nothing else. See supabase/migrations/0008.
 */
export async function subscribe(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(form.get("name") ?? "").trim();

  if (!email.includes("@")) return { error: "That does not look like an email address." };
  if (!hasSupabase()) return { error: "The list is not set up yet. Write to us instead." };

  // The function returns a table of one row. Said as a cast rather than through
  // .returns(), which insists a single object cannot be an array and is right
  // about everything except this.
  const { data, error } = await supabasePublic().rpc("newsletter_signup", {
    the_email: email,
    the_name: name,
  });

  const rows = (data ?? []) as { token: string; already: boolean }[];
  if (error || rows.length === 0) {
    return { error: "Something went wrong. Try again, or just write to us." };
  }

  const { token, already } = rows[0];

  // Already confirmed: nothing to send, and nothing to be coy about.
  if (already) return { message: "You are already on the list. Nothing to do." };

  if (!canSend) {
    return {
      error:
        "Your address is noted, but the confirmation email cannot go out yet — write to us and we will finish it by hand.",
    };
  }

  const sent = await send(confirmationLetter(email, token));
  if (!sent.ok) {
    return {
      error:
        "Your address is noted, but the confirmation email would not send. Write to us and we will finish it by hand.",
    };
  }

  return {
    message: `Almost — there is a note on its way to ${email}. Open it and you are on the list.`,
  };
}
