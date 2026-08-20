"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addRow, deleteRow, type RowValues, saveRows } from "@/app/admin/rows-actions";
import { type Column, TABLES, type TableName } from "@/lib/admin/tables";
import { Picker, type Pickable } from "./Pick";
import { Empty, Field, Flag, Icon, Problem, SaveBar, Word, pretty, today } from "./ui";

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
 */

export type Row = RowValues & { id: string };

export default function RowsEditor({
  table,
  initial,
  stories = [],
  photos = [],
  fresh,
}: {
  table: TableName;
  initial: Row[];
  /** For a "which story" column. */
  stories?: { tag: string; title: string }[];
  /** For a "picture" column. */
  photos?: Pickable[];
  /** Values a new row starts with, over the table's own blanks. */
  fresh?: RowValues;
}) {
  const spec = TABLES[table];
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(initial);
  const [kept, setKept] = useState<Row[]>(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [picking, setPicking] = useState<{ id: string; key: string } | null>(null);
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
    // A date column starts on today rather than empty: it is nearly always
    // right, and an empty one is refused.
    const dates = Object.fromEntries(
      spec.columns.filter((column) => column.kind === "date").map((column) => [column.key, today()]),
    );
    const values: RowValues = { ...spec.blank, ...dates, ...fresh };
    if (spec.publishable) values.published = spec.startsShown;

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
    if (!confirm(`Delete ${name ? `“${name}”` : "this"}? There is no undo.`)) return;

    setProblem("");
    start(async () => {
      const result = await deleteRow(table, row.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
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
      const text = String(value ?? "");
      return (
        <textarea
          value={text}
          rows={Math.min(8, Math.max(2, Math.ceil(text.length / 80)))}
          placeholder={column.placeholder}
          onChange={(event) => edit(row.id, column.key, event.target.value)}
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
        <select
          value={String(value ?? "")}
          onChange={(event) => edit(row.id, column.key, event.target.value)}
        >
          {(column.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (column.kind === "story") {
      return (
        <select
          value={String(value ?? "")}
          onChange={(event) => edit(row.id, column.key, event.target.value || null)}
        >
          <option value="">no story in particular</option>
          {stories.map((story) => (
            <option key={story.tag} value={story.tag}>
              {story.title}
            </option>
          ))}
        </select>
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

    return (
      <input
        value={String(value ?? "")}
        placeholder={column.placeholder}
        onChange={(event) => edit(row.id, column.key, event.target.value)}
      />
    );
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <p style={{ margin: "0 0 18px" }}>
        <button type="button" className="admin-btn" onClick={add} disabled={pending}>
          <Icon name="plus" />
          add {spec.one}
        </button>
      </p>

      {rows.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        rows.map((row) => {
          const grid = spec.columns.filter((column) => !column.wide);
          const wide = spec.columns.filter((column) => column.wide);
          const shown = spec.publishable ? row.published !== false : true;

          return (
            <section
              key={row.id}
              className="admin-panel"
              style={shown ? undefined : { borderColor: "var(--hairline)" }}
            >
              <header className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-name">
                    {String(row[spec.title] ?? "").slice(0, 70) || <em>nothing yet</em>}
                  </h2>
                  {"given_on" in row || "happens_on" in row || "published_on" in row ? (
                    <p className="admin-panel-hint">
                      {pretty(
                        String(row.given_on ?? row.happens_on ?? row.published_on ?? ""),
                      )}
                    </p>
                  ) : null}
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {spec.publishable ? (
                    <Flag on={shown} onChange={(next) => edit(row.id, "published", next)} />
                  ) : null}
                  <Word danger onClick={() => remove(row)} disabled={pending}>
                    delete
                  </Word>
                </span>
              </header>

              <div className="admin-fields">
                {grid.map((column) => (
                  <Field key={column.key} label={column.label} hint={column.hint}>
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
