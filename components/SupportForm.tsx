"use client";

import { useState } from "react";

/**
 * Applying for support. There is no server behind the website yet, so the form
 * writes the email for you and hands it to your mail programme — which is
 * honest, and works today.
 */
export default function SupportForm() {
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

  return (
    <form className="support" onSubmit={(event) => event.preventDefault()}>
      <div className="support-grid">
        <label>
          <span>what you want to do</span>
          <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="one line" />
        </label>
        <label>
          <span>where</span>
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="street, town"
          />
        </label>
        <label>
          <span>when, roughly</span>
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="a month is fine" />
        </label>
        <label>
          <span>how many of you</span>
          <input value={people} onChange={(e) => setPeople(e.target.value)} placeholder="3" />
        </label>
        <label>
          <span>what it would cost</span>
          <input
            value={money}
            onChange={(e) => setMoney(e.target.value)}
            placeholder="an honest guess"
          />
        </label>
      </div>

      <label className="support-wide">
        <span>anything else we should know</span>
        <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
      </label>

      <a className="support-send" href={href}>
        send this to us →
      </a>
      <p className="page-note">
        This opens your mail programme with the answers filled in, so you can see exactly what you
        are sending. Nothing is stored on this website.
      </p>
    </form>
  );
}
