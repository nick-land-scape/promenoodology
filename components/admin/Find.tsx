"use client";

import { useRef } from "react";
import { Icon } from "./ui";

/**
 * A line to type into, above a list.
 *
 * It sits over the rows rather than beside the title, because it is not a thing
 * you *do* to the section — it is a way of looking at what is already there, and
 * what it does happens immediately underneath it.
 *
 * It says how much of the list it is showing, and only while it is hiding some
 * of it: a count over an unfiltered list is a number nobody asked for, and a
 * list that has quietly gone short is the one thing a search field must never
 * do without saying so.
 */
export default function Find({
  value,
  onChange,
  what,
  showing,
  total,
}: {
  value: string;
  onChange: (next: string) => void;
  /** "an evening", for the placeholder and for the count under it. */
  what: string;
  /** How many rows are left after the typing. */
  showing: number;
  total: number;
}) {
  const field = useRef<HTMLInputElement>(null);
  const searching = value.trim().length > 0;

  return (
    <div className="admin-find">
      <label className="admin-find-box">
        <Icon name="search" />
        <input
          ref={field}
          type="text"
          value={value}
          placeholder={`find ${what}`}
          aria-label={`Find ${what}`}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Escape empties it and stays put, which is what escape does
            // everywhere else in here.
            if (event.key === "Escape" && searching) {
              event.preventDefault();
              onChange("");
            }
          }}
        />
        {searching ? (
          <button
            type="button"
            className="admin-find-clear"
            aria-label="Clear what you typed"
            title="Clear"
            onClick={() => {
              onChange("");
              field.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
      </label>

      {searching ? (
        <p className="admin-find-count">
          {showing === 0
            ? `nothing here matches “${value.trim()}”`
            : `${showing} of ${total}`}
        </p>
      ) : null}
    </div>
  );
}
