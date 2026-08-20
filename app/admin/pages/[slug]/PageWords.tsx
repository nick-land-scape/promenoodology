"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Field,
  Fields,
  Flag,
  Grip,
  Move,
  Panel,
  Place,
  Problem,
  SaveBar,
  Word,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import type { PageSpec } from "@/lib/admin/pages";
import { PAGE_SETTINGS, type PageSettings } from "@/lib/admin/page-settings";
import Uploader from "@/components/admin/Uploader";
import { mediaUrl } from "@/lib/supabase/config";
import { savePageWords } from "../actions";

/**
 * One page: its heading, the line under it, the handful of things it may decide
 * about itself, and — where the page is made of words — the words.
 *
 * Every part of a words page says what it is, loud or quiet, heading or
 * paragraph, because on those two pages that is the whole of the layout.
 * Choosing between two named voices is the only design decision on offer here,
 * which is the point.
 */

type Block = { kind: string; text: string };
type Draft = { title: string; lead: string; blocks: Block[]; settings: PageSettings };

export default function PageWords({ spec, initial }: { spec: PageSpec; initial: Draft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [kept, setKept] = useState<Draft>(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(draft) !== JSON.stringify(kept);
  const knobs = PAGE_SETTINGS[spec.slug] ?? [];
  const madeOfWords = spec.kinds.length > 0;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
    setJustSaved(false);
  }

  const setBlocks = (blocks: Block[]) => set("blocks", blocks);

  function moveBlock(from: number, to: number) {
    const next = moved(draft.blocks, from, to);
    if (next !== draft.blocks) setBlocks(next);
  }

  /* The blocks are dragged, nudged or told a number, like every other list in
     here. They have no id of their own — a block is only its kind and its words —
     so their place in the list stands in for one. That is enough: it is only
     needed for the length of one drag. */
  const draggable = draft.blocks.map((block, index) => ({ ...block, id: String(index) }));
  const { dropProps, handleProps, dragging } = useDragOrder(draggable, moveBlock);

  function setKnob(key: string, value: string | number | boolean) {
    setDraft((old) => ({ ...old, settings: { ...old.settings, [key]: value } }));
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
        <Panel
          name="the top of the page"
          hint={
            spec.slug === "community"
              ? "The heading here is read out by a screen reader rather than shown — the grid of names is the page."
              : undefined
          }
        >
          <Fields>
            {spec.usesTitle ? (
              <Field label="heading" hint="The big words at the top.">
                <input value={draft.title} onChange={(event) => set("title", event.target.value)} />
              </Field>
            ) : null}
            {spec.usesLead ? (
              <Field
                label="the line under it"
                hint="One or two sentences. Plain text — a link cannot be put in here."
                wide
              >
                <textarea
                  rows={3}
                  value={draft.lead}
                  onChange={(event) => set("lead", event.target.value)}
                />
              </Field>
            ) : null}
          </Fields>
        </Panel>
      ) : null}

      {knobs.length > 0 ? (
        <Panel
          name="how it behaves"
          hint="A short list on purpose. Everything else about how the page looks is in the stylesheet, where it cannot be knocked over by accident."
        >
          <Fields>
            {knobs.map((knob) => {
              const value = draft.settings[knob.key];

              if (knob.kind === "toggle") {
                return (
                  <div className="admin-field" key={knob.key}>
                    <span>{knob.label}</span>
                    <span style={{ paddingTop: 4 }}>
                      <Flag
                        on={Boolean(value)}
                        onChange={(next) => setKnob(knob.key, next)}
                        labels={["shown", "hidden"]}
                      />
                    </span>
                    {knob.hint ? <em>{knob.hint}</em> : null}
                  </div>
                );
              }

              if (knob.kind === "choice") {
                return (
                  <div className="admin-field" key={knob.key}>
                    <span>{knob.label}</span>
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 3 }}>
                      {knob.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="admin-flag"
                          aria-pressed={value === option.value}
                          title={option.hint}
                          onClick={() => setKnob(knob.key, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </span>
                    <em>
                      {knob.options.find((option) => option.value === value)?.hint ?? knob.hint}
                    </em>
                  </div>
                );
              }

              if (knob.kind === "image") {
                const path = String(value ?? "");
                return (
                  <div className="admin-field admin-field-wide" key={knob.key}>
                    <span>{knob.label}</span>
                    <span style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingTop: 4 }}>
                      <span className="admin-thumb" style={{ width: 96, height: 68 }}>
                        {path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(path)} alt="" draggable={false} />
                        ) : (
                          "none"
                        )}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                        <Uploader
                          folder={knob.folder}
                          many={false}
                          label={path ? "another picture" : "a picture"}
                          onDone={(uploaded) => setKnob(knob.key, uploaded.path)}
                        />
                        {path ? (
                          <Word danger onClick={() => setKnob(knob.key, "")}>
                            take it away
                          </Word>
                        ) : null}
                        <em style={{ fontSize: "0.85em", color: "var(--admin-faint)" }}>
                          {knob.hint}
                        </em>
                      </span>
                    </span>
                  </div>
                );
              }

              if (knob.kind === "number") {
                return (
                  <Field
                    key={knob.key}
                    label={`${knob.label}${knob.unit ? ` (${knob.unit})` : ""}`}
                    hint={`${knob.hint ? `${knob.hint} ` : ""}Between ${knob.min} and ${knob.max}; ${knob.fallback} is what the site shipped with.`}
                  >
                    <input
                      type="number"
                      min={knob.min}
                      max={knob.max}
                      value={Number(value)}
                      onChange={(event) => setKnob(knob.key, Number(event.target.value))}
                    />
                  </Field>
                );
              }

              return (
                <Field
                  key={knob.key}
                  label={knob.label}
                  hint={knob.hint}
                  wide={knob.kind === "lines"}
                >
                  {knob.kind === "lines" ? (
                    <textarea
                      rows={3}
                      value={String(value)}
                      onChange={(event) => setKnob(knob.key, event.target.value)}
                    />
                  ) : (
                    <input
                      value={String(value)}
                      onChange={(event) => setKnob(knob.key, event.target.value)}
                    />
                  )}
                </Field>
              );
            })}
          </Fields>
        </Panel>
      ) : null}

      {madeOfWords ? (
        <Panel
          name="the words"
          hint={spec.kinds.map((kind) => `${kind.label} — ${kind.hint}`).join("  ·  ")}
        >
          {draft.blocks.map((block, index) => (
            <div
              className={`admin-section${dragging === String(index) ? " admin-row-dragging" : ""}`}
              key={index}
              {...dropProps(draggable[index], index)}
            >
              <header className="admin-section-head">
                <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <Grip {...handleProps(draggable[index])} />
                  <Place index={index} total={draft.blocks.length} onMove={moveBlock} />
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
                <Move index={index} total={draft.blocks.length} onMove={moveBlock} />
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
                  rows={
                    block.kind === "heading"
                      ? 1
                      : Math.min(9, Math.max(2, Math.ceil(block.text.length / 80)))
                  }
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
      ) : spec.madeOf ? (
        <p className="admin-note">{spec.madeOf}</p>
      ) : null}

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep this page"
      />

      {madeOfWords ? (
        <p className="admin-note" style={{ marginTop: 18 }}>
          Empty parts are dropped when you save. Delete every part and the page goes back to the
          words it shipped with, rather than showing nothing.
        </p>
      ) : null}
    </>
  );
}
