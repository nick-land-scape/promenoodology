"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Empty, Problem, Word, pretty } from "@/components/admin/ui";
import type { ApplicationRow } from "@/lib/supabase/rows";
import { deleteRequest, setRequestState } from "./actions";

/** The four answers a request can be at. */
const STATES: { value: ApplicationRow["state"]; label: string }[] = [
  { value: "new", label: "not answered" },
  { value: "talking", label: "talking" },
  { value: "yes", label: "yes" },
  { value: "no", label: "no" },
];

/** Which line of a request is which, in the order it is worth reading. */
const LINES: { key: keyof ApplicationRow; label: string }[] = [
  { key: "place", label: "where" },
  { key: "when_roughly", label: "when, roughly" },
  { key: "people", label: "how many of them" },
  { key: "cost", label: "what it would cost" },
  { key: "contact", label: "how to reach them" },
];

export default function RequestsInbox({ initial }: { initial: ApplicationRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  function answer(row: ApplicationRow, state: ApplicationRow["state"]) {
    setProblem("");
    setRows((list) => list.map((one) => (one.id === row.id ? { ...one, state } : one)));
    start(async () => {
      const result = await setRequestState(row.id, state);
      if (!result.ok) {
        setProblem(result.error ?? "That did not change.");
        setRows((list) => list.map((one) => (one.id === row.id ? { ...one, state: row.state } : one)));
      } else {
        router.refresh();
      }
    });
  }

  function remove(row: ApplicationRow) {
    if (!confirm("Delete this request? It is gone for good, including how to reach them.")) return;
    setProblem("");
    start(async () => {
      const result = await deleteRequest(row.id);
      if (!result.ok) setProblem(result.error ?? "That did not delete.");
      else {
        setRows((list) => list.filter((one) => one.id !== row.id));
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return <Empty>Nobody has asked for anything yet.</Empty>;
  }

  return (
    <>
      <Problem>{problem}</Problem>

      {rows.map((row) => (
        <section
          key={row.id}
          className="admin-panel"
          style={row.state === "new" ? { borderColor: "var(--purple)" } : undefined}
        >
          <header className="admin-panel-head">
            <div>
              <h2 className="admin-panel-name">{row.what || "no description"}</h2>
              <p className="admin-panel-hint">
                asked {pretty(row.created_at.slice(0, 10))}
              </p>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {STATES.map((state) => (
                <button
                  key={state.value}
                  type="button"
                  className="admin-flag"
                  aria-pressed={row.state === state.value}
                  disabled={pending}
                  onClick={() => answer(row, state.value)}
                >
                  {state.label}
                </button>
              ))}
            </span>
          </header>

          <table className="admin-table" style={{ border: 0 }}>
            <tbody>
              {LINES.map((line) => {
                const value = String(row[line.key] ?? "");
                if (!value) return null;
                return (
                  <tr key={String(line.key)}>
                    <th scope="row" style={{ borderBottom: "1px solid var(--hairline)", width: "10rem" }}>
                      {line.label}
                    </th>
                    <td>
                      {line.key === "contact" && value.includes("@") ? (
                        <a href={`mailto:${value}`}>{value}</a>
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                );
              })}
              {row.about ? (
                <tr>
                  <th scope="row" style={{ width: "10rem" }}>
                    in their words
                  </th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{row.about}</td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <p style={{ margin: "10px 14px 12px" }}>
            <Word danger onClick={() => remove(row)} disabled={pending}>
              delete this request
            </Word>
          </p>
        </section>
      ))}
    </>
  );
}
