"use client";

import InHead from "./InHead";
import Dropdown from "./Picker";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addRow, deleteRow, type RowValues, saveRows } from "@/app/admin/rows-actions";
import { type Column, fresh, TABLES, type TableName } from "@/lib/admin/tables";
import { Picker, type Pickable } from "./Pick";
import { Some } from "./Many";
import When from "./When";
import type { Choice } from "./Picker";
import Placed from "./Placed";
import { Bin, Empty, Field, Flag, Icon, Problem, SaveBar, Word, pretty, today } from "./ui";

/**
 * One editor for the four tables that are lists: quotes, news, the wall, and
 * what is on in the app.
 *
 * What each of them is made of is written down in lib/admin/tables.ts, so this
 * file knows nothing about quotes or evenings in particular — which is the
 * point: the four sections behave identically, and a new list needs a
 * description rather than another editor.
 *
 * Everything is edited in place and written when you say so. Changes are worked
 * out by comparing what is on screen with what came from the database, so only
 * the rows that actually moved are sent.
 *
 * It draws whatever rows it is handed, which is now one of two things: all of
 * them — quotes and the wall, which are short and read as a page of one-liners —
 * or exactly one, on a page of its own reached from a list of names. See
 * `alone`.
 */

export type Row = RowValues & { id: string };

