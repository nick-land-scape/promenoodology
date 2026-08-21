"use client";

import { useState } from "react";
import Picker, { type Choice } from "@/components/admin/Picker";
import Thumb from "@/components/admin/Thumb";
import { Bin, Grip, Icon, Place, moved, useDragOrder } from "@/components/admin/ui";
import { LAYOUTS } from "@/lib/photo-layout";
import type { PhotoLayout } from "@/lib/supabase/rows";

/**
 * The page, built by hand.
 *
 * What it replaces: the words were typed in one panel as sections and
 * paragraphs, the photographs were arranged in another, and the page wove the
 * two together by a rule — a section, a share of the photographs, the next
 * section. That rule is what made every story look like a story from this site,
 * and it is also why nobody could say "this paragraph, then that photograph".
 *
 * So there is one column now, and it is the page in order. A heading, a
 * paragraph, a photograph, a deliberate gap; dragged into the order a reader
 * gets them in. The rule is still there for any story nobody has arranged — see
 * StoryBody — so this changes nothing until somebody moves something.
 *
 * Each block keeps a key of its own that never changes, because dragging a list
 * keyed by position makes React reuse the wrong textarea and the words appear to
 * jump between blocks.
 */

export type Block = {
  /** Ours, for React and for dragging. Never written down. */
  id: string;
  kind: "heading" | "text" | "photo" | "space";
  words: string;
  photoId: string | null;
  layout: PhotoLayout | null;
};

let counter = 0;
const nextId = () => `b${(counter += 1)}`;

export function blankBlock(kind: Block["kind"]): Block {
  return { id: nextId(), kind, words: "", photoId: null, layout: null };
}

/** What each kind is called, and what it does to the page. */
const KINDS: { kind: Block["kind"]; label: string; icon: string; note: string }[] = [
  { kind: "heading", label: "heading", icon: "quote", note: "A small purple line that opens a part" },
  { kind: "text", label: "paragraph", icon: "stories", note: "One paragraph of the story" },
  { kind: "photo", label: "photograph", icon: "photos", note: "One from the archive" },
  { kind: "space", label: "space", icon: "minus", note: "A deliberate gap" },
];

export default function StoryPage({
  blocks,
  onChange,
  photos,
  cover,
  onCover,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
  /** The story's photographs, to choose from. */
  photos: (Choice & { width: number; height: number })[];
  cover: string | null;
  onCover: (id: string | null) => void;
}) {
  const [adding, setAdding] = useState(false);

  const { dropProps, handleProps, stateOf } = useDragOrder(blocks, (from, to) => {
    const next = moved(blocks, from, to);
    if (next !== blocks) onChange(next);
  });

  const set = (id: string, patch: Partial<Block>) =>
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const add = (kind: Block["kind"], after?: number) => {
    const fresh = blankBlock(kind);
    if (after === undefined) onChange([...blocks, fresh]);
    else onChange([...blocks.slice(0, after + 1), fresh, ...blocks.slice(after + 1)]);
    setAdding(false);
  };

  const seen = photos.length;

  return (
    <div className="admin-build">
      {blocks.length === 0 ? (
        <p className="admin-empty" style={{ padding: "18px 14px" }}>
          Nothing on the page yet. Add a heading or a paragraph below.
        </p>
      ) : null}

      <ul className="admin-blocks">
        {blocks.map((block, index) => {
          const chosen = photos.find((one) => one.value === block.photoId);
          return (
            <li
              key={block.id}
              {...dropProps(block, index)}
              className={["admin-block", `admin-block-${block.kind}`, stateOf(block)]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="admin-block-hold">
                <Grip {...handleProps(block)} />
                <Place index={index} total={blocks.length} onMove={(from, to) => {
                  const next = moved(blocks, from, to);
                  if (next !== blocks) onChange(next);
                }} />
              </span>

              <span className="admin-block-body">
                {block.kind === "heading" ? (
                  <input
                    className="admin-block-heading"
                    value={block.words}
                    placeholder="opportunity"
                    aria-label="A heading"
                    onChange={(event) => set(block.id, { words: event.target.value })}
                  />
                ) : null}

                {block.kind === "text" ? (
                  <textarea
                    className="admin-block-text"
                    rows={Math.min(10, Math.max(2, Math.ceil(block.words.length / 88)))}
                    value={block.words}
                    placeholder="a paragraph"
                    aria-label="A paragraph"
                    onChange={(event) => set(block.id, { words: event.target.value })}
                  />
                ) : null}

                {block.kind === "space" ? (
                  <span className="admin-block-gap">a gap on the page</span>
                ) : null}

                {block.kind === "photo" ? (
                  <span className="admin-block-photo">
                    <span className="admin-block-frame">
                      {chosen?.image ? (
                        <Thumb
                          src={chosen.image}
                          width={chosen.width}
                          height={chosen.height}
                          sizes="120px"
                        />
                      ) : (
                        <span className="admin-block-none">none</span>
                      )}
                    </span>

                    <span className="admin-block-says">
                      <Picker
                        value={block.photoId ?? ""}
                        onChange={(next) => set(block.id, { photoId: next || null })}
                        options={photos}
                        empty={seen === 0 ? "nothing tagged for this story" : "choose one"}
                        search={seen > 8}
                        wide
                        label="Which photograph"
                      />

                      <span className="admin-block-how">
                        {/* How it sits. "let the page decide" is the automatic
                            cycle and the right answer almost always. */}
                        <button
                          type="button"
                          className="admin-flag"
                          aria-pressed={block.layout === null}
                          onClick={() => set(block.id, { layout: null })}
                          title="The automatic size, which never lines up and never breaks"
                        >
                          auto
                        </button>
                        {LAYOUTS.map((choice) => (
                          <button
                            key={choice.value}
                            type="button"
                            className="admin-flag"
                            aria-pressed={block.layout === choice.value}
                            onClick={() => set(block.id, { layout: choice.value })}
                            title={choice.hint}
                          >
                            {choice.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="admin-flag"
                          aria-pressed={cover === block.photoId}
                          disabled={!block.photoId}
                          onClick={() => onCover(cover === block.photoId ? null : block.photoId)}
                          title="The one that stands for this story in the list and in a link preview"
                        >
                          cover
                        </button>
                      </span>
                    </span>
                  </span>
                ) : null}
              </span>

              <span className="admin-block-does">
                <Bin
                  what={`this ${block.kind === "text" ? "paragraph" : block.kind}`}
                  onClick={() => onChange(blocks.filter((one) => one.id !== block.id))}
                />
              </span>
            </li>
          );
        })}
      </ul>

      {/* One place to add, at the end, because that is where a page grows. Any
          block can then be dragged to where it belongs. */}
      <div className="admin-build-add">
        {adding ? (
          <span className="admin-build-kinds">
            {KINDS.map((one) => (
              <button key={one.kind} type="button" onClick={() => add(one.kind)} title={one.note}>
                <Icon name={one.icon} />
                {one.label}
              </button>
            ))}
            <button type="button" className="admin-word" onClick={() => setAdding(false)}>
              never mind
            </button>
          </span>
        ) : (
          <button type="button" className="admin-add" onClick={() => setAdding(true)}>
            + something on the page
          </button>
        )}
      </div>
    </div>
  );
}
