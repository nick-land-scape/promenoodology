"use client";

import { useState } from "react";
import Picker, { type Choice } from "./Picker";

/**
 * More than one of something: tags, the people who were there, the partners.
 *
 * The same shape for all three, because they are the same question — what is on
 * this list — and the only difference is where the candidates come from. Chosen
 * things are chips with a cross; adding is one control underneath, and it is the
 * searchable picker where there is a list to search and a text box where the
 * words are yours to invent.
 */

export function Chosen({
  items,
  onRemove,
  empty,
}: {
  items: { value: string; label: string; note?: string }[];
  onRemove: (value: string) => void;
  empty: string;
}) {
  if (items.length === 0) return <p className="admin-chips-empty">{empty}</p>;

  return (
    <ul className="admin-chips">
      {items.map((one) => (
        <li key={one.value}>
          <span>{one.label}</span>
          {one.note ? <em>{one.note}</em> : null}
          <button type="button" onClick={() => onRemove(one.value)} aria-label={`Remove ${one.label}`}>
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Words you make up as you go. */
export function Tags({
  value,
  onChange,
  placeholder = "a word, then Enter",
  empty = "no tags yet",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  empty?: string;
}) {
  const [typed, setTyped] = useState("");

  function add() {
    const one = typed.trim().replace(/\s+/g, " ");
    setTyped("");
    if (!one) return;
    // Case-blind, because "Cooking" and "cooking" are one tag and a list with
    // both in it is a list nobody trusts.
    if (value.some((have) => have.toLowerCase() === one.toLowerCase())) return;
    onChange([...value, one]);
  }

  return (
    <div className="admin-many">
      <Chosen
        items={value.map((one) => ({ value: one, label: one }))}
        onRemove={(one) => onChange(value.filter((have) => have !== one))}
        empty={empty}
      />
      <input
        className="admin-many-add"
        value={typed}
        placeholder={placeholder}
        onChange={(event) => setTyped(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
          // Backspace on an empty box takes the last one off, which is what
          // every tag field anybody has used does.
          if (event.key === "Backspace" && !typed && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

/** Several out of a list that already exists. */
export function Some({
  value,
  onChange,
  options,
  add,
  empty,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: Choice[];
  /** What the picker says before anything is chosen. */
  add: string;
  empty: string;
}) {
  const left = options.filter((one) => !value.includes(one.value));
  const chosen = value
    .map((id) => options.find((one) => one.value === id))
    .filter(Boolean) as Choice[];

  return (
    <div className="admin-many">
      <Chosen
        items={chosen}
        onRemove={(one) => onChange(value.filter((have) => have !== one))}
        empty={empty}
      />
      {left.length > 0 ? (
        <Picker
          value=""
          onChange={(next) => next && onChange([...value, next])}
          options={left}
          empty={add}
          search={options.length > 8}
          label={add}
        />
      ) : (
        <p className="admin-chips-empty">that is everybody</p>
      )}
    </div>
  );
}