export default function RowsEditor({
  table,
  initial,
  stories = [],
  photos = [],
  coming = {},
  people = [],
  partners = [],
  told = [],
  begins,
  alone,
}: {
  table: TableName;
  initial: Row[];
  /** For a "which story" column. */
  stories?: { tag: string; title: string }[];
  /** For a "picture" column. */
  photos?: Pickable[];
  /** How many people have asked to come, by row id. Only evenings have these. */
  coming?: Record<string, number>;
  /** For a "written by" column. */
  people?: Choice[];
  /** For a "with" column. */
  partners?: Choice[];
  /** For a "what came of it" column: the stories, by id. */
  told?: { id: string; title: string }[];
  /** Values a new row starts with, over the table's own blanks. */
  begins?: RowValues;
  /**
   * One row, on its own page: where the list it came from is.
   *
   * With it there is no "add" — you arrived here from the place that adds
   * things — and deleting the row goes back there, because there is nothing
   * left on this page to stay for.
   */
  alone?: string;
}) {
  const spec = TABLES[table];
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(initial);
  const [kept, setKept] = useState<Row[]>(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [picking, setPicking] = useState<{ id: string; key: string } | null>(null);

  /*
   * Which language you are typing in, where this table has another one.
   *
   * One toggle rather than two of every field: the field stays where it is and
   * changes what it is holding, with the English showing through as the
   * placeholder — which is what the site does with it when the French is empty.
   */
  const [saying, setSaying] = useState<"en" | "fr">("en");
  const inFrench = Boolean(spec.translates) && saying === "fr";
  const [pending, start] = useTransition();

  const changed = useMemo(() => {
    const before = new Map(kept.map((row) => [row.id, row]));
    return rows.filter((row) => {
      const was = before.get(row.id);
      if (!was) return false;
      return JSON.stringify(was) !== JSON.stringify(row);
    });
  }, [rows, kept]);

  function edit(id: string, key: string, value: RowValues[string]) {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
    setJustSaved(false);
  }

  /** The French of one field, kept beside the English in the row's own `fr`. */
  function editFrench(row: Row, key: string, value: string) {
    const had = (row.fr && typeof row.fr === "object" ? row.fr : {}) as Record<string, string>;
    edit(row.id, "fr", { ...had, [key]: value } as unknown as RowValues[string]);
  }

  /** What is in a field, and where what you type into it goes. */
  function saying_(row: Row, key: string) {
    const english = String(row[key] ?? "");
    const translated = Boolean(spec.translates?.includes(key));
    if (!inFrench || !translated) {
      return {
        value: english,
        said: (next: string) => edit(row.id, key, next),
        placeholder: undefined as string | undefined,
        lang: undefined as string | undefined,
      };
    }
    const had = (row.fr && typeof row.fr === "object" ? row.fr : {}) as Record<string, string>;
    return {
      value: had[key] ?? "",
      said: (next: string) => editFrench(row, key, next),
      placeholder: english,
      lang: "fr",
    };
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveRows(table, changed);
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(rows);
        setJustSaved(true);
        router.refresh();
      }
    });
  }

  function add() {
    setProblem("");
    // What a new row is made of lives with the description of the table, so the
    // list that makes one and the editor that makes one make the same thing.
    const values: RowValues = fresh(table, today(), begins);

    start(async () => {
      const result = await addRow(table, values);
      if (!result.ok || !result.id) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      const row: Row = { ...values, id: result.id };
      setRows((list) => [row, ...list]);
      setKept((list) => [row, ...list]);
      router.refresh();
    });
  }

  function remove(row: Row) {
    const name = String(row[spec.title] ?? "").slice(0, 60);
    if (!confirm(`Delete ${name ? `“${name}”` : "this"}? It goes to the bin for thirty days.`)) return;

    setProblem("");
    start(async () => {
      const result = await deleteRow(table, row.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      if (alone) {
        // Nothing left here to look at.
        router.push(alone);
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      setKept((list) => list.filter((one) => one.id !== row.id));
      router.refresh();
    });
  }

  const photoUrl = (path: unknown) =>
    photos.find((photo) => photo.path === path)?.url ?? "";

  function cell(row: Row, column: Column) {
    const value = row[column.key];

    if (column.kind === "long") {
      const now = saying_(row, column.key);
      return (
        <textarea
          value={now.value}
          rows={Math.min(8, Math.max(2, Math.ceil(now.value.length / 80)))}
          placeholder={now.placeholder ?? column.placeholder}
          lang={now.lang}
          onChange={(event) => now.said(event.target.value)}
        />
      );
    }

    if (column.kind === "date") {
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(event) => edit(row.id, column.key, event.target.value)}
        />
      );
    }

    if (column.kind === "when") {
      /* A day and an hour together, behind a calendar of our own — the one place
         the browser's control genuinely cannot help, because it has no idea the
         two belong to each other. */
      const hour = column.time ?? column.key;
      // The end of something may not be before its beginning, and the calendar
      // says so by refusing the squares rather than by complaining afterwards.
      const beginning = spec.columns.find((one) => one.kind === "when" && one !== column);
      return (
        <When
          label={column.label}
          date={String(value ?? "")}
          time={String(row[hour] ?? "")}
          notBefore={
            beginning && spec.columns.indexOf(beginning) < spec.columns.indexOf(column)
              ? String(row[beginning.key] ?? "") || undefined
              : undefined
          }
          onChange={(day, at) => {
            edit(row.id, column.key, day);
            edit(row.id, hour, at);
          }}
          empty={column.hint ? "not set" : "choose a day"}
        />
      );
    }

    /* A stretch, in one field. Two native controls side by side rather than a
       calendar of our own: the browser's gives a phone a wheel, a laptop a
       proper calendar, and everybody the date format their machine is set to,
       and anything hand-built here would be a worse version of all three. */
    /* Two numbers and a way of finding them. */
    if (column.kind === "where") {
      const other = column.until ?? "lng";
      return (
        <Placed
          lat={row[column.key] as number | null}
          lng={row[other] as number | null}
          near={String(row.place ?? row.title ?? "")}
          onPlace={(lat, lng) => {
            // Two columns, one act: a pin is both numbers or neither.
            edit(row.id, column.key, lat);
            edit(row.id, other, lng);
          }}
        />
      );
    }

    if (column.kind === "dates" || column.kind === "times") {
      const type = column.kind === "dates" ? "date" : "time";
      const far = column.until ?? column.key;
      return (
        <span className="admin-range">
          <input
            type={type}
            value={String(value ?? "")}
            aria-label={`${column.label} — from`}
            onChange={(event) => edit(row.id, column.key, event.target.value)}
          />
          <span aria-hidden="true">→</span>
          <input
            type={type}
            value={String(row[far] ?? "")}
            aria-label={`${column.label} — until`}
            // Not before the beginning, where the browser can say so itself.
            min={type === "date" ? String(value ?? "") || undefined : undefined}
            onChange={(event) => edit(row.id, far, event.target.value)}
          />
        </span>
      );
    }

    if (column.kind === "people" || column.kind === "partners") {
      const options = column.kind === "people" ? people : partners;
      const chosen = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Some
          value={chosen}
          onChange={(next) => edit(row.id, column.key, next)}
          options={options}
          add={column.kind === "people" ? "add somebody" : "add a partner"}
          empty={column.kind === "people" ? "nobody yet" : "nobody yet"}
        />
      );
    }

    if (column.kind === "time") {
      /* The browser's own time control, and deliberately so: it gives a phone a
         wheel, a laptop a pair of spinners, and everybody the 24-hour clock
         their machine is set to. Anything hand-built here would be a worse
         version of all three. */
      return (
        <input
          type="time"
          value={String(value ?? "")}
          onChange={(event) => edit(row.id, column.key, event.target.value)}
        />
      );
    }

    if (column.kind === "number") {
      return (
        <input
          type="number"
          min={0}
          value={Number(value ?? 0)}
          onChange={(event) => edit(row.id, column.key, Number(event.target.value))}
        />
      );
    }

    if (column.kind === "choice") {
      return (
        <Dropdown
          value={String(value ?? "")}
          onChange={(next) => edit(row.id, column.key, next)}
          options={(column.options ?? []).map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          empty={null}
          label={column.label}
        />
      );
    }

    if (column.kind === "storyref") {
      return (
        <Dropdown
          value={String(value ?? "")}
          onChange={(next) => edit(row.id, column.key, next || null)}
          options={told.map((one) => ({ value: one.id, label: one.title }))}
          empty="nothing written yet"
          search={told.length > 8}
          label={column.label}
        />
      );
    }

    if (column.kind === "story") {
      return (
        <Dropdown
          value={String(value ?? "")}
          onChange={(next) => edit(row.id, column.key, next || null)}
          options={stories.map((story) => ({ value: story.tag, label: story.title }))}
          empty="no story in particular"
          search={stories.length > 8}
          label={column.label}
        />
      );
    }

    if (column.kind === "photo") {
      const url = photoUrl(value);
      return (
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-thumb">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" />
            ) : (
              "none"
            )}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
            <Word onClick={() => setPicking({ id: row.id, key: column.key })}>
              {url ? "change it" : "choose one"}
            </Word>
            {value ? (
              <Word danger onClick={() => edit(row.id, column.key, null)}>
                take it off
              </Word>
            ) : null}
          </span>
        </span>
      );
    }

    const now = saying_(row, column.key);
    return (
      <input
        value={now.value}
        placeholder={now.placeholder ?? column.placeholder}
        lang={now.lang}
        onChange={(event) => now.said(event.target.value)}
      />
    );
  }

  return (
    <>
      <Problem>{problem}</Problem>

      {/* Beside the page's title, where every other section's one action is.
          It sat above the list, which put the way to make something in the
          same place as the first of the things already made. */}
      <InHead>
        {spec.translates ? (
          <span className="admin-saying">
            {(["en", "fr"] as const).map((one) => (
              <button
                key={one}
                type="button"
                className="admin-flag"
                aria-pressed={saying === one}
                onClick={() => setSaying(one)}
                title={
                  one === "en"
                    ? "The words the site is written in"
                    : "The French. Anything left empty shows the English instead."
                }
              >
                {one === "en" ? "English" : "Français"}
              </button>
            ))}
          </span>
        ) : null}
        {alone ? null : (
          <button type="button" className="admin-btn" onClick={add} disabled={pending}>
            <Icon name="plus" />
            add {spec.one}
          </button>
        )}
      </InHead>

      {rows.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        rows.map((row) => {
          const picture = spec.columns.find((column) => column.kind === "photo");
          const inTheHead = new Set([spec.title, picture?.key].filter(Boolean) as string[]);
          const grid = spec.columns.filter((column) => !column.wide && !inTheHead.has(column.key));
          const wide = spec.columns.filter((column) => column.wide && !inTheHead.has(column.key));
          const shown = spec.publishable ? row.published !== false : true;

          return (
            <section
              key={row.id}
              className="admin-panel"
              style={shown ? undefined : { borderColor: "var(--hairline)" }}
            >
              {/*
               * The heading is the name, and typing in it changes the name.
               *
               * It used to be a heading *and*, separately, a field further down
               * the grid — a name you could not change with the one you could
               * hidden underneath it. Reported as "why is it not possible to
               * change the event name", which is exactly how it read.
               *
               * The picture sits beside it for the same reason: it is what the
               * row *is*, not one of its details, and clicking a picture is how
               * anybody changes a picture.
               */}
              <header className="admin-panel-head admin-rowhead">
                {picture ? (
                  <span className="admin-rowhead-photo">
                    <button
                      type="button"
                      className="admin-logo"
                      onClick={() => setPicking({ id: row.id, key: picture.key })}
                      title={photoUrl(row[picture.key]) ? "Choose another picture" : "Choose a picture from the archive"}
                    >
                      {photoUrl(row[picture.key]) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl(row[picture.key]) as string} alt="" draggable={false} />
                      ) : (
                        <span className="admin-logo-none">no picture</span>
                      )}
                      <em>{photoUrl(row[picture.key]) ? "replace" : "choose one"}</em>
                    </button>
                    {row[picture.key] ? (
                      <Bin
                        what="this picture"
                        onClick={() => edit(row.id, picture.key, null)}
                      />
                    ) : null}
                  </span>
                ) : null}

                <div className="admin-rowhead-name">
                  <input
                    className="admin-rowhead-input"
                    value={saying_(row, spec.title).value}
                    placeholder={
                      saying_(row, spec.title).placeholder ??
                      spec.columns.find((c) => c.key === spec.title)?.placeholder ??
                      "a name"
                    }
                    lang={saying_(row, spec.title).lang}
                    aria-label={spec.columns.find((c) => c.key === spec.title)?.label ?? "name"}
                    onChange={(event) => saying_(row, spec.title).said(event.target.value)}
                  />
                  <p className="admin-panel-hint">
                    {[
                      "given_on" in row || "happens_on" in row || "published_on" in row
                        ? pretty(String(row.given_on ?? row.happens_on ?? row.published_on ?? ""))
                        : null,
                      // Only evenings have anybody coming.
                      coming[row.id]
                        ? `${coming[row.id]} asked to come${
                            Number(row.spots) > 0 ? ` of ${Number(row.spots)}` : ""
                          }`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "\u00a0"}
                  </p>
                </div>

                <span className="admin-rowhead-does">
                  {/* One of them at the top, and only one: pressing this on a
                      second row takes it off the first, which the save enforces
                      as well so the two can never disagree. */}
                  {spec.pinned ? (
                    <button
                      type="button"
                      className="admin-flag"
                      aria-pressed={row[spec.pinned] === true}
                      title={
                        row[spec.pinned] === true
                          ? "Held at the top of the app's front screen"
                          : "Hold this one at the top, in place of whichever is there now"
                      }
                      onClick={() => {
                        const on = row[spec.pinned as string] !== true;
                        setRows((list) =>
                          list.map((one) => ({
                            ...one,
                            [spec.pinned as string]: on ? one.id === row.id : false,
                          })),
                        );
                        setJustSaved(false);
                      }}
                    >
                      <Icon name="pin" />
                      {row[spec.pinned] === true ? "at the top" : "pin it"}
                    </button>
                  ) : null}
                  {spec.publishable ? (
                    <Flag on={shown} onChange={(next) => edit(row.id, "published", next)} />
                  ) : null}
                  <Bin
                    what={String(row[spec.title] ?? "") || `this ${spec.one.replace(/^an? /, "")}`}
                    onClick={() => remove(row)}
                    disabled={pending}
                  />
                </span>
              </header>

              <div className="admin-fields">
                {grid.map((column) => (
                  <Field
                    key={column.key}
                    label={column.label}
                    hint={column.hint}
                    /* A stretch needs two controls' worth of room; in one
                       column the browser clips its own date format. */
                    two={column.kind === "dates" || column.kind === "times"}
                    /* A "when" is one control and fits one column. Spanning two
                       in a three-column grid left the next field alone on a row
                       with nothing under it. */
                  >
                    {cell(row, column)}
                  </Field>
                ))}
              </div>
              {wide.map((column) => (
                <div key={column.key} className="admin-fields">
                  <Field label={column.label} hint={column.hint} wide>
                    {cell(row, column)}
                  </Field>
                </div>
              ))}
            </section>
          );
        })
      )}

      {rows.length > 0 ? (
        <SaveBar
          onSave={save}
          pending={pending}
          dirty={changed.length > 0}
          saved={justSaved}
          label={changed.length > 1 ? `keep ${changed.length} changes` : "keep the change"}
        />
      ) : null}

      {picking ? (
        <Picker
          photos={photos}
          onClose={() => setPicking(null)}
          onPick={(photo) => edit(picking.id, picking.key, photo.path)}
        />
      ) : null}
    </>
  );
}
