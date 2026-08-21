"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BACK_COOKIE,
  CODE_COOKIE,
  CODE_COOKIE_MAX_AGE,
  onlyAPath,
  tidyCode,
} from "@/lib/auth-code";
import { SITE_URL } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Signing in, joining, and editing your own profile.
 *
 * There are no passwords. You give an address, we send a code and a link to it,
 * and either one lets you in — so there is nothing to remember, nothing to
 * reset, and nothing on any account worth stealing.
 *
 * Which address we are waiting on is kept in a short-lived cookie rather than
 * in the address bar: the code page needs to know whose code it is checking, and
 * somebody's email address has no business being in a URL, a browser history or
 * a server log.
 *
 * Each action answers with a message rather than throwing, so the form can say
 * what went wrong in plain language instead of showing an error page.
 */

export type Result = { error?: string; message?: string };

/**
 * Where the link in the email lands.
 *
 * Not /account: a link carries a token, and something has to trade it for a
 * session before the page can ask who is signed in. That is what /account/confirm
 * is for — see the note at the top of it.
 */
const landing = `${SITE_URL}/account/confirm`;

async function remember(email: string, back: string) {
  const jar = await cookies();
  const keeping = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CODE_COOKIE_MAX_AGE,
  };
  jar.set(CODE_COOKIE, email, keeping);
  if (back) jar.set(BACK_COOKIE, back, keeping);
}

async function whoseCode() {
  const jar = await cookies();
  return jar.get(CODE_COOKIE)?.value ?? "";
}

async function forget() {
  const jar = await cookies();
  jar.delete(CODE_COOKIE);
  jar.delete(BACK_COOKIE);
}

/**
 * Where somebody goes once we know who they are.
 *
 * The profile page only when there is something on it to fill in — which is the
 * first time, and only the first time. After that, back to whatever they were
 * reading when they knocked, and failing that the front page. Landing on a form
 * about yourself every time you sign in reads as though the site has forgotten
 * you, which is the opposite of what just happened.
 */
async function wherePut(): Promise<string> {
  const jar = await cookies();
  const back = onlyAPath(jar.get(BACK_COOKIE)?.value);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/account";

  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle<{ name: string | null }>();

  // Nothing written down yet: there is a reason to be on the form.
  if (!data?.name?.trim()) return "/account";

  // Not back to the sign-in pages, which would be a loop.
  if (back && !back.startsWith("/account/")) return back;
  return "/";
}

/**
 * Ask for a code. Existing accounts only — an address nobody has used before is
 * turned away here rather than quietly becoming an account.
 */
export async function sendCode(_state: Result, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) return { error: "Your email address, please." };

  // Where they knocked from, so they can be put back there afterwards.
  const back = onlyAPath(String(form.get("back") ?? ""));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      // Carried in the link as well as the cookie: the link is often opened on
      // the phone, where this browser's cookie is not.
      emailRedirectTo: back ? `${landing}?next=${encodeURIComponent(back)}` : landing,
    },
  });
  if (error) return { error: friendly(error.message) };

  await remember(email, back);
  redirect("/account/code");
}

/** Another one, from the code page, for whoever closed the email by mistake. */
export async function resendCode(): Promise<void> {
  const email = await whoseCode();
  if (!email) redirect("/account/sign-in");

  const supabase = await supabaseServer();
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: landing },
  });

  // Nothing is said about whether it worked: the page below already says an
  // email is on its way, and a second, louder claim would only invite doubt.
  redirect("/account/code?again=1");
}

export async function verifyCode(_state: Result, form: FormData): Promise<Result> {
  const email = await whoseCode();
  if (!email) return { error: "That took a while. Start again with your address." };

  const token = tidyCode(String(form.get("token") ?? ""));
  if (!token) return { error: "The code from the email, please." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: friendly(error.message) };

  const going = await wherePut();
  await forget();
  revalidatePath("/", "layout");
  redirect(going);
}

