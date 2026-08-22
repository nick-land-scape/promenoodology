"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type Result, verifyCode } from "@/lib/site-actions/account";
import { CODE_LENGTH } from "@/lib/auth-code";

/**
 * The code from the email, one box per character.
 *
 * A row of boxes rather than one long field, because a code is read off a screen
 * a character at a time and this is the shape that keeps your place. It behaves
 * the way people already expect these to:
 *
 * - typing a digit fills the box and moves on
 * - backspace clears the box you are in, or, if it is already empty, steps back
 *   and clears the one before it
 * - the arrow keys walk along the row
 * - pasting the whole code fills every box at once, wherever you paste it
 * - the last character submits, because by then there is nothing left to decide
 *
 * There are exactly as many boxes as Supabase puts characters in the code — see
 * lib/auth-code.
 *
 * The boxes are deliberately NOT controlled by React. Held in state, each
 * keystroke had to go out to React and come back before the box showed it, and
 * anything faster than that — a quick typist, a password manager filling the row,
 * a phone offering the code from the notification — put the next character into a
 * box that was about to be redrawn from behind it, and it was simply lost. Twice
 * built that way, twice it dropped characters. So the browser keeps the value,
 * which it is good at; React is told afterwards, and only so the button and the
 * hidden field know where things stand.
 */
export default function CodeEntry() {
  const [state, action, checking] = useActionState(verifyCode, {} as Result);
  const [code, setCode] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const complete = code.length === CODE_LENGTH;

  const at = (index: number) => boxes.current[Math.max(0, Math.min(CODE_LENGTH - 1, index))];

  /** Read the row and tell React what it says. */
  function sync() {
    setCode(
      boxes.current
        .map((box) => box?.value ?? "")
        .join("")
        // A gap in the middle is not a code yet; only a full row counts.
        .slice(0, CODE_LENGTH),
    );
  }

  function go(index: number) {
    const box = at(index);
    box?.focus();
    // Selected rather than placed after, so the next character typed replaces
    // what is there — which is what typing over a filled box should do.
    box?.select();
  }

  /** Write `text` into the row from `from` on, and leave the cursor after it. */
  function fill(from: number, text: string) {
    const typed = text.replace(/\D/g, "");
    if (!typed) return;

    let index = from;
    for (const character of typed) {
      if (index >= CODE_LENGTH) break;
      const box = boxes.current[index];
      if (box) box.value = character;
      index += 1;
    }
    sync();
    go(index);
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    const box = boxes.current[index];

    if (event.key === "Backspace") {
      event.preventDefault();
      if (box?.value) {
        // Clear where you are, and stay.
        box.value = "";
      } else if (index > 0) {
        // Already empty: step back and clear that one instead.
        const before = boxes.current[index - 1];
        if (before) before.value = "";
        go(index - 1);
      }
      sync();
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      if (box) box.value = "";
      sync();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  }

  /**
   * Everything is in — submit rather than asking for a click that has nothing
   * left to decide.
   *
   * Once per code, and that guard is not optional: a wrong code comes back with
   * the row still full, and without it the answer arriving would look like a
   * fresh completion and send the same wrong code again, for ever.
   */
  const sent = useRef("");
  useEffect(() => {
    if (!complete || checking || sent.current === code) return;
    sent.current = code;
    form.current?.requestSubmit();
  }, [complete, checking, code]);

  return (
    <form action={action} ref={form} className="auth-form">
      <input type="hidden" name="token" value={code} />

      <fieldset className="code-row">
        <legend>the {CODE_LENGTH}-character code from the email</legend>
        <div className="code-boxes">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <input
              key={index}
              ref={(element) => {
                boxes.current[index] = element;
              }}
              className="code-box"
              // Not type="number": that brings spinners, and lets in "e" and "-".
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Character ${index + 1} of ${CODE_LENGTH}`}
              maxLength={1}
              autoFocus={index === 0}
              onChange={(event) => {
                // The browser has already put the character in the box; this
                // moves on from it and tells React the row changed.
                const typed = event.target.value.replace(/\D/g, "").slice(-1);
                event.target.value = typed;
                sync();
                if (typed) go(index + 1);
              }}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={(event) => {
                event.preventDefault();
                // A whole code pasted anywhere in the row fills it from the
                // start — nobody means "put all six in the fourth box".
                fill(0, event.clipboardData.getData("text"));
              }}
              onFocus={(event) => event.target.select()}
            />
          ))}
        </div>
      </fieldset>

      {state.error ? <p className="auth-error">{state.error}</p> : null}

      <button type="submit" className="join-primary" disabled={checking || !complete}>
        {checking ? "one moment…" : "let me in →"}
      </button>
    </form>
  );
}
