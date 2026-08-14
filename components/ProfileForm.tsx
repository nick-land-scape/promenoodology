"use client";

import { useActionState } from "react";
import { type Result, saveProfile } from "@/app/(site)/account/actions";

type Props = {
  name: string;
  country: string;
  listed: boolean;
};

/** The only thing a member can change for now: how they are listed. */
export default function ProfileForm({ name, country, listed }: Props) {
  const [state, action, pending] = useActionState(saveProfile, {} as Result);

  return (
    <form action={action} className="auth-form">
      <label>
        <span>your name</span>
        <input name="name" defaultValue={name} required />
      </label>
      <label>
        <span>where you are from</span>
        <input name="country" defaultValue={country} placeholder="optional" />
      </label>
      <label className="auth-check">
        <input type="checkbox" name="listed" defaultChecked={listed} />
        <span>show me on the community page</span>
      </label>

      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.message ? <p className="auth-message">{state.message}</p> : null}

      <button type="submit" className="join-primary" disabled={pending}>
        {pending ? "saving…" : "save →"}
      </button>
    </form>
  );
}