/**
 * Joining, which is closed.
 *
 * An account now starts with an invitation from /admin → people. This is left
 * here rather than deleted because the form that called it may still be open in
 * somebody's tab, and a button that quietly does nothing is worse than one that
 * says why.
 *
 * Worth being straight about the limit: this is the app declining, not the
 * database. The same public key could still be used to sign somebody up directly
 * against Supabase. Closing that properly means turning signups off in the
 * Supabase dashboard and giving the invitation on the admin page a service-role
 * key of its own — see the note in .env.example.
 */
export async function join(_state: Result, _form: FormData): Promise<Result> {
  return {
    error:
      "Accounts are closed at the moment — they start with an invitation from us. Put your address on the newsletter and we will be in touch.",
  };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  await forget();
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
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/community");
  return { message: "Saved." };
}

/**
 * Your own portrait, on the community page.
 *
 * The file is already in the bucket by the time this runs — the browser puts it
 * there under profiles/<your login>/, which is the only folder the storage policy
 * lets you write to. This writes down which file is yours, and takes the one it
 * replaced back out: a portrait nobody points at is a bill.
 */
export async function setMyPhoto(path: string | null): Promise<Result> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in any more." };

  const { data: before } = await supabase
    .from("profiles")
    .select("photo_path")
    .eq("user_id", user.id)
    .maybeSingle<{ photo_path: string | null }>();

  const { error } = await supabase
    .from("profiles")
    .update({ photo_path: path })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  /* The one it replaces is nobody's now — but only if it is one of your own.
   *
   * A portrait an admin uploaded for you sits under profiles/<your row>/ rather
   * than profiles/<your login>/, and the storage policy will not let you delete
   * it. Trying anyway would be a failure nobody can act on, so it is left where
   * it is and the row simply stops pointing at it. */
  const old = before?.photo_path;
  if (old && old !== path && old.startsWith(`profiles/${user.id}/`)) {
    await supabase.storage.from("media").remove([old]);
  }

  revalidatePath("/account");
  revalidatePath("/community");
  return { message: path ? "That is your portrait now." : "Taken off." };
}

/**
 * A different email address.
 *
 * Nothing changes until the new address answers. Supabase sends a link there and
 * the address only moves when somebody opens it, which is the whole point: an
 * address you cannot read is not a way back into your account, and typing one
 * letter wrong would otherwise lock you out of your own profile.
 *
 * Where the link lands is /account/confirm, the same door the sign-in links use;
 * it knows an email change from a sign-in by the type Supabase names in the link.
 */
export async function changeMyEmail(_state: Result, form: FormData): Promise<Result> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in any more." };

  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@") || /\s/.test(email)) {
    return { error: "That does not look like an email address." };
  }
  if (email === (user.email ?? "").toLowerCase()) {
    return { error: "That is the address you already use." };
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: landing },
  );
  if (error) return { error: friendly(error.message) };

  return {
    message: `Sent to ${email}. Open the link in that inbox and the address moves — until then this one still works.`,
  };
}

/** Supabase speaks in error codes; people do not. */
function friendly(message: string) {
  const text = message.toLowerCase();
  if (text.includes("signups not allowed")) {
    return "There is no account with that address yet. Join us instead — it takes one more line.";
  }
  if (text.includes("email address is already") || text.includes("already been registered")) {
    return "There is already an account with that address.";
  }
  if (text.includes("user already registered")) {
    return "There is already an account with this address. Sign in instead.";
  }
  if (text.includes("rate limit") || text.includes("too many") || text.includes("security purposes")) {
    return "That is a lot of codes in a short time. Give it a minute and ask again.";
  }
  // Supabase says "Token has expired or is invalid" for both, and will not tell
  // us which — so neither do we, rather than guessing wrong. It read "expired"
  // for a while, which sent people looking for a newer email when the real
  // trouble was that the row of boxes was two characters too short.
  if (text.includes("expired") || text.includes("invalid") || text.includes("incorrect")) {
    return "That code is wrong, or it has been used already. Ask for a new one below.";
  }
  return message;
}
