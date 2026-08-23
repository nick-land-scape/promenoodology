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

    const broke = (event: ErrorEvent) => {
      const where = event.filename
        ? ` — ${event.filename.split("/").pop()}:${event.lineno}`
        : "";
      add(`${event.message}${where}`);
    };

    const unkept = (event: PromiseRejectionEvent) => {
      const why = event.reason;
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
