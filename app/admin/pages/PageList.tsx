"use client";

import Link from "next/link";
import Picker from "@/components/admin/Picker";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Field,
  Flag,
  Grip,
  Move,
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

  function move(from: number, to: number) {
    const next = moved(lines, from, to);
    if (next === lines) return;
    // The order on screen is the order in the menu, so the positions follow it.
    setLines(next.map((line, index) => ({ ...line, position: index + 1 })));
    setJustSaved(false);
  }

  /* A page is keyed by its slug rather than an id, so the hook is handed the
     one it does have. */
  const draggable = useMemo(() => lines.map((line) => ({ ...line, id: line.slug })), [lines]);
  const { dropProps, handleProps, dragging } = useDragOrder(draggable, move);

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

      <ul className="admin-rows">
        {lines.map((line, index) => (
          <li
            key={line.slug}
            {...dropProps(draggable[index], index)}
            className={[
              "admin-row",
              dragging === line.slug ? "admin-row-dragging" : "",
              line.visible ? "" : "admin-row-hidden",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ flexWrap: "wrap" }}
          >
            <Grip {...handleProps(draggable[index])} />
                  <Place index={index} total={lines.length} onMove={move} />

            <span className="admin-row-main" style={{ minWidth: 260 }}>
              <span className="admin-row-name" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* The address, and it is not a field: a page's address is the
                    folder it lives in, so moving one means moving code. A
                    story's address IS editable — that is in the story itself. */}
                <span title="A page's address is fixed. A story's is editable, in the story.">
                  /{line.slug}
                </span>
                <Link href={`/admin/pages/${line.slug}`} className="admin-word">
                  {line.hasWords ? "open its words →" : "open it →"}
                </Link>
              </span>
              <span className="admin-row-meta">{line.madeOf}</span>

              <span className="admin-fields" style={{ marginTop: 6 }}>
                <Field
                  label="in the menu as"
                  hint="Empty means it is not in the menu — the page is still there."
                >
                  <input
                    value={line.navLabel}
                    onChange={(event) => edit(line.slug, { navLabel: event.target.value })}
                    placeholder="not listed"
                  />
                </Field>
                <Field label="which group">
                  <Picker
                    value={line.group}
                    onChange={(next) =>
                      edit(line.slug, { group: next as PageLine["group"] })
                    }
                    options={GROUPS.map((group) => ({
                      value: group.value,
                      label: group.label,
                    }))}
                    empty={null}
                    label="Which group in the menu"
                  />
                </Field>
              </span>
            </span>

            <span className="admin-row-side" style={{ flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
              <Flag
                on={line.visible}
                onChange={(next) => edit(line.slug, { visible: next })}
                labels={["on the site", "off the site"]}
              />
              {line.visible ? (
                <a href={`/${line.slug}`} target="_blank" rel="noopener noreferrer" className="admin-word">
                  look at it ↗
                </a>
              ) : (
                <Tag tone="warn">404 for everybody</Tag>
              )}
              <Move index={index} total={lines.length} onMove={move} />
            </span>
          </li>
        ))}
      </ul>

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
