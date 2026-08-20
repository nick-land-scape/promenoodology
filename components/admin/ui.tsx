"use client";

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
  up: "M12 19V5M6 11l6-6 6 6",
  upload: "M12 16V4m0 0 4 4m-4-4-4 4M4 20h16",
  trash: "M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7L18 7",
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
  wide?: boolean;
  children: React.ReactNode;
};

/** A labelled cell in a grid of fields. */
export function Field({ label, hint, wide, children }: FieldProps) {
  return (
    <label className={wide ? "admin-field admin-field-wide" : "admin-field"}>
      <span>{label}</span>
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
  return (
    <button
      type="button"
      className="admin-flag"
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
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

/** 12 August 2026, or the raw thing if it is not a date. */
export function pretty(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Today, as the date inputs want it. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}
