"use client";

import Link from "next/link";
import AppleSignIn from "./AppleSignIn";
import { useActionState } from "react";
import { join, type Result, sendCode } from "@/lib/site-actions/account";

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
            /* No autoFocus: in the app this is the first screen, and it opened
               with the keyboard already up over half of it. On a phone that
               reads as being shouted at. */
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

      <p className="auth-switch">
        No account yet? <Link href="/account/register">Join us</Link> — it takes an address and one
        code, and there is nothing to pay.
      </p>
    </>
  );
}

function Says({ state }: { state: Result }) {
  if (state.error) return <p className="auth-error">{state.error}</p>;
  if (state.message) return <p className="auth-message">{state.message}</p>;
  return null;
}

/**
 * Joining.
 *
 * The same shape as signing in, because it is the same act with one extra
 * question: an address, a name if you feel like giving one, and a code. No
 * password, so there is nothing to choose and nothing to forget — and no second
 * field asking you to type the same address again.
 */
export function JoinForm({ back }: { back?: string }) {
  const [state, action, sending] = useActionState(join, EMPTY);

  return (
    <>
      <form action={action} className="auth-form">
        {back ? <input type="hidden" name="back" value={back} /> : null}
        <label>
          <span>your name</span>
          <input name="name" autoComplete="name" placeholder="what to call you" />
        </label>
        <label>
          <span>email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="where the code should go"
            required
          />
        </label>
        <Says state={state} />
        <button type="submit" className="join-primary" disabled={sending}>
          {sending ? "sending…" : "send me a code →"}
        </button>
      </form>

      <p className="auth-or">or</p>
      <AppleSignIn back={back} join />

      <p className="auth-switch">
        Been here before? <Link href="/account/sign-in">Sign in</Link>.
      </p>
    </>
  );
}
