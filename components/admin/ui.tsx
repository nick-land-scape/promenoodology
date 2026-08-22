"use client";

import { useEffect, useRef, useState } from "react";
import { pretty, today } from "@/lib/admin/when";

/**
 * The small pieces the back of the house is built out of.
 *
 * There is no component library and no utility classes: the shapes are in
 * app/admin/admin.css and these components only put the right class names on
 * the right elements, so the styling stays in one readable file.
 */

/* ------------------------------------------------------------------- shapes */

/** One line each, so a shape can be named rather than pasted. */
const ICONS: Record<string, string> = {
  home: "M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5",
  stories: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5",
  photos: "M4 6h16v12H4zM4 14l4-4 4 4 3-3 5 5",
  quote: "M9 6H5v5h4c0 3-1.5 4.5-4 5M20 6h-4v5h4c0 3-1.5 4.5-4 5",
  pages: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5",
  wall: "M3 8h18M3 8v11h18V8M3 8l3-4h12l3 4M9 8v11M15 8v11",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M8 14h3v3H8z",
  news: "M4 5h16v14H4zM7 9h6M7 13h10M7 16h10",
  people:
    "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5zM20 19v-1.3a3 3 0 0 0-2.2-2.9M15.2 4.3a3.25 3.25 0 0 1 0 6.2",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13l2.5-8h11L20 13v6H4z",
  letter: "M3 6h18v12H3zM3 6l9 7 9-7",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z",
  out: "M15 17l5-5-5-5M20 12H9M12 20H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4H12",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  turnleft: "M8 5 4.5 8.5 8 12M4.5 8.5h9A6 6 0 1 1 7.5 14.5",
  turnright: "M16 5l3.5 3.5L16 12M19.5 8.5h-9A6 6 0 1 0 16.5 14.5",
  flipx: "M12 3v18M8 7 3.5 12 8 17V7M16 7l4.5 5-4.5 5V7",
  flipy: "M3 12h18M7 8l5-4.5L17 8H7M7 16l5 4.5L17 16H7",
  crop: "M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14",
  swap: "M4 8h13l-3.5-3.5M20 16H7l3.5 3.5",
  pin: "M9 3h6l-1 6 4 4v2H6v-2l4-4-1-6zM12 15v6",
  eyeoff:
    "M4 4l16 16M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.6 7.7A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.4-.66M9.6 9.7a2.8 2.8 0 0 0 3.9 3.9",
  up: "M12 19V5M6 11l6-6 6 6",
  upload: "M12 16V4m0 0 4 4m-4-4-4 4M4 20h16",
  trash: "M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7L18 7",
  theme: "M12 3a9 9 0 1 0 0 18c1.7 0 2-1.2 1.2-2.2-.8-1-.2-2.3 1.1-2.3H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3zM7.5 11.5h.01M10.5 8h.01M14.5 8h.01",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l4.5 4.5",
  sun: "M12 5V2m0 20v-3m7-7h3M2 12h3m12.5-5.5 2-2m-15 15 2-2m0-11-2-2m15 15-2-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  film: "M3 5h18v14H3zM3 9.5h18M3 14.5h18M7.5 5v14M16.5 5v14",
  /* Partners are the ones who are not people: a school, a festival, a council,
     the association that lent us a kitchen. Buildings, then — they were sharing
     the two-faces mark with the people, which is the one thing they are not. */
  partners: "M3 20V6l6-2.5V20M9 20v-8.5l6 2.5V20M15 20v-5h5.5v5M2 20h20M6 8.5h.01M6 12h.01M6 15.5h.01",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
  /* A book, open, with a spine down the middle — the handbook is the one thing
     here that is really a book, and it is drawn as one. */
  book: "M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v14",
};

