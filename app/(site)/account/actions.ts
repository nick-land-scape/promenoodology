"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Signing in, joining, and editing your own profile.
 *
 * Each action returns a message rather than throwing, so the form can say what
 * went wrong in plain language instead of showing an error page.
 */

export type Result = { error?: string; message?: string };

export async function signIn(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Both fields, please." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function register(_state: Result, form: FormData): Promise<Result> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const country = String(form.get("country") ?? "").trim();

  if (!name) return { error: "We would like to know what to call you." };
  if (password.length < 8) return { error: "Eight characters or more, please." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${SITE_URL}/account` },
  });
  if (error) return { error: friendly(error.message) };

  // With confirmation switched on there is no session yet: the person has to
  // click the link in the email first.
  if (!data.session) {
    return { message: `Almost there — we sent a link to ${email}. Open it and you are in.` };
  }

  if (country && data.user) {
    await supabase.from("profiles").update({ country }).eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

/** Sends a one-time code (or a link, depending on the email template). */
export async function sendCode(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Your email address, please." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/account` },
  });
  if (error) return { error: friendly(error.message) };

  return { message: `Sent. Look for a mail from us at ${email}.` };
}

export async function verifyCode(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "").trim();
  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  if (!token) return { error: "The code from the email, please." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveProfile(_state: Result, form: FormData): Promise<Result> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in any more." };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: String(form.get("name") ?? "").trim(),
      country: String(form.get("country") ?? "").trim(),
      listed: form.get("listed") === "on",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/community");
  return { message: "Saved." };
}

/** Supabase speaks in error codes; people do not. */
function friendly(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "That email and password do not match.";
  if (text.includes("email not confirmed")) {
    return "This address has not been confirmed yet — the link is in your inbox.";
  }
  if (text.includes("user already registered")) {
    return "There is already an account with this address. Sign in instead.";
  }
  if (text.includes("signups not allowed")) return "New accounts are closed at the moment.";
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts for now. Try again in a few minutes.";
  }
  if (text.includes("expired") || text.includes("invalid")) {
    return "That code is wrong or too old. Ask for a new one.";
  }
  return message;
}
