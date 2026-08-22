"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Find from "@/components/admin/Find";
import {
  Bin,
  Empty,
  Flag,
  Grip,
  Place,
  Problem,
  Copy,
  Tag,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { hay, matches } from "@/lib/admin/find";
import { deleteLeaf, duplicateLeaf, reorderLeaves, showLeaf } from "./actions";

export type LeafRow = {
  id: string;
  title: string;
  /** The first words on it, so a page with no heading is still recognisable. */
  opening: string;
  words: number;
  published: boolean;
};

/**
 * The book, as a list of its pages.
 *
 * The order is the whole point of a book, so it is dragged and kept exactly as
 * the stories' order is — and while you are searching it is put away, because a
 * number that says "page 7 of 24" over a list with sixteen of them hidden is a
 * number that is lying.
 */
export default function LeafList({ initial }: { initial: LeafRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [reordered, setReordered] = useState(false);
  const [looking, setLooking] = useState("");
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  const searching = looking.trim().length > 0;
  const found = useMemo(
    () => rows.filter((row) => matches(hay(row.title, row.opening), looking)),
    [rows, looking],
  );

  function move(from: number, to: number) {
    const next = moved(rows, from, to);
    if (next === rows) return;
    setRows(next);
    setReordered(true);
    setProblem("");
  }

  const { dropProps, handleProps, stateOf } = useDragOrder(rows, move);

  function keepOrder() {
    setProblem("");
    start(async () => {
      const result = await reorderLeaves(rows.map((row) => row.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setReordered(false);
    });
  }

  function show(row: LeafRow, published: boolean) {
    setProblem("");
    setRows((list) => list.map((one) => (one.id === row.id ? { ...one, published } : one)));
    start(async () => {
      const result = await showLeaf(row.id, published);
      if (!result.ok) {
        setProblem(result.error ?? "That did not change.");
        setRows((list) =>
          list.map((one) => (one.id === row.id ? { ...one, published: !published } : one)),
        );
      }
    });
  }

  /** The same page again, directly after it. */
  function copy(row: LeafRow) {
    setProblem("");
    start(async () => {
      const result = await duplicateLeaf(row.id);
      if (!result.ok || !result.id) {
        setProblem(result.error ?? "That did not copy.");
        return;
      }
      router.push(`/admin/handbook/${result.id}`);
    });
  }

  function remove(row: LeafRow) {
    if (!confirm(`Delete “${row.title || row.opening || "this page"}”? It goes to the bin for thirty days.`)) {
      return;
    }
    setProblem("");
    start(async () => {
      const result = await deleteLeaf(row.id);
      if (!result.ok) setProblem(result.error ?? "That did not delete.");
      else {
        setRows((list) => list.filter((one) => one.id !== row.id));
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return <Empty>No pages yet. “New page” starts the book.</Empty>;
  }

  return (
    <>
      <Problem>{problem}</Problem>

      {reordered ? (
        <div className="admin-save" style={{ position: "static", marginTop: 0, marginBottom: 16 }}>
          <button type="button" className="admin-btn" onClick={keepOrder} disabled={pending}>
            {pending ? "saving…" : "keep this order"}
          </button>
          <button
            type="button"
            className="admin-word"
            onClick={() => {
              setRows(initial);
              setReordered(false);
            }}
          >
            put it back
          </button>
        </div>
      ) : null}

      {rows.length > 5 ? (
        <Find
          value={looking}
          onChange={setLooking}
          what="a page"
          showing={found.length}
          total={rows.length}
        />
      ) : null}

      {searching ? (
        <p className="admin-note" style={{ marginBottom: 12 }}>
          The order is put away while you are looking for something — clear the field to drag the
          pages about again.
        </p>
      ) : null}

      {found.length === 0 ? (
        <Empty>Nothing here matches that. Clearing the field brings them all back.</Empty>
      ) : null}

      <ul className="admin-rows">
        {found.map((row) => {
          const index = rows.indexOf(row);
          return (
            <li
              key={row.id}
              {...(searching ? {} : dropProps(row, index))}
              className={[
                "admin-row",
                searching ? "" : stateOf(row),
                row.published ? "" : "admin-row-hidden",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {searching ? null : (
                <>
                  <Grip {...handleProps(row)} />
                  <Place index={index} total={rows.length} onMove={move} />
                </>
              )}

              <span className="admin-row-main">
                <Link
                  href={`/admin/handbook/${row.id}`}
                  className="admin-row-name"
                  style={{ fontStyle: "normal" }}
                >
                  {row.title || "no heading"}
                </Link>
                <span className="admin-row-meta">
                  {row.opening || "a heading and nothing under it yet"}
                </span>
              </span>

              <span className="admin-row-side">
                <Tag>
                  {row.words} word{row.words === 1 ? "" : "s"}
                </Tag>
                <Flag on={row.published} onChange={(next) => show(row, next)} />
                <Link href={`/admin/handbook/${row.id}`} className="admin-btn">
                  edit page →
                </Link>
                <Copy
                  what={row.title || "this page"}
                  onClick={() => copy(row)}
                  disabled={pending}
                />
                <Bin
                  what={row.title || "this page"}
                  onClick={() => remove(row)}
                  disabled={pending}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <p className="admin-note" style={{ marginTop: 16 }}>
        A hidden page is not in the book at all, and the pages after it move up. The heading, the line under it and how it is
        shown are in the panel above.
      </p>
    </>
  );
}
