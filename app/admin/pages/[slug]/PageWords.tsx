"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Fields, Move, Panel, Problem, SaveBar, Word, moved } from "@/components/admin/ui";
import type { PageSpec } from "@/lib/admin/pages";
import { savePageWords } from "../actions";

/**
 * The words of a fixed-shape page.
 *
 * Every part says what it is — loud or quiet, heading or paragraph — because on
 * these two pages that is the whole of the layout. Choosing it from a list of
 * two is the only design decision on offer, which is the point.
 */

type Block = { kind: string; text: string };
type Draft = { title: string; lead: string; blocks: Block[] };

export default function PageWords({
  spec,
  initial,
}: {
  spec: PageSpec;
  initial: Draft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [kept, setKept] = useState<Draft>(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(draft) !== JSON.stringify(kept);

  function setBlocks(blocks: Block[]) {
    setDraft((old) => ({ ...old, blocks }));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await savePageWords({ slug: spec.slug, ...draft });
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(draft);
        setJustSaved(true);
        router.refresh();
      }
    });
  }

  // Headings are numbered on the page, so they are numbered here too.
  const numberOf = (index: number) =>
    String(
      draft.blocks.slice(0, index + 1).filter((block) => block.kind === "heading").length,
    ).padStart(2, "0");

  return (
    <>
      <Problem>{problem}</Problem>

      {spec.usesTitle || spec.usesLead ? (
        <Panel name="the top of the page">
          <Fields>
            {spec.usesTitle ? (
              <Field label="title" hint="The big words at the top.">
                <input
                  value={draft.title}
                  onChange={(event) => {
                    setDraft((old) => ({ ...old, title: event.target.value }));
                    setJustSaved(false);
                  }}
                />
              </Field>
            ) : null}
            {spec.usesLead ? (
              <Field label="the line under it" hint="One or two sentences." wide>
                <textarea
                  rows={2}
                  value={draft.lead}
                  onChange={(event) => {
                    setDraft((old) => ({ ...old, lead: event.target.value }));
                    setJustSaved(false);
                  }}
                />
              </Field>
            ) : null}
          </Fields>
        </Panel>
      ) : null}

      <Panel
        name="the words"
        hint={spec.kinds.map((kind) => `${kind.label} — ${kind.hint}`).join("  ·  ")}
      >
        {draft.blocks.map((block, index) => (
          <div className="admin-section" key={index}>
            <header className="admin-section-head">
              <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                {spec.kinds.map((kind) => (
                  <button
                    key={kind.value}
                    type="button"
                    className="admin-flag"
                    aria-pressed={block.kind === kind.value}
                    onClick={() =>
                      setBlocks(
                        draft.blocks.map((one, i) =>
                          i === index ? { ...one, kind: kind.value } : one,
                        ),
                      )
                    }
                  >
                    {kind.label}
                  </button>
                ))}
                {block.kind === "heading" ? (
                  <span className="admin-tag admin-tag-on">{numberOf(index)}</span>
                ) : null}
              </span>
              <Move
                index={index}
                total={draft.blocks.length}
                onMove={(from, to) => setBlocks(moved(draft.blocks, from, to))}
              />
              <Word
                danger
                onClick={() => setBlocks(draft.blocks.filter((_, i) => i !== index))}
                aria-label={`Remove part ${index + 1}`}
              >
                remove
              </Word>
            </header>

            <div className="admin-para">
              <textarea
                rows={block.kind === "heading" ? 1 : Math.min(9, Math.max(2, Math.ceil(block.text.length / 80)))}
                value={block.text}
                onChange={(event) =>
                  setBlocks(
                    draft.blocks.map((one, i) =>
                      i === index ? { ...one, text: event.target.value } : one,
                    ),
                  )
                }
                placeholder={block.kind === "heading" ? "a short heading" : "a paragraph"}
                aria-label={`Part ${index + 1}`}
                style={
                  block.kind === "loud"
                    ? { fontSize: "1.35rem", fontWeight: "bold", lineHeight: 1.25 }
                    : block.kind === "quiet"
                      ? { fontStyle: "italic", color: "#4a4640" }
                      : undefined
                }
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="admin-add"
          onClick={() =>
            setBlocks([
              ...draft.blocks,
              {
                // The about statement alternates, so a new part is the other
                // voice from the one before it.
                kind:
                  spec.kinds.find(
                    (kind) => kind.value !== draft.blocks[draft.blocks.length - 1]?.kind,
                  )?.value ?? spec.kinds[0].value,
                text: "",
              },
            ])
          }
        >
          + {spec.addLabel}
        </button>
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep these words"
      />

      <p className="admin-note" style={{ marginTop: 18 }}>
        Empty parts are dropped when you save. Delete every part and the page goes back to the words
        it shipped with, rather than showing nothing.
      </p>
    </>
  );
}
