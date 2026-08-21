"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import InHead from "@/components/admin/InHead";
import { Look } from "@/components/admin/Pick";
import Picker, { type Choice } from "@/components/admin/Picker";
import Uploader from "@/components/admin/Uploader";
import {
  Bin,
  Chosen,
  Empty,
  Field,
  Flag,
  Grip,
  Place,
  Problem,
  SaveBar,
  Tick,
  moved,
  useChosen,
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
  /**
   * Who took it, when they are one of us. The name is kept in `credit` too, so
   * the site has something to print either way — but this is what makes the
   * credit follow somebody who changes their name.
   */
  person: string | null;
  year: string;
  story: string | null;
  published: boolean;
};

export type StoryOption = { tag: string; title: string };
export type PersonOption = { id: string; name: string; country: string; photo: string | null };

/** Two tags that are not stories: everything, and everything with no story. */
const ALL = "";
const LOOSE = "—";

/**
 * The years on offer.
 *
 * A text box let anybody write 20226, and nobody found out until the archive
 * grew a filter for it. The list runs from next year back to the year before the
 * oldest photograph, so it never needs touching again — and anything already in
 * the archive is included whatever it says, because a year that is there is a
 * year you must be able to pick again.
 */
function yearsFor(items: PhotoItem[]): Choice[] {
  const counted = new Map<string, number>();
  for (const item of items) {
    if (item.year) counted.set(item.year, (counted.get(item.year) ?? 0) + 1);
  }

  const now = new Date().getFullYear();
  const oldest = Math.min(now, ...[...counted.keys()].map(Number).filter(Number.isFinite));

  const range: string[] = [];
  for (let year = now + 1; year >= oldest; year -= 1) range.push(String(year));
  for (const year of counted.keys()) if (!range.includes(year)) range.push(year);

  return range.map((year) => {
    const held = counted.get(year);
    return { value: year, label: year, note: held ? `${held}` : undefined };
  });
}

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
  people,
  filter,
}: {
  initial: PhotoItem[];
  stories: StoryOption[];
  people: PersonOption[];
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
  const [person, setPerson] = useState("");
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
        was.person !== item.person ||
        was.year !== item.year ||
        was.story !== item.story ||
        was.published !== item.published
      );
    });
  }, [items, kept]);

  const named = useMemo(() => new Map(people.map((one) => [one.id, one.name])), [people]);

  /* The same two lists everywhere on this page: in each card, and in the bar
     that changes forty cards at once. */
  const faces: Choice[] = useMemo(
    () =>
      people.map((one) => ({
        value: one.id,
        label: one.name,
        note: one.country || undefined,
        image: one.photo ?? undefined,
      })),
    [people],
  );
  const years = useMemo(() => yearsFor(items), [items]);

  /*
   * Naming the photographer.
   *
   * Both fields are written at once. `person` is the real answer and what the
   * site prefers, and `credit` is kept in step with it so that a caption still
   * reads properly anywhere the join is not made — and so that unpicking
   * somebody leaves their name behind as plain text rather than a blank.
   */
  function credited(id: string, personId: string) {
    const name = named.get(personId);
    if (!name) return;
    edit(id, { person: personId, credit: name });
  }

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
          credit_profile_id: item.person,
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

  /* Dragging, or a typed number, reorders what is on screen; the rest of the
     archive keeps its places. */
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

  /* Dragged or told a number — both go through the same move. */
  const { dropProps, handleProps, stateOf } = useDragOrder(shown, move);

  /* Choosing several. Nothing here writes: an action changes every chosen row in
     this page's state, and the save button below writes them, so a change to
     forty photographs is as reviewable as a change to one. */
  const pick = useChosen(shown);

  /* What the whole selection already says, so the bar shows a state rather than
     offering blank fields: where they agree it says so, where they do not it
     says nothing and the first pick decides for all of them. */
  const picked = pick.picked();
  const agreed = <K extends keyof PhotoItem>(key: K): PhotoItem[K] | "" => {
    if (picked.length === 0) return "";
    const first = picked[0][key];
    return picked.every((one) => one[key] === first) ? first : ("" as PhotoItem[K]);
  };
  const theirPerson = (agreed("person") as string | null) ?? "";
  const theirYear = agreed("year") as string;
  const allChosenShown = picked.length > 0 && picked.every((one) => one.published);

  function applyToChosen(patch: Partial<PhotoItem>) {
    setItems((list) => list.map((item) => (pick.has(item.id) ? { ...item, ...patch } : item)));
    setJustSaved(false);
  }

  function removeChosen() {
    const doomed = pick.picked();
    if (
      !confirm(
        `Delete ${doomed.length} photograph${doomed.length === 1 ? "" : "s"}? The files go too, and there is no undo.`,
      )
    ) {
      return;
    }

    setProblem("");
    start(async () => {
      const failed: string[] = [];
      for (const item of doomed) {
        const result = await deletePhoto(item.id);
        if (!result.ok) failed.push(result.error ?? "one would not delete");
        else {
          setItems((list) => list.filter((one) => one.id !== item.id));
          setKept((list) => list.filter((one) => one.id !== item.id));
        }
      }
      pick.none();
      // Only the first, or a wall of the same sentence.
      if (failed.length) setProblem(`${failed.length} could not be deleted. ${failed[0]}`);
      router.refresh();
    });
  }

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
          <Field
            label="new ones are by"
            hint="Given to whatever you add next — not to what is already here."
          >
            <Picker
              value={person}
              onChange={(next) => {
                setPerson(next);
                // The name comes along, so the credit reads properly even
                // before anything looks up the person.
                setCredit(named.get(next) ?? "");
              }}
              options={faces}
              empty="a name, by hand"
              search
              label="Who took the next ones"
            />
            {person ? null : (
              <input
                value={credit}
                onChange={(event) => setCredit(event.target.value)}
                placeholder="who took them"
              />
            )}
          </Field>
          <Field label="and from" hint="Same — for new ones only.">
            <Picker
              value={year}
              onChange={setYear}
              options={years}
              empty="no year"
              label="Which year the next ones are from"
            />
          </Field>
          {/* Drawn beside the page's title, where the one thing that *makes* a
              photograph belongs — it used to sit down here among the fields that
              say which photographs you are looking at. */}
          <InHead>
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
                    credit_profile_id: person || null,
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
                    person: person || null,
                    year,
                    story: story === ALL || story === LOOSE ? null : story,
                    published: true,
                  };
                  setItems((list) => [...list, fresh]);
                  setKept((list) => [...list, fresh]);
                }}
              />
          </InHead>
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

      {pick.count > 0 ? (
        <Chosen count={pick.count} what="photographs" onAll={pick.all} onNone={pick.none}>
          {/* No written labels on these three, so the row fits on one line: a
              story title, a face with a name and a four-figure year each say
              what they are without being told. The names are still there for
              anybody listening rather than looking. */}
          <select
            defaultValue=""
            aria-label="Give them all a story"
            onChange={(event) => {
              applyToChosen({ story: event.target.value || null });
              event.currentTarget.value = "";
            }}
          >
            <option value="" disabled>
              a story
            </option>
            <option value="">no story — loose</option>
            {stories.map((one) => (
              <option key={one.tag} value={one.tag}>
                {one.title}
              </option>
            ))}
          </select>

          <Picker
            value={theirPerson}
            onChange={(next) => {
              const name = named.get(next);
              applyToChosen({ person: next || null, credit: name ?? "" });
            }}
            options={faces}
            empty="one of us"
            search
            label="Who took these"
          />

          <span className="admin-picker-narrow">
            <Picker
              value={theirYear}
              onChange={(next) => applyToChosen({ year: next })}
              options={years}
              empty="a year"
              label="Which year these are from"
            />
          </span>

          {/* One switch, the same one as on a card, reading the state of the
              whole selection: two words side by side made you read which of
              them you had pressed. Mixed counts as hidden, so one press shows
              the lot. */}
          <Flag
            on={allChosenShown}
            onChange={(next) => applyToChosen({ published: next })}
            labels={["shown", "hidden"]}
          />

          <Bin
            what={`these ${pick.count} photographs`}
            onClick={removeChosen}
            disabled={pending}
          />
        </Chosen>
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
                stateOf(item),
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

              {/* Outside the button that opens it, so choosing and looking are
                  two different gestures on the same card. */}
              <Tick
                on={pick.has(item.id)}
                onChoose={(range) => pick.toggle(item.id, range)}
                label={`Choose photograph ${index + 1}`}
              />

              <figcaption className="admin-photo-body">
                <div className="admin-fields">
                  {/* Wide, because a name in a 90px box is a name you cannot
                      read: "Álvaro Smoolenaars García" needs the row. */}
                  <Field label="photo by" wide>
                    <Picker
                      value={item.person ?? ""}
                      onChange={(next) => {
                        if (next) credited(item.id, next);
                        else edit(item.id, { person: null });
                      }}
                      options={faces}
                      empty="a name, by hand"
                      search
                      wide
                      label="Who took this one"
                    />
                    {/* Only where nobody is picked, so the two cannot disagree
                        on screen about who took the photograph. */}
                    {item.person ? null : (
                      <input
                        value={item.credit}
                        onChange={(event) => edit(item.id, { credit: event.target.value })}
                        placeholder="—"
                      />
                    )}
                  </Field>
                  <Field label="year">
                    <Picker
                      value={item.year}
                      onChange={(next) => edit(item.id, { year: next })}
                      options={years}
                      empty="no year"
                      label="Which year this is from"
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

                {/* Left: where it sits, and how to move it. Right: what it is
                    and whether it stays. */}
                <div className="admin-photo-foot">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Grip {...handleProps(item)} />
                    <Place index={index} total={shown.length} onMove={move} />
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Flag
                      on={item.published}
                      onChange={(next) => edit(item.id, { published: next })}
                    />
                    <Bin what="this photograph" onClick={() => remove(item)} disabled={pending} />
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
