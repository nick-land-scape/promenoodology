"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bin,
  Field,
  Fields,
  Grip,
  Panel,
  Place,
  Problem,
  SaveBar,
  Word,
  moved,
  useDragOrder,
  useUnsaved,
} from "@/components/admin/ui";
import { deleteLeaf, saveLeaf } from "../actions";

type Block = { kind: string; text: string };

/**
 * One page of the handbook.
 *
 * The same two voices the handbook has always had — a heading and the paragraphs
 * under it — and nothing else, because this writing is words and a page that
 * could hold anything would need somebody to design each one.
 *
 * What is new is the counting. A page of a book is a fixed amount of room, and
 * the only thing this editor can honestly do about that is say how much is on
 * it before somebody finds out on a phone.
 */
export default function LeafEditor({
  id,
  initial,
}: {
  id: string;
  initial: { title: string; blocks: Block[] };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(draft) !== JSON.stringify(kept);
  useUnsaved(dirty, "changes to this page");

  const words = draft.blocks.reduce(
    (sum, block) => sum + (block.text.trim() ? block.text.trim().split(/\s+/).length : 0),
    0,
  );

  function setBlocks(blocks: Block[]) {
    setDraft((old) => ({ ...old, blocks }));
    setJustSaved(false);
  }

  function moveBlock(from: number, to: number) {
    const next = moved(draft.blocks, from, to);
    if (next !== draft.blocks) setBlocks(next);
  }

  /* The blocks have no id of their own — a block is only its kind and its
     words — so their place in the list stands in for one, which is enough for
     the length of one drag. The same trade the pages editor makes. */
  const draggable = draft.blocks.map((block, index) => ({ ...block, id: String(index) }));
  const { dropProps, handleProps, stateOf } = useDragOrder(draggable, moveBlock);

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveLeaf(id, draft.title, draft.blocks);
      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      setKept(draft);
      setJustSaved(true);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete “${draft.title || "this page"}”? It goes to the bin for thirty days.`)) {
      return;
    }
    setProblem("");
    start(async () => {
      const result = await deleteLeaf(id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      router.push("/admin/handbook");
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <Panel
        name="the page"
        hint="A heading and the words under it. Everything here lands on one page of the book."
      >
        <Fields>
          <Field
            label="what this page is called"
            hint="For the list in here and the contents in the book. Empty is fine for a page that carries on from the one before."
            wide
          >
            <input
              value={draft.title}
              placeholder="before you start"
              onChange={(event) => {
                setDraft((old) => ({ ...old, title: event.target.value }));
                setJustSaved(false);
              }}
            />
          </Field>
        </Fields>

        {draft.blocks.map((block, index) => (
          <div
            key={index}
            className={["admin-section", stateOf(draggable[index])].filter(Boolean).join(" ")}
            {...dropProps(draggable[index], index)}
          >
            <header className="admin-section-head">
              <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <Grip {...handleProps(draggable[index])} />
                <Place index={index} total={draft.blocks.length} onMove={moveBlock} />
                {[
                  { value: "heading", label: "heading" },
                  { value: "text", label: "paragraph" },
                ].map((kind) => (
                  <button
                    key={kind.value}
                    type="button"
                    className="admin-flag"
                    aria-pressed={block.kind === kind.value}
                    onClick={() =>
                      setBlocks(
                        draft.blocks.map((one, at) =>
                          at === index ? { ...one, kind: kind.value } : one,
                        ),
                      )
                    }
                  >
                    {kind.label}
                  </button>
                ))}
              </span>
              <span style={{ display: "flex", gap: 12 }}>
                <Word
                  onClick={() =>
                    setBlocks([
                      ...draft.blocks.slice(0, index + 1),
                      { ...block },
                      ...draft.blocks.slice(index + 1),
                    ])
                  }
                  title="The same again, just below"
                >
                  duplicate
                </Word>
                <Word
                  danger
                  onClick={() => setBlocks(draft.blocks.filter((_, at) => at !== index))}
                  aria-label={`Remove part ${index + 1}`}
                >
                  remove
                </Word>
              </span>
            </header>

            <div className="admin-para">
              <textarea
                rows={
                  block.kind === "heading"
                    ? 1
                    : Math.min(10, Math.max(3, Math.ceil(block.text.length / 70)))
                }
                value={block.text}
                placeholder={block.kind === "heading" ? "a short heading" : "a paragraph"}
                aria-label={`Part ${index + 1}`}
                onChange={(event) =>
                  setBlocks(
                    draft.blocks.map((one, at) =>
                      at === index ? { ...one, text: event.target.value } : one,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="admin-add"
          onClick={() => setBlocks([...draft.blocks, { kind: "text", text: "" }])}
        >
          + another part
        </button>
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep this page"
      >
        {/*
         * How full the page is.
         *
         * Roughly a hundred and forty words is what fits a leaf on a phone at
         * the size this book is set in. It is a guide rather than a rule — the
         * book scrolls a page that overruns rather than cutting it off — but
         * "this one is long" is worth knowing while you are still writing it.
         */}
        <span className="admin-note" style={{ margin: 0 }}>
          {words} word{words === 1 ? "" : "s"}
          {words > 140 ? " — long for one page; it may want splitting in two" : null}
        </span>
        <Bin what={draft.title || "this page"} onClick={remove} disabled={pending} />
      </SaveBar>
    </>
  );
}
