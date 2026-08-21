"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * The Apple button at the door.
 *
 * Apple hands back an address and Supabase matches it to an account, which works
 * for anybody who signs in with the address we already have for them. Anybody who
 * chooses "hide my email" gets a relay address instead, and there is nothing to
 * match on — so they arrive as somebody new, which is honest but is not what they
 * meant.
 *
 * That is what the button in your own settings is for: signed in, you join Apple
 * to the account you are already standing in, and after that this button brings
 * you back to it whatever address Apple offers. Said here, in one line, because
 * finding out afterwards is worse than reading it now.
 *
 * The redirect lands on /account/confirm, the same door the codes and the links
 * use — it trades what it is given for a session and knows where to put you.
 */
export default function AppleSignIn({ back }: { back?: string }) {
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");

  async function go() {
    setTrouble("");
    setBusy(true);
    const next = back ? `?next=${encodeURIComponent(back)}` : "";
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/account/confirm${next}` },
    });
    if (error) {
      setBusy(false);
      setTrouble(
        /provider is not enabled/i.test(error.message)
          ? "Sign in with Apple is not switched on yet."
          : error.message,
      );
    }
  }

  return (
    <div className="auth-other">
      <button type="button" className="apple-button" onClick={() => void go()} disabled={busy}>
        <svg viewBox="0 0 18 22" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M14.9 11.6c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7 1.4 0 1.8.8 3 .7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1.1-2.2-2.3-.9-2.3-3.4-2.3-3.4zM12.4 4.3c.6-.8 1-1.9.9-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.8-1.3z"
          />
        </svg>
        {busy ? "asking Apple…" : "Sign in with Apple"}
      </button>
      {trouble ? <p className="auth-error">{trouble}</p> : null}
    </div>
  );
}
