"use client";

import { useEffect, useState } from "react";

/**
 * What went wrong, said on the screen.
 *
 * A white screen is the worst thing an app can do. It says nothing, it cannot be
 * reported, and the person holding the phone has no way to tell "the club's app is
 * broken" apart from "my signal is bad" — so they close it and do not come back.
 *
 * This is the floor under that. Anything that reaches the window uncaught — a
 * script that would not parse, a promise nobody caught, a component that threw
 * before React had anything to show — puts a line of text on the paper instead of
 * nothing at all: what happened, and where. There is no clever recovery here on
 * purpose; by the time this runs, the screen is already gone. Its whole job is to
 * be readable and to be photographable, so that whoever is holding the phone can
 * say what it said.
 *
 * It is deliberately outside React's own error handling. An error boundary catches
 * what happens *inside* a render; this catches the rest, including the two things
 * that produce a white screen most often — a module that throws while it is being
 * evaluated, and a rejected promise in an effect.
 */
export default function Broke() {
  const [what, setWhat] = useState<string[]>([]);

  useEffect(() => {
    const add = (line: string) =>
      setWhat((have) => (have.includes(line) ? have : [...have, line].slice(0, 4)));

    /* A piece of the app that is not there any more, which is not a fault.
     *
     * This app is a web view over a site that is published several times on a busy
     * day, and its files are named after what is in them — so the moment a new
     * version goes up, the pieces the phone in somebody's hand is still holding
     * stop existing. The next thing they press asks for one of them, the request
     * is answered with nothing, and the web view puts up its own "this page
     * couldn't load", which is a dead end with our app nowhere in it.
     *
     * Nothing has broken. The app has simply moved on without them, and the whole
     * fix is to fetch it again — so this does, rather than showing somebody an
     * error about a filename.
     *
     * Once, and no more: it is written down before the reload, so a genuinely
     * missing file cannot put the app in a loop of reloading itself. If it happens
     * again inside a minute, whatever it is is not a stale copy, and it falls
     * through to being said on the paper like anything else. */
    const staleCopy = (line: string) =>
      /chunkloaderror|loading chunk|loading css chunk|importing a module script failed|failed to fetch dynamically imported module/i.test(
        line,
      );

    const fetchItAgain = () => {
      try {
        const last = Number(sessionStorage.getItem("reloaded") ?? 0);
        if (Date.now() - last < 60000) return false;
        sessionStorage.setItem("reloaded", String(Date.now()));
      } catch {
        /* No storage: reload anyway. A phone with storage switched off is not a
           phone that should be left looking at a dead screen. */
      }
      window.location.reload();
      return true;
    };

    const broke = (event: ErrorEvent) => {
      if (staleCopy(event.message) && fetchItAgain()) return;
      const where = event.filename
        ? ` — ${event.filename.split("/").pop()}:${event.lineno}`
        : "";
      add(`${event.message}${where}`);
    };

    const unkept = (event: PromiseRejectionEvent) => {
      const why = event.reason;
      const said = why instanceof Error ? `${why.name}: ${why.message}` : String(why ?? "");
      if (staleCopy(said) && fetchItAgain()) return;
      add(
        typeof why === "string"
          ? why
          : why instanceof Error
            ? `${why.name}: ${why.message}`
            : "a promise nobody caught",
      );
    };

    window.addEventListener("error", broke);
    window.addEventListener("unhandledrejection", unkept);
    return () => {
      window.removeEventListener("error", broke);
      window.removeEventListener("unhandledrejection", unkept);
    };
  }, []);

  if (what.length === 0) return null;

  return (
    <div className="broke" role="alert">
      <p className="broke-said">Something in the app broke.</p>
      {what.map((line) => (
        <p className="broke-what" key={line}>
          {line}
        </p>
      ))}
      <button
        type="button"
        className="pill pill-small"
        onClick={() => window.location.reload()}
      >
        try again
      </button>
    </div>
  );
}
