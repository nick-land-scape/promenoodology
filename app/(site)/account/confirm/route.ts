import { type NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where the link in the email lands.
 *
 * The link used to point straight at /account, and that page only ever asked who
 * was signed in — so it answered "nobody", every time. A link in an email is not
 * a session: it carries a token that has to be handed back to Supabase and traded
 * for one, and there was nowhere in this project doing the trading. The code in
 * the same email worked, which is why nobody noticed.
 *
 * Two kinds of token can arrive here:
 *
 * `token_hash` is the one we ask the email templates to send, and the one that
 * works from anywhere. It is checked against the address it was issued for and
 * needs nothing else, so the link opens on whichever device is holding the inbox
 * — the phone, a different browser, a webmail tab.
 *
 * `code` is what Supabase sends when a template uses its own stock
 * `{{ .ConfirmationURL }}`. It only works in the browser that asked for it,
 * because trading it in needs a secret that was left in a cookie there. It is
 * handled anyway, so a template that has not been updated still lets somebody in
 * where it can — but a link opened on a different device than it was asked from
 * cannot work, and that is the whole reason the templates send the hash instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") ?? "email";
  // Where to go once we know who this is; only ever a path on this site.
  const next = searchParams.get("next");
  const landing = next?.startsWith("/") ? next : "/account";

  const away = (why: string) =>
    NextResponse.redirect(new URL(`/account/sign-in?link=${why}`, origin));

  const supabase = await supabaseServer();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      // Supabase names the type in the link it built; anything unfamiliar is
      // treated as an ordinary email confirmation, which is what these are.
      type: type as "email" | "magiclink" | "signup" | "invite" | "recovery",
    });
    if (error) return away("used");
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return away("device");
  } else {
    return away("empty");
  }

  return NextResponse.redirect(new URL(landing, origin));
}
