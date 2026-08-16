"use client";

import { useActionState } from "react";
import { type Result, subscribe } from "@/app/(site)/newsletter/actions";

/** Two fields and a button. Nothing is asked for that we do not need. */
export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, {} as Result);

  if (state.message) {
    return <p className="auth-message">{state.message}</p>;
  }

  return (
    <form action={action} className="auth-form">
      <label>
        <span>your name</span>
        <input name="name" autoComplete="name" placeholder="optional" />
      </label>
      <label>
        <span>email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      {state.error ? <p className="auth-error">{state.error}</p> : null}

      <button type="submit" className="join-primary" disabled={pending}>
        {pending ? "one moment…" : "keep me posted →"}
      </button>
    </form>
  );
}
