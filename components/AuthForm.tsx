"use client";

import Link from "next/link";
import { useActionState } from "react";
import { join, type Result, sendCode } from "@/app/(site)/account/actions";

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

export function SignInForm() {
  const [state, action, sending] = useActionState(sendCode, EMPTY);

  return (
    <>
      <form action={action} className="auth-form">
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

      <p className="auth-switch">
        No account yet? <Link href="/account/register">Join us</Link>.
      </p>
    </>
  );
}

export function RegisterForm() {
  const [state, action, sending] = useActionState(join, EMPTY);

  return (
    <form action={action} className="auth-form">
      <label>
        <span>your name</span>
        <input name="name" autoComplete="name" required placeholder="how you want to be listed" />
      </label>
      <label>
        <span>where you are from</span>
        <input name="country" autoComplete="country-name" placeholder="optional" />
      </label>
      <label>
        <span>email</span>
        <input name="email" type="email" autoComplete="email" inputMode="email" required />
      </label>
      <Says state={state} />
      <button type="submit" className="join-primary" disabled={sending}>
        {sending ? "sending…" : "send me a code →"}
      </button>
      <p className="page-note" style={{ margin: 0 }}>
        No password to choose. We send a code, you type it in, and that is the account made.
      </p>
      <p className="auth-switch">
        Already have an account? <Link href="/account/sign-in">Sign in</Link>.
      </p>
    </form>
  );
}

function Says({ state }: { state: Result }) {
  if (state.error) return <p className="auth-error">{state.error}</p>;
  if (state.message) return <p className="auth-message">{state.message}</p>;
  return null;
}
