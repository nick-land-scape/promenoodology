"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Look } from "@/components/admin/Pick";
import Uploader from "@/components/admin/Uploader";
import {
  Empty,
  Field,
  Flag,
  Grip,
  Move,
  Place,
  Problem,
  SaveBar,
  Word,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { addPhoto, deletePhoto, reorderPhotos, savePhotos } from "./actions";

export type PhotoItem = {
  id: string;
  path: string;
  url: string;
  width: number;
  height: number;
  credit: string;
  year: string;
  story: string | null;
  published: boolean;
};

export type StoryOption = { tag: string; title: string };

/** Two tags that are not stories: everything, and everything with no story. */
const ALL = "";
const LOOSE = "—";

/**
 * The archive.
 *
 * Editing happens here on the page and is written when you say so, not on every
 * keystroke: giving forty photographs the same photographer means typing it
 * forty times either way, but only one save.
 */
export default function PhotoLibrary({
  initial,
  stories,
  filter,
}: {
  initial: PhotoItem[];
  stories: StoryOption[];
  filter: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [story, setStory] = useState(filter || ALL);
  const [looking, setLooking] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [reordered, setReordered] = useState(false);
  const [pending, start] = useTransition();

  /* What new uploads are given, so a batch does not have to be typed twice. */
  const [credit, setCredit] = useState("");
  const [year, setYear] = useState("");

  const shown = useMemo(() => {
    if (story === ALL) return items;
    if (story === LOOSE) return items.filter((item) => !item.story);
    return items.filter((item) => item.story === story);
  }, [items, story]);

  const changed = useMemo(() => {
    const before = new Map(kept.map((item) => [item.id, item]));
    return items.filter((item) => {
      const was = before.get(item.id);
      if (!was) return false;
      return (
        was.credit !== item.credit ||
        was.year !== item.year ||
        was.story !== item.story ||
        was.published !== item.published
      );
    });
  }, [items, kept]);

  function edit(id: string, patch: Partial<PhotoItem>) {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await savePhotos(
        changed.map((item) => ({
          id: item.id,
          credit: item.credit,
          year: item.year,
          story_tag: item.story,
          published: item.published,
        })),
      );
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(items);
        setJustSaved(true);
      }
    });
  }

  /* Dragging and the arrows reorder what is on screen; the rest of the archive
     keeps its places. */
  function move(from: number, to: number) {
    const next = moved(shown, from, to);
    if (next === shown) return;
    setItems((list) => {
      // The filtered photographs keep their slots in the full list and are
      // dealt back into them in their new order; everything else stays put.
      const queue = [...next];
      const inFilter = new Set(next.map((item) => item.id));
      return list.map((item) => (inFilter.has(item.id) ? queue.shift()! : item));
    });
    setReordered(true);
    setProblem("");
  }

  /* Dragged, nudged, or told a number — all three go through the same move. */
  const { dropProps, handleProps, dragging } = useDragOrder(shown, move);

  function keepOrder() {
    setProblem("");
    start(async () => {
      const result = await reorderPhotos(shown.map((item) => item.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setReordered(false);
    });
  }

  function remove(item: PhotoItem) {
    if (!confirm("Delete this photograph? The file goes too, and there is no undo.")) return;
    setProblem("");
    start(async () => {
      const result = await deletePhoto(item.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      setItems((list) => list.filter((one) => one.id !== item.id));
      setKept((list) => list.filter((one) => one.id !== item.id));
      router.refresh();
    });
  }

  const label = (tag: string | null) => {
    if (!tag) return "loose";
    return stories.find((one) => one.tag === tag)?.title ?? tag;
  };

  return (
    <>
      <Problem>{problem}</Problem>

      {/* which story, and what a new batch is given */}
      <div className="admin-panel">
        <div className="admin-fields">
          <Field label="showing" hint={`${shown.length} of ${items.length} photographs`}>
            <select value={story} onChange={(event) => setStory(event.target.value)}>
              <option value={ALL}>everything</option>
              <option value={LOOSE}>no story — loose in the archive</option>
              {stories.map((one) => (
                <option key={one.tag} value={one.tag}>
                  {one.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="photographer" hint="Given to whatever you add next — not to what is already here.">
            <input
              value={credit}
              onChange={(event) => setCredit(event.target.value)}
              placeholder="who took them"
            />
          </Field>
          <Field label="year" hint="Same — for new ones only.">
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="2026"
              inputMode="numeric"
            />
          </Field>
          <div className="admin-field">
            <span>add</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Uploader
                folder="resources"
                watchWindow
                label="add photographs"
                onDone={async (uploaded) => {
                  const result = await addPhoto({
                    path: uploaded.path,
                    width: uploaded.width,
                    height: uploaded.height,
                    credit,
                    year,
                    story_tag: story === ALL || story === LOOSE ? null : story,
                  });
                  if (!result.ok || !result.id) {
                    setProblem(result.error ?? "The picture went up but was not written down.");
                    return;
                  }
                  const fresh: PhotoItem = {
                    id: result.id,
                    path: uploaded.path,
                    url: mediaUrl(uploaded.path),
                    width: uploaded.width,
                    height: uploaded.height,
                    credit,
                    year,
                    story: story === ALL || story === LOOSE ? null : story,
                    published: true,
                  };
                  setItems((list) => [...list, fresh]);
                  setKept((list) => [...list, fresh]);
                }}
              />
            </div>
            <em>
              Dropped anywhere on this page works too. Each one is shrunk to 1800px, re-saved and
              renamed, and the camera&rsquo;s notes are left behind.
            </em>
          </div>
        </div>
      </div>

      {reordered ? (
        <div className="admin-save" style={{ position: "static", marginTop: 0, marginBottom: 16 }}>
          <button type="button" className="admin-btn" onClick={keepOrder} disabled={pending}>
            {pending ? "saving…" : "keep this order"}
          </button>
          <span className="admin-note" style={{ margin: 0 }}>
            only these {shown.length} move; the rest of the archive stays where it is
          </span>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <Empty>
          {items.length === 0
            ? "Nothing in the archive yet."
            : "Nothing here under that story yet."}
        </Empty>
      ) : (
        <div className="admin-photos">
          {shown.map((item, index) => (
            <figure
              key={item.id}
              {...dropProps(item, index)}
              className={[
                "admin-photo",
                item.published ? "" : "admin-photo-hidden",
                dragging === item.id ? "admin-row-dragging" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ margin: 0 }}
            >
              <button
                type="button"
                className="admin-photo-frame"
                onClick={() => setLooking(item.url)}
                aria-label="Look at it properly"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" loading="lazy" draggable={false} />
              </button>

              <figcaption className="admin-photo-body">
                <div className="admin-fields">
                  <Field label="photo by">
                    <input
                      value={item.credit}
                      onChange={(event) => edit(item.id, { credit: event.target.value })}
                      placeholder="—"
                    />
                  </Field>
                  <Field label="year">
                    <input
                      value={item.year}
                      onChange={(event) => edit(item.id, { year: event.target.value })}
                      placeholder="—"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="story" wide>
                    <select
                      value={item.story ?? ""}
                      onChange={(event) => edit(item.id, { story: event.target.value || null })}
                    >
                      <option value="">no story — loose</option>
                      {stories.map((one) => (
                        <option key={one.tag} value={one.tag}>
                          {one.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="admin-photo-foot">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Grip {...handleProps(item)} />
                  <Place index={index} total={shown.length} onMove={move} />
                    <Flag on={item.published} onChange={(next) => edit(item.id, { published: next })} />
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Move index={index} total={shown.length} onMove={move} />
                    <Word danger onClick={() => remove(item)} disabled={pending}>
                      delete
                    </Word>
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <SaveBar
          onSave={save}
          pending={pending}
          dirty={changed.length > 0}
          saved={justSaved}
          label={changed.length > 1 ? `keep ${changed.length} changes` : "keep the change"}
        >
          <span className="admin-note" style={{ margin: 0 }}>
            {story === ALL
              ? "the whole archive"
              : `showing ${label(story === LOOSE ? null : story)}`}
          </span>
        </SaveBar>
      ) : null}

      {looking ? <Look url={looking} onClose={() => setLooking(null)} /> : null}
    </>
  );
}
