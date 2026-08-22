"use client";

import { useEffect, useState } from "react";

/**
 * Turning the paper down.
 *
 * The choice is remembered in the browser rather than on the server, because it
 * belongs to the person and the screen they are on, not to the account — the
 * same reader wants dark on a phone at night and light on a laptop at noon, and
 * a site that argued with them about that would be wrong both times.
 *
 * Nothing is drawn until the first paint has told us which way round we are, so
 * the word never says the opposite of what the screen is doing. The stored
 * choice is applied before paint by a script in the layout; this only offers the
 * switch.
 *
 * With no choice stored, the phone decides — dark mode on a device means dark
 * mode everywhere, not everywhere except here. Pressing this writes a choice down
 * and from then on the device is overruled on this browser, which is the right
 * way round: an explicit press beats a system default.
 */

export const THEME_KEY = "promenood-paper";

export default function DarkSwitch() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  if (dark === null) return null;

  function flip() {
    /* Read from the element rather than from state.
     *
     * The attribute is what is actually in force — it was put there before the
     * first paint by the script in the layout, and it is what the stylesheet
     * reads. State is only this component's copy of it, and two presses inside
     * one render both saw the same stale copy: the second did nothing instead of
     * turning the light back on. */
    const next = document.documentElement.dataset.theme !== "dark";
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // A browser with storage turned off still gets the switch, just not the
      // memory of it. That is a better outcome than an error nobody can act on.
    }
  }

  return (
    <button
      type="button"
      className="dark-switch"
      onClick={flip}
      aria-pressed={dark}
      title={dark ? "Put the paper back" : "Turn the paper down"}
    >
      {dark ? <Sun /> : <Moon />}
      <span>{dark ? "make it light" : "make it dark"}</span>
    </button>
  );
}

/* Two shapes, drawn here rather than imported: it is fourteen lines against a
   whole icon set in the public bundle for one glyph. */
function Moon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5V2m0 20v-3m7-7h3M2 12h3m12.5-5.5 2-2m-15 15 2-2m0-11-2-2m15 15-2-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
