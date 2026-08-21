"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Thumb from "./Thumb";
import { Icon } from "./ui";

/**
 * A dropdown that can hold a face and be searched.
 *
 * A native <select> was the right thing until the list became the whole
 * community. Sixty-six names in a scrolling column, alphabetical, no way to
 * type at it and no way to tell two Gabrielas apart — you were picking a string
 * and hoping. This shows the portrait beside the name and filters as you type,
 * which is how you actually recognise somebody.
 *
 * It is also used for years, where there is nothing to show but where the same
 * argument applies in reverse: the years are a known, short list, and typing
 * one into a text box let anybody write 20226 and nobody find out until the
 * archive had a filter for it.
 */

export type Choice = {
  value: string;
  label: string;
  /** A second line: where somebody is from, how many photographs a year holds. */
  note?: string;
  /** A portrait or a logo, if there is one. */
  image?: string;
};

export default function Picker({
  value,
  onChange,
  options,
  empty = "not chosen",
  search,
  label,
  wide,
  keepOpen,
}: {
  value: string;
  onChange: (next: string) => void;
  options: Choice[];
  /** What the first, unchosen option says. Pass null to insist on an answer. */
  empty?: string | null;
  /** Show the box you can type into. Worth it past a dozen options. */
  search?: boolean;
  /** For anybody who cannot see the thing it sits under. */
  label?: string;
  wide?: boolean;
  /**
   * Stay open after a choice.
   *
   * For a list you are adding several things to: naming four people who were
   * there meant opening the same dropdown four times, and typing the same three
   * letters again if you had been searching. What is chosen leaves the list as
   * it is chosen, so it is obvious what has been taken.
   */
  keepOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [cursor, setCursor] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  const chosen = options.find((one) => one.value === value);

  const shown = useMemo(() => {
    const needle = typed.trim().toLowerCase();
    if (!needle) return options;
    // Matched on both lines: typing "Spain" should find everybody from there,
    // not nobody.
    return options.filter((one) =>
      `${one.label} ${one.note ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, typed]);

  // Clicking anywhere else closes it. Pointerdown rather than click, so a click
  // that lands on another picker opens that one instead of being eaten.
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => {
    if (open) field.current?.focus();
    else {
      setTyped("");
      setCursor(0);
    }
  }, [open]);

  function take(next: string) {
    onChange(next);
    if (!keepOpen) setOpen(false);
  }

  function keys(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const last = shown.length - 1 + (empty === null ? 0 : 1);
      setCursor((was) => Math.min(last, Math.max(0, was + step)));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (empty !== null && cursor === 0) take("");
      else take(shown[cursor - (empty === null ? 0 : 1)]?.value ?? value);
      return;
    }
  }

  const rows: Choice[] = empty === null ? shown : [{ value: "", label: empty }, ...shown];

  /* Choosing removes a row, so the keyboard's place can end up past the end of a
     list it was in the middle of. */
  const at = Math.min(cursor, Math.max(0, rows.length - 1));

  return (
    <div className={wide ? "admin-picker admin-picker-wide" : "admin-picker"} ref={box}>
      <button
        type="button"
        className="admin-picker-face"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((was) => !was)}
      >
        {chosen?.image ? (
          <Thumb src={chosen.image} width={0} height={0} sizes="24px" />
        ) : null}
        <span className={chosen ? "" : "admin-picker-none"}>{chosen?.label ?? empty ?? "—"}</span>
        <svg viewBox="0 0 10 6" aria-hidden="true" className="admin-picker-arrow">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {open ? (
        <div className="admin-picker-drop" role="listbox">
          {search ? (
            <div className="admin-picker-search">
              <Icon name="search" />
              <input
                ref={field}
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  setCursor(empty === null ? 0 : 1);
                }}
                onKeyDown={keys}
                placeholder="type a few letters"
                aria-label="Search the list"
              />
            </div>
          ) : null}

          <div className="admin-picker-list">
            {rows.length === 0 ? (
              <p className="admin-picker-empty">Nobody by that name.</p>
            ) : (
              rows.map((one, index) => (
                <button
                  key={one.value || "none"}
                  type="button"
                  role="option"
                  aria-selected={one.value === value}
                  className={[
                    "admin-picker-row",
                    one.value === value ? "admin-picker-on" : "",
                    index === at ? "admin-picker-cursor" : "",
                    one.value ? "" : "admin-picker-none",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPointerEnter={() => setCursor(index)}
                  onClick={() => take(one.value)}
                >
                  {one.image ? (
                    <Thumb src={one.image} width={0} height={0} sizes="40px" />
                  ) : one.value && options.some((option) => option.image) ? (
                    // A blank of the same size, so the names stay in one column
                    // whether or not somebody has sat for a portrait.
                    <span className="admin-picker-noface" />
                  ) : null}
                  <span className="admin-picker-name">{one.label}</span>
                  {one.note ? <em>{one.note}</em> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
