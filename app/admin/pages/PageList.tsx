"use client";

import Link from "next/link";
import Picker from "@/components/admin/Picker";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Field,
  Flag,
  Grip,
  Place,
  Problem,
  SaveBar,
  Tag,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { savePageList } from "./actions";

export type PageLine = {
  slug: string;
  visible: boolean;
  navLabel: string;
  group: "main" | "more" | "none";
  position: number;
  /** Every page has an editor now; this says whether it is made of words. */
  hasWords: boolean;
  madeOf: string;
};

const GROUPS = [
  { value: "main", label: "the bold links" },
  { value: "more", label: "the quieter group" },
  { value: "none", label: "not in the menu" },
] as const;

/** What each part of the menu is, in a line. */
const HINTS: Record<PageLine["group"], string> = {
  main: "The capitals at the top of the menu, in this order.",
  more: "Underneath the bold ones, set smaller and in italics.",
  none: "On the site and reachable by its address, but nowhere in the menu.",
};

/** One page: where it is, what the menu calls it, and the two doors. */
function PageRow({
  line,
  index,
  total,
  drop,
  handle,
  state,
  onMove,
  onEdit,
}: {
  line: PageLine;
  index: number;
  total: number;
  drop: React.HTMLAttributes<HTMLLIElement>;
  handle: React.HTMLAttributes<HTMLSpanElement>;
  state: string;
  onMove: (from: number, to: number) => void;
  onEdit: (slug: string, patch: Partial<PageLine>) => void;
}) {
  return (
    <li
      {...drop}
      className={["admin-row", state, line.visible ? "" : "admin-row-hidden"]
        .filter(Boolean)
        .join(" ")}
      style={{ flexWrap: "wrap" }}
    >
      <Grip {...handle} />
      <Place index={index} total={total} onMove={onMove} />

      <span className="admin-row-main" style={{ minWidth: 260 }}>
        <span className="admin-row-name">
          {/* The address, and it is not a field: a page's address is the folder
              it lives in, so moving one means moving code. A story's address IS
              editable — that is in the story itself. */}
          <span title="A page's address is fixed. A story's is editable, in the story.">
            /{line.slug}
          </span>
        </span>
        <span className="admin-row-meta">{line.madeOf}</span>

        {/* The two menu questions side by side: what it is called and which
            part it sits in are one decision asked twice, and the grid's
            auto-fit was stacking them because the row is narrow. */}
        <span className="admin-fields admin-fields-pair" style={{ marginTop: 6 }}>
          <Field
            label="in the menu as"
            hint="Empty means it is not listed — the page is still there."
          >
            <input
              value={line.navLabel}
              onChange={(event) => onEdit(line.slug, { navLabel: event.target.value })}
              placeholder="not listed"
            />
          </Field>
          <Field label="which part of the menu">
            <Picker
              value={line.group}
              onChange={(next) => onEdit(line.slug, { group: next as PageLine["group"] })}
              options={GROUPS.map((group) => ({ value: group.value, label: group.label }))}
              empty={null}
              label="Which part of the menu"
            />
          </Field>
        </span>
      </span>

      {/*
       * One line: whether it is on the site, the way in, and the way out to it.
       *
       * The two doors used to sit at opposite ends of the row — "open its words"
       * beside the address and "look at it" down here — and both read as "go to
       * the page", so which one you wanted was a guess. Together, and weighted:
       * editing is a button because it is what anybody came here to do, and the
       * way out to the site is a word beside it. One arrow each settles the
       * rest — → stays in the back of the house, ↗ leaves for the front.
       */}
      <span className="admin-doors">
        <Flag
          on={line.visible}
          onChange={(next) => onEdit(line.slug, { visible: next })}
          labels={["on the site", "off the site"]}
        />

        {/* Two words and two arrows. A pair of buttons the same size reads as a
            pair of choices, which is what they are; "edit the page" spelled out
            was the biggest thing in the row and the arrow already says where it
            goes. → stays here, ↗ leaves for the site. */}
        <Link
          href={`/admin/pages/${line.slug}`}
          className="admin-btn"
          title="Everything about this page you can change: the heading, the line under it, the words where it has any, and what it decides for itself"
        >
          edit →
        </Link>

        {line.visible ? (
          <a
            href={`/${line.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-quiet"
            title="Opens the page itself, in a new tab"
          >
            view ↗
          </a>
        ) : (
          <Tag tone="warn">404 for everybody</Tag>
        )}
      </span>
    </li>
  );
}

/**
 * One part of the menu, and the pages in it.
 *
 * Its own component because it needs its own drag: a hook cannot be called in a
 * loop, and three parts each reordering themselves is three hooks.
 */
function Part({
  label,
  hint,
  lines,
  onMove,
  onEdit,
}: {
  label: string;
  hint: string;
  lines: PageLine[];
  onMove: (from: number, to: number) => void;
  onEdit: (slug: string, patch: Partial<PageLine>) => void;
}) {
  const draggable = useMemo(() => lines.map((line) => ({ ...line, id: line.slug })), [lines]);
  const { dropProps, handleProps, stateOf } = useDragOrder(draggable, onMove);

  return (
    <section className="admin-part">
      <header className="admin-part-head">
        <h2>{label}</h2>
        <p>{hint}</p>
      </header>

      {lines.length === 0 ? (
        <p className="admin-empty" style={{ padding: "14px 0 4px" }}>
          Nothing here.
        </p>
      ) : (
        <ul className="admin-rows">
          {lines.map((line, index) => (
            <PageRow
              key={line.slug}
              line={line}
              index={index}
              total={lines.length}
              drop={dropProps(draggable[index], index)}
              handle={handleProps(draggable[index])}
              state={stateOf(draggable[index])}
              onMove={onMove}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The pages of the website.
 *
 * The order here is the order of the menu, so it is dragged rather than typed:
 * the number in a "position" box is not something anybody should have to think
 * about.
 */
export default function PageList({ initial }: { initial: PageLine[] }) {
  const router = useRouter();
  const [lines, setLines] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = useMemo(() => JSON.stringify(lines) !== JSON.stringify(kept), [lines, kept]);

  function edit(slug: string, patch: Partial<PageLine>) {
    setLines((list) => list.map((line) => (line.slug === slug ? { ...line, ...patch } : line)));
    setJustSaved(false);
  }

  /*
   * Moving a page within its own part of the menu.
   *
   * The three parts are what the menu actually is — bold links, the quieter
   * group underneath, and the pages that are on the site but not listed — so the
   * list is drawn in three, and dragging happens inside one of them. The pages
   * that moved are dealt back into the slots they already held between them, so
   * reordering the quieter group cannot disturb the bold links above it.
   */
  function moveIn(group: PageLine["group"], from: number, to: number) {
    const mine = lines.filter((line) => line.group === group);
    const next = moved(mine, from, to);
    if (next === mine) return;

    const queue = [...next];
    const theirs = new Set(mine.map((line) => line.slug));
    const rearranged = lines.map((line) => (theirs.has(line.slug) ? queue.shift()! : line));
    setLines(rearranged.map((line, index) => ({ ...line, position: index + 1 })));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await savePageList(
        lines.map((line) => ({
          slug: line.slug,
          visible: line.visible,
          navLabel: line.navLabel,
          group: line.group,
          position: line.position,
        })),
      );
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(lines);
        setJustSaved(true);
        router.refresh();
      }
    });
  }

  const hidden = lines.filter((line) => !line.visible);

  return (
    <>
      <Problem>{problem}</Problem>

      {hidden.length > 0 ? (
        <p className="admin-error" style={{ borderColor: "var(--purple)", color: "var(--ink)" }}>
          Off the site at the moment:{" "}
          {hidden.map((line) => `/${line.slug}`).join(", ")}. Nobody can reach{" "}
          {hidden.length === 1 ? "it" : "them"}, link or no link.
        </p>
      ) : null}

      {GROUPS.map((group) => (
        <Part
          key={group.value}
          label={group.label}
          hint={HINTS[group.value]}
          lines={lines.filter((line) => line.group === group.value)}
          onMove={(from, to) => moveIn(group.value, from, to)}
          onEdit={edit}
        />
      ))}

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep the menu"
      >
        <span className="admin-note" style={{ margin: 0 }}>
          drag a row to change the order of the menu
        </span>
      </SaveBar>

      <p className="admin-note" style={{ marginTop: 18 }}>
        The front page cannot be turned off, so it is not listed. The newsletter is not in a menu
        group on purpose: the last line of the menu already offers it, until somebody signs in and
        it becomes their own face.
      </p>
    </>
  );
}