export function Icon({ name }: { name: string }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------- fields */

type FieldProps = {
  label: string;
  hint?: string;
  /** A fact about the field, set beside its name rather than under it. */
  aside?: string;
  /** Two columns' worth of room, for a field holding two controls. */
  two?: boolean;
  wide?: boolean;
  children: React.ReactNode;
};

/** A labelled cell in a grid of fields. */
export function Field({ label, hint, aside, two, wide, children }: FieldProps) {
  return (
    <label
      className={[
        "admin-field",
        wide ? "admin-field-wide" : "",
        two ? "admin-field-two" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* `aside` rides on the label's line, hard right: a count is a fact about
          the field, not an instruction under it, and under the control it read
          as a hint about what to type. */}
      <span className={aside ? "admin-field-label" : undefined}>
        {label}
        {aside ? <em>{aside}</em> : null}
      </span>
      {children}
      {hint ? <em>{hint}</em> : null}
    </label>
  );
}

export function Fields({ children }: { children: React.ReactNode }) {
  return <div className="admin-fields">{children}</div>;
}

/* ------------------------------------------------------------------ panels */

export function Panel({
  name,
  hint,
  action,
  children,
}: {
  name?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-panel">
      {name ? (
        <header className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">{name}</h2>
            {hint ? <p className="admin-panel-hint">{hint}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="admin-panel-body">{children}</div>
    </section>
  );
}

/* ----------------------------------------------------------------- buttons */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "normal" | "quiet" | "danger";
};

export function Button({ tone = "normal", className, ...rest }: ButtonProps) {
  const tones = {
    normal: "admin-btn",
    quiet: "admin-btn admin-btn-quiet",
    danger: "admin-btn admin-btn-quiet admin-btn-danger",
  };
  return <button type="button" {...rest} className={[tones[tone], className].filter(Boolean).join(" ")} />;
}

/** A word you can press: remove, move, undo. */
export function Word({
  danger,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={["admin-word", danger ? "admin-word-danger" : "", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

/**
 * Throwing something away.
 *
 * A bin rather than the word "delete", for one reason: it is the only
 * irreversible thing on any of these pages, and a word in a row of words does
 * not look different from the words either side of it. A red bin does.
 */
export function Bin({
  what,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { what?: string }) {
  return (
    <button
      type="button"
      {...rest}
      className="admin-bin"
      aria-label={what ? `Delete ${what}` : "Delete"}
      title={what ? `Delete ${what}` : "Delete"}
    >
      <Icon name="trash" />
    </button>
  );
}

/**
 * Shown or hidden. The only switch in the back of the house, and it says which
 * state it is in rather than leaving you to read a colour.
 */
export function Flag({
  on,
  onChange,
  labels = ["shown", "hidden"],
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  labels?: [string, string];
}) {
  /* An eye, open or struck through, rather than a small square that was purple
     when on and grey when off — a colour is a thing you have to have been told,
     and an eye with a line through it is a thing you already know. */
  return (
    <button
      type="button"
      className="admin-flag"
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      <Icon name={on ? "eye" : "eyeoff"} />
      {on ? labels[0] : labels[1]}
    </button>
  );
}

/** Up and down, for anything whose order the visitor sees. */
export function Move({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <span className="admin-move">
      <button
        type="button"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
    </span>
  );
}

/* ------------------------------------------------------ leaving unsaved work */

/**
 * A word before you walk away from something you have not kept.
 *
 * Every screen back here writes when you say so and not before, which is the
 * right way round — a change is a decision, not a keystroke. The cost of that is
 * a page full of typing that a stray click on the menu throws away without
 * comment, and until now there was nothing at all standing in the way of it.
 *
 * Two doors, and they are genuinely different:
 *
 * Leaving the site — a reload, a closed tab, an address typed over the top — is
 * the browser's own dialog, and the browser will not let us word it. All we can
 * do is say there is something to lose.
 *
 * Leaving for another page of the back of the house never reaches the browser at
 * all: the router swaps the page out underneath us. So the click is caught on the
 * way down, while it can still be stopped, and asked about in our own words.
 * Anything opening in a new tab is left alone — that is not leaving.
 */
export function useUnsaved(dirty: boolean, what = "changes you have not kept") {
  useEffect(() => {
    if (!dirty) return;

    const leaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // The older browsers want this set; the newer ones only read the default
      // being prevented, and none of them show a message we choose.
      event.returnValue = "";
    };

    const clicking = (event: MouseEvent) => {
      // A middle click, or one with a modifier held, opens somewhere else and
      // leaves this page where it is.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      // Somewhere else entirely: the browser's own dialog has that covered.
      if (!href.startsWith("/")) return;
      // Where we already are.
      if (href === window.location.pathname) return;

      if (!window.confirm(`Leave without keeping the ${what}? They will be lost.`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", leaving);
    // Capturing, so it is stopped before the router has been told.
    document.addEventListener("click", clicking, true);

    return () => {
      window.removeEventListener("beforeunload", leaving);
      document.removeEventListener("click", clicking, true);
    };
  }, [dirty, what]);
}

/* --------------------------------------------------------------- the strip */

/**
 * The strip along the bottom with the one button that matters. It sticks, so a
 * long page never hides the way to keep what you have written.
 */
export function SaveBar({
  onSave,
  pending,
  dirty,
  saved,
  error,
  children,
  label = "save",
}: {
  onSave: () => void;
  pending: boolean;
  dirty: boolean;
  saved: boolean;
  error?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="admin-save">
      <button type="button" className="admin-btn" onClick={onSave} disabled={pending || !dirty}>
        {pending ? "saving…" : label}
      </button>
      {saved && !dirty ? <span className="admin-ok">kept ✓</span> : null}
      {dirty && !pending ? <span className="admin-note" style={{ margin: 0 }}>not kept yet</span> : null}
      {error ? <span style={{ color: "var(--pink)" }}>{error}</span> : null}
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- odds & ends */

export function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "on" | "warn";
}) {
  const cls = ["admin-tag", tone === "on" ? "admin-tag-on" : "", tone === "warn" ? "admin-tag-warn" : ""];
  return <span className={cls.filter(Boolean).join(" ")}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="admin-empty">{children}</p>;
}

export function Problem({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="admin-error">{children}</p>;
}

/** Move an item in a list, without changing the original. */
export function moved<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}


/* The two date helpers live in lib/admin/when.ts now — they are plain functions
   and a server page has every right to call one. Re-exported so that the fifteen
   places importing them from here carry on working. */
export { pretty, today };

/* ------------------------------------------------------- putting things in order

   Everything in here that a visitor sees in order — stories, photographs, the
   parts of a page, the partners — is arranged the same three ways: dragged,
   nudged with the arrows, or told a number. One place for all three, because
   five copies of it drifted into five subtly different behaviours.

   Two things about dragging that are easy to get wrong, and were:

   Safari and Firefox refuse a drop unless dragstart put something on the
   dataTransfer. Chrome does not care, which is exactly why this went unnoticed —
   it worked on the machine it was written on.

   An <img> is draggable on its own, natively, and hijacks the drag with its own
   payload: you end up dragging the picture rather than the row it sits in. Every
   image inside something draggable needs draggable={false}. */

export function useDragOrder<T extends { id: string }>(
  items: T[],
  onMove: (from: number, to: number) => void,
) {
  const [dragging, setDragging] = useState<string | null>(null);
  /* Which row the pointer is over. Without this a drag was all faith: the thing
     you had picked up looked no different, nothing said where it would land,
     and you found out by letting go. */
  const [over, setOver] = useState<string | null>(null);

  /**
   * The row: where something can be dropped, but not where a drag starts.
   *
   * That split is not tidiness. Most of these rows have a text field in them, and
   * on a draggable element you cannot select text with the mouse — the drag wins
   * the gesture. So the row accepts, and only the handle offers.
   */
  function dropProps(_item: T, index: number) {
    return {
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (over !== _item.id) setOver(_item.id);
      },
      onDragLeave: () => {
        if (over === _item.id) setOver(null);
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        // The state is the quick answer; the dataTransfer is the one that
        // survives a drag that began somewhere else.
        const id = dragging ?? event.dataTransfer.getData("text/plain");
        const from = items.findIndex((one) => one.id === id);
        if (from !== -1 && from !== index) onMove(from, index);
        setDragging(null);
        setOver(null);
      },
    };
  }

  /** The handle: the only thing a drag may start from. */
  function handleProps(item: T) {
    return {
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(item.id);
        // The whole page says a drag is happening, which is what lets the
        // cursor be a closed hand over every row rather than only this one.
        document.documentElement.classList.add("admin-dragging");
      },
      onDragEnd: () => {
        setDragging(null);
        setOver(null);
        document.documentElement.classList.remove("admin-dragging");
      },
    };
  }

  /** What a row should be called while a drag is in the air. */
  function stateOf(item: T) {
    if (dragging === item.id) return "admin-row-dragging";
    if (dragging && over === item.id) return "admin-row-over";
    return "";
  }

  return { dropProps, handleProps, dragging, over, stateOf };
}

/** The thing you take hold of. Small, and the only way a drag begins. */
export function Grip(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className="admin-grip"
      role="button"
      tabIndex={-1}
      aria-label="Drag to reorder"
      title="Drag to reorder"
    >
      <svg viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
        <circle cx="2.5" cy="3" r="1.2" />
        <circle cx="7.5" cy="3" r="1.2" />
        <circle cx="2.5" cy="8" r="1.2" />
        <circle cx="7.5" cy="8" r="1.2" />
        <circle cx="2.5" cy="13" r="1.2" />
        <circle cx="7.5" cy="13" r="1.2" />
      </svg>
    </span>
  );
}

/**
 * The number, which is also the way to move something a long way.
 *
 * Sixty-four photographs is a lot of dragging and a very long way for an arrow.
 * Typing 3 into the fortieth one puts it third — which is how anybody would
 * describe what they wanted anyway.
 */
export function Place({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
}) {
  const [typed, setTyped] = useState<string | null>(null);

  function commit() {
    const wanted = typed?.trim();
    setTyped(null);
    // Nothing typed, or the field emptied and left: that is not "put it first".
    // Number("") is 0, which is finite, which sent it to the top of the list —
    // so the emptiness is checked before the arithmetic, not after it.
    if (!wanted) return;

    const asked = Number(wanted);
    if (!Number.isFinite(asked)) return;

    const to = Math.min(total, Math.max(1, Math.round(asked))) - 1;
    if (to !== index) onMove(index, to);
  }

  return (
    <input
      className="admin-place"
      value={typed ?? String(index + 1)}
      inputMode="numeric"
      aria-label={`Number ${index + 1} of ${total} — type another to move it there`}
      title="Type a number to move it there"
      onChange={(event) => setTyped(event.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        // Enter commits here rather than blurring and letting onBlur do it. One
        // hop instead of two: the round trip through the browser's focus
        // handling was a step that could quietly not happen.
        if (event.key === "Enter" || event.key === "NumpadEnter") {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setTyped(null);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

/* ---------------------------------------------------------- choosing several

   Sixty-five people and a hundred and sixty photographs. Giving forty of them
   the same photographer, or taking a dozen names off the community page, is one
   decision — and doing it forty times is not the same thing, it is the same
   thing done badly.

   Nothing here writes anything. Choosing marks rows; an action applies the
   change to every marked row in the page's own state; the page's own save button
   writes it. So a bulk change is reviewable before it is real, and it is undone
   by reloading, like every other change in here. */

export function useChosen<T extends { id: string }>(items: T[]) {
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const last = useRef<string | null>(null);

  // Anything no longer on screen — filtered away, deleted — is no longer chosen
  // either. Acting on rows you cannot see is how a bulk edit becomes a surprise.
  // In an effect rather than during the render, because a render is not allowed
  // to be the place where things change.
  const ids = items.map((item) => item.id).join(",");
  useEffect(() => {
    const visible = new Set(ids ? ids.split(",") : []);
    setChosen((before) => {
      const live = [...before].filter((id) => visible.has(id));
      return live.length === before.size ? before : new Set(live);
    });
  }, [ids]);

  function toggle(id: string, range = false) {
    // Worked out here, not inside the updater below. A state updater may be run
    // more than once, or run and thrown away — so it is no place to record what
    // was last touched, and recording it there is why shift-clicking chose two
    // rows instead of the four between them.
    const from = last.current ? items.findIndex((item) => item.id === last.current) : -1;
    const to = items.findIndex((item) => item.id === id);
    last.current = id;

    setChosen((before) => {
      const next = new Set(before);

      // Shift takes everything between this and the last one touched, which is
      // how a run of forty gets chosen without forty clicks.
      if (range && from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from];
        for (let i = start; i <= end; i += 1) next.add(items[i].id);
        return next;
      }

      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    chosen,
    count: chosen.size,
    has: (id: string) => chosen.has(id),
    toggle,
    all: () => setChosen(new Set(items.map((item) => item.id))),
    none: () => setChosen(new Set()),
    /** The chosen ones, in the order they are on screen. */
    picked: () => items.filter((item) => chosen.has(item.id)),
  };
}

/** The tick on a row. */
export function Tick({
  on,
  onChoose,
  label,
}: {
  on: boolean;
  onChoose: (range: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="admin-tick"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      title="Click to choose. Shift-click to choose everything in between."
      onClick={(event) => onChoose(event.shiftKey)}
    >
      {on ? "✓" : ""}
    </button>
  );
}

/**
 * What to do with the ones you chose. Appears only when something is chosen,
 * and says how many — a bulk action with no count is a bulk action you cannot
 * check before you take it.
 */
export function Chosen({
  count,
  what,
  onNone,
  onAll,
  children,
}: {
  count: number;
  /** "photographs", "people" — what is being counted. */
  what: string;
  onNone: () => void;
  onAll: () => void;
  children: React.ReactNode;
}) {
  /*
   * Two halves, and which half a thing is in is the whole point.
   *
   * On the left, what is chosen — the count, and the two words that change it.
   * On the right, what you can do to them. "All" and "none" used to sit on the
   * right, at the far end past the delete bin, which put a harmless thing that
   * changes the *selection* in among the things that change the *photographs*,
   * and pushed the row onto a second line besides.
   */
  return (
    <div className="admin-chosen" role="group" aria-label={`${count} ${what} chosen`}>
      <span className="admin-chosen-count">
        <strong>
          {count} {count === 1 ? what.replace(/s$/, "") : what}
        </strong>
        <button type="button" onClick={onAll}>
          all
        </button>
        <button type="button" onClick={onNone}>
          none
        </button>
      </span>
      <span className="admin-chosen-do">{children}</span>
    </div>
  );
}
