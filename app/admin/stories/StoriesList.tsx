"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bin,
  Empty,
  Flag,
  Grip,
  Place,
  Problem,
  Tag,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { deleteStory, reorderStories, showStory } from "./actions";

export type StoryRow = {
  id: string;
  slug: string;
  title: string;
  tag: string;
  place: string;
  happened: string;
  published: boolean;
  photos: number;
};

/**
 * The stories, in the order visitors read them.
 *
 * The order is dragged, or typed into the number, and is only written when you
 * say so — dragging a row is a decision in progress, not five saves. The pair of
 * arrows that used to sit in every row is gone: with seven stories it was a
 * third way to do the same thing, and with sixty photographs it was never the
 * way anybody would choose.
 */
export default function StoriesList({ initial }: { initial: StoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [reordered, setReordered] = useState(false);
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

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
      const result = await reorderStories(rows.map((row) => row.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setReordered(false);
    });
  }

  function show(row: StoryRow, published: boolean) {
    setProblem("");
    setRows((list) => list.map((one) => (one.id === row.id ? { ...one, published } : one)));
    start(async () => {
      const result = await showStory(row.id, published);
      if (!result.ok) {
        setProblem(result.error ?? "That did not change.");
        setRows((list) =>
          list.map((one) => (one.id === row.id ? { ...one, published: !published } : one)),
        );
      }
    });
  }

  function remove(row: StoryRow) {
    const warning =
      row.photos > 0
        ? `Delete “${row.title}”? Its ${row.photos} photograph${
            row.photos === 1 ? "" : "s"
          } stay in the archive, but with no story to belong to.`
        : `Delete “${row.title}”? There is no undo.`;
    if (!confirm(warning)) return;

    setProblem("");
    start(async () => {
      const result = await deleteStory(row.id);
      if (!result.ok) setProblem(result.error ?? "That did not delete.");
      else {
        setRows((list) => list.filter((one) => one.id !== row.id));
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return <Empty>No stories yet. “New story” starts one.</Empty>;
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

      <ul className="admin-rows">
        {rows.map((row, index) => (
          <li
            key={row.id}
            {...dropProps(row, index)}
            className={[
              "admin-row",
              stateOf(row),
              row.published ? "" : "admin-row-hidden",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Grip {...handleProps(row)} />
            <Place index={index} total={rows.length} onMove={move} />

            <span className="admin-row-main">
              {/* The name is a link into the story as well as the button being
                  one. Two ways to the same place, and that is fine here: a list
                  of names is a thing people click the names of. */}
              <Link
                href={`/admin/stories/${row.slug}`}
                className="admin-row-name"
                style={{ fontStyle: "normal" }}
              >
                {row.title || "Untitled"}
              </Link>
              <span className="admin-row-meta">
                {[row.place, row.happened].filter(Boolean).join(" · ") || "no place or date yet"}
                {" — "}
                {row.photos === 0 ? (
                  <Link href={`/admin/photos?story=${row.tag}`}>no photographs yet</Link>
                ) : (
                  <Link href={`/admin/photos?story=${row.tag}`}>
                    {row.photos} photograph{row.photos === 1 ? "" : "s"}
                  </Link>
                )}
              </span>
            </span>

            <span className="admin-row-side">
              <Tag>{row.tag}</Tag>
              <Flag on={row.published} onChange={(next) => show(row, next)} />

              {/* The same matched pair as on the pages screen: same border, same
                  ink, same height, and one arrow each — → stays in the back of
                  the house, ↗ leaves for the front. A hidden story has no front
                  to go to, so it says that instead. */}
              <Link href={`/admin/stories/${row.slug}`} className="admin-btn">
                edit story →
              </Link>
              {row.published ? (
                <a
                  href={`/stories/${row.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn"
                  title="Opens the story itself, in a new tab"
                >
                  view ↗
                </a>
              ) : (
                <Tag tone="warn">not on the site</Tag>
              )}

              <Bin what={row.title || "this story"} onClick={() => remove(row)} disabled={pending} />
            </span>
          </li>
        ))}
      </ul>

      <p className="admin-note" style={{ marginTop: 16 }}>
        A hidden story is not on the site at all — not in the list, not at its own address, not in
        the archive&rsquo;s filters.
      </p>
    </>
  );
}
