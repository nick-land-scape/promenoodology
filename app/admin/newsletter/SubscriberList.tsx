"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Empty, Problem, Word, pretty } from "@/components/admin/ui";
import type { NewsletterRow } from "@/lib/supabase/rows";
import { removeSubscriber } from "./actions";

/**
 * The list, and one honest way of getting it out: all the addresses in a box you
 * can copy from. No file to download and no export to configure — a newsletter
 * is sent from somewhere else, and this is the shape that somewhere else wants.
 */
export default function SubscriberList({ initial }: { initial: NewsletterRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [problem, setProblem] = useState("");
  const [copying, setCopying] = useState(false);
  const [pending, start] = useTransition();

  const addresses = rows.map((row) => row.email).join(", ");

  function remove(row: NewsletterRow) {
    if (!confirm(`Take ${row.email} off the list?`)) return;
    setProblem("");
    start(async () => {
      const result = await removeSubscriber(row.id);
      if (!result.ok) setProblem(result.error ?? "That did not work.");
      else {
        setRows((list) => list.filter((one) => one.id !== row.id));
        router.refresh();
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(addresses);
      setCopying(true);
      setTimeout(() => setCopying(false), 2500);
    } catch {
      setProblem("This browser would not let us copy. Select the box below instead.");
    }
  }

  if (rows.length === 0) {
    return <Empty>Nobody on the list yet.</Empty>;
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <p style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px" }}>
        <button type="button" className="admin-btn" onClick={copy}>
          copy all {rows.length} addresses
        </button>
        {copying ? <span className="admin-ok">copied ✓</span> : null}
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>address</th>
            <th>name</th>
            <th>since</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <a href={`mailto:${row.email}`}>{row.email}</a>
              </td>
              <td className="admin-table-quiet">{row.name || "—"}</td>
              <td className="admin-table-quiet">{pretty(row.created_at.slice(0, 10))}</td>
              <td>
                <Word danger onClick={() => remove(row)} disabled={pending}>
                  take off
                </Word>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-panel" style={{ marginTop: 22 }}>
        <header className="admin-panel-head">
          <div>
            <h2 className="admin-panel-name">all of them, to paste somewhere</h2>
            <p className="admin-panel-hint">
              Put these in the <em>bcc</em> line, never the <em>to</em> line — otherwise everybody on
              the list gets everybody else&rsquo;s address.
            </p>
          </div>
        </header>
        <div className="admin-fields">
          <label className="admin-field admin-field-wide">
            <span>addresses</span>
            <textarea readOnly rows={4} value={addresses} onFocus={(event) => event.target.select()} />
          </label>
        </div>
      </div>
    </>
  );
}
