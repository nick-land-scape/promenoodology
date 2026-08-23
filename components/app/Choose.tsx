"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buzz } from "@/lib/native";

export type Choice = { value: string; label: string; lang?: string };

/**
 * A list you choose one thing from.
 *
 * The app had two ways of asking a closed question and neither was this. A row of
 * pills is right for two or three options and hopeless for a hundred years; a
 * native `<select>` is right for a hundred years and, on a phone, is a wheel that
 * arrives from the bottom of the screen wearing the operating system's clothes —
 * fine in a form somebody is filling in, wrong for a setting that is meant to look
 * like part of the app.
 *
 * So: a button that says what is chosen, and a list under it. It is the ARIA
 * combobox-with-listbox pattern rather than a div with a click handler, which
 * means the keyboard works the way a keyboard is supposed to — arrows to move,
 * Home and End to jump, Enter or Space to take it, Escape to give up — and a
 * screen reader is told it is a list of options rather than left to guess from a
 * row of buttons.
 *
 * Typing works too, and it matters most where the list is longest: pressing "1 9
 * 8" in the year list goes to 1980 rather than walking there one arrow at a time.
 */
export default function Choose({
  value,
  options,
  onChange,
  label,
  wide,
  disabled,
}: {
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
  /** Read out in place of a visible label, where the field's own label is elsewhere. */
  label?: string;
  /** How much room the closed button takes. A day needs less than a country. */
  wide?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  /* Which line the keyboard is on, which is not the same as which is chosen: you
     can walk the list without taking anything, and Escape should leave what was
     chosen alone. */
  const [at, setAt] = useState(() => Math.max(0, options.findIndex((one) => one.value === value)));
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ what: "", when: 0 });

  const chosen = options.find((one) => one.value === value) ?? null;

  /* Opening puts the highlight on what is already chosen, so the list opens where
     you left it rather than at the top — the difference between "1994" and a
     hundred years of scrolling. */
  useEffect(() => {
    if (!open) return;
    const now = Math.max(0, options.findIndex((one) => one.value === value));
    setAt(now);
  }, [open, value, options]);

  // And the highlighted line is brought into view, however it was moved.
  useEffect(() => {
    if (!open) return;
    list.current?.children[at]?.scrollIntoView({ block: "nearest" });
  }, [open, at]);

  /* A press anywhere else shuts it. Pointerdown rather than click: a click lands
     after the thing under it has already reacted, so pressing a second dropdown
     opened that one and left this one open behind it. */
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function take(index: number) {
    const one = options[index];
    if (!one) return;
    void buzz("light");
    onChange(one.value);
    setOpen(false);
  }

  /** Jump to whatever starts with what has just been typed. */
  function toTyping(key: string) {
    const now = Date.now();
    // A second's pause starts a new word, so "1 9 8" is 1980 and "1 … 9" is not.
    typed.current.what = now - typed.current.when > 1000 ? key : typed.current.what + key;
    typed.current.when = now;
    const looking = typed.current.what.toLowerCase();
    const found = options.findIndex((one) => one.label.toLowerCase().startsWith(looking));
    if (found >= 0) setAt(found);
  }

  function onKey(event: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        take(at);
        break;
      case "ArrowDown":
        event.preventDefault();
        setAt((now) => Math.min(options.length - 1, now + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setAt((now) => Math.max(0, now - 1));
        break;
      case "Home":
        event.preventDefault();
        setAt(0);
        break;
      case "End":
        event.preventDefault();
        setAt(options.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (event.key.length === 1) toTyping(event.key);
    }
  }

  return (
    <div className={open ? "choose choose-open" : "choose"} ref={box}>
      <button
        type="button"
        className="choose-said"
        style={wide ? { minWidth: wide } : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        aria-controls={`${id}-list`}
        onClick={() => setOpen((now) => !now)}
        onKeyDown={onKey}
      >
        {/* Nothing chosen is drawn quieter than something chosen: the closed
            button of an empty field says "year", and it should read as the name
            of the field rather than as the answer to it. */}
        <span className={value ? undefined : "choose-none"} lang={chosen?.lang}>
          {chosen ? chosen.label : "—"}
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M6 9.5 12 15.5 18 9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          className="choose-list"
          id={`${id}-list`}
          role="listbox"
          ref={list}
          tabIndex={-1}
          aria-activedescendant={`${id}-${at}`}
        >
          {options.map((one, index) => (
            <li
              key={one.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={one.value === value}
              className={
                [
                  index === at ? "is-at" : "",
                  one.value === value ? "is-chosen" : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              lang={one.lang}
              /* Click, and not pointerdown with `preventDefault`, which is what
                 this was and is why the list could not be scrolled on a phone: a
                 touch inside the list always starts on a line, and cancelling the
                 pointer event that starts on a line cancels the pan with it. The
                 press-outside handler that pointerdown was for does not need it —
                 it asks whether the press was inside this dropdown, and every line
                 of the list is. */
              onClick={() => take(index)}
              /* And the highlight follows a *pointer*. A finger is not hovering
                 over anything: on touch this fired as the finger went down and
                 moved the highlight to whatever line the scroll happened to start
                 on. */
              onPointerEnter={(over) => {
                if (over.pointerType === "mouse") setAt(index);
              }}
            >
              {one.label}
              {one.value === value ? (
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path
                    d="M5 12.5 10 17.5 19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
