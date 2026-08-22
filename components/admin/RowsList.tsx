"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addRow, deleteRow, saveRows } from "@/app/admin/rows-actions";
import { matches } from "@/lib/admin/find";
import { fresh, TABLES, type TableName } from "@/lib/admin/tables";
import Find from "./Find";
import InHead from "./InHead";
import { Bin, Empty, Flag, Icon, Problem, Tag, today } from "./ui";

/**
 * A section as a list of names, with each name a way in to its own page.
 *
 * Every one of these sections used to be every one of its rows, opened at once:
 * forty evenings meant forty panels of fields, a page you scrolled for a minute
 * to reach the one you came for, and a save button that spoke for all of them.
 * It was fine when there were four of anything.
 *
 * So the shape the stories have had all along, made general: a list you can read
 * and search, and one thing at a time to edit. What is on each row is decided by
 * the page above — it knows that an evening has people coming and a note has
 * somebody who wrote it — and everything else here is the same for all of them.
 */

export type Listed = {
  id: string;
  /** The name, as it stands. Empty is allowed and says so. */
  title: string;
  /** The line under the name: a date, a place, whatever is worth knowing. */
  meta: string;
  /** Everything the search should look through, joined up by the page above. */
  hay: string;
  published: boolean;
  /** Held at the top, for the tables that have such a thing. */
  pinned?: boolean;
  /** A word set beside the switches — "over" for an evening that has been. */
  note?: string;
};

export default function RowsList({
  table,
  initial,
  at,
  what,
  untitled,
}: {
  table: TableName;
  initial: Listed[];
  /** Where this section lives, so a row knows its own address. */
  at: string;
  /** "an evening", for the search field. */
  what: string;
  /** What a row with no name is called in the list. */
  untitled: string;
}) {
  const spec = TABLES[table];
  const router = useRouter();

  const [rows, setRows] = useState(initial);
  const [looking, setLooking] = useState("");
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  const found = useMemo(
    () => rows.filter((row) => matches(row.hay, looking)),
    [rows, looking],
  );

  /**
   * A new one is made straight away and opened, rather than appearing at the top
   * of the list as an empty panel to fill in.
   *
   * It is how a new story has always worked, and it is the honest order of
   * events: you are not adding a row to a list, you are starting something, and
   * the place to start it is its own page. Nothing outside sees it until it is
   * turned on — see startsShown in the table's description.
   */
  function add() {
    setProblem("");
    start(async () => {
      const result = await addRow(table, fresh(table, today()));
      if (!result.ok || !result.id) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      router.push(`${at}/${result.id}`);
    });
  }

  function show(row: Listed, published: boolean) {
    setProblem("");
    setRows((list) => list.map((one) => (one.id === row.id ? { ...one, published } : one)));
    start(async () => {
      const result = await saveRows(table, [{ id: row.id, published }]);
      if (!result.ok) {
        setProblem(result.error ?? "That did not change.");
        setRows((list) =>
          list.map((one) => (one.id === row.id ? { ...one, published: !published } : one)),
        );
      } else {
        router.refresh();
      }
    });
  }

  /** One of them at the top, and only one — the save enforces the same rule. */
  function hold(row: Listed, on: boolean) {
    if (!spec.pinned) return;
    const before = rows;
    setProblem("");
    setRows((list) =>
      list
        .map((one) => {
          if (one.id === row.id) return { ...one, pinned: on };
          // Pinning one lets go of whichever was held before it.
          return on ? { ...one, pinned: false } : one;
        })
        // The one at the top goes to the top, here as well as in the app —
        // otherwise it says "at the top" from the middle of the list.
        .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false)),
    );
    start(async () => {
      const result = await saveRows(table, [{ id: row.id, [spec.pinned as string]: on }]);
      if (!result.ok) {
        setProblem(result.error ?? "That did not change.");
        setRows(before);
      } else {
        router.refresh();
      }
    });
  }

  function remove(row: Listed) {
    const name = row.title || untitled;
    if (!confirm(`Delete “${name}”? It goes to the bin for thirty days.`)) return;

    setProblem("");
    start(async () => {
      const result = await deleteRow(table, row.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      router.refresh();
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      {/* Beside the page's title, where every other section's one action is. */}
      <InHead>
        <button type="button" className="admin-btn" onClick={add} disabled={pending}>
          <Icon name="plus" />
          add {spec.one}
        </button>
      </InHead>

      {rows.length === 0 ? (
        <Empty>Nothing here yet.</Empty>
      ) : (
        <>
          {/* Not over a list short enough to read: a field for finding things
              among six of them is a field that only says the list is long. */}
          {rows.length > 5 ? (
            <Find
              value={looking}
              onChange={setLooking}
              what={what}
              showing={found.length}
              total={rows.length}
            />
          ) : null}

          {found.length === 0 ? (
            <Empty>Nothing here matches that. Clearing the field brings them all back.</Empty>
          ) : (
            <ul className="admin-rows">
              {found.map((row) => (
                <li
                  key={row.id}
                  className={["admin-row", row.published ? "" : "admin-row-hidden"]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="admin-row-main">
                    <Link href={`${at}/${row.id}`} className="admin-row-name">
                      {row.title || untitled}
                    </Link>
                    <span className="admin-row-meta">{row.meta || "nothing filled in yet"}</span>
                  </span>

                  <span className="admin-row-side">
                    {row.note ? <Tag>{row.note}</Tag> : null}

                    {spec.pinned ? (
                      <button
                        type="button"
                        className="admin-flag"
                        aria-pressed={row.pinned === true}
                        disabled={pending}
                        title={
                          row.pinned
                            ? "Held at the top of the app's front screen"
                            : "Hold this one at the top, in place of whichever is there now"
                        }
                        onClick={() => hold(row, !row.pinned)}
                      >
                        <Icon name="pin" />
                        {row.pinned ? "at the top" : "pin it"}
                      </button>
                    ) : null}

                    <Flag on={row.published} onChange={(next) => show(row, next)} />

                    <Link href={`${at}/${row.id}`} className="admin-btn">
                      edit →
                    </Link>

                    <Bin
                      what={row.title || untitled}
                      onClick={() => remove(row)}
                      disabled={pending}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
