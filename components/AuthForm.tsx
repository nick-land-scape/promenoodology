"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type Result, register, sendCode, signIn, verifyCode } from "@/app/(site)/account/actions";

/**
 * How many digits the code in the email has. Supabase decides this in
 * Authentication → Providers → Email → "Email OTP Length" (6 by default). If it
 * is changed there, change it here — the two have to agree.
 */
export const CODE_LENGTH = 6;

const EMPTY: Result = {};

export function SignInForm() {
  /**
   * The code in an email is the way in, and the password is the exception.
   *
   * That order matters: the accounts that look after the site have no password
   * at all — there is nothing on them to guess and nothing to leak — so leading
   * with a password field would meet them with "that email and password do not
   * match" and no hint as to why. Anybody who does have one can still say so.
   */
  const [withCode, setWithCode] = useState(true);

  return (
    <>
      {withCode ? <CodeForm /> : <PasswordForm />}

      <p className="auth-switch">
        <button type="button" className="text-button" onClick={() => setWithCode(!withCode)}>
          {withCode ? "I have a password" : "send me a code instead"}
        </button>
      </p>

      <p className="auth-switch">
        No account yet? <Link href="/account/register">Join us</Link>.
      </p>
    </>
  );
}

function PasswordForm() {
  const [state, action, pending] = useActionState(signIn, EMPTY);

  return (
    <form action={action} className="auth-form">
      <label>
        <span>email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <Says state={state} />
      <button type="submit" className="join-primary" disabled={pending}>
        {pending ? "one moment…" : "sign in →"}
      </button>
    </form>
  );
}

/** Ask for a code by email, then type it in. */
function CodeForm() {
  const [sent, sendAction, sending] = useActionState(sendCode, EMPTY);
  const [checked, checkAction, checking] = useActionState(verifyCode, EMPTY);
  const [email, setEmail] = useState("");

  return (
    <>
      <form action={sendAction} className="auth-form">
        <label>
          <span>email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <Says state={sent} />
        <button type="submit" className="join-primary" disabled={sending}>
          {sending ? "sending…" : "send me a code →"}
        </button>
      </form>

      {sent.message ? (
        <form action={checkAction} className="auth-form auth-code">
          <input type="hidden" name="email" value={email} />
          <label>
            <span>the {CODE_LENGTH}-digit code from the email</span>
            <input
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH + 2}
              pattern={`[0-9]{${CODE_LENGTH}}`}
              placeholder={"0".repeat(CODE_LENGTH)}
              required
            />
          </label>
          <Says state={checked} />
          <button type="submit" className="join-primary" disabled={checking}>
            {checking ? "checking…" : "let me in →"}
          </button>
          <p className="page-note" style={{ margin: 0 }}>
            The same email also has a link in it — clicking that works just as well.
          </p>
        </form>
      ) : null}
    </>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, EMPTY);

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
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="eight characters or more"
        />
      </label>
      <Says state={state} />
      <button type="submit" className="join-primary" disabled={pending}>
        {pending ? "one moment…" : "join →"}
      </button>
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
