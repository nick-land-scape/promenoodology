"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Bin,
  Empty,
  Flag,
  Grip,
  Place,
  Problem,
  Tag,
  Word,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import Find from "@/components/admin/Find";
import { hay, matches } from "@/lib/admin/find";
import { deleteStory, duplicateStory, reorderStories, showStory } from "./actions";

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
  const [looking, setLooking] = useState("");
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  /*
   * Searching and ordering are the same list looked at two ways, and only one of
   * them can be true at a time.
   *
   * A number beside a row means "third of seven". Over a list with four of the
   * seven hidden it would mean nothing, and dragging one row past another when
   * you cannot see what is between them is a change made blind. So while there
   * is something typed the handles and the numbers go, and the list says why.
   */
  const searching = looking.trim().length > 0;
  const found = useMemo(
    () =>
      rows.filter((row) =>
        matches(hay(row.title, row.place, row.happened, row.tag, row.slug), looking),
      ),
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

  /** The same story again, hidden, opened so it can be made different. */
  function copy(row: StoryRow) {
    setProblem("");
    start(async () => {
      const result = await duplicateStory(row.id);
      if (!result.ok || !result.slug) {
        setProblem(result.error ?? "That did not copy.");
        return;
      }
      router.push(`/admin/stories/${result.slug}`);
    });
  }

  function remove(row: StoryRow) {
    const warning =
      row.photos > 0
        ? `Delete “${row.title}”? It goes to the bin for thirty days. Its ${row.photos} photograph${
            row.photos === 1 ? "" : "s"
          } stay in the archive, with no story to belong to.`
        : `Delete “${row.title}”? It goes to the bin for thirty days.`;
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

      {/* Not over a list short enough to read at a glance. */}
      {rows.length > 5 ? (
        <Find
          value={looking}
          onChange={setLooking}
          what="a story"
          showing={found.length}
          total={rows.length}
        />
      ) : null}

      {searching ? (
        <p className="admin-note" style={{ marginBottom: 12 }}>
          Ordering is put away while you are looking for something — clear the field to drag them
          about again.
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
          );
        })}
      </ul>

      <p className="admin-note" style={{ marginTop: 16 }}>
        A hidden story is not on the site at all — not in the list, not at its own address, not in
        the archive&rsquo;s filters.
      </p>
    </>
  );
}
