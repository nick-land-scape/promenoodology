"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Thumb from "@/components/admin/Thumb";
import { Bin, Button, Empty, Icon, Problem, Word, pretty } from "@/components/admin/ui";
import { DAYS_IN_THE_BIN, daysLeft } from "@/lib/admin/bin";
import { destroy, emptyTheBin, unbin } from "@/app/admin/bin-actions";

export type Binned = {
  table: string;
  section: string;
  href: string;
  one: string;
  id: string;
  deletedAt: string;
  name: string;
  meta: string;
  picture: string | null;
};

/**
 * The bin, grouped by where things came from.
 *
 * Sorted with the least time left first, which is the only order that matters
 * here: what is about to be lost should be at the top, not whatever was deleted
 * most recently.
 */
export default function TheBin({ binned, only }: { binned: Binned[]; only: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(binned);
  /* Which section is being looked at. State rather than the address, so pressing
     one is instant — the link from a section's heading sets the first value and
     then this takes over. */
  const [showing, setShowing] = useState(only);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");
  const [pending, start] = useTransition();

  const shown = useMemo(
    () =>
      rows
        .filter((row) => (showing ? row.table === showing : true))
        .sort((a, b) => daysLeft(a.deletedAt) - daysLeft(b.deletedAt)),
    [rows, showing],
  );

  /* What is actually in the bin, to filter by. Only sections with something in
     them are offered: a filter that can only ever return nothing is a button
     that lies about there being something behind it. */
  const kinds = useMemo(() => {
    const counted = new Map<string, { section: string; count: number }>();
    for (const row of rows) {
      const had = counted.get(row.table);
      counted.set(row.table, { section: row.section, count: (had?.count ?? 0) + 1 });
    }
    return [...counted.entries()].sort((a, b) => a[1].section.localeCompare(b[1].section));
  }, [rows]);

  const sections = useMemo(() => {
    const out = new Map<string, Binned[]>();
    for (const row of shown) {
      const list = out.get(row.section) ?? [];
      list.push(row);
      out.set(row.section, list);
    }
    return [...out.entries()];
  }, [shown]);

  function put(row: Binned) {
    setProblem("");
    setSaid("");
    start(async () => {
      const result = await unbin(row.table, row.id);
      if (!result.ok) {
        setProblem(result.error ?? "It would not go back.");
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      setSaid(`${row.name || row.one} is back where it was.`);
      router.refresh();
    });
  }

  function forGood(row: Binned) {
    if (
      !confirm(
        `Delete ${row.name ? `“${row.name}”` : row.one} for good? ${
          row.picture ? "The file goes with it. " : ""
        }This one really has no undo.`,
      )
    ) {
      return;
    }
    setProblem("");
    setSaid("");
    start(async () => {
      const result = await destroy(row.table, row.id);
      if (!result.ok) {
        setProblem(result.error ?? "It would not delete.");
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      router.refresh();
    });
  }

  function sweep() {
    const due = rows.filter((row) => daysLeft(row.deletedAt) === 0);
    if (due.length === 0) return;
    if (!confirm(`Empty ${due.length} whose thirty days are up? There is no undo for those.`)) {
      return;
    }
    setProblem("");
    start(async () => {
      const result = await emptyTheBin();
      if (!result.ok) {
        setProblem(result.error ?? "The bin would not empty.");
        return;
      }
      setRows((list) => list.filter((row) => daysLeft(row.deletedAt) > 0));
      setSaid(`${result.gone ?? 0} gone for good.`);
      router.refresh();
    });
  }

  const overdue = rows.filter((row) => daysLeft(row.deletedAt) === 0).length;

  if (rows.length === 0) {
    return <Empty>The bin is empty. Nothing has been deleted in the last thirty days.</Empty>;
  }

  return (
    <>
      <Problem>{problem}</Problem>
      {said ? (
        <p className="admin-ok" style={{ display: "block", marginBottom: 14 }}>
          {said}
        </p>
      ) : null}

      {kinds.length > 1 ? (
        <div className="admin-sift" role="group" aria-label="Which section to show">
          <button
            type="button"
            aria-pressed={showing === ""}
            onClick={() => setShowing("")}
          >
            everything <em>{rows.length}</em>
          </button>
          {kinds.map(([table, { section, count }]) => (
            <button
              key={table}
              type="button"
              aria-pressed={showing === table}
              onClick={() => setShowing(showing === table ? "" : table)}
            >
              {section} <em>{count}</em>
            </button>
          ))}
        </div>
      ) : null}

      {overdue > 0 ? (
        <div className="admin-panel" style={{ borderColor: "var(--pink)" }}>
          <div className="admin-panel-body" style={{ padding: "12px 14px" }}>
            <p style={{ margin: "0 0 10px" }}>
              {overdue} {overdue === 1 ? "thing has" : "things have"} run out of days. The nightly
              job takes them; this button does it now.
            </p>
            <Button tone="danger" onClick={sweep} disabled={pending}>
              <Icon name="trash" />
              empty {overdue === 1 ? "it" : "them"}
            </Button>
          </div>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <Empty>Nothing from that section is in the bin.</Empty>
      ) : null}

      {sections.map(([section, things]) => (
        <div className="admin-part" key={section}>
          <header className="admin-part-head">
            <h2>{section}</h2>
            <p>
              {things.length} {things.length === 1 ? "thing" : "things"} —{" "}
              <Link href={things[0].href}>back to {section} →</Link>
            </p>
          </header>

          <ul className="admin-rows">
            {things.map((row) => {
              const left = daysLeft(row.deletedAt);
              return (
                <li key={`${row.table}-${row.id}`} className="admin-row">
                  {row.picture ? (
                    <span className="admin-thumb" style={{ width: 62, height: 46, flex: "none" }}>
                      <Thumb src={row.picture} width={0} height={0} sizes="80px" eager />
                    </span>
                  ) : null}

                  <span className="admin-row-main">
                    <span className="admin-row-name" style={{ fontStyle: "normal" }}>
                      {row.name || <em>{row.one}, unnamed</em>}
                    </span>
                    <span className="admin-row-meta">
                      {[row.meta, `deleted ${pretty(row.deletedAt)}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  <span className="admin-row-side">
                    {/* How long it has, said in days rather than a date: "four
                        days" is a thing anybody can act on, and 20 September is
                        a thing to work out. */}
                    <span className={left <= 3 ? "admin-left admin-left-soon" : "admin-left"}>
                      {left === 0
                        ? "out of days"
                        : `${left} ${left === 1 ? "day" : "days"} left of ${DAYS_IN_THE_BIN}`}
                    </span>
                    <Word onClick={() => put(row)} disabled={pending}>
                      put it back
                    </Word>
                    <Bin
                      what={`${row.name || row.one} for good`}
                      onClick={() => forGood(row)}
                      disabled={pending}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
