"use client";

import { useActionState, useState } from "react";
import { apply, type Result } from "@/app/(site)/handbook/actions";

/**
 * Applying for support.
 *
 * It goes to us directly: anybody may write one of these and only we may read
 * them. The mail link underneath is still there for anybody who would rather
 * write in their own words, and it fills itself in from whatever has been typed
 * so nothing is lost by changing your mind halfway.
 */
export default function SupportForm() {
  const [state, send, sending] = useActionState(apply, {} as Result);

  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [people, setPeople] = useState("");
  const [money, setMoney] = useState("");
  const [about, setAbout] = useState("");

  const body = [
    `What we want to do: ${what || "—"}`,
    `Where: ${where || "—"}`,
    `When: ${when || "—"}`,
    `How many of us: ${people || "—"}`,
    `What it would cost: ${money || "—"}`,
    "",
    about,
  ].join("\n");

  const href = `mailto:info@promeNOODology.com?subject=${encodeURIComponent(
    `Support for something in ${where || "our street"}`,
  )}&body=${encodeURIComponent(body)}`;

  if (state.message) {
    return (
      <div className="support">
        <p className="auth-message" style={{ marginBottom: 10 }}>
          {state.message}
        </p>
        <p className="page-note" style={{ margin: 0 }}>
          If you would rather add something, write to{" "}
          <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="support" action={send}>
      <div className="support-grid">
        <label>
          <span>what you want to do</span>
          <input
            name="what"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="one line"
            required
          />
        </label>
        <label>
          <span>where</span>
          <input
            name="place"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="street, town"
          />
        </label>
        <label>
          <span>when, roughly</span>
          <input
            name="when"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="a month is fine"
          />
        </label>
        <label>
          <span>how many of you</span>
          <input
            name="people"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            placeholder="3"
          />
        </label>
        <label>
          <span>what it would cost</span>
          <input
            name="cost"
            value={money}
            onChange={(e) => setMoney(e.target.value)}
            placeholder="an honest guess"
          />
        </label>
        <label>
          <span>how we reach you</span>
          <input
            name="contact"
            type="text"
            placeholder="an email address, or a phone number"
            required
          />
        </label>
      </div>

      <label className="support-wide">
        <span>anything else we should know</span>
        <textarea name="about" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
      </label>

      {state.error ? (
        <p className="auth-error" style={{ marginTop: 12 }}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="support-send" disabled={sending}>
        {sending ? "sending…" : "send this to us →"}
      </button>

      <p className="page-note">
        It comes straight to us, and nobody else can read it. If you would rather write it yourself,{" "}
        <a href={href}>open it in your own mail programme</a> instead — what you have typed comes
        with it.
      </p>
    </form>
  );
}
