"use client";

import { useMemo, useState } from "react";
import Picker, { type Choice } from "./Picker";
import Thumb from "./Thumb";
import Uploader from "./Uploader";
import type { Uploaded } from "@/lib/admin/upload";
import { Button, Empty, Field, Icon, Problem, Word, useChosen } from "./ui";

/**
 * Putting photographs into a story, either way round.
 *
 * It replaces a link that said "add or remove them →" and went to the archive
 * with a filter on it — which worked, and meant leaving the story to do it,
 * finding the tag, and coming back. Two ways in, in one dialog:
 *
 * From the archive, because most of the time the photographs are already there.
 * Several at once, and what is already in this story is shown as such rather
 * than offered again.
 *
 * From the machine, because the rest of the time they are not — and then the
 * credit and the year are asked for *here*, before the upload, rather than being
 * something to go and fill in on sixty cards afterwards. Which was the actual
 * complaint: sixty-nine photographs in the archive have no name against them.
 */

export type Addable = Choice & { width: number; height: number; inStory: boolean };

export default function AddPhotos({
  photos,
  people,
  years,
  onFromArchive,
  onUploaded,
  onClose,
}: {
  /** Everything in the archive, with those already in this story marked. */
  photos: Addable[];
  /** For the credit on anything uploaded here. */
  people: Choice[];
  years: Choice[];
  /** Chosen from the archive: joined to the story, in this order. */
  onFromArchive: (ids: string[]) => Promise<string | null>;
  /**
   * One that has just gone up. The caller writes the row, because only it knows
   * which story's tag to put on it — the credit and the year come from here,
   * where they were asked before the upload rather than after it.
   */
  onUploaded: (photo: Uploaded, credit: { person: string | null; year: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [where, setWhere] = useState<"archive" | "machine">("archive");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  /* What a batch being uploaded is credited to. Asked once, here, and given to
     every file in the batch. */
  const [person, setPerson] = useState("");
  const [year, setYear] = useState("");

  /* What to offer, and how much of it.
   *
   * The whole archive was offered at once — a hundred and fifty-seven optimised
   * thumbnails in one dialog, which is slow to draw, expensive the first time
   * anybody opens it, and a wall rather than a way of finding a photograph. So:
   * the ones in no story at all first, because those are what a story is usually
   * being given, then everything else; a box to search by name or year; and
   * sixty at a time. */
  const [typed, setTyped] = useState("");
  const [showing, setShowing] = useState(60);

  const loose = useMemo(() => {
    const needle = typed.trim().toLowerCase();
    return photos
      .filter((one) => !one.inStory)
      .filter((one) => (needle ? one.label.toLowerCase().includes(needle) : true))
      // In no story at all first: a photograph nobody has used is the one most
      // likely to be wanted here.
      .sort((a, b) => Number(Boolean(a.note)) - Number(Boolean(b.note)));
  }, [photos, typed]);

  const shown = loose.slice(0, showing);
  const pick = useChosen(loose.map((one) => ({ id: one.value })));

  async function join() {
    const ids = pick.picked().map((one) => one.id);
    if (ids.length === 0) return;
    setBusy(true);
    setProblem("");
    const answer = await onFromArchive(ids);
    setBusy(false);
    if (answer) setProblem(answer);
    else onClose();
  }

  return (
    <div className="admin-add-photos" role="dialog" aria-modal="true" aria-label="Add photographs">
      <button type="button" className="admin-add-away" onClick={onClose} aria-label="Close" />

      <div className="admin-add-sheet">
        <header>
          <span className="admin-add-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={where === "archive"}
              onClick={() => setWhere("archive")}
            >
              from the archive
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={where === "machine"}
              onClick={() => setWhere("machine")}
            >
              from your machine
            </button>
          </span>
          <Word onClick={onClose}>close</Word>
        </header>

        <Problem>{problem}</Problem>

        {where === "archive" ? (
          <>
            <div className="admin-add-find">
              <Icon name="search" />
              <input
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  setShowing(60);
                }}
                placeholder="a photographer, or a year"
                aria-label="Search the archive"
              />
              <span className="admin-note" style={{ margin: 0 }}>
                {loose.length} to choose from
              </span>
            </div>

            {loose.length === 0 ? (
              <Empty>
                {typed
                  ? "Nothing in the archive matches that."
                  : "Everything in the archive is already in this story. Upload something, or take one out first."}
              </Empty>
            ) : (
              <div className="admin-add-grid">
                {shown.map((one) => (
                  <button
                    key={one.value}
                    type="button"
                    role="checkbox"
                    aria-checked={pick.has(one.value)}
                    className={[
                      "admin-add-one",
                      pick.has(one.value) ? "admin-add-picked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => pick.toggle(one.value, event.shiftKey)}
                    title={`${one.label} — click to choose, shift-click for a run`}
                  >
                    {one.image ? (
                      <Thumb
                        src={one.image}
                        width={one.width}
                        height={one.height}
                        sizes="150px"
                        eager
                      />
                    ) : null}
                    {/* Drawn, not pressed. The whole tile is the control, and a
                        button inside a button is invalid HTML — which is not a
                        detail: it broke hydration and every thumbnail in the
                        dialog came out blank. */}
                    <span className="admin-add-tick" aria-hidden="true">
                      {pick.has(one.value) ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {shown.length < loose.length ? (
              <p style={{ textAlign: "center", padding: "0 14px 14px", margin: 0 }}>
                <Word onClick={() => setShowing((many) => many + 60)}>
                  show sixty more ({loose.length - shown.length} left)
                </Word>
              </p>
            ) : null}

            <footer>
              <span className="admin-note" style={{ margin: 0 }}>
                {pick.count > 0
                  ? `${pick.count} chosen — shift-click for a run`
                  : "click the ones this story should have"}
              </span>
              <Button onClick={join} disabled={busy || pick.count === 0}>
                <Icon name="plus" />
                {busy ? "adding…" : `add ${pick.count || ""}`.trim()}
              </Button>
            </footer>
          </>
        ) : (
          <>
            <div className="admin-fields">
              <Field label="taken by" hint="Given to everything you upload here.">
                <Picker
                  value={person}
                  onChange={setPerson}
                  options={people}
                  empty="nobody yet"
                  search
                  label="Who took them"
                />
              </Field>
              <Field label="in" hint="Same — for this batch.">
                <Picker
                  value={year}
                  onChange={setYear}
                  options={years}
                  empty="no year"
                  label="Which year"
                />
              </Field>
            </div>

            <div className="admin-add-drop">
              {/* The credit and the year are already answered above, so a file
                  dropped here arrives finished rather than as one more card to
                  go back and fill in. */}
              <Uploader
                folder="resources"
                label="choose files"
                onDone={async (uploaded) => {
                  await onUploaded(uploaded, { person: person || null, year });
                }}
              />
              <p className="admin-note" style={{ margin: "10px 0 0" }}>
                Each one is shrunk to 1800px, re-saved, renamed, and the camera&rsquo;s notes are
                left behind. They land in this story and in the archive at once.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
