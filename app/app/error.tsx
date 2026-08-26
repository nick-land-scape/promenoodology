"use client";

import { useEffect } from "react";

/**
 * A screen that did not come, said on the paper.
 *
 * Without this, a screen that throws on the server leaves the web view holding
 * nothing — and a web view holding nothing puts up its own "This page couldn't
 * load", which has our app nowhere in it, no way back except the system's own
 * buttons, and no clue what happened. It is the app looking broken in somebody
 * else's words.
 *
 * This is the app's own words instead: what happened, a way to try again, and a
 * way back to the front screen. The digest is printed because it is the one thing
 * that ties what somebody is looking at to the line in the log that explains it —
 * so a member can photograph this and it is worth something.
 */
export default function Broken({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Into the console as well, for whoever is holding the phone with a laptop.
    console.error("app screen failed", error);
  }, [error]);

  return (
    <div className="app-broken">
      <p className="app-broken-said">This screen did not come.</p>
      <p className="app-broken-what">
        Something went wrong on our side rather than yours. Trying again usually
        does it.
      </p>
      {error.digest ? <p className="app-broken-digest">{error.digest}</p> : null}
      <div className="app-broken-does">
        <button type="button" className="pill pill-solid" onClick={reset}>
          try again
        </button>
        <a className="pill" href="/app">
          the front screen
        </a>
      </div>
    </div>
  );
}
