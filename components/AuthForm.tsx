"use client";

import Link from "next/link";
import AppleSignIn from "./AppleSignIn";
import { useActionState } from "react";
import { type Result, sendCode } from "@/app/(site)/account/actions";

/**
 * The two ways in, and neither of them has a password.
 *
 * Both forms do the same thing — ask for an address and send a code to it — and
 * both hand over to /account/code. The only difference is that joining also asks
 * what to call you, because the code is what makes the account.
 *
 * There is deliberately no password anywhere: nothing to choose, nothing to
 * forget, nothing on any account worth stealing. The accounts that look after
 * the site have no password at all.
 */

const EMPTY: Result = {};

export function SignInForm({ back }: { back?: string }) {
  const [state, action, sending] = useActionState(sendCode, EMPTY);

  return (
    <>
      <form action={action} className="auth-form">
        {/* Where they were when they knocked, so signing in puts them back
            rather than parking them on a form about themselves. */}
        {back ? <input type="hidden" name="back" value={back} /> : null}
        <label>
          <span>email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="the address you gave us"
            required
            autoFocus
          />
        </label>
        <Says state={state} />
        <button type="submit" className="join-primary" disabled={sending}>
          {sending ? "sending…" : "send me a code →"}
        </button>
      </form>

      {/* The other way in. Under the code rather than over it: the code is the
          one that works for everybody, and this one only for whoever has joined
          Apple to their account — or whose Apple address is the one we already
          have for them. */}
      <p className="auth-or">or</p>
      <AppleSignIn back={back} />

      {/* No "join us": accounts start with an invitation from /admin → people. */}
      <p className="auth-switch">
        No account? They start with an invitation from us — the{" "}
        <Link href="/newsletter">newsletter</Link> is the way to hear from us in the meantime.
      </p>
    </>
  );
}

function Says({ state }: { state: Result }) {
  if (state.error) return <p className="auth-error">{state.error}</p>;
  if (state.message) return <p className="auth-message">{state.message}</p>;
  return null;
}
